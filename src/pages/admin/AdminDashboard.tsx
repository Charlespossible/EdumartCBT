import React from "react";
import { FaTimes, FaBars } from "react-icons/fa";
import Sidebar from "../admin/Sidebar";
import UsersTable from "../admin/UsersTable";
import UploadQuestions from "../admin/UploadQuestions";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CreateAdmin from "./CreateAdmin";
import QuestionEditor from "./QuestionEditor";

const AdminDashboard: React.FC = () => {
  const [openUsersTableModal, setOpenUsersTableModal] = useState(false);
  const [openQuestionEditorModal, setOpenQuestionEditorModal] = useState(false);
  const [openCreateAdminModal, setOpenCreateAdminModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);
  const navigate = useNavigate();
    
  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("You have been logged out successfully!", {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    navigate("/admin/Adminlogin");
  };
  
  const closeModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - conditionally rendered based on visibility state */}
      {sidebarVisible && (
        <Sidebar
          openUsersTableModal={() => setOpenUsersTableModal(true)}
          openQuestionEditorModal={() => setOpenQuestionEditorModal(true)}
          openCreateAdminModal={() => setOpenCreateAdminModal(true)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <header className="shadow p-4 flex justify-between items-center">
          <div className="flex items-center">
            {isMobile && (
              <button 
                onClick={toggleSidebar} 
                className="mr-4 text-gray-600 hover:text-gray-800"
                aria-label="Toggle sidebar"
              >
                <FaBars size={24} />
              </button>
            )}
            <h1 className="text-lg font-bold text-ce">Admin Dashboard</h1>
          </div>
          <button
            className="bg-[#66934e] text-white px-4 py-2 rounded-md"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>
        <main className={`${isMobile ? 'p-3' : 'p-6'} space-y-6 overflow-y-auto`}>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Upload Questions</h2>
          <hr className="my-4" />
          <UploadQuestions />
          <hr className="my-4" />
        </main>
          
        {/* UsersTable Modal */}
        {openUsersTableModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-lg w-full max-h-full overflow-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'} relative flex flex-col`}>
              <div className="sticky top-0 bg-white p-4 border-b z-10 flex justify-between items-center">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Manage Users</h2>
                <button
                  onClick={() => closeModal(setOpenUsersTableModal)}
                  className="text-gray-600 hover:text-gray-800"
                  aria-label="Close"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className={`${isMobile ? 'p-3' : 'p-4'} overflow-auto flex-1`}>
                <UsersTable />
              </div>
            </div>
          </div>
        )}
          
        {/* Question Editor Modal */}
        {openQuestionEditorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-lg w-full max-h-full overflow-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'} relative flex flex-col`}>
              <div className="sticky top-0 bg-white p-4 border-b z-10 flex justify-between items-center">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Manage Questions</h2>
                <button
                  onClick={() => closeModal(setOpenQuestionEditorModal)}
                  className="text-gray-600 hover:text-gray-800"
                  aria-label="Close"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className={`${isMobile ? 'p-3' : 'p-4'} overflow-auto flex-1`}>
                <QuestionEditor />
              </div>
            </div>
          </div>
        )}
    
        {/* CreateAdmin Modal */}
        {openCreateAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-lg w-full max-h-full overflow-auto ${isMobile ? 'max-w-full' : 'max-w-md'} relative flex flex-col`}>
              <div className="sticky top-0 bg-white p-4 border-b z-10 flex justify-between items-center">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Create Admin</h2>
                <button
                  onClick={() => closeModal(setOpenCreateAdminModal)}
                  className="text-gray-600 hover:text-gray-800"
                  aria-label="Close"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className={`${isMobile ? 'p-3' : 'p-4'} overflow-auto flex-1`}>
                <CreateAdmin />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;