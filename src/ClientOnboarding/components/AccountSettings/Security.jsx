import  { useState } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../icons";

const Security = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <div
     
    >
      <div className="align-items-center mb-3 ">
      <h5
        className="mb-0 me-3"
        style={{
          color: "#3B4A66",
          fontSize: "20px",
          fontWeight: "500",
          fontFamily: "BasisGrotesquePro",
        }}
      >
        Security Settings
      </h5>
      <p
        className="mb-0"
        style={{
          color: "#4B5563",
          fontSize: "14px",
          fontWeight: "400",
          fontFamily: "BasisGrotesquePro",
        }}
      >
        Manage your account security and privacy
      </p>
       </div>
       
       <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <strong style={{ color: "#3B4A66", fontSize: "15px", fontFamily: "BasisGrotesquePro", fontWeight: "500", }}>
            Two-Factor Authentication
          </strong>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "13px",
              fontWeight: "400",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="custom-toggle">
          <input
            type="checkbox"
            id="twoFactor"
            checked={twoFactor}
            onChange={() => setTwoFactor(!twoFactor)}
          />
          <label htmlFor="twoFactor"></label>
        </div>
      </div>


      <div className="mb-4">
        <label
          htmlFor="sessionTimeout"
          style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
        >
          Session Timeout (minutes)
        </label>
        <select
          id="sessionTimeout"
          className="form-select mt-2"
          style={{ maxWidth: "300px", borderRadius: "10px", fontFamily: "BasisGrotesquePro", }}
        >
          <option>15 minutes</option>
          <option>30 minutes</option>
          <option>1 hour</option>
          <option>2 hours</option>
        </select>
      </div>


      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <strong style={{ color: "#3B4A66", fontSize: "15px", fontFamily: "BasisGrotesquePro", }}>
            Login Alerts
          </strong>
          <p
            className="mb-0"
            style={{
              color: "#4B5563",
              fontSize: "13px",
              fontWeight: "400",
            }}
          >
            Get notified of new login attempts
          </p>
        </div>
        <div className="custom-toggle">
          <input
            type="checkbox"
            id="loginAlerts"
            checked={loginAlerts}
            onChange={() => setLoginAlerts(!loginAlerts)}
          />
          <label htmlFor="loginAlerts"></label>
        </div>
      </div>


      <h6
        className="mb-3"
        style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
      >
        Password
      </h6>
      <form>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Current Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter current password"
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter new password"
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Confirm new password"
            style={{ color: "#3B4A66", fontSize: "15px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}
          />
        </div>
        <button
          type="button"
          className="btn mb-4"
          style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "400", fontFamily: "BasisGrotesquePro", background: "#E8F0FF" }}
        >
          Update Password
        </button>
      </form>

      <button
        className="btn d-flex align-items-center gap-2"
        style={{
          backgroundColor: "#F56D2D",
          color: "#fff",
          fontWeight: "400",
          fontSize: "15px",
          fontFamily: "BasisGrotesquePro",

        }}
      >
        <SaveIcon />
        Save Security Settings
      </button>


    </div>
  );
};

export default Security;
