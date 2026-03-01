// src/pages/Login.tsx
import React from "react";
import LoginForm from "../components/LoginForm";
import { LoginFormData } from "../types/LoginForm";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Login: React.FC = () => {
  const handleLogin = (data: LoginFormData) => {
    console.log("Login data submtted :", data);
    // Implement authentication logic here later
  };

  return (
    <div>
      <Navbar />
      <LoginForm onSubmit={handleLogin} />
      <Footer />
    </div>
  );
};

export default Login;
