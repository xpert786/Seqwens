import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { BsCameraVideo } from "react-icons/bs";
import { DateIcon, AwaitingIcon, MobileIcon, PersonIcon, DiscusIcon, EditIcon, DeleteIcon, AppoinIcon, MonthIcon, ZoomIcon, EsternTimeIcon, CrossIcon } from "../components/icons";
import "../styles/Icon.css"
import "../styles/fonts.css"
export default function Appointments() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [highlightBox, setHighlightBox] = useState(null);


  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  const times = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
  ]
  const [appointments] = useState({
    upcoming: [
      {
        id: 1,
        title: "Quarterly Planning Session",
        status: "Confirmed",
        date: "Mar 15 2025",
        time: "9:00 AM - 10:00 AM",
        person: "Sarah Johnson",
        description: "Discuss Q2 2025 tax planning strategies",
        type: "Zoom Meeting",
        joinable: true,
      },
      {
        id: 2,
        title: "Tax Return Review",
        status: "Confirmed",
        date: "Mar 22 2025",
        time: "2:00 PM - 3:00 PM",
        person: "Sarah Johnson",
        description: "Review and finalize 2025 tax return",
        type: "Zoom Meeting",
      },
      {
        id: 3,
        title: "Document Review",
        status: "Pending",
        date: "Mar 30 2025",
        time: "9:00 AM - 9:30 AM",
        person: "John Smith",
        description: "Quick review of uploaded documents",
        type: "Zoom Meeting",
      },
    ],
    past: [
      {
        id: 4,
        title: "Initial Tax Consultation",
        status: "Complete",
        date: "Feb 05 2025",
        time: "10:00 AM - 11:00 AM",
        person: "Sarah Johnson",
        description: "Initial consultation for 2025 tax preparation",
        type: "Zoom Meeting",
      },
      {
        id: 5,
        title: "Business Tax Discussion",
        status: "Complete",
        date: "Feb 15 2025",
        time: "1:00 PM - 2:00 PM",
        person: "John Smith",
        description: "Discussion about business deductions and expenses",
        type: "Zoom Meeting",
      },
    ],
  });

  return (
    <div className="px-4" >

      <div className="d-flex justify-content-between align-items-center mb-2">

        <div className="align-items-center mb-3 ">
          <h5
            className="mb-0 me-3"
            style={{
              color: "#3B4A66",
              fontSize: "28px",
              fontWeight: "500",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Appointments
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
            Schedule and manage your meetings
          </p>
        </div>

        <button
          className="btn d-flex align-items-center"
          style={{ background: "#F56D2D", color: "#fff" }}
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="me-2" /> Schedule Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="d-flex gap-3 mb-4">
        <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }} >Next Appointment</small>
            <AppoinIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
          </div>
          <h6 className="mb-0 " style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "500", }}>Mar 15</h6>
          <small style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "400", }}>10:00 AM</small>
        </div>

        <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>This Month</small>
            <MonthIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
          </div>
          <h6 className="mb-0" style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>3</h6>
          <small style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>Appointments</small>
        </div>

        <div className="bg-white rounded shadow-sm p-3 flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small style={{ color: "#4B5563", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Total Hours</small>
            <AwaitingIcon style={{ width: "18px", height: "18px", color: "#3B4A66" }} />
          </div>
          <h6 className="mb-0" style={{ fontFamily: "BasisGrotesquePro", color: "#3B4A66", fontSize: "14px", fontWeight: "500", }}>4.5</h6>
          <small style={{ fontFamily: "BasisGrotesquePro", color: "#4B5563", fontSize: "14px", fontWeight: "400", }}>This month</small>
        </div>
      </div>


      {/* Appointment Lists */}
      <div className="d-flex gap-4 flex-wrap">

        <div className="bg-white rounded shadow-sm p-3 flex-grow-1" style={{ minWidth: "350px" }}>

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
              Upcoming Appointments
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
              Your Scheduled meetings
            </p>
          </div>

          {appointments.upcoming.map((appt) => (
            <div
              key={appt.id}
              className="border rounded p-3 mb-3 mt-3"
              onClick={() => setSelectedAppointmentId(appt.id)}
              style={{
                cursor: "pointer",
                backgroundColor: selectedAppointmentId === appt.id ? "#FFF4E6" : "white",
              }}
            >


              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2" style={{ fontFamily: "BasisGrotesquePro" }}>
                  <strong>{appt.title}</strong>


                  <span
                    className="px-1 py-1 fw-semibold"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      fontFamily: "BasisGrotesquePro",
                      backgroundColor:
                        appt.status === "Confirmed"
                          ? "#DCFCE7"
                          : appt.status === "Pending"
                            ? "#FEF9C3"
                            : "#E0E7FF",
                      borderRadius: "30px",
                      color:
                        appt.status === "Confirmed"
                          ? "#166534"
                          : appt.status === "Pending"
                            ? "#92400E"
                            : "#3730A3",
                    }}
                  >
                    {appt.status}
                  </span>

                </div>

                {/* Edit & Delete buttons */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "30%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3B4A66",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    onClick={() => console.log("Edit clicked")}
                  >
                    <EditIcon style={{ width: "16px", height: "16px" }} />
                  </button>

                  <button
                    className="btn btn-sm ms-2"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#991B1B",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                    onClick={() => console.log("Delete clicked")}
                  >
                    <DeleteIcon style={{ width: "16px", height: "16px" }} />
                  </button>

                </div>
              </div>


              {/* Date, Time, Type in one line */}
              <div className="small text-muted d-flex align-items-center mb-2" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DateIcon className="me-1 text-primary" /> {appt.date}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><AwaitingIcon className="text-success" />{appt.time}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><MobileIcon className="me-1 text-info" /> {appt.type}</span>
              </div>


              <div className="small text-muted d-flex align-items-center" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><PersonIcon className="me-1 text-primary" />{appt.person}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DiscusIcon className="me-1 text-primary" />{appt.description}</span>
              </div>

              {/* Join button if available */}
              {appt.joinable && (
                <button
                  className="btn w-100 mt-3"
                  style={{ background: "#F56D2D", color: "#fff" }}
                >
                  <BsCameraVideo className="me-2" /> Join Meeting
                </button>
              )}
            </div>
          ))}
        </div>


        {/* Past */}
        <div className="bg-white rounded shadow-sm p-3 flex-grow-1" style={{ minWidth: "350px" }}>

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
              Past Appointments
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
              Your Scheduled meetings
            </p>
          </div>


          {appointments.past.map((appt) => (
            <div
              key={appt.id}
              className="border rounded p-3 mb-3 mt-3"
              onClick={() => setSelectedAppointmentId(appt.id)}
              style={{
                cursor: "pointer",
                backgroundColor: selectedAppointmentId === appt.id ? "#FFF4E6" : "white",
              }}
            >


              <div className="d-flex align-items-center gap-2 mb-2">
                <strong>{appt.title}</strong>
                <span
                  className="px-2 py-1 small fw-semibold"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor:
                      appt.status === "Completed"
                        ? "#DCFCE7"
                        : appt.status === "Cancelled"
                          ? "#FEE2E2"
                          : "#E0E7FF",
                    borderRadius: "30px",
                    color:
                      appt.status === "Completed"
                        ? "#166534"
                        : appt.status === "Cancelled"
                          ? "#991B1B"
                          : "#3730A3",
                  }}
                >
                  {appt.status}
                </span>
              </div>


              <div className="small text-muted d-flex align-items-center mb-2" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DateIcon className="me-1 text-primary" /> {appt.date}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><AwaitingIcon className="text-success" />{appt.time}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><MobileIcon className="me-1 text-info" /> {appt.type}</span>
              </div>


              <div className="small text-muted d-flex align-items-center" style={{ gap: "15px", fontFamily: "BasisGrotesquePro" }}>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><PersonIcon className="me-1 text-primary" />{appt.person}</span>
                <span className="d-flex align-items-center small-icon" style={{ gap: "8px" }}><DiscusIcon className="me-1 text-primary" />{appt.description}</span>
              </div>
            </div>
          ))}
        </div>

      </div>




      {/* ---------- Custom Modal Popup ---------- */}
      {showModal && (
        <div className="custom-popup-overlay">
          <div className="custom-popup-container">
            {/* Header */}
            <div className="popup-header">
              <div className="popup-header-top">
                <h5 className="popup-title">Schedule New Appointment</h5>
                <button onClick={() => setShowModal(false)} className="popup-close-btn">
                  <CrossIcon />
                </button>
              </div>
              <p className="popup-subtitle">Schedule a meeting with your tax professional</p>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="popup-body">
                {(selectedBox
                  ? [
                    {
                      id: selectedBox,
                      ...[
                        {
                          id: 1,
                          icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                          title: "Schedule a free Phone call with Sarah Johnson",
                          desc: "Use this to schedule 30 minute phone call meeting",
                        },
                        {
                          id: 2,
                          icon: <span className="icon-custom"><ZoomIcon /></span>,
                          title: "Schedule a free Zoom call with John Smith",
                          desc: "Use this to schedule 1 hour long zoom meeting",
                        },
                        {
                          id: 3,
                          icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                          title: "Schedule a free Phone call with Sarah Johnson",
                          desc: "Use this to schedule 30 minute phone call meeting",
                        },
                      ].find((opt) => opt.id === selectedBox),
                    },
                  ]
                  : [
                    {
                      id: 1,
                      icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                      title: "Schedule a free Phone call with Sarah Johnson",
                      desc: "Use this to schedule 30 minute phone call meeting",
                    },
                    {
                      id: 2,
                      icon: <span className="icon-custom"><ZoomIcon /></span>,
                      title: "Schedule a free Zoom call with John Smith",
                      desc: "Use this to schedule 1 hour long zoom meeting",
                    },
                    {
                      id: 3,
                      icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                      title: "Schedule a free Phone call with Sarah Johnson",
                      desc: "Use this to schedule 30 minute phone call meeting",
                    },
                  ]
                ).map((option) => (
                  <div key={option.id} className="option-box">
                    <div
                      onClick={() => setHighlightBox(highlightBox === option.id ? null : option.id)}
                      className={`info  ${highlightBox === option.id ? "active" : ""}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2 align-items-start">
                          <span>{option.icon}</span>
                          <div>
                            <strong className="option-title">{option.title}</strong>
                            <p className="option-desc">{option.desc}</p>
                          </div>
                        </div>

                        {selectedBox !== option.id && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBox(option.id);
                            }}
                            className="arrow-icon"
                          >
                            ›
                          </span>
                        )}
                      </div>

                      {selectedBox === option.id && (
                        <div className="mt-3">
                          <button className="btn schedule-btn d-flex align-items-center gap-2">
                            <span className="d-flex align-items-center small-icon">
                              <AwaitingIcon className="text-success" />
                            </span>
                            <span className="schedule-time">30 min</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedBox === option.id && (
                      <>
                        <div className="selection-box">
                          <div className="row">
                            <div className="col-7">
                              <h6 className="selection-title">Select a date</h6>
                              <div className="calendar-grid">
                                {dates.map((day) => (
                                  <button
                                    key={day}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDate(day);
                                    }}
                                    className={`calendar-btn ${selectedDate === day ? "active" : ""
                                      }`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="col-5">
                              <h6 className="selection-title">Select a time</h6>
                              <div className={`time-list ${selectedTime ? "clicked" : ""}`}>
                                {times.map((time) => (
                                  <button
                                    key={time}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTime(time);
                                    }}
                                    className={`time-btn ${selectedTime === time ? "active" : ""}`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>

                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBox(null);
                            }}
                            className="btn btn-secondary"
                          >
                            Back
                          </button>
                          <button
                            disabled={!selectedDate || !selectedTime}
                            onClick={() => setStep(2)}
                            className="nex-btn"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}


            {/* Step 2 : Subject of Meeting */}
            {step === 2 && (
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  {/* LEFT CARD : Schedule Details */}
                  <div
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#fff",
                      fontFamily: "BasisGrotesquePro"
                    }}
                  >
                    {/* Selected Appointment Info */}
                    {[
                      {
                        id: 1,
                        icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                        title: "Schedule a free Phone call with Sarah Johnson",
                        desc: "Use this to schedule 30 minute phone call meeting",
                      },
                      {
                        id: 2,
                        icon: <span className="icon-custom"><ZoomIcon /></span>,
                        title: "Schedule a free Zoom call with John Smith",
                        desc: "Use this to schedule 1 hour long zoom meeting",
                      },
                      {
                        id: 3,
                        icon: <span className="mobile-icon-custom"><MobileIcon /></span>,
                        title: "Schedule a free Phone call with Sarah Johnson",
                        desc: "Use this to schedule 30 minute phone call meeting",
                      },
                    ]
                      .filter((opt) => opt.id === selectedBox)
                      .map((selectedOpt) => (
                        <div key={selectedOpt.id} style={{ fontFamily: "BasisGrotesquePro" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <span>{selectedOpt.icon}</span>
                            <div>
                              <h6
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  fontFamily: "BasisGrotesquePro",
                                  marginBottom: "4px",
                                  color: "#3B4A66",
                                }}
                              >
                                {selectedOpt.title}
                              </h6>
                              <p
                                style={{
                                  fontSize: "13px",
                                  fontFamily: "BasisGrotesquePro",
                                  color: "#4B5563",
                                  marginBottom: "10px",
                                  fontWeight: "400"
                                }}
                              >
                                {selectedOpt.desc}
                              </p>
                              <button
                                style={{
                                  background: "#E8F0FF",
                                  color: "#374151",
                                  padding: "7px 14px",
                                  borderRadius: "12px",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  fontFamily: "BasisGrotesquePro",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span className="d-flex align-items-center small-icon"><AwaitingIcon className="text-success" /></span>
                                <span style={{ fontSize: "15px", color: "#4B5563", fontWeight: "400" }}>
                                  30 min
                                </span>
                              </button>
                            </div>
                          </div>


                          <div
                            style={{
                              marginTop: "15px",
                              fontFamily: "BasisGrotesquePro",
                              marginLeft: "20px",
                            }}
                          >

                            <p
                              style={{
                                fontSize: "13px",
                                margin: "6px 0",
                                color: "#6B7280",
                                fontFamily: "BasisGrotesquePro",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="d-flex align-items-center small-icon"><AwaitingIcon className="text-success" /></span>
                              {selectedDate} June 2025 {selectedTime}
                            </p>


                            <p
                              style={{
                                fontSize: "13px",
                                margin: "4px 0",
                                color: "#6B7280",
                                fontFamily: "BasisGrotesquePro",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <EsternTimeIcon />
                              Eastern Time - US & Canada (2:12 pm)
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>


                  <div
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "15px",
                      background: "#fff",
                    }}
                  >
                    <h6
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3B4A66",
                        fontFamily: "BasisGrotesquePro",
                        marginBottom: "10px",
                      }}
                    >
                      Subject of Meeting
                    </h6>
                    <textarea
                      placeholder="Write meeting subject (e.g., Tax Return Review)"
                      style={{
                        width: "100%",
                        minHeight: "80px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "6px",
                        padding: "8px",
                        fontSize: "13px",
                        fontFamily: "BasisGrotesquePro",
                      }}
                    ></textarea>
                  </div>
                </div>


                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      background: "#E5E7EB",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      background: "#F56D2D",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
