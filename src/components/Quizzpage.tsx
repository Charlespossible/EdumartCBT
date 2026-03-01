import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

// === IMPORT MATH HELPERS ===
import { SmartImage, OptionalMathContent } from "./Maths";

// ---- Types ----
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

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ---------- Refs for precise layout ----------
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // -------------------- STATE --------------------
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  /**
   * correctAnswers is derived locally — no network call needed.
   * `correctAnswer` is already present on every Question object
   * returned by GET /exam/questions, so we compare in-memory.
   */
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

  /** Score is derived from correctAnswers — always in sync, no extra state. */
  const score = useMemo(
    () => Object.values(correctAnswers).filter(Boolean).length,
    [correctAnswers]
  );

  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const resultAlreadySubmitted = useRef<boolean>(false);

  const [userData, setUserData] = useState<UserData>({ id: "", firstName: "User" });

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalQuestions: 0,
  });
  const [activeTab, setActiveTab] = useState<"correct" | "incorrect" | "unattempted">("correct");

  // -------------------- QUERY PARAMS --------------------
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      examType: params.get("examType"),
      subjectName: params.get("subjectName"),
      year: params.get("year"),
    };
  }, [location.search]);

  // -------------------- LOAD USER --------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserData(JSON.parse(stored));
    } catch (err) {
      console.error("Error parsing user data", err);
    }
  }, []);

  // -------------------- FETCH QUESTIONS --------------------
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

        // accumulate unique questions across pages
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

  // -------------------- TIMER --------------------
  useEffect(() => {
    if (timeRemaining <= 0 || isQuizEnded) return;
    const t = setInterval(() => setTimeRemaining((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeRemaining, isQuizEnded]);

  // -------------------- ANSWER SELECTION --------------------
  /**
   * Pure local state update — ZERO network I/O.
   *
   * Previously this called POST /exam/validate-answer on every click, which:
   *   - Broke answer registration when offline or on a slow connection
   *   - Created race conditions when the user clicked quickly
   *   - Made the UI dependent on server availability just to record a selection
   *
   * Fix: `correctAnswer` is already present on the Question object returned by
   * GET /exam/questions.  We derive correctness in-memory via the `correctAnswers`
   * memo above.  The single authoritative server-side score is computed once,
   * at final submission (submitExamResult).
   */
  const handleAnswerSelect = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, questionId: number, optionText: string) => {
      if (isQuizEnded) return;
      setUserAnswers((prev) => ({ ...prev, [questionId]: optionText }));
    },
    [isQuizEnded]
  );

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

  // -------------------- PAGINATION --------------------
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (questionsContainerRef.current) {
      questionsContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPagination((p) => ({ ...p, currentPage: newPage }));
  };

  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-6">
      <button
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1 || isQuizEnded}
        className={`px-4 py-2 rounded-lg ${
          pagination.currentPage === 1 || isQuizEnded
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-[#66934e] text-white hover:bg-[#558040]"
        }`}
      >
        Previous
      </button>
      <span className="text-gray-600">
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <button
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage === pagination.totalPages || isQuizEnded}
        className={`px-4 py-2 rounded-lg ${
          pagination.currentPage === pagination.totalPages || isQuizEnded
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-[#66934e] text-white hover:bg-[#558040]"
        }`}
      >
        Next
      </button>
    </div>
  );

  // -------------------- SUBMIT --------------------
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

  useEffect(() => {
    if (timeRemaining <= 0 && !isQuizEnded && !isSubmitting) {
      handleSubmitExam();
    }
  }, [timeRemaining, isQuizEnded, isSubmitting, handleSubmitExam]);

  const questionFilters = useMemo(() => {
    const source = allQuestions.length ? allQuestions : questions;
    return {
      correct: source.filter((q) => correctAnswers[q.id]),
      incorrect: source.filter((q) => userAnswers[q.id] && !correctAnswers[q.id]),
      unattempted: source.filter((q) => !userAnswers[q.id]),
    };
  }, [allQuestions, questions, correctAnswers, userAnswers]);

  const restartQuiz = useCallback(() => {
    setUserAnswers({});
    setIsQuizEnded(false);
    setTimeRemaining(3600);
    resultAlreadySubmitted.current = false;
    setActiveTab("correct");
    setAllQuestions([]);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, []);

  // ---------- Layout sizing ----------
  useEffect(() => {
    const recompute = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const footerH = footerRef.current?.offsetHeight ?? 0;
      const viewport = window.innerHeight;
      const padding = 20;
      const h = Math.max(300, viewport - headerH - footerH - padding);
      setContainerHeight(h);
    };
    let timeoutId: NodeJS.Timeout;
    const debouncedRecompute = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(recompute, 100);
    };
    recompute();
    const roHeader = headerRef.current ? new ResizeObserver(debouncedRecompute) : null;
    const roFooter = footerRef.current ? new ResizeObserver(debouncedRecompute) : null;
    const roSticky = stickyRef.current ? new ResizeObserver(debouncedRecompute) : null;
    if (headerRef.current && roHeader) roHeader.observe(headerRef.current);
    if (footerRef.current && roFooter) roFooter.observe(footerRef.current);
    if (stickyRef.current && roSticky) roSticky.observe(stickyRef.current);
    window.addEventListener("resize", debouncedRecompute);
    window.addEventListener("orientationchange", debouncedRecompute);
    return () => {
      clearTimeout(timeoutId);
      if (roHeader && headerRef.current) roHeader.unobserve(headerRef.current);
      if (roFooter && footerRef.current) roFooter.unobserve(footerRef.current);
      if (roSticky && stickyRef.current) roSticky.unobserve(stickyRef.current);
      window.removeEventListener("resize", debouncedRecompute);
      window.removeEventListener("orientationchange", debouncedRecompute);
    };
  }, []);

  // -------------------- QUESTION ITEM --------------------
  const QuestionItem: React.FC<{ question: Question; index: number; showAnswer?: boolean }> = ({
    question,
    index,
    showAnswer = false,
  }) => (
    <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Render question with math support */}
      <p className="font-bold text-lg mb-3">
        {index + 1}. <OptionalMathContent content={question.question} />
      </p>

      {question.questionImageUrl && (
        <div className="mb-4">
          <SmartImage src={question.questionImageUrl} alt="Question" />
        </div>
      )}

      <div className="mt-3 space-y-3">
        {["A", "B", "C", "D"].map((opt) => {
          const key = `option${opt}` as keyof Question;
          const optionText = question[key] as unknown as string | null;
          if (!optionText) return null;

          const isSelected = userAnswers[question.id] === optionText;
          const isCorrectChoice = showAnswer && question.correctAnswer === optionText;

          return (
            <label
              key={opt}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isQuizEnded ? "" : "cursor-pointer hover:bg-gray-100"
              } ${isSelected ? "bg-blue-50 border border-blue-200" : ""} ${
                showAnswer && isCorrectChoice ? "bg-green-50 border border-green-200" : ""
              } ${
                showAnswer && isSelected && !isCorrectChoice ? "bg-red-50 border border-red-200" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt}
                checked={isSelected}
                disabled={isQuizEnded}
                onChange={(e) =>
                  optionText && handleAnswerSelect(e, question.id, optionText)
                }
                className="mr-3 h-4 w-4 accent-[#66934e] focus:outline-none"
                onFocus={(e) => e.target.blur()}
              />
              {/* Render option with math support */}
              <OptionalMathContent content={optionText} />
              {showAnswer && isCorrectChoice && (
                <span className="ml-auto text-green-600">✓</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );

  const ResultCard: React.FC<{ question: Question; status: "correct" | "incorrect" | "unattempted" }> =
    ({ question, status }) => {
      const statusIcon =
        status === "correct" ? "✅" : status === "incorrect" ? "❌" : "❓";
      const statusColor =
        status === "correct" ? "#66934e" : status === "incorrect" ? "red" : "gray";

      return (
        <div className="p-5 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
          <p className="font-bold text-lg flex items-start mb-3">
            <span style={{ color: statusColor, marginRight: 10 }}>{statusIcon}</span>
            <OptionalMathContent content={question.question} />
          </p>

          {question.questionImageUrl && (
            <SmartImage src={question.questionImageUrl} alt="Question" />
          )}

          {status === "incorrect" && (
            <p className="mb-2 text-red-600">
              Your answer: <OptionalMathContent content={userAnswers[question.id]} />
            </p>
          )}

          {(status === "incorrect" || status === "unattempted") &&
            question.correctAnswer && (
              <p className="mb-2 text-green-600 font-medium">
                Correct answer:{" "}
                <OptionalMathContent content={question.correctAnswer} />
              </p>
            )}

          {question.explanation && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-[#66934e]">
              <p className="flex items-start">
                <span style={{ color: "#66934e", marginRight: 8 }}>💡</span>
                <OptionalMathContent content={question.explanation} />
              </p>
            </div>
          )}
        </div>
      );
    };

  // -------------------- RENDER --------------------
  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <header ref={headerRef} className="bg-white shadow-md py-6 px-4 mb-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Take Exam
          </h1>
          <div className="flex justify-center">
            <hr className="border-b-2 border-[#66934e] mt-4 w-20" />
          </div>
          {!loading && !isQuizEnded && (
            <div className="mt-4 flex justify-center text-gray-700">
              <span className="font-medium">{queryParams.examType}</span> -
              <span className="mx-2">{queryParams.subjectName}</span> -
              <span>{queryParams.year}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-[#66934e] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-lg font-medium text-gray-700">
              Loading exam questions...
            </p>
          </div>
        ) : (
          <div
            ref={questionsContainerRef}
            className="questions-container relative overflow-y-auto scroll-smooth"
            style={{
              height: containerHeight ? `${containerHeight}px` : undefined,
              scrollBehavior: "smooth",
            }}
          >
            {!isQuizEnded && (
              <div
                ref={stickyRef}
                className="sticky top-0 z-20 bg-white/98 backdrop-blur-sm p-4 border-b border-gray-200 shadow-sm"
              >
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="font-medium text-gray-600">
                    <span>Questions:</span>
                    <span className="ml-2 bg-[#66934e] text-white py-1 px-3 rounded-full text-sm">
                      {examStats.attempted} / {totalQuestionsSafe}
                    </span>
                  </div>
                  <div className="font-bold text-xl flex items-center">
                    <span className="text-gray-700 mr-2">Time:</span>
                    <span
                      className={`${
                        timeRemaining < 300 ? "text-red-600" : "text-[#66934e]"
                      } ${timeRemaining < 60 ? "animate-pulse" : ""}`}
                    >
                      {Math.floor(timeRemaining / 60)}:
                      {String(timeRemaining % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="font-medium text-gray-600">
                    <span>Score:</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">
                      {score} / {totalQuestionsSafe}
                    </span>
                  </div>
                </div>
                <div className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#66934e] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            )}

            {/* QUESTION LIST */}
            <div className="space-y-6 mt-4 pb-6">
              {!isQuizEnded ? (
                <>
                  {questions.map((q, idx) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      index={(pagination.currentPage - 1) * 10 + idx}
                    />
                  ))}
                  <div className="pt-4">
                    <PaginationControls />
                  </div>
                </>
              ) : (
                <div>
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-bold mb-2">
                      {userData.firstName}, Your Exam Results
                    </h3>
                    <hr className="border-b-2 border-[#66934e] mb-4 w-32 mx-auto" />
                    <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
                      <div className="bg-white shadow-md rounded-lg p-4 flex-1 max-w-[200px] border-t-4 border-[#66934e] mx-auto md:mx-0">
                        <p className="text-4xl font-bold text-[#66934e] text-center">
                          {score}
                        </p>
                        <p className="text-gray-600 text-center">
                          out of {totalQuestionsSafe}
                        </p>
                        <div className="mt-2 flex justify-center">
                          <span
                            className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                              examStats.percentage >= 70
                                ? "bg-green-500"
                                : examStats.percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          >
                            {examStats.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <div className="bg-white shadow-md rounded-lg p-3 border-l-4 border-green-500 min-w-[120px]">
                          <p className="font-medium text-center">Correct</p>
                          <p className="text-2xl font-bold text-center text-green-600">
                            {examStats.passed}
                          </p>
                        </div>
                        <div className="bg-white shadow-md rounded-lg p-3 border-l-4 border-red-500 min-w-[120px]">
                          <p className="font-medium text-center">Incorrect</p>
                          <p className="text-2xl font-bold text-center text-red-600">
                            {examStats.failed}
                          </p>
                        </div>
                        <div className="bg-white shadow-md rounded-lg p-3 border-l-4 border-gray-500 min-w-[120px]">
                          <p className="font-medium text-center">Unattempted</p>
                          <p className="text-2xl font-bold text-center text-gray-600">
                            {examStats.unattempted}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-200">
                      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                        {(["correct", "incorrect", "unattempted"] as const).map((tab) => (
                          <li className="mr-2" key={tab}>
                            <button
                              onClick={() => setActiveTab(tab)}
                              className={`inline-block p-4 rounded-t-lg ${
                                activeTab === tab
                                  ? "text-[#66934e] border-b-2 border-[#66934e]"
                                  : "text-gray-500 hover:text-gray-600 hover:border-gray-300 border-b-2 border-transparent"
                              }`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)} (
                              {tab === "correct"
                                ? examStats.passed
                                : tab === "incorrect"
                                ? examStats.failed
                                : examStats.unattempted}
                              )
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4">
                      {activeTab === "correct" &&
                        (questionFilters.correct.length ? (
                          questionFilters.correct.map((q) => (
                            <ResultCard key={q.id} question={q} status="correct" />
                          ))
                        ) : (
                          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600 font-medium">
                              No correct answers yet
                            </p>
                          </div>
                        ))}
                      {activeTab === "incorrect" &&
                        (questionFilters.incorrect.length ? (
                          questionFilters.incorrect.map((q) => (
                            <ResultCard key={q.id} question={q} status="incorrect" />
                          ))
                        ) : (
                          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600 font-medium">
                              Perfect! No incorrect answers
                            </p>
                          </div>
                        ))}
                      {activeTab === "unattempted" &&
                        (questionFilters.unattempted.length ? (
                          questionFilters.unattempted.map((q) => (
                            <ResultCard key={q.id} question={q} status="unattempted" />
                          ))
                        ) : (
                          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600 font-medium">
                              Great! You attempted all questions
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-between gap-3">
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => navigate("/exams")}
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                    >
                      Take Another Exam
                    </button>
                    <button
                      onClick={restartQuiz}
                      className="bg-[#66934e] text-white py-2 px-6 rounded-lg hover:bg-[#558040] focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50 transition-colors duration-200"
                    >
                      Retake Exam
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {!isQuizEnded && (
        <div
          ref={footerRef}
          className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-4 px-4 flex justify-center z-30"
        >
          <div className="max-w-6xl w-full flex justify-center">
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className={`bg-[#66934e] text-white py-3 px-8 rounded-lg text-lg font-medium shadow-md hover:bg-[#558040] focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50 transition-colors duration-200 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
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
