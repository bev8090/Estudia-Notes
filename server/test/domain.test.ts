import { describe, expect, it } from "vitest";
import { buildQuestionRows, InvalidExamError, shortAnswerCount, shuffleChoices, type GeneratedQuestion } from "../src/domain/exam.ts";
import { attemptScore, gradeMcq } from "../src/domain/grading.ts";

const mcq = (overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion => ({
  type: "MCQ",
  topicNumber: 1,
  prompt: "What is 2 + 2?",
  choices: ["3", "4", "5", "6"],
  correctChoice: 1,
  modelAnswer: null,
  rubric: null,
  explanation: "Two plus two is four.",
  ...overrides,
});

const short = (overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion => ({
  type: "SHORT",
  topicNumber: 2,
  prompt: "Explain addition.",
  choices: [],
  correctChoice: null,
  modelAnswer: "Combining quantities.",
  rubric: "Mentions combining quantities.",
  explanation: "Addition combines quantities.",
  ...overrides,
});

describe("shuffleChoices", () => {
  it("keeps the correct answer attached to the same text", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { choices, correctIndex } = shuffleChoices(["a", "b", "c", "d"], 2, () => (seed * 0.137) % 1);
      expect(choices[correctIndex]).toBe("c");
      expect([...choices].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });

  it("spreads the correct answer across all four positions", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 200; i++) positions.add(shuffleChoices(["a", "b", "c", "d"], 0, Math.random).correctIndex);
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });
});

describe("buildQuestionRows", () => {
  const topicIds = ["topic-1", "topic-2"];

  it("maps topics, numbers questions, and keeps MCQ answers consistent after shuffling", () => {
    const rows = buildQuestionRows([mcq(), short()], { questionCount: 2, topicIds });
    expect(rows.map((r) => r.order)).toEqual([0, 1]);
    expect(rows[0].topicId).toBe("topic-1");
    expect(rows[0].choices[rows[0].correctIndex!]).toBe("4");
    expect(rows[1]).toMatchObject({ type: "SHORT", topicId: "topic-2", choices: [], correctIndex: null });
  });

  it("drops malformed questions and fills from the rest", () => {
    const rows = buildQuestionRows(
      [
        mcq({ choices: ["a", "b", "c"] }), // only 3 choices
        mcq({ correctChoice: 7 }), // out of range
        mcq({ choices: ["x", "x", "y", "z"] }), // duplicate choice
        short({ rubric: null }), // missing rubric
        mcq(),
      ],
      { questionCount: 1, topicIds },
    );
    expect(rows).toHaveLength(1);
  });

  it("throws when too few valid questions remain, so the caller can retry", () => {
    expect(() => buildQuestionRows([mcq(), mcq({ choices: [] })], { questionCount: 2, topicIds })).toThrow(InvalidExamError);
  });

  it("ignores extra questions beyond the requested count", () => {
    expect(buildQuestionRows([mcq(), mcq(), mcq()], { questionCount: 2, topicIds })).toHaveLength(2);
  });

  it("uses no topic when the model cites a topic that doesn't exist", () => {
    expect(buildQuestionRows([mcq({ topicNumber: 9 })], { questionCount: 1, topicIds })[0].topicId).toBeNull();
  });
});

describe("grading", () => {
  it("scores multiple choice", () => {
    expect(gradeMcq(2, 2)).toEqual({ score: 1, isCorrect: true });
    expect(gradeMcq(2, 1)).toEqual({ score: 0, isCorrect: false });
    expect(gradeMcq(2, null)).toEqual({ score: 0, isCorrect: false });
  });

  it("averages scores, counting partial credit", () => {
    expect(attemptScore([1, 0.5, 0, 1])).toBe(0.625);
    expect(attemptScore([])).toBe(0);
  });

  it("uses about 30% short answer", () => {
    expect([5, 10, 25].map(shortAnswerCount)).toEqual([2, 3, 8]);
  });
});
