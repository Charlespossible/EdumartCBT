import React from "react";
import Navbar from "../../components/Navbar";
import Olevel from "../../components/exams/Olevel";
import Footer from "../../components/Footer";


const Olevelpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <Olevel />
      <Footer />
    </div>
  );
};

export default Olevelpage;
