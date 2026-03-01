import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SchoolsPage from "../../components/schools/SchoolPage";

const Schoolpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <SchoolsPage />
      <Footer />
    </div>
  );
};

export default Schoolpage;
