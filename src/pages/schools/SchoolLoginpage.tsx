import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SchoolLoginPage from "../../components/schools/SchoolLoginPage";

const SchoolLoginpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <SchoolLoginPage />
      <Footer />
    </div>
  );
};

export default SchoolLoginpage;
