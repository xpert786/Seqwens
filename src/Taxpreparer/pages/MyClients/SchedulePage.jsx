import React from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Calender, MiniClock, PhoneMiniIcon, MiniDocument, MiniContact, FiltIcon } from "../../component/icons";

export default function SchedulePage() {
  // Mock schedule items (can be replaced with API data)
  const scheduleItems = [
    {
      id: "SCH-2024-021",
      title: "Quarterly Planning Session",
      date: "Mar 15, 2024",
      time: "10:00 AM - 11:00 AM",
      method: "Zoom Meeting",
      status: "confirmed",
      person: "Sarah Johnson",
      highlight: true,
      note: "Discuss Q1 2024 tax planning strategies",
    },
    {
      id: "SCH-2024-025",
      title: "Tax Return Review",
      date: "Mar 22, 2024",
      time: "2:00 PM - 3:00 PM",
      method: "Zoom Meeting",
      status: "confirmed",
      person: "Sarah Johnson",
      note: "Review and finalize 2023 tax return",
    },
    {
      id: "SCH-2024-028",
      title: "Document Review",
      date: "Mar 28, 2024",
      time: "9:00 AM - 9:30 AM",
      method: "Zoom Meeting",
      status: "pending",
      person: "John Smith",
      note: "Quick review of uploaded documents",
    },
  ];

  const navigate = useNavigate();

  const handleCardClick = (item) => {
    // Navigate to AllDocumentsPage when a card is clicked
    navigate("/taxdashboard/documents/all");
  };

  return (
    <>
      {/* Search and Filter */}
      <div className="d-flex align-items-center gap-2 mb-3 mt-3">
        <div className="position-relative search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            className="form-control ps-5 rounded mt-2" 
            placeholder="Search.." 
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
            }} 
          />
        </div>
        
        <button 
          className="btn btn-filter d-flex align-items-center rounded px-4" 
          style={{
            border: "none",
          }}
        >
          <FiltIcon className="me-3 text-muted" />
          <span className="ms-1">Filter</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl mt-6 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              Upcoming Appointments
            </div>
            <div className="text-xs text-gray-500">Your scheduled meetings</div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {scheduleItems.map((it) => {
            const isConfirmed = it.status === "confirmed";
            const badgeStyle = isConfirmed
              ? { background: "#DCFCE7", color: "#166534", border: "0.5px solid #166534" }
              : { background: "#FEF9C3", color: "#854D0E", border: "0.5px solid #854D0E" };
            
            return (
              <div
                key={it.id}
                className="rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  background: it.highlight ? "var(--Palette2-Gold-200, #FFF4E6)" : "#FFFFFF",
                  borderColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                }}
                onClick={() => handleCardClick(it)}
              >
              {/* Heading with inline status badge */}
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>{it.title}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={badgeStyle}>
                  {isConfirmed ? "confirmed" : "pending"}
                </span>
              </div>

              {/* Details with icons */}
              <div className="mt-2 text-xs text-gray-600">
                {/* Row 1: date, time, method in one line */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Calender />
                    <span>{it.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MiniClock />
                    <span>{it.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <PhoneMiniIcon />
                    <span>{it.method}</span>
                  </span>
                </div>
                {/* Row 2: person and note on same line */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center gap-1">
                    <MiniContact />
                    <span>With: {it.person}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MiniDocument />
                    <span>{it.note}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
