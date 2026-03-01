import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Question {
  id: string;
  subjectName: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  hasImage: boolean;
  imageUrl?: string;
}

const QuizPage: React.FC = () => {
  const { type, year, subjectName } = useParams<{ type: string; year: string; subjectName: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number>(60 * 5); // 5 minutes
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/exams/questions`, 
        {
          params: { subjectName, year },
        }
      )
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, [type, year, subjectName]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const getScore = () => {
    return questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">{subjectName} Exam ({year})</h2>
      <p className="text-gray-500 mb-4">Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? "0" : ""}{timeLeft % 60}</p>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">{index + 1}. {q.question}</h3>
            {q.hasImage && q.imageUrl && <img src={q.imageUrl} alt="Question" className="mb-2 rounded-md" />}

            <div className="space-y-2">
              {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
                <button
                  key={opt}
                  className={`w-full p-2 rounded border text-left ${
                    submitted
                      ? userAnswers[q.id] === q.correctAnswer && opt === q.correctAnswer
                        ? "bg-green-500 text-white"
                        : userAnswers[q.id] === opt && opt !== q.correctAnswer
                        ? "bg-red-500 text-white"
                        : "bg-gray-100"
                      : userAnswers[q.id] === opt
                      ? "bg-blue-300"
                      : "bg-gray-100"
                  }`}
                  onClick={() => handleSelectAnswer(q.id, q[opt as keyof Question] as string)}
                  disabled={submitted}
                >
                  {q[opt as keyof Question]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button onClick={handleSubmit} className="mt-6 w-full bg-blue-500 text-white p-2 rounded">
          Submit Exam
        </button>
      ) : (
        <div className="mt-6 text-center">
          <p className="text-xl font-semibold">Score: {getScore()} / {questions.length}</p>
          <button onClick={() => navigate("/")} className="mt-4 bg-gray-500 text-white p-2 rounded">
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
