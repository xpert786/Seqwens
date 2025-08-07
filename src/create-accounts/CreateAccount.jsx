import React from "react";
import "../styles/CreateAccount.css";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";




const CreateAccount = () => {
  return (
    <div className="create-account-page d-flex align-items-center justify-content-center vh-100 position-relative">
      <img
        src={logo}
        alt="Logo"
        style={{
          position: 'absolute',
          top: '20px',
          left: '80px',
          height: '50px',
          objectFit: 'contain',
        }}
      />

      <div
        className="outer-container text-white p-5 shadow w-75"
        style={{ maxWidth: '900px', borderRadius: '25px', background: 'var(--Palette2-Dark-blue-900, #3B4A66)' }}
      >
        <h2 className="mb-1" style={{
          fontFamily: "'BasisGrotesquePro'",
          color: "var(--White-900, #FFFFFF)",
          fontWeight: "700",
          fontSize: "34px",
        }}>Create Your Account</h2>

        <p
          className="mb-0"
          style={{
            fontFamily: "BasisGrotesquePro",
            color: " #FFFFFF)",
            fontWeight: "400",
            fontSize: "22px"

          }}
        >
          Start your return by creating a secure account.
        </p>


        <div className="inner-box bg-white text-dark rounded-4 p-4" style={{ marginTop: "30px" }}>
          <form>
            <div className="row mb-3">
              <div className="col">
                <label
                  className="form-label"
                  style={{ fontSize: "17px", fontWeight: "400", color: "#3B4A66", fontFamily: "BasisGrotesquePro" }}
                >
                  First Name <span style={{ color: "#EF4444" }}>*</span>
                </label>

                <input type="text" className="form-control rounded-3" placeholder="Enter Your First Name" style={{ fontFamily: "BasisGrotesquePro",  border: "1px solid #4B5563", boxShadow: "none"  }} />
              </div>
              <div className="col">
                <label className="form-label" style={{ fontSize: "17px", fontWeight: "400", color: "#3B4A66", fontFamily: "BasisGrotesquePro", }}>Middle Initial</label>
                <input type="text" className="form-control rounded-3" placeholder="Enter middle initial" style={{ fontFamily: "BasisGrotesquePro", border: "1px solid #4B5563", boxShadow: "none"  }} />
              </div>
              <div className="col">
                <label className="form-label" style={{ fontSize: "17px", fontWeight: "400", color: "#3B4A66", fontFamily: "BasisGrotesquePro", }}>Last Name <span style={{ color: "#EF4444" }}>*</span></label>
                <input type="text" className="form-control rounded-3" placeholder="Enter Your Last Name" style={{ fontFamily: "BasisGrotesquePro", border: "1px solid #4B5563", boxShadow: "none"  }} />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontSize: "17px", fontWeight: "400", color: "#3B4A66", fontFamily: "BasisGrotesquePro", }}>Email <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="email" className="form-control rounded-3" placeholder="abc@gmail.com" style={{ fontFamily: "BasisGrotesquePro", border: "1px solid #4B5563", boxShadow: "none"  }} />
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: "17px", fontWeight: "400", color: "#3B4A66", fontFamily: "BasisGrotesquePro", }}>Phone Number <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="tel" className="form-control rounded-3" placeholder="+01" style={{ fontFamily: "BasisGrotesquePro",  border: "1px solid #4B5563", boxShadow: "none" }} />
            </div>
          </form>
        </div>
        <Link to="/personal-info" className="text-decoration-none">
          <button
            type="button"
            className="btn w-40 text-white rounded-3"
            style={{ backgroundColor: "#F56D2D", fontFamily: "BasisGrotesquePro", marginTop: "30px", fontSize: "17px", fontWeight: "600" }}
          >
            Continue
          </button>
        </Link>

      </div>
    </div>



  );
};

export default CreateAccount;
