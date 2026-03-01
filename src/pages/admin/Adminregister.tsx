import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminRegister from "../../components/admin/AdminRegister";

const Adminregister: React.FC = () => {
  return (
    <div>
      <Navbar />
      <AdminRegister/>
      <Footer />
    </div>
  );
};

export default Adminregister;
