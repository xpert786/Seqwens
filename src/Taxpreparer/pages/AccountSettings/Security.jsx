import { useState, useEffect } from "react";
import "../../styles/icon.css";
import { SaveIcon } from "../../component/icons";

const Security = ({ security, onUpdate }) => {
  const [twoFactor, setTwoFactor] = useState(security?.two_factor_authentication ?? false);
  const [sessionTimeout, setSessionTimeout] = useState(security?.session_timeout ?? 30);
  const [isEmailVerified, setIsEmailVerified] = useState(security?.is_email_verified ?? false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(security?.is_phone_verified ?? false);

  // Update state when security prop changes
  useEffect(() => {
    if (security) {
      setTwoFactor(security.two_factor_authentication ?? false);
      setSessionTimeout(security.session_timeout ?? 30);
      setIsEmailVerified(security.is_email_verified ?? false);
      setIsPhoneVerified(security.is_phone_verified ?? false);
    }
  }, [security]);

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log('Security settings:', {
      two_factor_authentication: twoFactor,
      session_timeout: sessionTimeout,
      is_email_verified: isEmailVerified,
      is_phone_verified: isPhoneVerified
    });
    if (onUpdate) {
      onUpdate();
    }
  };

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

        {/* Two-Factor Authentication */}
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
            Session Timeout
            {security?.session_timeout_display && (
              <span className="text-muted ms-2" style={{ fontSize: "14px", fontWeight: "400" }}>
                (Current: {security.session_timeout_display})
              </span>
            )}
          </label>
          <select
            id="sessionTimeout"
            className="form-select"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(Number(e.target.value))}
            style={{
              maxWidth: "300px",
              borderRadius: "8px",
              fontFamily: "BasisGrotesquePro",
              border: "1px solid #E8F0FF",
              padding: "8px 12px"
            }}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Verification Status */}
        <div className="py-3 border-top border-bottom" style={{ borderColor: "#E8F0FF" }}>
          <div className="mb-2">
            <label
              style={{
                color: "#3B4A66",
                fontSize: "16px",
                fontWeight: "500",
                fontFamily: "BasisGrotesquePro",
                marginBottom: "12px",
                display: "block"
              }}
            >
              Account Verification Status
            </label>
          </div>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between">
              <span style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}>
                Email Verification
              </span>
              <span className={`badge ${isEmailVerified ? 'bg-success' : 'bg-warning'}`} style={{
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
                padding: "4px 8px"
              }}>
                {isEmailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <span style={{
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "400",
                fontFamily: "BasisGrotesquePro",
              }}>
                Phone Verification
              </span>
              <span className={`badge ${isPhoneVerified ? 'bg-success' : 'bg-warning'}`} style={{
                fontSize: "12px",
                fontFamily: "BasisGrotesquePro",
                padding: "4px 8px"
              }}>
                {isPhoneVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
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
            onClick={handleSave}
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
