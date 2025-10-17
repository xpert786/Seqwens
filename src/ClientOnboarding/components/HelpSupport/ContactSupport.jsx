import React from "react";
import { EmailsIcon, LiveIcon, MobileIcon, TicketIcon } from "../icons"

const ContactSupport = () => {
  return (
    <div
    >


      {/* Top 3 Support Cards */}
      <div className="row g-3 mb-4">
        {/* Email Support */}
        <div className="col-md-4">
          <div className="p-3 rounded-4  text-center h-100" style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <EmailsIcon />
            </div>
            <h6 className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Email Support</h6>
            <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Get help via email within 24 hours</p>
            <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>support@smithcpa.com</p>
            <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Support 24/7</p>
          </div>
        </div>

        {/* Phone Support */}
        <div className="col-md-4">
          <div className="p-3 rounded-4  text-center h-100 " style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <MobileIcon />
            </div>
            <h6 className=" mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Phone Support</h6>
            <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Speak directly with our support team</p>
            <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>+01 (555) 123-4567</p>
            <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Mon-Fri 9AM-6PM</p>
          </div>
        </div>

        {/* Live Chat */}
        <div className="col-md-4">
          <div className="p-3 rounded-4 text-center h-100" style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
            <div className="fs-2 mb-2 text-primary">
              <LiveIcon />
            </div>
            <h6 className="fw-semibold mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Live Chat</h6>
            <p className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Chat with a support representative</p>
            <p className="mb-0" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Available in portal</p>
            <p style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "13px", color: "#4B5563" }}>Mon-Fri 9AM-6PM</p>
          </div>
        </div>
      </div>

      {/* Support Ticket Form */}
      <div className="p-4 rounded-4 " style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF" }}>
        <h6 className="mb-1" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "18px", color: "#3B4A66" }}>Submit A Support Ticket</h6>
        <p className="mb-4" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#4B5563" }}>Can’t find what you're looking for? Send us a message</p>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Subject</label>
            <input
              type="text"
              placeholder="Enter Subject"
              className="form-control rounded-3 border-light-subtle"
              style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66" }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label " style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Category</label>
            <select
              className="form-select rounded-3 border-light-subtle"
              style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66", height: "45px", }}
            >
              <option >Select Category</option>
              <option>Billing</option>
              <option>Technical</option>
              <option>Account</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Priority</label>
            <select
              className="form-select rounded-3 border-light-subtle"
              style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66", height: "45px", }}
            >
              <option>Select Priority</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="col-md-12">
            <label className="form-label" style={{ fontFamily: "BasisGrotesquePro", fontWeight: "500", fontSize: "15px", color: "#3B4A66" }}>Description</label>
            <textarea
              rows="4"
              className="form-control rounded-3 border-light-subtle"
              placeholder="Please provide detailed information about your issue..."
              style={{ fontFamily: "BasisGrotesquePro", fontWeight: "400", fontSize: "12px", color: "#3B4A66" }}
            ></textarea>
          </div>
        </div>

        <button
          className="btn text-white d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#F56D2D",
            fontSize: "14px",
            padding: "10px 20px",
            borderRadius: "8px"
          }}
        >
          <TicketIcon /> Submit Ticket
        </button>
      </div>

    </div>
  );
};

export default ContactSupport;
