import { useState } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons";

const Security = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <div style={{
      backgroundColor: "#F3F7FF",
      padding: "10px",
      borderRadius: "12px",
      border: "none"
    }}>
      <div className="flex flex-col gap-4 border border-[#E8F0FF] p-4 rounded-lg bg-white">
        {/* Header */}
        <div className="align-items-center mb-3">
          <h5
            className="mb-0 me-3"
            style={{
              color: "#3B4A66",
              fontSize: "24px",
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
        {/* Security Settings Section */}
        <div className="flex justify-between items-center py-3 ">
          <div className="flex-1">
            <div
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginBottom: "4px"
              }}
            >
              Two-Factor Authentication
            </div>
            <p
              className="mb-0"
              style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Add an extra layer of security to your account
            </p>
          </div>
          <div className="custom-toggle ml-4">
            <input
              type="checkbox"
              id="twoFactor"
              checked={twoFactor}
              onChange={() => setTwoFactor(!twoFactor)}
            />
            <label htmlFor="twoFactor"></label>
          </div>
        </div>

        {/* Session Timeout */}
        <div className="py-3 ">
          <label
            htmlFor="sessionTimeout"
            style={{
              color: "#3B4A66",
              fontSize: "16px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
              marginBottom: "8px",
              display: "block"
            }}
          >
            Session Timeout (minutes)
          </label>
          <select
            id="sessionTimeout"
            className="form-select"
            style={{
              maxWidth: "300px",
              borderRadius: "8px",
              fontFamily: "BasisGrotesquePro",
              border: "1px solid #E8F0FF",
              padding: "8px 12px"
            }}
          >
            <option>15 minutes</option>
            <option selected>30 minutes</option>
            <option>1 hour</option>
            <option>2 hours</option>
          </select>
        </div>

        {/* Login Alerts */}
        <div className="flex justify-between items-center py-3 border-b-2 border-[#4B5563]">
          <div className="flex-1">
            {/* <div
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginBottom: "4px"
              }}
            >
              Login Alerts
            </div> */}
            <p
              className="mb-0"
              style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}
            >
              Get notified of new login attempts
            </p>
          </div>
          <div className="custom-toggle ml-4">
            <input
              type="checkbox"
              id="loginAlerts"
              checked={loginAlerts}
              onChange={() => setLoginAlerts(!loginAlerts)}
            />
            <label htmlFor="loginAlerts"></label>
          </div>
        </div>

        {/* Password Section */}
        <div className="mt-6">
          <h6
            className="mb-3"
            style={{
              color: "#3B4A66",
              fontSize: "18px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro"
            }}
          >
            Password
          </h6>
          <form>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                Current Password
              </label>
              <input
                type="password"
                className="form-control w-full"
                placeholder="Enter current password"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              />
            </div>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                New Password
              </label>
              <input
                type="password"
                className="form-control w-full"
                placeholder="Enter new password"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              />
            </div>
            <div className="mb-3">
              <label
                className="form-label"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "BasisGrotesquePro"
                }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-control w-full"
                placeholder="Confirm new password"
                style={{
                  color: "#3B4A66",
                  fontSize: "14px",
                  fontWeight: "400",
                  fontFamily: "BasisGrotesquePro",
                  border: "1px solid #E8F0FF",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              />
            </div>
            <button
              type="button"
              className="btn  px-4 py-2 rounded-lg"
              style={{
                color: "#3B4A66",
                fontSize: "15px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
                background: "#F3F7FF",
                border: "1px solid #E8F0FF"
              }}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Save Button */}
        <div className="mt-1">
          <button
            className="btn d-flex align-items-center gap-2 px-6 py-2 rounded-lg"
            style={{
              backgroundColor: "#F56D2D",
              color: "#fff",
              fontWeight: "400",
              fontSize: "15px",
              fontFamily: "BasisGrotesquePro",
              border: "none"
            }}
          >
            <SaveIcon />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Security;
