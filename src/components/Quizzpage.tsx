import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";
import { SmartImage, OptionalMathContent } from "./Maths";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Question {
  id: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  questionImageUrl?: string | null;
  hasImage?: boolean | null;
}

interface UserData {
  id: string;
  firstName: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
}

type ResultTab = "correct" | "incorrect" | "unattempted";

// ─── Utility ──────────────────────────────────────────────────────────────────

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Circular SVG progress ring used in the results screen */
const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 70 ? "#66934e" : percentage >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="70"
        y="65"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill={color}
      >
        {percentage}%
      </text>
      <text x="70" y="85" textAnchor="middle" fontSize="11" fill="#6b7280">
        Score
      </text>
    </svg>
  );
};

/** Stat pill shown in the results summary row */
const StatBadge: React.FC<{
  label: string;
  value: number;
  color: string;
  border: string;
}> = ({ label, value, color, border }) => (
  <div
    className={`bg-white shadow-sm rounded-xl p-4 min-w-[110px] flex flex-col items-center border-t-4 ${border}`}
  >
    <span className={`text-3xl font-bold ${color}`}>{value}</span>
    <span className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
      {label}
    </span>
  </div>
);

/** Sticky bar shown above questions during the quiz */
const StickyBar: React.FC<{
  attempted: number;
  total: number;
  timeRemaining: number;
  progressWidth: number;
}> = ({ attempted, total, timeRemaining, progressWidth }) => {
  const urgent = timeRemaining < 300;
  const critical = timeRemaining < 60;

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm px-4 py-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        {/* Progress pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Progress
          </span>
          <span className="bg-[#66934e] text-white text-sm font-semibold px-3 py-0.5 rounded-full">
            {attempted} / {total}
          </span>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 font-mono text-xl font-bold rounded-lg px-4 py-1.5 transition-colors duration-500 ${
            critical
              ? "bg-red-100 text-red-600 animate-pulse"
              : urgent
              ? "bg-orange-50 text-orange-500"
              : "bg-gray-50 text-[#66934e]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#66934e] h-full rounded-full transition-all duration-500"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
};

/** Single option card rendered inside a QuestionItem */
const OptionCard: React.FC<{
  opt: string;
  optionText: string;
  questionId: number;
  isSelected: boolean;
  isCorrectChoice: boolean;
  isWrongChoice: boolean;
  isQuizEnded: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  opt,
  optionText,
  questionId,
  isSelected,
  isCorrectChoice,
  isWrongChoice,
  isQuizEnded,
  onChange,
}) => {
  let cardStyle =
    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 ";

  if (isCorrectChoice) {
    cardStyle += "border-green-400 bg-green-50";
  } else if (isWrongChoice) {
    cardStyle += "border-red-400 bg-red-50";
  } else if (isSelected) {
    cardStyle += "border-[#66934e] bg-[#f0f7ec]";
  } else {
    cardStyle += "border-gray-200 bg-white hover:border-[#66934e] hover:bg-[#fafdf8]";
  }

  if (!isQuizEnded) cardStyle += " cursor-pointer";

  const labelLetter = (
    <span
      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-200 ${
        isCorrectChoice
          ? "bg-green-500 border-green-500 text-white"
          : isWrongChoice
          ? "bg-red-400 border-red-400 text-white"
          : isSelected
          ? "bg-[#66934e] border-[#66934e] text-white"
          : "border-gray-300 text-gray-400"
      }`}
    >
      {opt}
    </span>
  );

  return (
    <label className={cardStyle}>
      <input
        type="radio"
        name={`question-${questionId}`}
        value={opt}
        checked={isSelected}
        disabled={isQuizEnded}
        onChange={onChange}
        className="sr-only"
      />
      {labelLetter}
      <span className="flex-1 text-sm text-gray-700 leading-snug">
        <OptionalMathContent content={optionText} />
      </span>
      {isCorrectChoice && (
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {isWrongChoice && (
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </label>
  );
};

/** A single quiz question with its answer options */
const QuestionItem: React.FC<{
  question: Question;
  index: number;
  userAnswer: string | undefined;
  isQuizEnded: boolean;
  showAnswer?: boolean;
  onAnswerSelect: (questionId: number, optionText: string) => void;
}> = ({ question, index, userAnswer, isQuizEnded, showAnswer = false, onAnswerSelect }) => {
  const isAnswered = !!userAnswer;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 overflow-hidden ${
        isAnswered && !isQuizEnded ? "border-[#66934e]/40" : "border-gray-100"
      }`}
    >
      {/* Question header */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isAnswered && !isQuizEnded
              ? "bg-[#66934e] text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {index + 1}
        </span>
        <p className="text-gray-800 font-medium leading-relaxed">
          <OptionalMathContent content={question.question} />
        </p>
      </div>

      {question.questionImageUrl && (
        <div className="px-5 pb-3">
          <SmartImage src={question.questionImageUrl} alt="Question" />
        </div>
      )}

      {/* Options */}
      <div className="px-5 pb-5 space-y-2.5">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const key = `option${opt}` as keyof Question;
          const optionText = question[key] as string | null;
          if (!optionText) return null;

          const isSelected = userAnswer === optionText;
          const isCorrectChoice = showAnswer && question.correctAnswer === optionText;
          const isWrongChoice = showAnswer && isSelected && !isCorrectChoice;

          return (
            <OptionCard
              key={opt}
              opt={opt}
              optionText={optionText}
              questionId={question.id}
              isSelected={isSelected}
              isCorrectChoice={isCorrectChoice}
              isWrongChoice={isWrongChoice}
              isQuizEnded={isQuizEnded}
              onChange={(e) => {
                e.preventDefault();
                onAnswerSelect(question.id, optionText);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Pagination row at the bottom of the question list */
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, disabled, onPageChange }) => (
  <div className="flex justify-between items-center mt-6">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1 || disabled}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 ${
        currentPage === 1 || disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white border border-[#66934e] text-[#66934e] hover:bg-[#f0f7ec]"
      }`}
    >
      ← Previous
    </button>
    <span className="text-sm text-gray-500 font-medium">
      Page <span className="text-gray-800 font-semibold">{currentPage}</span> of{" "}
      <span className="text-gray-800 font-semibold">{totalPages}</span>
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages || disabled}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 ${
        currentPage === totalPages || disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-[#66934e] text-white hover:bg-[#558040]"
      }`}
    >
      Next →
    </button>
  </div>
);

/** Result card shown in the post-quiz review tabs */
const ResultCard: React.FC<{
  question: Question;
  status: ResultTab;
  userAnswer?: string;
}> = ({ question, status, userAnswer }) => {
  const [expanded, setExpanded] = useState(false);

  const headerColor =
    status === "correct"
      ? "border-green-400"
      : status === "incorrect"
      ? "border-red-400"
      : "border-gray-300";

  const iconEl =
    status === "correct" ? (
      <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs flex-shrink-0">✓</span>
    ) : status === "incorrect" ? (
      <span className="w-6 h-6 rounded-full bg-red-400 text-white flex items-center justify-center text-xs flex-shrink-0">✗</span>
    ) : (
      <span className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs flex-shrink-0">–</span>
    );

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-4 ${headerColor} mb-3 overflow-hidden transition-all duration-200`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors duration-150"
      >
        {iconEl}
        <span className="flex-1 text-sm text-gray-800 font-medium leading-snug">
          <OptionalMathContent content={question.question} />
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {question.questionImageUrl && (
            <SmartImage src={question.questionImageUrl} alt="Question" />
          )}

          {status === "incorrect" && userAnswer && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <span className="flex-shrink-0 font-semibold">Your answer:</span>
              <OptionalMathContent content={userAnswer} />
            </div>
          )}

          {(status === "incorrect" || status === "unattempted") && question.correctAnswer && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <span className="flex-shrink-0 font-semibold">Correct answer:</span>
              <OptionalMathContent content={question.correctAnswer} />
            </div>
          )}

          {question.explanation && (
            <div className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3">
              <span className="text-amber-500 flex-shrink-0">💡</span>
              <OptionalMathContent content={question.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Tab bar + content for the results review section */
const ResultTabs: React.FC<{
  activeTab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  counts: { correct: number; incorrect: number; unattempted: number };
  filters: { correct: Question[]; incorrect: Question[]; unattempted: Question[] };
  userAnswers: Record<number, string>;
}> = ({ activeTab, onTabChange, counts, filters, userAnswers }) => {
  const tabs: { key: ResultTab; label: string; color: string; active: string }[] = [
    { key: "correct", label: "Correct", color: "text-green-600", active: "border-green-500 text-green-700" },
    { key: "incorrect", label: "Incorrect", color: "text-red-500", active: "border-red-500 text-red-600" },
    { key: "unattempted", label: "Skipped", color: "text-gray-500", active: "border-gray-500 text-gray-700" },
  ];

  const emptyMessages: Record<ResultTab, string> = {
    correct: "No correct answers yet.",
    incorrect: "🎉 No incorrect answers — well done!",
    unattempted: "✅ You attempted every question!",
  };

  return (
    <div>
      {/* Tab list */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
              activeTab === key ? active : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === key ? "bg-gray-100" : "bg-gray-50"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {filters[activeTab].length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-2xl border border-gray-100">
            {emptyMessages[activeTab]}
          </div>
        ) : (
          filters[activeTab].map((q) => (
            <ResultCard
              key={q.id}
              question={q}
              status={activeTab}
              userAnswer={userAnswers[q.id]}
            />
          ))
        )}
      </div>
    </div>
  );
};

/** Confirmation modal before submitting */
const SubmitConfirmModal: React.FC<{
  unattempted: number;
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ unattempted, total, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full">
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Submit Exam?</h3>
        {unattempted > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            You have{" "}
            <span className="font-semibold text-amber-600">
              {unattempted} unanswered
            </span>{" "}
            question{unattempted !== 1 ? "s" : ""} out of {total}.
          </p>
        )}
        {unattempted === 0 && (
          <p className="text-sm text-gray-500 mt-2">You answered all questions. Ready to submit?</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors duration-200"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-[#66934e] text-white font-medium hover:bg-[#558040] transition-colors duration-200"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // ── State ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const resultAlreadySubmitted = useRef<boolean>(false);
  const [userData, setUserData] = useState<UserData>({ id: "", firstName: "User" });
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalQuestions: 0,
  });
  const [activeTab, setActiveTab] = useState<ResultTab>("correct");

  // ── Derived ────────────────────────────────────────────────────────────────

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      examType: params.get("examType"),
      subjectName: params.get("subjectName"),
      year: params.get("year"),
    };
  }, [location.search]);

  const correctAnswers = useMemo<Record<number, boolean>>(() => {
    const source = allQuestions.length ? allQuestions : questions;
    const map: Record<number, boolean> = {};
    for (const q of source) {
      if (userAnswers[q.id] !== undefined) {
        map[q.id] =
          userAnswers[q.id].trim().toLowerCase() ===
          (q.correctAnswer ?? "").trim().toLowerCase();
      }
    }
    return map;
  }, [userAnswers, allQuestions, questions]);

  const totalQuestionsSafe = useMemo(() => {
    if (pagination.totalQuestions > 0) return pagination.totalQuestions;
    if (allQuestions.length > 0) return allQuestions.length;
    if (pagination.totalPages > 1) return pagination.totalPages * 10;
    return questions.length;
  }, [pagination.totalQuestions, allQuestions.length, pagination.totalPages, questions.length]);

  const examStats = useMemo(() => {
    const passed = Object.values(correctAnswers).filter(Boolean).length;
    const attempted = Object.keys(userAnswers).length;
    const failed = Math.max(0, attempted - passed);
    const unattempted = Math.max(0, totalQuestionsSafe - attempted);
    const percentage =
      totalQuestionsSafe > 0 ? Math.round((passed / totalQuestionsSafe) * 100) : 0;
    return { passed, attempted, failed, unattempted, percentage };
  }, [correctAnswers, userAnswers, totalQuestionsSafe]);

  const progressWidth = useMemo(() => {
    if (totalQuestionsSafe === 0) return 0;
    return (examStats.attempted / totalQuestionsSafe) * 100;
  }, [examStats.attempted, totalQuestionsSafe]);

  const questionFilters = useMemo(() => {
    const source = allQuestions.length ? allQuestions : questions;
    return {
      correct: source.filter((q) => correctAnswers[q.id]),
      incorrect: source.filter((q) => userAnswers[q.id] && !correctAnswers[q.id]),
      unattempted: source.filter((q) => !userAnswers[q.id]),
    };
  }, [allQuestions, questions, correctAnswers, userAnswers]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserData(JSON.parse(stored));
    } catch (err) {
      console.error("Error parsing user data", err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseApi}/exam/questions`, {
          params: { ...queryParams, page: pagination.currentPage },
          signal: controller.signal,
        });
        const fetched: Question[] = res.data?.questions ?? [];
        setQuestions(fetched);
        setAllQuestions((prev) => {
          if (fetched.length === 0) return prev;
          const map = new Map<number, Question>(prev.map((q) => [q.id, q]));
          for (const q of fetched) if (!map.has(q.id)) map.set(q.id, q);
          return Array.from(map.values());
        });
        setPagination((p) => ({
          ...p,
          totalPages: res.data?.totalPages ?? p.totalPages,
          totalQuestions: res.data?.totalQuestions ?? p.totalQuestions,
        }));
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Error fetching questions", err);
          toast.error("Failed to fetch questions. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [queryParams, pagination.currentPage]);

  useEffect(() => {
    if (timeRemaining <= 0 || isQuizEnded) return;
    const t = setInterval(() => setTimeRemaining((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeRemaining, isQuizEnded]);

  // Layout sizing
  useEffect(() => {
    const recompute = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const footerH = footerRef.current?.offsetHeight ?? 0;
      const viewport = window.innerHeight;
      setContainerHeight(Math.max(300, viewport - headerH - footerH - 20));
    };
    let tid: NodeJS.Timeout;
    const debounced = () => { clearTimeout(tid); tid = setTimeout(recompute, 100); };
    recompute();
    const observers = [
      headerRef.current && new ResizeObserver(debounced),
      footerRef.current && new ResizeObserver(debounced),
      stickyRef.current && new ResizeObserver(debounced),
    ].filter(Boolean) as ResizeObserver[];
    if (headerRef.current && observers[0]) observers[0].observe(headerRef.current);
    if (footerRef.current && observers[1]) observers[1].observe(footerRef.current);
    if (stickyRef.current && observers[2]) observers[2].observe(stickyRef.current);
    window.addEventListener("resize", debounced);
    window.addEventListener("orientationchange", debounced);
    return () => {
      clearTimeout(tid);
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("resize", debounced);
      window.removeEventListener("orientationchange", debounced);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAnswerSelect = useCallback(
    (questionId: number, optionText: string) => {
      if (isQuizEnded) return;
      setUserAnswers((prev) => ({ ...prev, [questionId]: optionText }));
    },
    [isQuizEnded]
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    questionsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setPagination((p) => ({ ...p, currentPage: newPage }));
  };

  const submitExamResult = useCallback(async () => {
    if (resultAlreadySubmitted.current) return;
    try {
      setIsSubmitting(true);
      if (!userData.id) {
        toast.error("User information not found. Please log in again.");
        return;
      }
      const examId = allQuestions[0]?.id ?? questions[0]?.id;
      const payload = {
        userId: userData.id,
        examId,
        score: Object.values(correctAnswers).filter(Boolean).length,
        totalQuestions: totalQuestionsSafe,
        examType: queryParams.examType,
        subjectName: queryParams.subjectName,
        year: queryParams.year,
      };
      await axios.post(`${baseApi}/exam/submit-result`, payload);
      resultAlreadySubmitted.current = true;
      await axios.post(`${baseApi}/exam/send-result-email`, payload);
      toast.success("Exam results submitted and sent to your email!");
    } catch (err) {
      console.error("Error submitting result", err);
      toast.error("Failed to submit exam result.");
    } finally {
      setIsSubmitting(false);
    }
  }, [userData.id, allQuestions, questions, correctAnswers, totalQuestionsSafe, queryParams]);

  const handleSubmitExam = useCallback(() => {
    if (isSubmitting || isQuizEnded) return;
    setIsQuizEnded(true);
    setTimeRemaining(0);
    submitExamResult();
  }, [submitExamResult, isSubmitting, isQuizEnded]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (timeRemaining <= 0 && !isQuizEnded && !isSubmitting) {
      handleSubmitExam();
    }
  }, [timeRemaining, isQuizEnded, isSubmitting, handleSubmitExam]);

  const restartQuiz = useCallback(() => {
    setUserAnswers({});
    setIsQuizEnded(false);
    setTimeRemaining(3600);
    resultAlreadySubmitted.current = false;
    setActiveTab("correct");
    setAllQuestions([]);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {showConfirmModal && (
        <SubmitConfirmModal
          unattempted={examStats.unattempted}
          total={totalQuestionsSafe}
          onConfirm={() => {
            setShowConfirmModal(false);
            handleSubmitExam();
          }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* ── Header ── */}
      <header
        ref={headerRef}
        className="bg-white border-b border-gray-100 shadow-sm py-5 px-4"
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-800 tracking-tight">
            {isQuizEnded ? "Exam Results" : "Take Exam"}
          </h1>
          <div className="flex justify-center mt-2">
            <div className="w-10 h-0.5 bg-[#66934e] rounded-full" />
          </div>
          {!loading && (
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              {[queryParams.examType, queryParams.subjectName, queryParams.year]
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#f0f7ec] text-[#66934e] font-semibold px-3 py-1 rounded-full border border-[#66934e]/20"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-[#66934e] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-500">Loading questions…</p>
          </div>
        ) : (
          <div
            ref={questionsContainerRef}
            className="relative overflow-y-auto scroll-smooth"
            style={{ height: containerHeight ? `${containerHeight}px` : undefined }}
          >
            {/* Active quiz view */}
            {!isQuizEnded && (
              <>
                <div ref={stickyRef}>
                  <StickyBar
                    attempted={examStats.attempted}
                    total={totalQuestionsSafe}
                    timeRemaining={timeRemaining}
                    progressWidth={progressWidth}
                  />
                </div>

                <div className="space-y-4 mt-4 pb-6">
                  {questions.map((q, idx) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      index={(pagination.currentPage - 1) * 10 + idx}
                      userAnswer={userAnswers[q.id]}
                      isQuizEnded={isQuizEnded}
                      onAnswerSelect={handleAnswerSelect}
                    />
                  ))}
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    disabled={isQuizEnded}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}

            {/* Results view */}
            {isQuizEnded && (
              <div className="py-6 space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    {userData.firstName}, here are your results!
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    {queryParams.examType} · {queryParams.subjectName} · {queryParams.year}
                  </p>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <CircularProgress percentage={examStats.percentage} />

                    <div className="flex flex-wrap gap-3 justify-center">
                      <StatBadge
                        label="Correct"
                        value={examStats.passed}
                        color="text-green-600"
                        border="border-green-400"
                      />
                      <StatBadge
                        label="Incorrect"
                        value={examStats.failed}
                        color="text-red-500"
                        border="border-red-400"
                      />
                      <StatBadge
                        label="Skipped"
                        value={examStats.unattempted}
                        color="text-gray-500"
                        border="border-gray-300"
                      />
                      <StatBadge
                        label="Attempted"
                        value={examStats.attempted}
                        color="text-blue-600"
                        border="border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Review tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                    Review Answers
                  </h3>
                  <ResultTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={{
                      correct: examStats.passed,
                      incorrect: examStats.failed,
                      unattempted: examStats.unattempted,
                    }}
                    filters={questionFilters}
                    userAnswers={userAnswers}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-between">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    ← Dashboard
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate("/exams")}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      New Exam
                    </button>
                    <button
                      onClick={restartQuiz}
                      className="px-5 py-2.5 rounded-xl bg-[#66934e] text-white text-sm font-medium hover:bg-[#558040] transition-colors duration-200"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Submit footer ── */}
      {!isQuizEnded && (
        <div
          ref={footerRef}
          className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3 px-4 z-30"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400 hidden sm:block">
              {examStats.attempted} of {totalQuestionsSafe} answered
            </p>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className={`ml-auto flex items-center gap-2 bg-[#66934e] text-white py-2.5 px-7 rounded-xl font-semibold text-sm shadow-sm hover:bg-[#558040] focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-offset-2 transition-all duration-200 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Exam"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;