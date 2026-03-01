export interface Question {
  id: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  questionImageUrl: string | null;
  hasImage: boolean | null;
}

export interface UserData {
  id: string;
  firstName: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
}