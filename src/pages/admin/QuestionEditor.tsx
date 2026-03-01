import React, { useState, useEffect } from "react";
import axios from "axios";
import baseApi from "../../utils/baseApi";

interface Exam {
  id: number;
  subjectName: string;
  examType: string;
  year: number;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  questionImageUrl?: string | null;
  question: string;
}

interface SearchResult extends Exam {
  matchInfo: {
    isExactMatch: boolean;
    startsWithSearch: boolean;
    matchPercentage: number;
  };
}

interface NewQuestion {
  question: string;
  subjectName: string;
  examType: string;
  year: number | string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  questionImageUrl: string;
}

interface Categories {
  examTypes: string[];
  subjectNames: string[];
  years: number[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const QuestionEditor: React.FC = () => {
  const [questions, setQuestions] = useState<Exam[]>([]);
  const [filters, setFilters] = useState({ subjectName: "", examType: "", year: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingQuestion, setEditingQuestion] = useState<Exam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const itemsPerPage = 3;

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Create question states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    question: "",
    subjectName: "",
    examType: "",
    year: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
    questionImageUrl: "",
  });
  const [categories, setCategories] = useState<Categories>({
    examTypes: [],
    subjectNames: [],
    years: [],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestionImage, setNewQuestionImage] = useState<File | null>(null);
  const [newQuestionImagePreview, setNewQuestionImagePreview] = useState<string | null>(null);

  // State for quick image upload
  const [quickImageUpload, setQuickImageUpload] = useState<{ questionId: number; uploading: boolean } | null>(null);

  // Quick image upload handler
  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'warning');
      return;
    }

    setQuickImageUpload({ questionId, uploading: true });

