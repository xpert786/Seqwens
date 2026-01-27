import React from "react";
import logo from "../../assets/logo.png";
import "../styles/FixedLayout.css";

const FixedLayout = ({ children }) => {
  return (
    <div className="abc">
      <div className="top">
        <img src={logo} alt="Logo" />
      </div>


      <div className=".content-rap">
        {children}
      </div>
    </div>
  );
};

export default FixedLayout;
