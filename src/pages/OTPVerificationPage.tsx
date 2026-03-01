import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OtpVerify from "../components/OtpVerify";


const OTPVerificationPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <OtpVerify />
      <Footer />
    </div>
  );
};

export default OTPVerificationPage;