    try {
      // Upload image
      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await axios.post(`${baseApi}/admin/upload-question-image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.imageUrl;

      // Update question with new image URL
        await axios.put(
          `${baseApi}/admin/update-questions/${questionId}`,
          { questionImageUrl: imageUrl },
          { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
        );

      // Update the questions list
      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, questionImageUrl: imageUrl } : q
      ));

      showToast('Image uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setQuickImageUpload(null);
      // Reset file input
      e.target.value = '';
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4000);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(toast => toast.id !== id));

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, filters]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${baseApi}/admin/get-questions`, {
        params: {
          subjectName: filters.subjectName || undefined,
          examType: filters.examType || undefined,
          year: filters.year || undefined,
          page: currentPage,
          limit: itemsPerPage,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setQuestions(response.data.questions || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
      setTotalPages(1);
      showToast("Failed to fetch questions", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${baseApi}/admin/get-categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Search question by text
  const handleSearchQuestion = async () => {
    if (searchText.trim().length < 3) {
      showToast("Please enter at least 3 characters to search", "warning");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await axios.get(`${baseApi}/admin/search-question`, {
        params: { searchText: searchText.trim() },
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });

      setSearchResults(response.data.results || []);
      setHasSearched(true);
      
      if (response.data.count === 0) {
        showToast("No matching questions found. You can add it!", "info");
      } else {
        showToast(`Found ${response.data.count} matching question(s)`, "success");
      }
    } catch (error: any) {
      console.error("Error searching questions:", error);
      showToast(error.response?.data?.error || "Failed to search questions", "error");
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Open create modal from search (pre-fill question text)
  const openCreateFromSearch = () => {
    setNewQuestion({
      question: searchText,
      subjectName: "",
      examType: "",
      year: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
      questionImageUrl: "",
    });
    setNewQuestionImage(null);
    setNewQuestionImagePreview(null);
    setShowSearchModal(false);
    setShowCreateModal(true);
  };

  // Open create modal fresh
  const openCreateModal = () => {
    setNewQuestion({
      question: "",
      subjectName: "",
      examType: "",
      year: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
      questionImageUrl: "",
    });
    setNewQuestionImage(null);
    setNewQuestionImagePreview(null);
    setShowCreateModal(true);
  };

  // Handle new question image selection
  const handleNewQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'warning');
        return;
      }
      setNewQuestionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewQuestionImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Create new question
  const handleCreateQuestion = async () => {
    // Validate required fields
    if (!newQuestion.question.trim()) {
      showToast("Question text is required", "error");
      return;
    }
    if (!newQuestion.subjectName) {
      showToast("Subject name is required", "error");
      return;
    }
    if (!newQuestion.examType) {
      showToast("Exam type is required", "error");
      return;
    }
    if (!newQuestion.year) {
      showToast("Year is required", "error");
      return;
    }

    setIsCreating(true);
    try {
      let imageUrl = newQuestion.questionImageUrl;

      // Upload image if selected
      if (newQuestionImage) {
        const formData = new FormData();
        formData.append('image', newQuestionImage);
        const uploadResponse = await axios.post(`${baseApi}/admin/upload-question-image`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadResponse.data.imageUrl;
      }
      // Create question
      await axios.post(
        `${baseApi}/admin/create-question`,
        { ...newQuestion, questionImageUrl: imageUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );

      showToast("Question created successfully!", "success");
      setShowCreateModal(false);
      
      // Refresh questions list and categories
      fetchQuestions();
      fetchCategories();
    } catch (error: any) {
      console.error("Error creating question:", error);
      if (error.response?.status === 409) {
        showToast("This question already exists in the database", "error");
      } else {
        showToast(error.response?.data?.error || "Failed to create question", "error");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
    setSearchText("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchText("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleEditFromSearch = (question: Exam) => {
    closeSearchModal();
    handleEdit(question);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'warning');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    try {
      const response = await axios.post(`${baseApi}/admin/upload-question-image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadingImage(false);
      return response.data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Failed to upload image", 'error');
      setUploadingImage(false);
      return null;
    }
  };

  const handleEdit = (question: Exam) => {
    setEditingQuestion(question);
    setSelectedImage(null);
    setImagePreview(question.questionImageUrl || null);
  };

  const handleUpdate = async (updatedQuestion: Exam) => {
    try {
      const original = questions.find((q) => q.id === updatedQuestion.id);
      
      // If original not found, it means it was just created and not in the list yet
      // In this case, just update without comparison
      if (!original) {
                await axios.put(
          `${baseApi}/admin/update-questions/${updatedQuestion.id}`,
          updatedQuestion,
          { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
        );
        
        // Refresh the questions list to include the new question
        await fetchQuestions();
        setEditingQuestion(null);
        setSelectedImage(null);
        setImagePreview(null);
        showToast("Question updated successfully", "success");
        return;
      }

      const payload: Record<string, any> = {};
      const fieldsToCheck: (keyof Exam)[] = [
        'question', 'subjectName', 'examType', 'year',
        'optionA', 'optionB', 'optionC', 'optionD',
        'correctAnswer', 'explanation', 'questionImageUrl',
      ];

      for (const field of fieldsToCheck) {
        const newValue = updatedQuestion[field];
        const oldValue = original[field];
        const newIsEmpty = newValue === null || newValue === undefined || newValue === '';
        const oldIsEmpty = oldValue === null || oldValue === undefined || oldValue === '';
        if (newIsEmpty && oldIsEmpty) continue;
        if (newIsEmpty !== oldIsEmpty) {
          payload[field] = newValue === '' ? null : newValue;
        } else if (String(newValue) !== String(oldValue)) {
          payload[field] = newValue;
        }
      }

      if (selectedImage) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) return;
        payload.questionImageUrl = uploadedUrl;
      }

      if (Object.keys(payload).length === 0) {
        showToast("No changes detected", "info");
        setEditingQuestion(null);
        setSelectedImage(null);
        setImagePreview(null);
        return;
      }

      const response = await axios.put(
        `${baseApi}/admin/update-questions/${updatedQuestion.id}`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );

      setQuestions(questions.map((q) => q.id === updatedQuestion.id ? { ...q, ...response.data } : q));
      setEditingQuestion(null);
      setSelectedImage(null);
      setImagePreview(null);
      showToast("Question updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating question:", error);
      let errorMessage = "Failed to update question.";
      if (error.response?.status === 409) {
        errorMessage = "A question with the same subject, year, and text already exists.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${baseApi}/admin/del-questions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setQuestions(questions.filter((q) => q.id !== id));
      setShowDeleteConfirm(null);
      showToast('Question deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting question:", error);
      showToast("Failed to delete question", 'error');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (editingQuestion) {
      setEditingQuestion({ ...editingQuestion, questionImageUrl: null });
    }
  };

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="p-4">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] max-w-md p-4 rounded-lg shadow-lg flex items-start justify-between animate-[slideIn_0.3s_ease-out]
              ${toast.type === 'success' ? 'bg-blue-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-400 text-white' : ''}`}
          >
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-3 hover:opacity-75">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Question Editor</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openSearchModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Filter Inputs */}
      <div className="mb-4 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
        <input type="text" name="subjectName" placeholder="Subject" value={filters.subjectName} onChange={handleFilterChange} className="p-2 border rounded w-full sm:w-auto" />
        <input type="text" name="examType" placeholder="Exam Type" value={filters.examType} onChange={handleFilterChange} className="p-2 border rounded w-full sm:w-auto" />
        <input type="text" name="year" placeholder="Year" value={filters.year} onChange={handleFilterChange} className="p-2 border rounded w-full sm:w-auto" />
      </div>

      {/* Questions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Question</th>
              <th className="border p-2 text-left">Subject</th>
              <th className="border p-2 text-left">Exam Type</th>
              <th className="border p-2 text-left">Year</th>
              <th className="border p-2 text-left">Image</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.length > 0 ? (
              questions.map((question) => (
                <tr key={question.id}>
                  <td className="border p-2">{question.question}</td>
                  <td className="border p-2">{question.subjectName}</td>
                  <td className="border p-2">{question.examType}</td>
                  <td className="border p-2">{question.year}</td>
                  <td className="border p-2">
                    {question.questionImageUrl ? (
                      <div className="relative group">
                        <img 
                          src={question.questionImageUrl} 
                          alt="Question" 
                          className="w-16 h-16 object-cover rounded border-2 border-green-500"
                        />
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 border-2 border-dashed border-red-300 rounded flex items-center justify-center bg-red-50">
                          <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <label 
                          htmlFor={`quick-upload-${question.id}`}
                          className="cursor-pointer text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                          {quickImageUpload?.questionId === question.id && quickImageUpload.uploading
                            ? 'Uploading...'
                            : 'Add Image'}
                        </label>
                        <input
                          id={`quick-upload-${question.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQuickImageUpload(e, question.id)}
                          className="hidden"
                          disabled={quickImageUpload?.questionId === question.id && quickImageUpload.uploading}
                        />
                      </div>
                    )}
                  </td>
                  <td className="border p-2">
                    <button type="button" onClick={() => handleEdit(question)} className="mr-2 text-blue-500 hover:text-blue-700">Edit</button>
                    <button type="button" onClick={() => setShowDeleteConfirm(question.id)} className="text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="border p-2 text-center">No questions found</td></tr>
            )}
          </tbody>
        </table>

        {/* Search Modal */}
        {showSearchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Search Questions</h2>
                <button type="button" onClick={closeSearchModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchText.trim().length >= 3 && handleSearchQuestion()}
                  placeholder="Enter question text or keywords (min 3 characters)..."
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSearchQuestion}
                  disabled={isSearching || searchText.trim().length < 3}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Found {searchResults.length} result(s):</p>
                  {searchResults.map((result) => (
                    <div key={result.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 mb-2">{result.question}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-200 rounded">{result.subjectName}</span>
                            <span className="px-2 py-1 bg-gray-200 rounded">{result.examType}</span>
                            <span className="px-2 py-1 bg-gray-200 rounded">{result.year}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleEditFromSearch(result)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results - Show Create Option */}
              {searchResults.length === 0 && hasSearched && !isSearching && (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 mb-2">No questions found matching your search.</p>
                  <p className="text-gray-500 text-sm mb-4">Would you like to add this question to the database?</p>
                  <button
                    type="button"
                    onClick={openCreateFromSearch}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add This Question
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Question Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add New Question</h2>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Name *</label>
                  <select
                    value={newQuestion.subjectName}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subjectName: e.target.value })}
                    className="p-2 border w-full rounded"
                  >
                    <option value="">Select Subject</option>
                    {categories.subjectNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type new subject..."
                    value={categories.subjectNames.includes(newQuestion.subjectName) ? "" : newQuestion.subjectName}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subjectName: e.target.value })}
                    className="p-2 border w-full rounded mt-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Exam Type *</label>
                  <select
                    value={newQuestion.examType}
                    onChange={(e) => setNewQuestion({ ...newQuestion, examType: e.target.value })}
                    className="p-2 border w-full rounded"
                  >
                    <option value="">Select Exam Type</option>
                    {categories.examTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type new exam type..."
                    value={categories.examTypes.includes(newQuestion.examType) ? "" : newQuestion.examType}
                    onChange={(e) => setNewQuestion({ ...newQuestion, examType: e.target.value })}
                    className="p-2 border w-full rounded mt-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year *</label>
                  <select
                    value={newQuestion.year}
                    onChange={(e) => setNewQuestion({ ...newQuestion, year: e.target.value })}
                    className="p-2 border w-full rounded"
                  >
                    <option value="">Select Year</option>
                    {categories.years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Or type year..."
                    value={categories.years.includes(Number(newQuestion.year)) ? "" : newQuestion.year}
                    onChange={(e) => setNewQuestion({ ...newQuestion, year: e.target.value })}
                    className="p-2 border w-full rounded mt-2 text-sm"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Question *</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="p-2 border w-full rounded resize-vertical"
                  placeholder="Enter the question text..."
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Question Image</label>
                {newQuestionImagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img src={newQuestionImagePreview} alt="Preview" className="w-48 h-48 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => { setNewQuestionImage(null); setNewQuestionImagePreview(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    <span>{newQuestionImage ? 'Change Image' : 'Choose Image'}</span>
                    <input type="file" accept="image/*" onChange={handleNewQuestionImageSelect} className="hidden" />
                  </label>
                  <span className="text-sm text-gray-600">{newQuestionImage ? newQuestionImage.name : 'No file chosen'}</span>
                </div>
                <div className="mt-2">
                  <input
                    type="url"
                    value={newQuestion.questionImageUrl}
                    onChange={(e) => { setNewQuestion({ ...newQuestion, questionImageUrl: e.target.value }); setNewQuestionImagePreview(e.target.value); setNewQuestionImage(null); }}
                    className="p-2 border w-full rounded text-sm"
                    placeholder="Or enter image URL..."
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Option A</label>
                  <input
                    type="text"
                    value={newQuestion.optionA}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                    className="p-2 border w-full rounded"
                    placeholder="Option A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option B</label>
                  <input
                    type="text"
                    value={newQuestion.optionB}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                    className="p-2 border w-full rounded"
                    placeholder="Option B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option C</label>
                  <input
                    type="text"
                    value={newQuestion.optionC}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                    className="p-2 border w-full rounded"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option D</label>
                  <input
                    type="text"
                    value={newQuestion.optionD}
                    onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                    className="p-2 border w-full rounded"
                    placeholder="Option D"
                  />
                </div>
              </div>

              {/* Correct Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                  className="p-2 border w-full rounded"
                  placeholder="Enter correct answer"
                />
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Explanation</label>
                <textarea
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  className="p-2 border w-full rounded resize-vertical"
                  placeholder="Explanation for the answer..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateQuestion}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Question</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  className="p-2 border w-full rounded resize-vertical"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Question Image</label>
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded border" />
                    <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    <span>{selectedImage ? 'Change Image' : 'Choose Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                  <span className="text-sm text-gray-600">{selectedImage ? selectedImage.name : 'No file chosen'}</span>
                </div>
                <input
                  type="url"
                  value={editingQuestion.questionImageUrl || ""}
                  onChange={(e) => { setEditingQuestion({ ...editingQuestion, questionImageUrl: e.target.value }); setImagePreview(e.target.value); setSelectedImage(null); }}
                  className="p-2 border w-full rounded text-sm mt-2"
                  placeholder="Or enter image URL..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Option A</label>
                  <input type="text" value={editingQuestion.optionA || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, optionA: e.target.value })} className="p-2 border w-full rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option B</label>
                  <input type="text" value={editingQuestion.optionB || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, optionB: e.target.value })} className="p-2 border w-full rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option C</label>
                  <input type="text" value={editingQuestion.optionC || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, optionC: e.target.value })} className="p-2 border w-full rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option D</label>
                  <input type="text" value={editingQuestion.optionD || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, optionD: e.target.value })} className="p-2 border w-full rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                <input type="text" value={editingQuestion.correctAnswer || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })} className="p-2 border w-full rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Explanation</label>
                <textarea value={editingQuestion.explanation || ""} onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })} className="p-2 border w-full rounded resize-vertical" rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setEditingQuestion(null); setSelectedImage(null); setImagePreview(null); }} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded" disabled={uploadingImage}>Cancel</button>
                <button type="button" onClick={() => handleUpdate(editingQuestion)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50" disabled={uploadingImage}>{uploadingImage ? 'Uploading...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <p className="mb-4">Are you sure you want to delete this question?</p>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">Cancel</button>
                <button type="button" onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button type="button" onClick={goToPrevPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400">Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" onClick={goToNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400">Next</button>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default QuestionEditor;