import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SchoolRegistrationPage from "../../components/schools/SchoolRegistrationPage";

const SchoolRegistrationpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <SchoolRegistrationPage />
      <Footer />
    </div>
  );
};

export default SchoolRegistrationpage;
