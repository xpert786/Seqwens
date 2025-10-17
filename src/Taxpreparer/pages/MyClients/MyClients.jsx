import React, { useState,useRef,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { AwaitingIcon, CompletedIcon, Dot, DoubleUserIcon, FaildIcon, FiltIcon, Phone } from "../../component/icons";
import "../../styles/MyClients.css";

export default function MyClients() {
     const [openDropdown, setOpenDropdown] = useState(null);
     const dropdownRefs = useRef({});
     const navigate = useNavigate();

useEffect(() => {
  const handleClickOutside = (event) => {
    for (let id in dropdownRefs.current) {
      if (dropdownRefs.current[id] && !dropdownRefs.current[id].contains(event.target)) {
        setOpenDropdown(null);
      }
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  const clients = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High Priority", "High Priority", "Tax Season"],
      tasks: 3,
      documents: 8,
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "(555) 123-4567",
      statuses: ["Pending", "Medium", "New Client"],
      tasks: 0,
      documents: 0,
    },
    {
      id: 3,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "Medium", "Client"],
      tasks: 2,
      documents: 1,
    },
    {
      id: 4,
      name: "Mike Johnson",
      email: "mike@abccorp.com",
      phone: "(555) 123-4567",
      statuses: ["Active", "High", "Business", "Quarterly"],
      tasks: 5,
      documents: 12,
      due: "3/31/2024",
    },
  ];

  const cardData = [
    { label: "Total Clients", icon: <DoubleUserIcon />, count: clients.length, color: "#00bcd4" },
    { label: "Active", icon: <CompletedIcon />, count: clients.filter(c => c.statuses.includes("Active")).length, color: "#4caf50" },
    { label: "Pending", icon: <AwaitingIcon />, count: clients.filter(c => c.statuses.includes("Pending")).length, color: "#3f51b5" },
    { label: "High Priority", icon: <FaildIcon />, count: clients.filter(c => c.statuses.includes("High Priority")).length, color: "#EF4444" },
  ];

  const getBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "badge-active";
      case "pending":
      case "medium": // medium ko pending jaisa banaya
        return "badge-pending";
      case "high priority": // sirf ye hi red hoga
        return "badge-higher";
      default:
        return "badge-default";
    }
  };

  return (
    <div className="myclients-container">
      {/* Header */}
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold">My Clients</h3>
          <small className="text-muted">Manage your assigned clients</small>
        </div>
        <span className="badge bg-light text-dark p-2">{clients.length} clients</span>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {cardData.map((item, index) => (
          <div className="col-md-3 col-sm-6" key={index}>
            <div className="stat-card ">
              <div className="d-flex justify-content-between align-items-center">
                <div className="stat-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <div className="stat-count">{item.count}</div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
{/* Search / Filter */}
      <div className="d-flex align-items-center gap-2 mb-3 mt-3" >
             <div className="position-relative search-box" >
               <FaSearch className="search-icon" />
               <input type="text" className="form-control ps-5 rounded mt-2" placeholder="Search.." style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              
            }} />
             </div>
     
             <button className="btn btn-filter d-flex align-items-center rounded px-4" style={{
              border: "none",
              
            }}>
               <FiltIcon className="me-3 text-muted" />
               <span className="ms-1">Filter</span>
             </button>
           </div>

      {/* Client List Card */}
      <div className="card client-list-card p-3"style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
            }}>
        <h6 className="fw-semibold mb-3">Client List</h6>
        <div className="mb-3">All clients assigned to you</div>
         <div className="row g-3">
      {clients.map((client) => (
        <div key={client.id} className="col-md-6 col-12">
          <div 
            className="card client-card" 
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)"
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              
              {/* Left */}
              <div className="d-flex gap-3">
                <div className="client-initials">
                  {client.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h6 className="mb-1 fw-semibold">{client.name}</h6>
                  <div className="client-contact-info">
                    <small className="text-muted client-email">
                      {client.email}
                    </small>
                    <small className="text-muted client-phone">
                      <Phone /> {client.phone}
                    </small>
                  </div>
                  <div className="mt-1 d-flex flex-wrap gap-2">
                    {client.statuses.map((status, i) => (
                      <span key={i} className={`badge ${getBadgeStyle(status)}`}>
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Info + Dot Dropdown */}
              <div className="info-row">
                <div className="info-left">
                  <span className="info-item">{client.tasks} pending tasks</span>
                  <span className="info-item">{client.documents} documents</span>
                </div>
                <div className="info-right">
                  <div
                    className="dot-container"
                    ref={el => dropdownRefs.current[client.id] = el}
                    onClick={() =>
                      setOpenDropdown(openDropdown === client.id ? null : client.id)
                    }
                  >
                    <Dot />
                    {openDropdown === client.id && (
                      <ul className="dot-dropdown">
                        <li onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/taxdashboard/clients/${client.id}`, { state: { client } }); }}>View Details</li>
                        <li>View Tasks</li>
                        <li>Documents</li>
                        <li>Send Message</li>
                        <li>Schedule Meeting</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
      </div>
    </div>
  );
}
