import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaArrowLeft, FaUser } from "react-icons/fa";

const SchoolLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard with role
      navigate("/schools/dashboard", { state: { role: formData.role } });
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}

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
                  <option value="School Admin">School Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                </select>
              </div>
            </div>

            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="school@example.com"
                value={formData.email}
                onChange={handleChange}
                />
            </div>
            </div>
            
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                          Remember me
                                        </label>
                                      </div>
                        
                                      <div className="text-sm">
                                        <Link to="/schools/forgotpassword" className="font-medium text-[#66934e] hover:text-[#557a40]">
                                          Forgot your password?
                                        </Link>
                                      </div>
                                    </div>


            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#66934e] hover:bg-[#557a40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
                <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                              Don't have an account?{" "}
                              <Link to="/schools/register" className="font-medium text-[#66934e] hover:text-[#557a40]">
                                Register your school
                              </Link>
                            </p>
                          </div>
          
        </div>
        <div className="mt-8 text-center">
                  <Link to="/schools" className="inline-flex items-center text-sm text-gray-600 hover:text-[#66934e]">
                    <FaArrowLeft className="mr-2" />
                    Back to home
                  </Link>
                </div>
      </div>
    </div>
  );
};

export default SchoolLoginPage;
