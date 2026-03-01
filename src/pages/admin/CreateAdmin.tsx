import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../../utils/baseApi";

const CreateAdmin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${baseApi}/admin/create-admin`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          },
        }
      );
      if (response.status === 201) {
        toast.success("Admin Created Successfully!");
        setEmail("");
        setPassword("");
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const message = err.response.data.message || "Failed to create Admin";
        toast.error(message);
        setError(message);
      } else {
        toast.error("An unexpected error occurred");
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-[#78846f] mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-[#78846f] mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
          required
        />
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-bold text-white bg-[#66934e] rounded-lg hover:bg-[#66934e] focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Create Admin
      </button>
    </form>
  );
};

export default CreateAdmin;