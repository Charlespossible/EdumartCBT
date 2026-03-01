import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

// Define TypeScript interfaces for better type safety
interface ExamSelectionProps {}

const ExamSelection: React.FC<ExamSelectionProps> = () => {
  const [exams, setExams] = useState<string[]>([]);
  const [subscribedExamTypes, setSubscribedExamTypes] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Create a reusable fetch function with axios to avoid duplication
  const fetchData = useCallback(async (url: string, options = {}) => {
    const token = localStorage.getItem("accessToken");
    try {
      return await axios.get(url, {
        headers: { 
          Authorization: token ? `Bearer ${token}` : '',
          ...options
        }
      });
    } catch (error) {
      throw error;
    }
  }, []);

  // Fetch subscribed exam types
  const fetchSubscribedExamTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchData(`${baseApi}/subscription/payment-status`);
      const subscribed = (response.data.subscribedExamTypes || []).map((type: string) => type.toUpperCase());
      setSubscribedExamTypes(subscribed);
    } catch (error) {
      toast.error("Failed to fetch subscription status. Please try again.");
      console.error("Subscription fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  // Fetch exams only once when subscription types change
  const fetchExams = useCallback(async () => {
    if (subscribedExamTypes.length === 0) return;
    
    try {
      setIsLoading(true);
      const response = await fetchData(`${baseApi}/exam/exam-types`);
      const allExams: string[] = response.data;
      const filteredExams = allExams.filter((examType: string) =>
        subscribedExamTypes.includes(examType.toUpperCase())
      );
      setExams(filteredExams);
    } catch (error) {
      toast.error("Failed to fetch exam types. Please try again.");
      console.error("Exam types fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [subscribedExamTypes, fetchData]);

  // Fetch subjects for selected exam
  const fetchSubjects = useCallback(async () => {
    if (!selectedExam) return;
    
    try {
      setIsLoading(true);
      const response = await fetchData(`${baseApi}/exam/subjects?examType=${selectedExam}`);
      setSubjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch subjects. Please try again.");
      console.error("Subjects fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExam, fetchData]);

  // Fetch years for selected subject and exam
  const fetchYears = useCallback(async () => {
    if (!selectedSubject || !selectedExam) return;
    
    try {
      setIsLoading(true);
      const response = await fetchData(
        `${baseApi}/exam/years?subjectName=${selectedSubject}&examType=${selectedExam}`
      );
      setYears(response.data);
    } catch (error) {
      toast.error("Failed to fetch years. Please try again.");
      console.error("Years fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedExam, fetchData]);

  // Check for pre-selected exam from URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const preSelectedExam = queryParams.get("examType");
    
    if (preSelectedExam && subscribedExamTypes.length > 0 && exams.length > 0) {
      const normalizedExam = preSelectedExam.toUpperCase();
      if (subscribedExamTypes.includes(normalizedExam) && exams.includes(normalizedExam)) {
        setSelectedExam(normalizedExam);
      }
    }
  }, [location.search, subscribedExamTypes, exams]);

  // Initial data loading
  useEffect(() => {
    fetchSubscribedExamTypes();
  }, [fetchSubscribedExamTypes]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  // Use memoized handlers for better performance
  const handleExamChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedExam(value);
    setSelectedSubject("");
    setSelectedYear(null);
  }, []);

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSubject(value);
    setSelectedYear(null);
  }, []);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedYear(parseInt(value));
  }, []);

  // Memoize the validation check
  const isSelectionComplete = useMemo(() => {
    return Boolean(selectedExam && selectedSubject && selectedYear);
  }, [selectedExam, selectedSubject, selectedYear]);

  // Start the quiz with validation
  const startQuiz = useCallback(() => {
    if (!isSelectionComplete) {
      toast.error("Please select an exam, subject, and year to continue.");
      return;
    }
    
    navigate(
      `/quiz?examType=${selectedExam}&subjectName=${selectedSubject}&year=${selectedYear}`
    );
  }, [navigate, selectedExam, selectedSubject, selectedYear, isSelectionComplete]);

  // Render dropdown with common styling
  const renderDropdown = useCallback((
    label: string,
    value: string | number | null,
    options: Array<{ value: string | number, label: string }>,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    placeholder: string
  ) => (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <select
          value={value === null ? "" : value}
          onChange={onChange}
          className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
          disabled={isLoading}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value.toString()} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>
    </div>
  ), [isLoading]);

  // Format data for dropdowns
  const examOptions = useMemo(() => 
    exams.map(exam => ({ value: exam, label: exam })), 
    [exams]
  );
  
  const subjectOptions = useMemo(() => 
    subjects.map(subject => ({ value: subject, label: subject })), 
    [subjects]
  );
  
  const yearOptions = useMemo(() => 
    years.map(year => ({ value: year, label: year.toString() })), 
    [years]
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-start">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 mt-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Select Your Exam</h1>
        <div className="flex justify-center">
          <hr className="border-b-2 border-[#66934e] mt-3 mb-8 w-20"></hr>
        </div>

        {isLoading && (
          <div className="flex justify-center mb-6">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-[#66934e] rounded-full"></div>
              <div className="h-2 w-2 bg-[#66934e] rounded-full"></div>
              <div className="h-2 w-2 bg-[#66934e] rounded-full"></div>
            </div>
          </div>
        )}

        {/* Exam Type Dropdown */}
        {renderDropdown(
          "Exam Type",
          selectedExam,
          examOptions,
          handleExamChange,
          "Select an exam type"
        )}

        {/* Subject Dropdown - only show when exam is selected */}
        {selectedExam && 
          renderDropdown(
            "Subject",
            selectedSubject,
            subjectOptions,
            handleSubjectChange,
            "Select a subject"
          )
        }

        {/* Year Dropdown - only show when subject is selected */}
        {selectedSubject && 
          renderDropdown(
            "Year",
            selectedYear,
            yearOptions,
            handleYearChange,
            "Select a year"
          )
        }

        {/* Start Quiz Button */}
        <div className="mt-8 mb-4">
          <button
            onClick={startQuiz}
            disabled={!isSelectionComplete || isLoading}
            className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 flex justify-center items-center
              ${isSelectionComplete && !isLoading
                ? "bg-[#66934e] hover:bg-[#557a40] shadow-md hover:shadow-lg transform hover:-translate-y-1"
                : "bg-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              "Start Exam"
            )}
          </button>
        </div>
        
        {!isSelectionComplete && (
          <p className="text-sm text-center text-gray-500 mt-2">
            Please select all fields to start the exam.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamSelection;