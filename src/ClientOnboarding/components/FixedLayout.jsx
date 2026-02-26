import React from "react";
import defaultLogo from "../../assets/logo.png";
import "../styles/FixedLayout.css";
import { useFirmPortalColors } from "../../FirmAdmin/Context/FirmPortalColorsContext";

const FixedLayout = ({ children }) => {
  const { logoUrl, loading } = useFirmPortalColors();

  // Always use the Seqwens default logo for this layout, ignoring firm branding
  const logoSrc = defaultLogo;

  return (
    <div className="abc">
      <div className="top">
        <img src={logoSrc} alt="Seqwens Logo" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }} />
      </div>

      <div className=".content-rap">
        {children}
      </div>
    </div>
  );
};

export default FixedLayout;
