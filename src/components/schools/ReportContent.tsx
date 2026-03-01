import React, { useState, useMemo, useEffect } from "react";
import { FaEye, FaFilter, FaChartBar } from "react-icons/fa";
import baseApi from "../../utils/baseApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Report {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  date: string;
}

interface Exam {
  id: string;
  name: string;
  subject: string;
  class: string;
  date: string;
  status: "Active" | "Scheduled" | "Completed" | "Pending";
  createdBy: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
}

interface ReportsContentProps {
  reports: Report[];
  exams: Exam[];
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  token: string;
  schoolId: string;
}

const ReportsContent: React.FC<ReportsContentProps> = ({
  reports,
  exams,
  token,
  // schoolId 
}) => {
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailedReportId, setDetailedReportId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch both students and subjects in one useEffect
  useEffect(() => {
    const fetchData = async () => {
      console.log(token);
      if (!token) {
        setError("No authentication token provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch subjects
        const subjectsRes = await fetch(`${baseApi}/school/get-subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!subjectsRes.ok) {
          throw new Error("Failed to fetch subjects");
        }
        const subjectsData = await subjectsRes.json();
        console.log("Fetched subjects:", subjectsData); 
        setSubjects(subjectsData);

        // Fetch students
        const studentsRes = await fetch(`${baseApi}/school/get-students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!studentsRes.ok) {
          const errorData = await studentsRes.json().catch(() => ({
            message: "Failed to fetch students",
          }));
          throw new Error(errorData.message || "Failed to fetch students");
        }
        const studentsData = await studentsRes.json();
        console.log("Fetched students:", studentsData); 
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load students or subjects");
        toast.error("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Memoized filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const exam = exams.find((e) => e.id === report.examId);
      const student = students.find((s) => s.id === report.studentId);
      if (!exam || !student) return false;
      return (
        (!selectedExam || report.examId === selectedExam) &&
        (!selectedStudent || report.studentId === selectedStudent) &&
        (!selectedSubject || exam.subject === selectedSubject) &&
        (!searchQuery ||
          exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [reports, exams, students, selectedExam, selectedStudent, selectedSubject, searchQuery]);

  // Memoized detailed report
  const detailedReport = useMemo(() => {
    if (!detailedReportId) return null;
    const report = reports.find((r) => r.id === detailedReportId);
    if (!report) return null;
    const exam = exams.find((e) => e.id === report.examId);
    const student = students.find((s) => s.id === report.studentId);
    const subject = exam ? subjects.find((s) => s.name === exam.subject) : null;
    return { report, exam, student, subject };
  }, [detailedReportId, reports, exams, students, subjects]);

  const viewReport = (reportId: string) => {
    setDetailedReportId(reportId);
  };

  const closeDetailedView = () => {
    setDetailedReportId(null);
  };

  const calculatePercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#66934e] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <FaChartBar className="mx-auto text-red-400 text-4xl mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-600 mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  // Subject options for dropdown
  const subjectOptions = useMemo(() => {
    if (subjects.length > 0) {
      return subjects.map((subject) => subject.name);
    } else {
      return Array.from(new Set(exams.map((exam) => exam.subject)));
    }
  }, [subjects, exams]);

  // Main UI
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <FaFilter className="text-gray-500" />
          <span className="text-sm text-gray-500">
            {filteredReports.length} of {reports.length} reports
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
        {/* Subject dropdown */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border p-2 rounded w-full md:w-1/4 focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
        >
          <option value="">All Subjects</option>
          {subjectOptions.map((subjectName) => (
            <option key={subjectName} value={subjectName}>
              {subjectName}
            </option>
          ))}
        </select>

        {/* Exam dropdown */}
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="border p-2 rounded w-full md:w-1/4 focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
        >
          <option value="">All Exams</option>
          {exams
            .filter((exam) => !selectedSubject || exam.subject === selectedSubject)
            .map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
        </select>

        {/* Student dropdown */}
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="border p-2 rounded w-full md:w-1/4 focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
        >
          <option value="">All Students</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>

        {/* Search box */}
        <div className="relative w-full md:w-1/4">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 pl-8 rounded w-full focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
          />
          <FaChartBar className="absolute left-2 top-2.5 text-gray-400" />
        </div>
      </div>

      {detailedReport ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Report Details</h2>
            <button
              className="text-[#66934e] hover:text-[#557a40]"
              onClick={closeDetailedView}
            >
              Back to Reports
            </button>
          </div>
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-xl font-medium">{detailedReport.exam?.name}</h3>
              <p className="text-gray-500">Subject: {detailedReport.exam?.subject}</p>
              <p className="text-gray-500">Class: {detailedReport.exam?.class}</p>
              <p className="text-gray-500">Date: {detailedReport.report.date}</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="text-lg font-medium mb-2">Student Information</h4>
              <p>Name: {detailedReport.student?.name}</p>
              <p>Email: {detailedReport.student?.email}</p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Score Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">Score</p>
                  <p className="text-2xl font-bold">
                    {detailedReport.report.score}/{detailedReport.report.totalQuestions}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">Percentage</p>
                  <p className="text-2xl font-bold">
                    {calculatePercentage(
                      detailedReport.report.score,
                      detailedReport.report.totalQuestions
                    )}
                    %
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-500">Status</p>
                  <p
                    className={`text-xl font-bold ${
                      calculatePercentage(
                        detailedReport.report.score,
                        detailedReport.report.totalQuestions
                      ) >= 70
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {calculatePercentage(
                      detailedReport.report.score,
                      detailedReport.report.totalQuestions
                    ) >= 70
                      ? "Passed"
                      : "Failed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Exam Reports</h2>
          {filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const exam = exams.find((e) => e.id === report.examId);
                const student = students.find((s) => s.id === report.studentId);
                const percentage = calculatePercentage(report.score, report.totalQuestions);
                return (
                  <div
                    key={report.id}
                    className="flex justify-between items-center border-b py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="text-md font-medium text-gray-800">
                        {exam?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Student: {student?.name} • Score: {report.score}/{report.totalQuestions}
                      </p>
                      <p className="text-sm text-gray-500">
                        Subject: {exam?.subject} • Date: {report.date}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`text-white text-sm px-2 py-1 rounded ${
                          percentage >= 70 ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {percentage}%
                      </div>
                      <button
                        onClick={() => viewReport(report.id)}
                        className="text-gray-500 hover:text-[#66934e] transition-colors"
                        aria-label="View report details"
                      >
                        <FaEye size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaChartBar className="mx-auto text-gray-300 text-4xl mb-3" />
              <p className="text-gray-500">No reports found matching your filters.</p>
              <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      )}
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default ReportsContent;