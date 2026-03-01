import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import JuniorWaec from "../../components/exams/Jwaec";


const Jwaecpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <JuniorWaec />
      <Footer />
    </div>
  );
};

export default Jwaecpage;
