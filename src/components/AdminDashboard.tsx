import React, { useState } from "react";
import {
  FaUsers,
  FaClipboardList,
  FaQuestionCircle,
  FaChartLine,
  FaCogs,
  FaSignOutAlt,
} from "react-icons/fa";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#66934e] text-white hidden md:flex flex-col p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-4">
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-gray-300 ${
                activeTab === "dashboard" ? "text-white" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <FaChartLine /> <span>Dashboard</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-gray-300 ${
                activeTab === "users" ? "text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("users")}
            >
              <FaUsers /> <span>Users</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-gray-300 ${
                activeTab === "exams" ? "text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("exams")}
            >
              <FaClipboardList /> <span>Exams</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-gray-300 ${
                activeTab === "questions" ? "text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("questions")}
            >
              <FaQuestionCircle /> <span>Questions</span>
            </li>
            <li
              className={`flex items-center space-x-3 cursor-pointer hover:text-gray-300 ${
                activeTab === "settings" ? "text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <FaCogs /> <span>Settings</span>
            </li>
            <li className="flex items-center space-x-3 cursor-pointer mt-6 hover:text-gray-300">
              <FaSignOutAlt /> <span>Logout</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md">Logout</button>
        </header>
        {/* Dynamic Content */}
        <main className="p-6">
          {activeTab === "dashboard" && <h2 className="text-2xl font-bold">Welcome to Admin Dashboard</h2>}
          {activeTab === "users" && <h2 className="text-2xl font-bold">Manage Users</h2>}
          {activeTab === "exams" && <h2 className="text-2xl font-bold">Manage Exams</h2>}
          {activeTab === "questions" && <h2 className="text-2xl font-bold">Manage Questions</h2>}
          {activeTab === "settings" && <h2 className="text-2xl font-bold">Settings</h2>}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
