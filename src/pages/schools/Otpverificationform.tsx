import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import OTPVerificationForm from "../../components/schools/OtpVerificationForm";

const Otpverificationform: React.FC = () => {
  return (
    <div>
      <Navbar />
      <OTPVerificationForm />
      <Footer />
    </div>
  );
};

export default Otpverificationform;
