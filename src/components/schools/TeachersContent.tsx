import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaKey } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import baseApi from "../../utils/baseApi";
import "react-toastify/dist/ReactToastify.css";
import CreateUserModal from "./CreateUsermodal";

interface Teacher {
  id: string;
  name: string;
  email: string;
  hasTemporaryCredentials?: boolean;
  credentialsExpireAt?: string | null;
  credentialsExpired?: boolean;
}

interface Class {
  id: string;
  name: string;
}

interface TempCredential {
  teacherName: string;
  teacherEmail: string;
  tempPassword: string;
  expiresAt: string;
}

interface TeachersContentProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  token: string;
  setShowCreateUser: React.Dispatch<React.SetStateAction<boolean>>;
  schoolId: string;
}

const TeachersContent: React.FC<TeachersContentProps> = ({ 
  token,
  schoolId
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<TempCredential | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${baseApi}/school/get-teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const teachersData = await response.json();
          setTeachers(teachersData);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch teachers' }));
          toast.error(errorData.message || 'Failed to fetch teachers');
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Failed to fetch teachers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeachers();
  }, [token]);

  // Fetch classes for the school
  useEffect(() => {
    const fetchClasses = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(`${baseApi}/school/get-classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const classesData = await response.json();
          setClasses(classesData);
        } else {
          console.error('Failed to fetch classes');
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    
    fetchClasses();
  }, [token]);
  
  // Memoize filtered teachers for performance
  const filteredTeachers = useMemo(() => 
    teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [teachers, searchQuery]
  );

  const handleDeleteTeacher = useCallback(async (id: string) => {
    if (!token || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/delete-teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        setTeachers(prev => prev.filter(teacher => teacher.id !== id));
        toast.success('Teacher removed successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove teacher' }));
        throw new Error(errorData.message || 'Failed to remove teacher');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove teacher');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, isSubmitting]);

  const handleCreateCredentials = useCallback(async (teacher: Teacher) => {
    if (!token || isSubmitting) return;

    setSelectedTeacher(teacher);
    setShowCredentialsModal(true);
  }, [token, isSubmitting]);

  const confirmCreateCredentials = useCallback(async () => {
    if (!token || isSubmitting || !selectedTeacher) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${baseApi}/school/teacher-credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          expiresInDays
        })
      });

      if (response.ok) {
        const credentialData = await response.json();
        setTempCredentials(credentialData);
        
        // Update teacher status in the list
        setTeachers(prev => prev.map(t => 
          t.id === selectedTeacher.id 
            ? { 
                ...t, 
                hasTemporaryCredentials: true, 
                credentialsExpireAt: credentialData.expiresAt,
                credentialsExpired: false
              } 
            : t
        ));
        
        toast.success('Temporary credentials created successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create credentials' }));
        throw new Error(errorData.message || 'Failed to create credentials');
      }
    } catch (error) {
      console.error('Error creating credentials:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create credentials');
    } finally {
      setIsSubmitting(false);
      setShowCredentialsModal(false);
    }
  }, [token, isSubmitting, selectedTeacher, expiresInDays]);

  const handleCreateUser = useCallback(async (userData: {
    name: string;
    email: string;
    role: "TEACHER" | "STUDENT";
    classId?: string;
    schoolId: string;
  }) => {
    if (!token || isSubmitting) return false;
    
    setIsSubmitting(true);
    try {
      const endpoint = userData.role === "TEACHER" 
        ? `${baseApi}/school/create-teachers` 
        : `${baseApi}/school/create-students`;

      const requestBody = {
        name: userData.name,
        email: userData.email,
        ...(userData.role === "TEACHER" ? { classId: userData.classId } : {}),
        schoolId: userData.schoolId 
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 403) {
        toast.error("You don't have permission to perform this action");
        return false;
      }
      
      if (response.ok) {
        const newUser = await response.json();
        
        if (userData.role === "TEACHER") {
          setTeachers(prev => [...prev, newUser]);
        }
        
        toast.success(`${userData.role.toLowerCase()} created successfully`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: `Failed to create ${userData.role.toLowerCase()}` }));
        throw new Error(errorData.message || `Failed to create ${userData.role.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`Error creating ${userData.role.toLowerCase()}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to create ${userData.role.toLowerCase()}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [token, isSubmitting, schoolId]);

  const closeCredentialsModal = useCallback(() => {
    setShowCredentialsModal(false);
    setSelectedTeacher(null);
  }, []);

  const closeTempCredentialsModal = useCallback(() => {
    setTempCredentials(null);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(err => console.error('Could not copy text: ', err));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#66934e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Teachers Management</h1>
        <button
          onClick={() => setShowCreateUser(true)}
          className="bg-[#66934e] hover:bg-[#557a40] transition-colors text-white px-4 py-2 rounded flex items-center"
        >
          <FaPlus className="mr-2" />
          <span>Add Teacher</span>
        </button>
      </div>
      
      <div className="relative">
        <input
          type="text"
          placeholder="Search teachers..."
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
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Teachers List</h2>
        {filteredTeachers.length > 0 ? (
          <div className="space-y-4">
            {filteredTeachers.map(teacher => (
              <div 
                key={teacher.id} 
                className="flex justify-between items-center border-b py-3 hover:bg-gray-50 px-2 rounded transition-colors"
              >
                <div>
                  <h3 className="text-md font-medium text-gray-800">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">{teacher.email}</p>
                  {teacher.hasTemporaryCredentials && (
                    <div className="flex items-center mt-1">
                      <FaKey className="text-yellow-500 mr-1" size={12} />
                      <span className="text-xs text-yellow-600">
                        {teacher.credentialsExpired 
                          ? "Credentials expired" 
                          : `Temp access expires: ${new Date(teacher.credentialsExpireAt || "").toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleCreateCredentials(teacher)}
                    className="text-gray-500 hover:text-yellow-600 transition-colors"
                    aria-label={`Create credentials for ${teacher.name}`}
                    disabled={isSubmitting}
                  >
                    <FaKey size={18} />
                  </button>
                  <button 
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label={`Edit ${teacher.name}`}
                    disabled={isSubmitting}
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    aria-label={`Delete ${teacher.name}`}
                    disabled={isSubmitting}
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No teachers found.</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : 'Add a new teacher to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          handleCreateUser={handleCreateUser}
          classes={classes}
          schoolId={schoolId}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create Temporary Credentials</h3>
            <p className="mb-4">
              Create temporary access credentials for <span className="font-semibold">{selectedTeacher.name}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires in (days)
              </label>
              <input 
                type="number" 
                min="1" 
                max="30"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#66934e]"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeCredentialsModal}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateCredentials}
                className="bg-[#66934e] hover:bg-[#557a40] transition-colors text-white px-4 py-2 rounded flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Temporary Credentials Display Modal */}
      {tempCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Temporary Credentials Created</h3>
            <p className="mb-4 text-sm text-yellow-600">
              <strong>Important:</strong> Save this information. The password cannot be retrieved later.
            </p>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <div className="border p-2 rounded bg-gray-50 flex justify-between">
                  <span>{tempCredentials.teacherName}</span>
                  <button 
                    onClick={() => copyToClipboard(tempCredentials.teacherName)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="border p-2 rounded bg-gray-50 flex justify-between">
                  <span>{tempCredentials.teacherEmail}</span>
                  <button 
                    onClick={() => copyToClipboard(tempCredentials.teacherEmail)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <div className="border p-2 rounded bg-gray-50 flex justify-between">
                  <span>{tempCredentials.tempPassword}</span>
                  <button 
                    onClick={() => copyToClipboard(tempCredentials.tempPassword)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <div className="border p-2 rounded bg-gray-50">
                  {new Date(tempCredentials.expiresAt).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closeTempCredentialsModal}
                className="bg-[#66934e] hover:bg-[#557a40] transition-colors text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default TeachersContent;