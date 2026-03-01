import React from "react";
import Navbar from "../../components/Navbar";
import ProffesionalExams from "../../components/exams/ProffesionalExams";
import Footer from "../../components/Footer";


const Pexamspage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <ProffesionalExams />
      <Footer />
    </div>
  );
};

export default Pexamspage;