import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordResetForm from "../../components/schools/PasswordReset";



const PasswordReset: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PasswordResetForm />
      <Footer />
    </div>
  );
};

export default PasswordReset;
