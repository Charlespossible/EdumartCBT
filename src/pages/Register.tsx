import React from "react";
import RegistrationForm from "../components/RegistrationForm";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { RegistrationFormData } from "../types/RegistrationForm";

const Register: React.FC = () => {
  const handleRegister = (data: RegistrationFormData) => {
    console.log("Data :", data);
  };

  return (
    <div>
      <Navbar />
      <RegistrationForm onSubmit={handleRegister} />
      <Footer />
    </div>
  );
};

export default Register;
