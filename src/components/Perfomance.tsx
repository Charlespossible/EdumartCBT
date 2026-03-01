import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import baseApi from "../utils/baseApi";

interface PerformanceData {
  totalExams: number;
  averageScore: number;
  bestPerformance: { subject: string; score: number } | null;
  weakestSubject: { subject: string; score: number } | null;
}

const Performance: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceData>({
    totalExams: 0,
    averageScore: 0,
    bestPerformance: null,
    weakestSubject: null,
  });

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        // Retrieve the access token from localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found");
        }

        // Make the API request with the token in the Authorization header
        const response = await axios.get(`${baseApi}/exam/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPerformance(response.data);
      } catch (error) {
        console.error("Error fetching performance data:", error);
        toast.error("Failed to load performance data");
      }
    };
    fetchPerformance();
  }, []);

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-md bg-blue-100">
          <h3 className="font-semibold">Total Exams Taken</h3>
          <p className="text-lg font-bold">{performance.totalExams}</p>
        </div>
        <div className="p-4 border rounded-md bg-[#66934e]">
          <h3 className="font-semibold">Average Score</h3>
          <p className="text-lg font-bold">{performance.averageScore}%</p>
        </div>
        <div className="p-4 border rounded-md bg-yellow-100">
          <h3 className="font-semibold">Best Performance</h3>
          <p className="text-lg font-bold">
            {performance.bestPerformance
              ? `${performance.bestPerformance.subject} - ${performance.bestPerformance.score}%`
              : "N/A"}
          </p>
        </div>
        <div className="p-4 border rounded-md bg-red-100">
          <h3 className="font-semibold">Weakest Subject</h3>
          <p className="text-lg font-bold">
            {performance.weakestSubject
              ? `${performance.weakestSubject.subject} - ${performance.weakestSubject.score}%`
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Performance;