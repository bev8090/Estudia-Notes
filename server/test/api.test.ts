// API tests: real HTTP requests to the Express app and the real database, with two
// stand-ins: login (a test header instead of a Supabase token) and Claude (canned
// answers instead of paid API calls). Rows are created under random test user ids
// and deleted afterwards.
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/middleware/auth.ts", () => ({
  requireAuth: (req: { header(name: string): string | undefined; userId?: string }, res: { status(n: number): { json(b: unknown): void } }, next: () => void) => {
    const user = req.header("x-test-user");
    if (!user) return res.status(401).json({ error: "Missing bearer token" });
    req.userId = user;
    next();
  },
}));

vi.mock("../src/services/ai/summarize.ts", () => ({
  summarizeNotes: async () => ({
    model: "test-model",
    data: {
      usable: true,
      problem: null,
      title: "Cell Biology Basics",
      overview: "Covers cells and organelles.",
      topics: [
        { name: "Cells", keyPoints: ["Cells are the unit of life."], keyTerms: [{ term: "Cell", definition: "Basic unit of life" }] },
        { name: "Mitochondria", keyPoints: ["Mitochondria make ATP."], keyTerms: [] },
      ],
    },
  }),
}));

vi.mock("../src/services/ai/generateExam.ts", () => ({
  generateExamQuestions: async ({ questionCount }: { questionCount: number }) => ({
    model: "test-model",
    data: {
      questions: Array.from({ length: questionCount }, (_, i) =>
        i === 0
          ? {
              type: "SHORT",
              topicNumber: 2,
              prompt: "What do mitochondria do?",
              choices: [],
              correctChoice: null,
              modelAnswer: "They produce ATP.",
              rubric: "Says they produce ATP / energy.",
              explanation: "Mitochondria are where ATP is made.",
            }
          : {
              type: "MCQ",
              topicNumber: 1,
              prompt: `Question ${i}: what is the unit of life?`,
              choices: ["The cell", "The atom", "The organ", "The tissue"],
              correctChoice: 0,
              modelAnswer: null,
              rubric: null,
              explanation: "The cell is the basic unit of life.",
            },
      ),
    },
  }),
}));

vi.mock("../src/services/ai/gradeShortAnswers.ts", () => ({
  gradeShortAnswers: async (items: unknown[]) => items.map(() => ({ score: 0.5, feedback: "Partly right." })),
}));

const { createApp } = await import("../src/app.ts");
const { prisma } = await import("../src/lib/prisma.ts");

const app = createApp();
const alice = randomUUID();
const bob = randomUUID();
const as = (user: string) => ({ "x-test-user": user });
const notes = "Cells are the basic unit of life. Mitochondria are organelles that produce ATP for the cell.";

// Background jobs finish asynchronously; poll the way the browser does.
async function waitForReady(path: string, user: string) {
  for (let i = 0; i < 50; i++) {
    const res = await request(app).get(path).set(as(user));
    if (res.body.status !== "PROCESSING") return res;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`${path} never finished processing`);
}

afterAll(async () => {
  await prisma.note.deleteMany({ where: { userId: { in: [alice, bob] } } });
  await prisma.$disconnect();
});

describe("auth and validation", () => {
  it("rejects requests without a user", async () => {
    await request(app).get("/api/notes").expect(401);
  });

  it("rejects notes that are too short", async () => {
    const res = await request(app).post("/api/notes").set(as(alice)).field("text", "hi").expect(400);
    expect(res.body.error).toMatch(/at least/);
  });

  it("treats malformed ids as not found", async () => {
    await request(app).get("/api/notes/not-a-uuid").set(as(alice)).expect(404);
  });
});

describe("full flow: note -> exam -> attempt", () => {
  it("works end to end and keeps each user's data private", async () => {
    // 1. Create a note; the summary is generated in the background.
    const created = await request(app).post("/api/notes").set(as(alice)).field("text", notes).expect(202);
    const noteId = created.body.id;
    const note = await waitForReady(`/api/notes/${noteId}`, alice);
    expect(note.body).toMatchObject({ status: "READY", title: "Cell Biology Basics" });
    expect(note.body.summary.topics.map((t: { name: string }) => t.name)).toEqual(["Cells", "Mitochondria"]);

    // Bob can't see, use, or delete Alice's note.
    await request(app).get(`/api/notes/${noteId}`).set(as(bob)).expect(404);
    await request(app).post(`/api/notes/${noteId}/exams`).set(as(bob)).send({ difficulty: "HARD", questionCount: 5 }).expect(404);
    await request(app).delete(`/api/notes/${noteId}`).set(as(bob)).expect(404);
    expect((await request(app).get("/api/notes").set(as(bob))).body).toEqual([]);

    // 2. Generate an exam. Only 5, 10 or 25 questions are allowed.
    await request(app).post(`/api/notes/${noteId}/exams`).set(as(alice)).send({ difficulty: "HARD", questionCount: 7 }).expect(400);
    const examRes = await request(app).post(`/api/notes/${noteId}/exams`).set(as(alice)).send({ difficulty: "HARD", questionCount: 5 }).expect(202);
    const examId = examRes.body.id;
    const exam = await waitForReady(`/api/exams/${examId}`, alice);
    expect(exam.body.questions).toHaveLength(5);

    // The exam the student takes must not contain the answer key.
    for (const q of exam.body.questions) {
      expect(q).not.toHaveProperty("correctIndex");
      expect(q).not.toHaveProperty("modelAnswer");
      expect(q).not.toHaveProperty("rubric");
      expect(q).not.toHaveProperty("explanation");
    }
    await request(app).get(`/api/exams/${examId}`).set(as(bob)).expect(404);

    // 3. Submit: the short answer is graded in the background; one MCQ is left blank.
    const shortQ = exam.body.questions.find((q: { type: string }) => q.type === "SHORT");
    const mcqs = exam.body.questions.filter((q: { type: string }) => q.type === "MCQ");
    const answers = [
      { questionId: shortQ.id, text: "They make energy" },
      ...mcqs.slice(0, 3).map((q: { id: string; choices: string[] }) => ({ questionId: q.id, selectedIndex: q.choices.indexOf("The cell") })),
    ];
    const submitted = await request(app).post(`/api/exams/${examId}/attempts`).set(as(alice)).send({ answers }).expect(201);
    const attempt = await waitForReady(`/api/attempts/${submitted.body.id}`, alice);

    // 3 correct MCQs (3) + partial short answer (0.5) + 1 blank MCQ (0) = 3.5 / 5
    expect(attempt.body).toMatchObject({ status: "READY", score: 0.7 });
    const reviewShort = attempt.body.questions.find((q: { type: string }) => q.type === "SHORT");
    expect(reviewShort).toMatchObject({ modelAnswer: "They produce ATP.", answer: { score: 0.5, feedback: "Partly right." } });
    const firstMcq = attempt.body.questions.find((q: { type: string }) => q.type === "MCQ");
    expect(firstMcq.choices[firstMcq.correctIndex]).toBe("The cell");
    await request(app).get(`/api/attempts/${submitted.body.id}`).set(as(bob)).expect(404);

    // The note page now shows the exam with its best score.
    const noteAfter = await request(app).get(`/api/notes/${noteId}`).set(as(alice));
    expect(noteAfter.body.exams[0]).toMatchObject({ id: examId, attemptCount: 1, bestScore: 0.7 });

    // 4. Deleting the note removes everything under it.
    await request(app).delete(`/api/notes/${noteId}`).set(as(alice)).expect(204);
    await request(app).get(`/api/exams/${examId}`).set(as(alice)).expect(404);
  }, 60_000);
});
