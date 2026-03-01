import React, { useState, useCallback, useMemo } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import baseApi from "../../utils/baseApi";
import "react-toastify/dist/ReactToastify.css";

interface Subject {
  id: string;
  name: string;
}

interface SubjectsContentProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  token: string;
}

// Confirmation Dialog Component
const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subjectName: string;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, subjectName, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Subject</h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <strong>"{subjectName}"</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </div>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SubjectsContent: React.FC<SubjectsContentProps> = ({ subjects, setSubjects, token }) => {
  const [newSubject, setNewSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoize filtered subjects to prevent recalculation on every render
  const filteredSubjects = useMemo(() => 
    subjects.filter(subject =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [subjects, searchQuery]
  );

  React.useEffect(() => {
    const fetchSubjects = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${baseApi}/school/get-subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data: Subject[] = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error('Error loading subjects:', err);
        toast.error('Could not load subjects');
      }
    };
  
    fetchSubjects();
  }, [token, setSubjects]);

  const handleAddSubject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSubject.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/add-subjects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSubject.trim() }),
      });
      
      if (response.ok) {
        const newSubjectData = await response.json();
        setSubjects(prev => [...prev, newSubjectData]);
        setNewSubject("");
        toast.success('Subject added successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add subject' }));
        throw new Error(errorData.message || 'Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add subject');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, newSubject, isSubmitting, setSubjects]);

  const handleUpdateSubject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingSubject || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/edit-subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingSubject.name.trim() }),
      });
      
      if (response.ok) {
        setSubjects(prev => 
          prev.map(subject => 
            subject.id === editingSubject.id ? editingSubject : subject
          )
        );
        setEditingSubject(null);
        toast.success('Subject updated successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update subject' }));
        throw new Error(errorData.message || 'Failed to update subject');
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, editingSubject, isSubmitting, setSubjects]);

  const openDeleteDialog = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTimeout(() => setSubjectToDelete(null), 300); // Clear after animation would complete
  };

  const confirmDeleteSubject = async () => {
    if (!token || !subjectToDelete) return;
    setIsDeleting(true);
    
    try {
      //console.log(`Deleting subject with ID: ${subjectToDelete.id}`);
      const response = await fetch(`${baseApi}/school/delete-subjects/${subjectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      //console.log(`Delete response status: ${response.status}`);
      
      if (response.ok) {
        setSubjects(prev => prev.filter(subject => subject.id !== subjectToDelete.id));
        toast.success('Subject deleted successfully');
        closeDeleteDialog();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Failed to delete subject: ${response.status} ${errorData.message || ''}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error(`Failed to delete subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubject.trim()) {
      e.preventDefault();
      handleAddSubject(e as unknown as React.FormEvent);
    }
  }, [newSubject, handleAddSubject]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Subjects Management</h1>
      </div>
      
      {/* Add/Edit Subject Form */}
      <form 
        onSubmit={editingSubject ? handleUpdateSubject : handleAddSubject}
        className="bg-white p-4 rounded-lg shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingSubject ? 'Edit Subject' : 'Add New Subject'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-1 space-x-4">
            <input
              type="text"
              placeholder={editingSubject ? "Edit subject name" : "Add new subject"}
              value={editingSubject ? editingSubject.name : newSubject}
              onChange={(e) => 
                editingSubject 
                  ? setEditingSubject({...editingSubject, name: e.target.value})
                  : setNewSubject(e.target.value)
              }
              onKeyPress={handleKeyPress}
              className="border p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-[#66934e]"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="bg-[#66934e] hover:bg-[#557a40] transition-colors text-white px-4 py-2 rounded flex items-center"
              disabled={isSubmitting || (editingSubject ? !editingSubject.name.trim() : !newSubject.trim())}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </>
              )}
            </button>
            {editingSubject && (
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
      
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full pl-10 focus:outline-none focus:ring-2 focus:ring-[#66934e]"
        />
        <svg 
          className="w-5 h-5 absolute left-3 top-3 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>
      
      {/* Subjects List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Subjects List</h2>
        {filteredSubjects.length > 0 ? (
          <div className="space-y-4">
            {filteredSubjects.map(subject => (
              <div 
                key={subject.id} 
                className="flex justify-between items-center border-b py-3 hover:bg-gray-50 px-2 rounded transition-colors"
              >
                <h3 className="text-md font-medium text-gray-800">{subject.name}</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setEditingSubject(subject)}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label={`Edit ${subject.name}`}
                    disabled={isSubmitting || isDeleting}
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(subject)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    aria-label={`Delete ${subject.name}`}
                    disabled={isSubmitting || isDeleting}
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No subjects found.</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : 'Add a new subject to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteSubject}
        subjectName={subjectToDelete?.name || ''}
        isLoading={isDeleting}
      />
      
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default SubjectsContent;