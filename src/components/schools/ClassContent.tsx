import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import baseApi from "../../utils/baseApi";
import "react-toastify/dist/ReactToastify.css";

interface Class {
  id: string;
  name: string;
}

interface ClassesContentProps {
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  token: string;
}

// Confirmation Dialog Component
const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  className: string;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, className, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Class</h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <strong>"{className}"</strong>? This action cannot be undone.
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

const ClassesContent: React.FC<ClassesContentProps> = ({ classes, setClasses, token }) => {
  const [newClass, setNewClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${baseApi}/school/get-classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data: Class[] = await res.json();
        setClasses(data);
      } catch (err) {
        console.error('Error loading classes:', err);
        toast.error('Could not load classes');
      }
    };
  
    fetchClasses();
  }, [token, setClasses]);

  const handleAddClass = async () => {
    if (!token || !newClass || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/add-classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newClass.trim() }),
      });
      if (response.ok) {
        const newClassData = await response.json();
        setClasses([...classes, newClassData]);
        setNewClass("");
        toast.success('Class added successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add class' }));
        throw new Error(errorData.message || 'Failed to add class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!token || !editingClass || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/edit-classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingClass.name.trim() }),
      });
      
      if (response.ok) {
        setClasses(prev => 
          prev.map(cls => 
            cls.id === editingClass.id ? editingClass : cls
          )
        );
        setEditingClass(null);
        toast.success('Class updated successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update class' }));
        throw new Error(errorData.message || 'Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (classItem: Class) => {
    setClassToDelete(classItem);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTimeout(() => setClassToDelete(null), 300); // Clear after animation would complete
  };

  const confirmDeleteClass = async () => {
    if (!token || !classToDelete) return;
    setIsDeleting(true);
    
    try {
      console.log(`Deleting class with ID: ${classToDelete.id}`);
      const response = await fetch(`${baseApi}/school/delete-classes/${classToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      console.log(`Delete response status: ${response.status}`);
      
      if (response.ok) {
        setClasses(classes.filter(cls => cls.id !== classToDelete.id));
        toast.success('Class deleted successfully');
        closeDeleteDialog();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Failed to delete class: ${response.status} ${errorData.message || ''}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingClass) {
        handleUpdateClass();
      } else if (newClass.trim()) {
        handleAddClass();
      }
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Classes Management</h1>
      
      {/* Add/Edit Class Form */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingClass ? 'Edit Class' : 'Add New Class'}
        </h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder={editingClass ? "Edit class name" : "Add new class"}
            value={editingClass ? editingClass.name : newClass}
            onChange={(e) => 
              editingClass 
                ? setEditingClass({...editingClass, name: e.target.value})
                : setNewClass(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="border p-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-[#66934e]"
            disabled={isSubmitting}
          />
          <button
            onClick={editingClass ? handleUpdateClass : handleAddClass}
            className="bg-[#66934e] hover:bg-[#557a40] text-white px-4 py-2 rounded"
            disabled={isSubmitting || (editingClass ? !editingClass.name.trim() : !newClass.trim())}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              editingClass ? 'Update Class' : 'Add Class'
            )}
          </button>
          {editingClass && (
            <button
              onClick={() => setEditingClass(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search classes..."
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

      {/* Classes List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Classes List</h2>
        {filteredClasses.length > 0 ? (
          <div className="space-y-4">
            {filteredClasses.map(cls => (
              <div key={cls.id} className="flex justify-between items-center border-b py-3 hover:bg-gray-50 px-2 rounded transition-colors">
                <h3 className="text-md font-medium text-gray-800">{cls.name}</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setEditingClass(cls)}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label={`Edit ${cls.name}`}
                    disabled={isSubmitting || isDeleting}
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(cls)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    aria-label={`Delete ${cls.name}`}
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
            <p className="text-gray-500">No classes found.</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : 'Add a new class to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteClass}
        className={classToDelete?.name || ''}
        isLoading={isDeleting}
      />
      
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default ClassesContent;