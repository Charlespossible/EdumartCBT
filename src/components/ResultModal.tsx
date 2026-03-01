import React from "react";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
  questions: {
    id: number;
    question: string;
    correctAnswer: string | null;
    explanation: string | null;
    userAnswer: string | null;
  }[];
  onRestart: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  score,
  totalQuestions,
  questions,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h3 className="text-2xl font-bold text-center mb-4">Exam Results</h3>
        <hr className="border-b-2 border-[#66934e] mt-4 mb-6 w-20 mx-auto"></hr>

        <div className="space-y-4">
          <p className="text-center text-lg">
            You scored <span className="font-bold">{score}</span> out of{" "}
            <span className="font-bold">{totalQuestions}</span>.
          </p>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const isCorrect = question.userAnswer === question.correctAnswer;
              return (
                <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold">
                    {index + 1}. {question.question}
                  </p>
                  <p className={`mt-2 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    Your Answer: {question.userAnswer || "Not answered"}
                  </p>
                  {!isCorrect && (
                    <>
                      <p className="text-green-600">
                        Correct Answer: {question.correctAnswer}
                      </p>
                      {question.explanation && (
                        <p className="text-gray-600">
                          Explanation: {question.explanation}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onRestart}
              className="bg-[#66934e] text-white py-2 px-6 rounded-lg hover:bg-[#85b35c]"
            >
              Take Another Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;