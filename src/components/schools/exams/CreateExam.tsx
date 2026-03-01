import React, { useState, useEffect } from "react";
import { FaBook, FaClock, FaCalendarAlt, FaChalkboardTeacher, FaFileAlt, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import baseApi from "../../../utils/baseApi";

interface ExamData {
  examName: string;
  term: string;
  subjectId: string; 
  classId: string;   
  examDate: string;
  duration: string;
  instructions: string;
  questionFile: File | null;
  status: string;    
}


interface CreateExamProps {
  onClose: () => void;
  onCreate: () => void;
  token: string;
  schoolId: string;  
}

// Added interfaces for subjects and classes
interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

const CreateExam: React.FC<CreateExamProps> = ({ onClose, onCreate, token, schoolId }) => {
  const [examData, setExamData] = useState<ExamData>({
    examName: "",
    term: "",
    subjectId: "",
    classId: "",
    examDate: "",
    duration: "",
    instructions: "",
    questionFile: null,
    status: "DRAFT",
  });

  // Added state for subjects and classes
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const Terms = ["First Term", "Second Term", "Third Term"];

  // Fetch subjects and classes for the school
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoints
        const [subjectsResponse, classesResponse] = await Promise.all([
          fetch(`${baseApi}/school/get-subjects`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${baseApi}/school/get-classes`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (subjectsResponse.ok && classesResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          const classesData = await classesResponse.json();
          
          setSubjects(subjectsData);
          setClasses(classesData);
        } else {
          toast.error("Failed to load subjects or classes");
          console.log("Token being used:", token);
          console.log("Token length:", token?.length);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExamData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setExamData((prev) => ({ ...prev, questionFile: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examData.examName || !examData.term || !examData.subjectId || !examData.classId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      
      // Add all form data
      formData.append("examName", examData.examName);
      formData.append("term", examData.term);
      formData.append("subjectId", examData.subjectId);
      formData.append("classId", examData.classId);
      formData.append("examDate", examData.examDate);
      formData.append("duration", examData.duration);
      formData.append("instructions", examData.instructions || "");
      formData.append("status", examData.status);
      formData.append("schoolId", schoolId);
      
      if (examData.questionFile) {
        formData.append("questionFile", examData.questionFile);
      }

      // Replace with your actual API endpoint
      const response = await fetch("/exams", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Exam created successfully!");
        onCreate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to create exam. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="relative bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg">
      <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 text-center">Create New Exam</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Exam Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Name
          </label>
          <input
            name="examName"
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e]"
            placeholder="e.g. First Term Mathematics Exam"
            value={examData.examName}
            onChange={handleInputChange}
          />
        </div>

        {/* Term Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term
          </label>
          <div className="relative">
            <FaCalendarAlt className="absolute right-4 top-4 text-gray-400" />
            <select
              name="term"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e] appearance-none"
              value={examData.term}
              onChange={handleInputChange}
            >
              <option value="">Select Term</option>
              {Terms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject and Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <div className="relative">
              <FaBook className="absolute right-4 top-4 text-gray-400" />
              <select
                name="subjectId"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e] appearance-none"
                value={examData.subjectId}
                onChange={handleInputChange}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Level
            </label>
            <div className="relative">
              <FaChalkboardTeacher className="absolute right-4 top-4 text-gray-400" />
              <select
                name="classId"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e] appearance-none"
                value={examData.classId}
                onChange={handleInputChange}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Date
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute right-4 top-4 text-gray-400" />
              <input
                name="examDate"
                type="date"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e]"
                value={examData.examDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <div className="relative">
              <FaClock className="absolute right-4 top-4 text-gray-400" />
              <input
                name="duration"
                type="number"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e]"
                placeholder="e.g. 60"
                value={examData.duration}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Instructions
          </label>
          <textarea
            name="instructions"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e]"
            placeholder="Provide exam instructions..."
            value={examData.instructions}
            onChange={handleInputChange}
          ></textarea>
        </div>

        {/* Question Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Questions (PDF or Word)
          </label>
          <div className="relative">
            <FaFileAlt className="absolute right-4 top-4 text-gray-400" />
            <input
              name="questionFile"
              type="file"
              accept=".pdf,.doc,.docx"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#66934e] focus:border-[#66934e]"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white pt-6 border-t border-gray-200">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#66934e] text-white rounded-lg hover:bg-[#557a40] transition-colors"
            >
              Create Exam
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;