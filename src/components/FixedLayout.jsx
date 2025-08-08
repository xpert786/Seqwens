// src/components/Layout.js
import React from "react";
import "../styles/FixedLayout.css";
import logo from "../assets/logo.png";

const FixedLayout = ({ children }) => {
  return (
    <div className="fixed-screen">
      <img src={logo} alt="Logo" className="fixed-logo" />
      {children}
    </div>
  );
};

export default FixedLayout;
