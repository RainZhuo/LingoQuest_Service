export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
};

export type LessonLevel = "beginner" | "intermediate" | "advanced";

export type Lesson = {
  title: string;
  level: LessonLevel;
  dialogue: { speaker: string; text: string }[];
  vocabulary: { word: string; definition: string }[];
  grammar: string;
};

export type TutorMessage = {
  role: "user" | "assistant";
  text: string;
};

export type TutorReply = {
  reply: string;
  corrections?: {
    original: string;
    corrected: string;
    reason: string;
  }[];
  suggestions?: string[];
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  lastActiveAt: string;
};

export type LessonCompletionRecord = {
  lessonId: string;
  uid: string;
  topic: string | null;
  learnerLevel: LessonLevel | null;
  score: number | null;
  awardedXp: number;
  completed: true;
  completedAt: string;
};

export type LessonCompletionResult = {
  progress: {
    lessonId: string;
    completed: true;
    awardedXp: number;
    wasDuplicate: boolean;
    completedAt: string;
  };
  user: {
    uid: string;
    level: number;
    xp: number;
    streak: number;
    lastActiveAt: string;
  };
};

export type WordProgressStatus = "new" | "review" | "known";

export type WordProgressEntry = {
  word: string;
  status: WordProgressStatus;
  reviewedAt: string;
};
