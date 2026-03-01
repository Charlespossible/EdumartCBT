import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordForgetForm from "../../components/schools/PasswordForgetForm";


const Passwordforgetform: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PasswordForgetForm />
      <Footer />
    </div>
  );
};

export default Passwordforgetform;
