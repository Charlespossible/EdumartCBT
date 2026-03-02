import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import baseApi from "../../utils/baseApi";

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation?: string;
}

interface AnswerResult {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

// Toast utility (to fix missing toast reference)
const toast = {
  error: (message: string) => console.error(message),
};

// Memoized components for better performance
const LoadingState = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-600">Loading questions...</p>
    </div>
  </div>
));

const ErrorState = memo(({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <p className="text-xl font-semibold text-red-600 text-center">{message}</p>
      <button 
        onClick={onRetry || (() => window.location.reload())}
        className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
));

const SelectionScreen = memo(({ 
  title, 
  label, 
  options, 
  value, 
  onChange,
  isLoading,
  onBack
}: { 
  title: string, 
  label: string, 
  options: string[] | number[], 
  value: string | number | null, 
  onChange: (value: any) => void,
  isLoading?: boolean,
  onBack?: () => void
}) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {title}
      </h1>
      
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Go Back
        </button>
      )}
      
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66934e]"
        >
          <option value="">-- Select {label.split(' ')[1]} --</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  </div>
));

const QuestionNavigation = memo(({
  currentIndex,
  totalQuestions,
  onNavigate,
  answers
}: {
  currentIndex: number,
  totalQuestions: number,
  onNavigate: (index: number) => void,
  answers: string[]
}) => {
  const renderButtons = () => {
    const buttons = [];
    for (let i = 0; i < totalQuestions; i++) {
      const hasAnswer = answers[i] !== "";
      buttons.push(
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className={`w-10 h-10 rounded-full font-medium text-sm flex items-center justify-center transition-colors ${
            currentIndex === i
              ? "bg-[#66934e] text-white"
              : hasAnswer
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
        >
          {i + 1}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="w-full overflow-x-auto pb-2 px-1 mt-4">
      <div className="flex space-x-2 min-w-max">
        {renderButtons()}
      </div>
    </div>
  );
});

const ResultItem = memo(({ 
  question, 
  result, 
  index 
}: { 
  question: Question, 
  result: AnswerResult, 
  index: number 
}) => (
  <div className="p-6 bg-white rounded-lg shadow-sm mb-4 border-l-4 border-l-gray-300 hover:shadow-md transition-shadow">
    <p className="font-medium text-gray-800 mb-3">
      <span className="font-bold text-[#66934e]">Question {index + 1}:</span> {question.question}
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
      <div className={`p-3 rounded-md border ${
        result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <p className="text-gray-600">Your answer: <span className="font-medium">{result.selectedAnswer || "Not answered"}</span></p>
      </div>
      <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
        <p className="text-gray-600">Correct answer: <span className="font-medium">{result.correctAnswer}</span></p>
      </div>
    </div>
    {result.explanation && (
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-3">
        <p className="text-gray-700">
          <span className="font-medium text-blue-700">Explanation:</span> {result.explanation}
        </p>
      </div>
    )}
    <div className={`mt-3 p-2 text-center font-semibold rounded-md ${result.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {result.isCorrect ? "✓ Correct" : "✗ Incorrect"}
    </div>
  </div>
));

const ProgressBar = memo(({ 
  progress, 
  color = "bg-[#66934e]"
}: { 
  progress: number, 
  color?: string 
}) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className={`${color} h-2.5 rounded-full transition-all duration-300 ease-in-out`}
      style={{ width: `${progress}%` }}
    ></div>
  </div>
));

const PracticeTest = () => {
  const location = useLocation();
  const examType = location.state?.examType;

  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(false);

  // Fetch subjects
  useEffect(() => {
    if (examType) {
      setSubjectsLoading(true);
      axios
        .get(`${baseApi}/exam/subjects/${examType}`)
        .then((response) => {
          setSubjects(response.data);
          setSubjectsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch subjects", error);
          setError("Failed to load exam subjects. Please try again.");
          setSubjectsLoading(false);
        });
    }
  }, [examType]);

  // Fetch years and sort in ascending order
  useEffect(() => {
    if (selectedSubject) {
      setYearsLoading(true);
      axios
        .get(`${baseApi}/exam/years/${examType}/${selectedSubject}`)
        .then((response) => {
          const sortedYears = response.data.sort((a: number, b: number) => a - b);
          setYears(sortedYears);
          setYearsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch years", error);
          setError("Failed to load exam years. Please try again.");
          setYearsLoading(false);
        });
    }
  }, [selectedSubject, examType]);

  // Fetch questions with debounce
  useEffect(() => {
    if (selectedYear) {
      setLoading(true);
      const fetchQuestionsTimeout = setTimeout(() => {
        axios
          .get(`${baseApi}/exam/questions/${examType}/${selectedSubject}/${selectedYear}`)
          .then((response) => {
            setQuestions(response.data);
            setAnswers(new Array(response.data.length).fill(""));
            setResults(new Array(response.data.length).fill(null));
            setLoading(false);
          })
          .catch((error) => {
            console.error("Failed to fetch questions", error);
            setError("Failed to load questions. Please try again.");
            setLoading(false);
          });
      }, 300);
      
      return () => clearTimeout(fetchQuestionsTimeout);
    }
  }, [selectedYear, selectedSubject, examType]);

  // Timer with requestAnimationFrame for better performance
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const updateTimer = (currentTime: number) => {
      if (currentTime - lastTime >= 1000) {
        setTimeLeft(prev => {
          if (prev <= 0) {
            if (!isTestFinished && questions.length > 0) {
              handleSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
        lastTime = currentTime;
      }
      
      if (timeLeft > 0 && !isTestFinished && questions.length > 0) {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };
    
    if (timeLeft > 0 && !isTestFinished && questions.length > 0) {
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [timeLeft, isTestFinished, questions.length]);

  // Handle answer selection with optimized function
  const handleAnswerChange = useCallback(async (option: string) => {
    if (!questions[currentQuestionIndex]) return;
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const selectedOptionText = String(currentQuestion[`option${option}` as keyof Question]);
      
      // Update answers state
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = selectedOptionText || "";
        return newAnswers;
      });

      // Check if answer is correct
      const response = await axios.post(`${baseApi}/exam/check-answer`, {
        questionId: currentQuestion.id,
        selectedAnswer: selectedOptionText,
      });
      
      const { isCorrect, correctAnswer, explanation } = response.data;
      
      // Update results
      setResults(prev => {
        const newResults = [...prev];
        newResults[currentQuestionIndex] = {
          questionId: currentQuestion.id,
          selectedAnswer: selectedOptionText || "",
          isCorrect,
          correctAnswer,
          explanation,
        };
        return newResults;
      });
    } catch (error) {
      console.error("Failed to check answer", error);
      toast.error("Failed to check answer. Please try again.");
    }
  }, [currentQuestionIndex, questions]);

  // Navigation functions
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleNavigate = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const handleSubmit = useCallback(() => {
    setIsTestFinished(true);
  }, []);

  const handleRestart = useCallback(() => {
    setSelectedSubject(null);
    setSelectedYear(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeLeft(600);
    setIsTestFinished(false);
    setResults([]);
    setError(null);
  }, []);

  // Computed values
  const formatTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);
  
  const progressPercentage = useMemo(() => 
    questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
  [currentQuestionIndex, questions.length]);
  
  const answeredQuestionsCount = useMemo(() => 
    answers.filter(answer => answer !== "").length,
  [answers]);
  
  const completionPercentage = useMemo(() => 
    questions.length > 0 ? (answeredQuestionsCount / questions.length) * 100 : 0,
  [answeredQuestionsCount, questions.length]);

  const testResults = useMemo(() => {
    if (!isTestFinished || !questions.length) return null;
    
    const totalQuestions = questions.length;
    const passedQuestions = results.filter((r) => r?.isCorrect).length;
    const failedQuestions = totalQuestions - passedQuestions;
    const percentage = (passedQuestions / totalQuestions) * 100;
    const grade = percentage >= 50 ? "Pass" : "Fail";
    
    return {
      totalQuestions,
      passedQuestions,
      failedQuestions,
      percentage,
      grade
    };
  }, [isTestFinished, questions.length, results]);

  // Handle errors
  if (error) {
    return <ErrorState message={error} onRetry={handleRestart} />;
  }

  // Handle invalid exam type
  if (!examType) {
    return <ErrorState message="Invalid exam type. Please go back and try again." />;
  }

  // Loading state
  if (loading && !questions.length) {
    return <LoadingState />;
  }

  // Subject selection
  if (!selectedSubject) {
    return (
      <SelectionScreen
        title={`${examType} Practice Test`}
        label="Select Subject"
        options={subjects}
        value={selectedSubject}
        onChange={(value) => setSelectedSubject(value)}
        isLoading={subjectsLoading}
      />
    );
  }

  // Year selection
  if (!selectedYear) {
    return (
      <SelectionScreen
        title={`${examType} Practice Test`}
        label="Select Year"
        options={years}
        value={selectedYear}
        onChange={(value) => setSelectedYear(Number(value))}
        isLoading={yearsLoading}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  // Test loading
  if (questions.length === 0) {
    return <LoadingState />;
  }

  // Results page
  if (isTestFinished && testResults) {
    const { totalQuestions, passedQuestions, failedQuestions, percentage, grade } = testResults;
    const scoreColor = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600";

    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              {examType} Test Results
            </h1>
            
            {/* Results summary card */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-center mb-6">
                <div className={`text-6xl font-bold ${scoreColor} mb-4 md:mb-0 md:mr-8`}>
                  {Math.round(percentage)}%
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl text-gray-600">
                    Score: <span className="font-semibold">{passedQuestions}</span> out of {totalQuestions}
                  </p>
                  <p className="text-lg text-gray-600 mt-1">
                    Grade: <span className={`font-semibold ${grade === "Pass" ? "text-green-600" : "text-red-600"}`}>{grade}</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-green-600 font-medium">Correct</p>
                  <p className="text-2xl font-bold text-green-700">{passedQuestions}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-red-600 font-medium">Incorrect</p>
                  <p className="text-2xl font-bold text-red-700">{failedQuestions}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={handleRestart}
                className="bg-[#66934e] text-white px-6 py-3 rounded-lg hover:bg-[#557941] transition-colors font-medium shadow-md"
              >
                Take Another Test
              </button>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Results</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              result && (
                <ResultItem 
                  key={questions[index].id}
                  question={questions[index]}
                  result={result}
                  index={index}
                />
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active test view
  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
              {examType} Practice Test
            </h1>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <div className="bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-600">
                  Time: {formatTime()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question Progress</span>
              <span>{currentQuestionIndex + 1}/{questions.length}</span>
            </div>
            <ProgressBar progress={progressPercentage} />
            
            <div className="flex justify-between text-sm text-gray-600 mt-3 mb-1">
              <span>Completion</span>
              <span>{answeredQuestionsCount}/{questions.length} Questions</span>
            </div>
            <ProgressBar 
              progress={completionPercentage} 
              color="bg-blue-500" 
            />
          </div>

          {/* Question */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xl font-medium text-gray-800">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionKey = `option${option}` as keyof Question;
              const optionText = currentQuestion[optionKey];
              const isSelected = answers[currentQuestionIndex] === optionText;
              
              return (
                <button
                  key={option}
                  onClick={() => handleAnswerChange(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected 
                      ? "bg-blue-100 border-blue-300 shadow-sm" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 ${
                    isSelected 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {option}
                  </span>
                  {optionText}
                </button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              Submit Test
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === questions.length - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Next
            </button>
          </div>
          
          {/* Question navigation */}
          <QuestionNavigation 
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            onNavigate={handleNavigate}
            answers={answers}
          />
        </div>
        
        {/* Status info */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-2 sm:mb-0">
              <p className="text-gray-600">
                <span className="font-medium">Subject:</span> {selectedSubject}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Year:</span> {selectedYear}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600">
                  <span className="font-medium">{answeredQuestionsCount}</span> Answered
                </p>
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{questions.length - answeredQuestionsCount}</span> Remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeTest;