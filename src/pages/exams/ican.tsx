import React from "react";
import Navbar from "../../components/Navbar";
import ICAN from "../../components/exams/Ican";
import Footer from "../../components/Footer";


const IcanPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <ICAN />
      <Footer />
    </div>
  );
};

export default IcanPage;