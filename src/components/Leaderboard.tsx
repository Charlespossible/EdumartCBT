import React, { useEffect, useState } from "react";
import axios from "axios";
import  baseApi  from "../utils/baseApi";

interface LeaderboardEntry {
  name: string;
  bestSubject: string;
  averageScore: string;
}

// Updated Leaderboard component
const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${baseApi}/auth/leaderboard`);
        // Convert numbers to strings if needed
        const data = response.data.map((entry: LeaderboardEntry) => ({
          ...entry,
          averageScore: entry.averageScore.toString()
        }));
        setLeaderboard(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard. Please try again later."); // Set error state
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) { // Render error state
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Top Performers
        <hr className="border-b-4 border-[#66934e] mt-4 mb-8 w-48 mx-auto"></hr>
      </h2>
      
      <div className="overflow-x-auto">
  <table className="min-w-full bg-white rounded-lg shadow-lg">
    <thead>
      <tr className="bg-[#66934e] text-white">
        <th className="py-3 px-4 text-center">Rank</th>
        <th className="py-3 px-4 text-center">Name</th>
        <th className="py-3 px-4 text-center">Best Subject</th>
        <th className="py-3 px-4 text-center">Average Score</th>
      </tr>
    </thead>
    <tbody>
      {leaderboard.map((entry, index) => (
        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
          <td className="py-3 px-4 text-center">{index + 1}</td>
          <td className="py-3 px-4 text-center">{entry.name}</td>
          <td className="py-3 px-4 text-center">{entry.bestSubject}</td>
          <td className="py-3 px-4 text-center">{entry.averageScore}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
};

export default Leaderboard;