import React from "react";
import defaultLogo from "../../assets/logo.png";
import "../styles/FixedLayout.css";
import { useFirmPortalColors } from "../../FirmAdmin/Context/FirmPortalColorsContext";

const FixedLayout = ({ children }) => {
  const { logoUrl, loading } = useFirmPortalColors();

  // Use firm logo if available, otherwise fallback to default
  const logoSrc = logoUrl || defaultLogo;

  return (
    <div className="abc">
      <div className="top">
        <img src={logoSrc} alt="Logo" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }} />
      </div>

      <div className=".content-rap">
        {children}
      </div>
    </div>
  );
};

export default FixedLayout;
