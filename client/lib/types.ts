// Shapes of the JSON the Express API returns. Keep in sync with server/src/routes.

export type JobStatus = "PROCESSING" | "READY" | "FAILED";
export type SourceType = "TEXT" | "PDF" | "DOCX" | "IMAGE";
export type Difficulty = "STANDARD" | "HARD" | "CHALLENGE";
export type QuestionType = "MCQ" | "SHORT";

export type NoteListItem = {
  id: string;
  title: string;
  sourceType: SourceType;
  status: JobStatus;
  error: string | null;
  createdAt: string;
  examCount: number;
};

export type Topic = {
  id: string;
  name: string;
  keyPoints: string[];
  keyTerms: { term: string; definition: string }[];
};

export type ExamListItem = {
  id: string;
  difficulty: Difficulty;
  questionCount: number;
  status: JobStatus;
  error: string | null;
  createdAt: string;
  attemptCount: number;
  bestScore: number | null;
};

export type NoteDetail = Omit<NoteListItem, "examCount"> & {
  summary: { overview: string; topics: Topic[] } | null;
  exams: ExamListItem[];
};

export type PublicQuestion = {
  id: string;
  order: number;
  type: QuestionType;
  prompt: string;
  choices: string[];
  topic: { name: string } | null;
};

export type ExamDetail = {
  id: string;
  difficulty: Difficulty;
  questionCount: number;
  status: JobStatus;
  error: string | null;
  createdAt: string;
  note: { id: string; title: string };
  questions: PublicQuestion[];
  attempts: { id: string; status: JobStatus; score: number | null; submittedAt: string }[];
};

export type ReviewQuestion = PublicQuestion & {
  correctIndex: number | null;
  modelAnswer: string | null;
  explanation: string;
  answer: {
    selectedIndex: number | null;
    text: string | null;
    score: number | null;
    isCorrect: boolean | null;
    feedback: string | null;
  } | null;
};

export type AttemptDetail = {
  id: string;
  status: JobStatus;
  error: string | null;
  score: number | null;
  submittedAt: string;
  exam: { id: string; difficulty: Difficulty; questionCount: number; note: { id: string; title: string } };
  questions: ReviewQuestion[];
};
