import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus, FaCog, FaChartBar, FaUserGraduate, FaClipboardList, 
  FaCheckCircle, FaRegClock, FaUsers, FaChalkboardTeacher
} from "react-icons/fa";
import baseApi from "../../utils/baseApi";

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

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface DashboardContentProps {
  userRole: UserRole;
  setShowCreateExam: React.Dispatch<React.SetStateAction<boolean>>;
  exams: Exam[];
  classes: Class[];
  teachers: Teacher[];
  students: Student[];
  token: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  userRole, 
  setShowCreateExam, 
  exams, 
  classes, 
  teachers,
  token
}) => {
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch students count from API
  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${baseApi}/school/get-students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const studentsData = await response.json();
          setTotalStudents(studentsData.length);
        } else {
          console.error('Failed to fetch students');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [token]);

  const stats = {
    "ADMIN": [
      { label: "Total Exams", value: exams.length, icon: <FaClipboardList /> },
      { label: "Active Exams", value: exams.filter(e => e.status === "Active").length, icon: <FaCheckCircle /> },
      { label: "Scheduled Exams", value: exams.filter(e => e.status === "Scheduled").length, icon: <FaRegClock /> },
      { label: "Completed Exams", value: exams.filter(e => e.status === "Completed").length, icon: <FaCheckCircle /> },
      { label: "Total Teachers", value: teachers.length, icon: <FaUsers /> },
      { label: "Total Students", value: isLoading ? "..." : totalStudents, icon: <FaUserGraduate /> },
    ],
    "TEACHER": [
      { label: "My Exams", value: exams.length, icon: <FaClipboardList /> },
      { label: "Active Exams", value: exams.filter(e => e.status === "Active").length, icon: <FaCheckCircle /> },
      { label: "Scheduled Exams", value: exams.filter(e => e.status === "Scheduled").length, icon: <FaRegClock /> },
      { label: "Completed Exams", value: exams.filter(e => e.status === "Completed").length, icon: <FaCheckCircle /> },
      { label: "Classes Assigned", value: classes.length, icon: <FaChalkboardTeacher /> },
      { label: "Total Students", value: isLoading ? "..." : totalStudents, icon: <FaUserGraduate /> },
    ],
    "STUDENT": [
      { label: "Upcoming Exams", value: exams.filter(e => e.status === "Scheduled").length, icon: <FaRegClock /> },
      { label: "Completed Exams", value: exams.filter(e => e.status === "Completed").length, icon: <FaCheckCircle /> },
      { label: "Total Students", value: isLoading ? "..." : totalStudents, icon: <FaUserGraduate /> },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {userRole === "ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setShowCreateExam(true)}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaPlus className="text-[#66934e] mb-2" />
            <h3 className="font-medium text-gray-800">Create New Exam</h3>
          </button>
          <Link to="/schools/settings" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <FaCog className="text-[#66934e] mb-2" />
            <h3 className="font-medium text-gray-800">School Settings</h3>
          </Link>
        </div>
      )}
      
      {userRole === "TEACHER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setShowCreateExam(true)}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FaPlus className="text-[#66934e] mb-2" />
            <h3 className="font-medium text-gray-800">Create New Exam</h3>
          </button>
          <Link to="/schools/reports" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <FaChartBar className="text-[#66934e] mb-2" />
            <h3 className="font-medium text-gray-800">View Reports</h3>
          </Link>
          <Link to="/schools/students" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <FaUserGraduate className="text-[#66934e] mb-2" />
            <h3 className="font-medium text-gray-800">Manage Students</h3>
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats[userRole].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </div>
              <div className="text-[#66934e]">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {userRole === "STUDENT" ? "Upcoming Exams" : "Recent Exams"}
        </h2>
        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.slice(0, 3).map(exam => (
              <div key={exam.id} className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{exam.name}</h3>
                  <p className="text-sm text-gray-500">{exam.subject} • {exam.class}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    exam.status === "Active" ? "bg-green-100 text-green-800" :
                    exam.status === "Scheduled" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {exam.status}
                  </span>
                  {userRole === "STUDENT" && exam.status === "Active" && (
                    <button className="bg-[#66934e] text-white px-3 py-1 rounded text-sm">Take Exam</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No exams found.</p>
        )}
      </div>
      
      {userRole !== "STUDENT" && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Completed Exams</h2>
          {exams.filter(exam => exam.status === "Completed").length > 0 ? (
            <div className="space-y-4">
              {exams.filter(exam => exam.status === "Completed").slice(0, 3).map(exam => (
                <div key={exam.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-500">{exam.subject} • {exam.class}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Completed
                    </span>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">View Results</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No completed exams found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardContent;