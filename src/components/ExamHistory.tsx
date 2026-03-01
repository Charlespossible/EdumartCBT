import React, { useState, useEffect } from "react";
import axios from "axios";
import baseApi from "../utils/baseApi";

// Define TypeScript interface for exam data
interface Exam {
  id: number;
  name: string;
  date: string;
  score: number;
  status: "Pass" | "Fail";
}

const ExamHistory: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamHistory = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No token found");
        }
        const response = await axios.get(`${baseApi}/exam/exam-history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setExams(response.data);
        if (response.data.length === 0) {
          console.log("No exam history available");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response) {
            console.error("API Error:", err.response.status, err.response.data);
            setError(`Failed to fetch exam history: ${err.response.data.message || "Unknown error"}`);
          } else if (err.request) {
            console.error("Network Error:", err);
            setError("Failed to fetch exam history: Network error");
          } else {
            console.error("Error:", err.message);
            setError(`Failed to fetch exam history: ${err.message}`);
          }
        } else {
          console.error("Unexpected Error:", err);
          setError("Failed to fetch exam history: Unexpected error");
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchExamHistory();
  }, []);// Empty dependency array means it runs once on mount

  // Handle loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div>{error}</div>;
  }

  // Render the table with dynamic data
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Exam History</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4 border">Exam Name</th>
              <th className="py-2 px-4 border">Date Taken</th>
              <th className="py-2 px-4 border">Score (%)</th>
              <th className="py-2 px-4 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="text-center">
                <td className="py-2 px-4 border">{exam.name}</td>
                <td className="py-2 px-4 border">{exam.date}</td>
                <td className="py-2 px-4 border">{exam.score}</td>
                <td
                  className={`py-2 px-4 border font-bold ${
                    exam.status === "Pass" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {exam.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamHistory;