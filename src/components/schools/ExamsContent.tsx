import { useState } from "react";
import React from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

interface Exam {
  id: string;
  name: string;
  subject: string;
  class: string;
  date: string;
  status: "Active" | "Scheduled" | "Completed" | "Pending";
  createdBy: string;
}

interface Class {
  id: string;
  name: string;
}

interface Subject {
    id: string;
    name: string;
  }
  
  const ExamsContent: React.FC<{ userRole: UserRole; setShowCreateExam: React.Dispatch<React.SetStateAction<boolean>>; exams: Exam[]; subjects: Subject[]; classes: Class[] }> = ({ userRole, setShowCreateExam, exams, subjects, classes }) => {
    const [activeTab, setActiveTab] = useState("all");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const getFilteredExams = () => {
      let filtered = [...exams];
      if (activeTab !== "all") filtered = filtered.filter(exam => exam.status.toLowerCase() === activeTab);
      if (selectedSubject) filtered = filtered.filter(exam => exam.subject === selectedSubject);
      if (selectedClass) filtered = filtered.filter(exam => exam.class === selectedClass);
      if (searchQuery) filtered = filtered.filter(exam => exam.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return filtered;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Exams Management</h1>
          {userRole !== "STUDENT" && (
            <button onClick={() => setShowCreateExam(true)} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <FaPlus className="text-[#66934e] mb-2" />
              <h3 className="font-medium text-gray-800">Create New Exam</h3>
            </button>
          )}
        </div>
        <div className="flex space-x-4 border-b border-gray-200">
          {["all", "active", "scheduled", "completed"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 ${activeTab === tab ? "border-b-2 border-[#66934e] text-[#66934e]" : "text-gray-500"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="border p-2 rounded w-full md:w-1/4">
            <option value="">All Subjects</option>
            {subjects.map(subject => <option key={subject.id} value={subject.name}>{subject.name}</option>)}
          </select>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded w-full md:w-1/4">
            <option value="">All Classes</option>
            {classes.map(cls => <option key={cls.id} value={cls.name}>{cls.name}</option>)}
          </select>
          <input type="text" placeholder="Search exams..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border p-2 rounded w-full md:w-1/2" />
        </div>
        <div className="space-y-4">
          {getFilteredExams().length > 0 ? getFilteredExams().map(exam => (
            <div key={exam.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{exam.name}</h3>
                  <p className="text-sm text-gray-500">{exam.subject} • {exam.class} • {exam.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.status === "Active" ? "bg-green-100 text-green-800" :
                    exam.status === "Scheduled" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                    {exam.status}
                  </span>
                  {userRole !== "STUDENT" && (
                    <>
                      <button className="text-gray-500 hover:text-gray-700"><FaEdit /></button>
                      <button className="text-gray-500 hover:text-gray-700"><FaTrash /></button>
                    </>
                  )}
                  <button className="text-gray-500 hover:text-gray-700"><FaEye /></button>
                  {userRole === "STUDENT" && exam.status === "Active" && (
                    <button className="bg-[#66934e] text-white px-3 py-1 rounded">Take Exam</button>
                  )}
                  {exam.status === "Completed" && (
                    <button className="bg-blue-500 text-white px-3 py-1 rounded">View Results</button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center">No exams found.</p>
          )}
        </div>
      </div>
    );
  };

  export default ExamsContent;