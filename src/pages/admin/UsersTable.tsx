import React, { useState, useEffect } from "react";
import axios from "axios";
import { user } from "../../types/LoginForm";
import baseApi from "../../utils/baseApi";

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<user[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<user | null>(null);
  const itemsPerPage = 10;

  // Fetch users with pagination
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${baseApi}/admin/users`, {
          params: { page: currentPage, limit: itemsPerPage },
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });
        setUsers(response.data.users);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage]);

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Delete
  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await axios.delete(`${baseApi}/admin/delete-users/${userToDelete}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });
        setUsers(users.filter((user) => user.id.toString() !== userToDelete));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle Edit
  const handleEdit = (id: string) => {
    const user = users.find((u) => u.id.toString() === id);
    if (user) {
      setEditUser(user);
      setShowEditModal(true);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editUser) {
      setEditUser({
        ...editUser,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleEditSubmit = async () => {
    if (editUser) {
      try {
        const response = await axios.put(
          `${baseApi}/admin/edit-users/${editUser.id}`,
          editUser,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          }
        );
        setUsers(users.map((u) => (u.id === editUser.id ? response.data : u)));
        setShowEditModal(false);
        setEditUser(null);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditUser(null);
  };

  // Pagination controls
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-1 focus:ring-[#66934e]"
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-[#66934e] text-white">
                <th className="p-3 text-center">First Name</th>
                <th className="p-3 text-center">Last Name</th>
                <th className="p-3 text-center">Email</th>
                <th className="p-3 text-center">Phone Number</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-center">{user.firstName}</td>
                    <td className="p-3 text-center">{user.lastName || "N/A"}</td>
                    <td className="p-3 text-center">{user.email}</td>
                    <td className="p-3 text-center">{user.phoneNumber || "N/A"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleEdit(user.id.toString())}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id.toString())}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between mt-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#66934e] text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#66934e] text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={editUser.firstName}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={editUser.lastName || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editUser.email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={editUser.phoneNumber || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;