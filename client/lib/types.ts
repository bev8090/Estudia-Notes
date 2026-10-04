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

export type TopicImportance = "HIGH" | "MEDIUM" | "LOW";

export type Topic = {
  id: string;
  name: string;
  importance: TopicImportance;
  keyPoints: string[];
  keyTerms: { term: string; definition: string }[];
  examTips: string[]; // "Be able to ..."
  pitfalls: string[]; // common mistakes to avoid
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
  summary: { overview: string; examPriorities: string[]; topics: Topic[] } | null;
  exams: ExamListItem[];
};

export type PublicQuestion = {
  id: string;
  order: number;
  type: QuestionType;
  prompt: string;
  choices: string[];
  topic: { id: string; name: string } | null;
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

export type TopicProgress = {
  topicId: string;
  name: string;
  answered: number;
  accuracy: number; // 0..1 over the most recent answers
  lastPracticed: string;
  weak: boolean;
};

export type ProgressStats = {
  totals: {
    attempts: number;
    averageScore: number | null;
    questionsAnswered: number;
    topicsPracticed: number;
    weakTopics: number;
  };
  history: {
    attemptId: string;
    score: number;
    submittedAt: string;
    difficulty: Difficulty;
    questionCount: number;
    noteTitle: string;
  }[];
  notes: { noteId: string; noteTitle: string; topics: TopicProgress[] }[];
};
