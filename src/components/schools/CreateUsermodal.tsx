import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface CreateUserModalProps {
  onClose: () => void;
  handleCreateUser: (userData: {
    name: string;
    email: string;
    role: "TEACHER" | "STUDENT";
    classId?: string;
    schoolId: string; 
  }) => Promise<boolean | undefined>;
  classes?: { id: string; name: string }[];
  schoolId: string;
}

type UserRole = "TEACHER" | "STUDENT";

const CreateUserModal: React.FC<CreateUserModalProps> = ({ 
  onClose, 
  handleCreateUser, 
  classes = [],
  schoolId
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [classId, setClassId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Clean up function to re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Show/hide class selection based on role
  const showClassSelection = role === "STUDENT";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (role === "") {
        toast.error("Please select a user role");
        setIsSubmitting(false);
        return;
      }
      
      // Validate class selection for students
      if (role === "STUDENT" && !classId) {
        toast.error("Please select a class for the student");
        setIsSubmitting(false);
        return;
      }

      // Prepare user data with schoolId included
      const userData = {
        name,
        email,
        role: role as UserRole,
        schoolId, 
        ...(role === "STUDENT" ? { classId } : {})
      };

      await handleCreateUser(userData);
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stop propagation of clicks within the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Portal root for the modal - ensures it's at the top level of DOM */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay - ensuring it covers entire viewport */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        ></div>
        
        {/* Modal positioning - centered both horizontally and vertically */}
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
          {/* Modal content */}
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 overflow-hidden transform transition-all"
            onClick={handleModalContentClick}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New User</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                  required
                  autoComplete="name"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                  required
                  autoComplete="email"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole | "")}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                  required
                >
                  <option value="">Select User Role</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
              
              {showClassSelection && (
                <div className="mb-4">
                  <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    id="class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                    required={role === "STUDENT"}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      No classes available. Please create a class first.
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#66934e] text-white rounded hover:bg-[#557a40] transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-offset-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUserModal;