import React, { useState, useCallback } from "react";
import { LoginFormData, LoginFormProps } from "../types/LoginForm";
import axios, { AxiosError } from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";
import Cookies from "js-cookie";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginResponse {
  user: {
    firstName: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  accessToken: string;
  message?: string;
}

const LoginForm: React.FC<LoginFormProps> = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // -------------------------
  // Handle Input Changes
  // -------------------------
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  // -------------------------
  // Form Validation
  // -------------------------
  const validateForm = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // -------------------------
  // Handle Submit
  // -------------------------
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);

      try {
        const response = await axios.post<LoginResponse>(
          `${baseApi}/auth/login`,
          formData
        );

        const { user, accessToken, message } = response.data;

        if (!accessToken) {
          throw new Error("Authentication token missing from server response");
        }

        // Clear stale auth first
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Store fresh auth state
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        // Optional: store non-sensitive UI data in cookies
        const cookieOptions = {
          secure: window.location.protocol === "https:",
          sameSite: "Lax" as const,
          path: "/",
        };

        Cookies.set("firstName", user.firstName, cookieOptions);
        Cookies.set("email", user.email, cookieOptions);
        Cookies.set("role", user.role, cookieOptions);

        toast.success(message || "Login successful!");
        //setTimeout(() => navigate("/dashboard"), 2000);
        // Navigate immediately (ProtectedRoute now validates properly)
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      } catch (err) {
        const error = err as AxiosError<any>;

        if (error.response?.status === 403) {
          toast.error("Already logged in on another device");
        } else {
          toast.error(
            error.response?.data?.message || "Invalid email or password"
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, navigate]
  );

  // -------------------------
  // Toggle Password Visibility
  // -------------------------
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-[#66934e] py-4">
          <h2 className="text-center text-2xl font-bold text-white">
            Login to Your Account
          </h2>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#66934e]"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <NavLink
                to="/forgotpassword"
                className="text-sm text-[#66934e] hover:underline"
              >
                Forgot your password?
              </NavLink>
            </div>

            {/* Submit */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-[#66934e] hover:bg-[#5a8044] disabled:opacity-70"
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <NavLink
                to="/register"
                className="text-[#66934e] hover:underline font-medium"
              >
                Sign up
              </NavLink>
            </p>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default React.memo(LoginForm);