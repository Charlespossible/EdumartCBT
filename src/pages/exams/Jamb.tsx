import React from "react";
import Navbar from "../../components/Navbar";
import Jamb from "../../components/exams/Jamb";
import Footer from "../../components/Footer";


const Jambpage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <Jamb />
      <Footer />
    </div>
  );
};

export default Jambpage;
