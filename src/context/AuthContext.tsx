import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import baseApi from "../utils/baseApi";
import Cookies from "js-cookie";

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  setUser?: (user: User | null) => void;
}


export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []); // Runs on mount to sync user state

  const logout = async () => {
    try {
      // Get user data from localStorage as a fallback
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        throw new Error("No user data available");
      }
      const userData: User = JSON.parse(storedUser);
      if (!userData.id) {
        throw new Error("No user ID available");
      }

      await axios.post(
        `${baseApi}/auth/logout`,
        { userId: userData.id }, // Match backend expectation
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // Clear all storage
      localStorage.clear();
      Cookies.remove("firstName");
      Cookies.remove("email");
      Cookies.remove("role");
      setUser(null);

      toast.success("Logged out successfully", {
        autoClose: 3000,
        onClose: () => {
          navigate("/login");
        },
      });
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};