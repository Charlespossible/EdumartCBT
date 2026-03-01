import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaUsersCog, FaEdit, FaBars, FaTimes } from "react-icons/fa";

interface SidebarProps {
  openUsersTableModal: () => void;
  openQuestionEditorModal: () => void;
  openCreateAdminModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  openUsersTableModal,
  openQuestionEditorModal,
  openCreateAdminModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavItemClick = (callback: () => void) => {
    callback();
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 md:hidden bg-[#66934e] text-white p-2 rounded-md"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-20 w-64 bg-[#66934e] text-white flex flex-col p-4 h-full transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <h2 className="text-xl font-bold mb-6 mt-8 md:mt-0">Admin Dashboard</h2>
        <nav>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => handleNavItemClick(openUsersTableModal)}
                className="flex items-center space-x-3 hover:text-gray-300 w-full text-left p-2 rounded hover:bg-[#5a8044]"
              >
                <FaUsersCog /> <span>Manage Users</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavItemClick(openQuestionEditorModal)}
                className="flex items-center space-x-3 hover:text-gray-300 w-full text-left p-2 rounded hover:bg-[#5a8044]"
              >
                <FaEdit /> <span>Manage Questions</span>
              </button>
            </li>
            
            <li>
              <button
                onClick={() => handleNavItemClick(openCreateAdminModal)}
                className="flex items-center space-x-3 hover:text-gray-300 w-full text-left p-2 rounded hover:bg-[#5a8044]"
              >
                <FaUser /> <span>Create Admin</span>
              </button>
            </li>
            <li className="mt-6">
              <NavLink
                to="/admin/logout"
                className="flex items-center space-x-3 hover:text-gray-300 p-2 rounded hover:bg-[#5a8044]"
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
              >
                <FaSignOutAlt /> <span>Logout</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;