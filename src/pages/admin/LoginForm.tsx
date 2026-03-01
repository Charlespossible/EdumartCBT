import React, { useState } from "react";
import { LoginFormData, LoginFormProps } from "../../types/LoginForm";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../../utils/baseApi";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = (data: LoginFormData): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    const newErrors: { email?: string; password?: string } = {};

    if (!emailRegex.test(data.email)) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!passwordRegex.test(data.password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include uppercase, lowercase, and numbers.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${baseApi}/auth/login`,
        formData
      );
      toast.success(response.data.message || "Login successful!");
      localStorage.setItem("isLoggedIn", "true");
      const storedAccessToken = response.data.accessToken; 
      localStorage.setItem("accessToken", storedAccessToken);
      const Myemail = response.data.user.email;
      localStorage.setItem("email", Myemail);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-[#66934e] mb-6">
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[#78846f] mb-2">
              Email Address
            </label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter Valid Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-[#66934e]"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-[#78846f] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter Your Correct Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-[#66934e]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 py-2 text-[#78846f]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-[#66934e] rounded-lg hover:bg-green-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-[#78846f] mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-[#66934e] hover:underline">
            Register
          </a>
        </p>
        <p className="text-center text-[#78846f] mt-2">
          <a href="/forgotpassword" className="text-[#66934e] hover:underline">
            Forgot Password?
          </a>
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default LoginForm;
