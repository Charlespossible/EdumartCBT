import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaArrowLeft, FaUser, FaIdCard } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

import baseApi from "../../utils/baseApi"
import "react-toastify/dist/ReactToastify.css";

// Define role type for better type safety
type UserRole = "ADMIN" | "TEACHER" | "STUDENT" | "";

interface FormData {
  email: string;
  password: string;
  role: UserRole;
  signInId: string;
}

interface SessionData {
  token: string;
  role: UserRole;
  userId: string;
  expiresAt: number;
}

const SchoolLoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    role: "",
    signInId: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Check for existing session on component mount
  useEffect(() => {
    const session = localStorage.getItem("edumart-session");
    if (session) {
      try {
        const sessionData: SessionData = JSON.parse(session);

        // Check if session is valid and not expired
        if (sessionData.role && sessionData.token && sessionData.expiresAt > Date.now()) {
          toast.info("Restoring previous session");
          navigate("/schools/dashboard");
        } else {
          // Clear expired session
          localStorage.removeItem("edumart-session");
        }
      } catch (error) {
        localStorage.removeItem("edumart-session");
      }
    }
  }, [navigate]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = formData.role === "ADMIN"
        ? { email: formData.email, password: formData.password, role: formData.role }
        : { signInId: formData.signInId, role: formData.role };

      const response = await fetch(`${baseApi}/school/school-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      const data = await response.json();

      // Store session in local storage with role information
      localStorage.setItem("edumart-session", JSON.stringify({
        token: data.data.token,
        role: data.data.user.role, 
        userId: data.data.user.id, 
        expiresAt: Date.now() + 3600000,
      }));

      toast.success("Login successful!");
      navigate("/schools/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Login failed. Please try again.");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized form fields renderer for better performance
  const renderFormFields = useCallback(() => {
    if (!formData.role) {
      return (
        <div className="py-4 px-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Please select a role to continue</p>
        </div>
      );
    }

    if (formData.role === "ADMIN") {
      return (
        <>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                placeholder="admin@school.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/schools/forgotpassword"
                className="font-medium text-[#66934e] hover:text-[#557a40]"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </>
      );
    } else {
      // Student or Teacher login with ID
      return (
        <>
          <div>
            <label
              htmlFor="signInId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {formData.role} ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaIdCard className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="signInId"
                name="signInId"
                type="text"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                placeholder={`Enter your ${formData.role} ID`}
                value={formData.signInId}
                onChange={handleChange}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This ID is provided by your school administrator.
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>
        </>
      );
    }
  }, [formData.role, formData.email, formData.password, formData.signInId, handleChange]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-[#66934e]">Edumart CBT</h1>
          </Link>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">School Login</h2>
            <p className="text-gray-600 mt-2">
              Access your school CBT dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select your role</option>
                  <option value="ADMIN">School Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
            </div>

            {/* Dynamically rendered form fields based on role */}
            {renderFormFields()}

            <div>
              <button
                type="submit"
                disabled={isLoading || !formData.role}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#66934e] hover:bg-[#557a40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] ${(isLoading || !formData.role) ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/schools/register"
                className="font-medium text-[#66934e] hover:text-[#557a40]"
              >
                Register your school
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/schools"
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#66934e]"
          >
            <FaArrowLeft className="mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolLoginPage;