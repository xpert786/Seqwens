import React from "react";
import { useSearchParams } from "react-router-dom";
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlinePhone, AiOutlineUser, AiOutlineFileText } from "react-icons/ai";
import { Clocking,MiniClock, Docs, DownloadIcon,Calender, Paid,PhoneMiniIcon,MiniDocument, Paiding, EyeSquareIcon, FiltIcon, Clock, MiniContact } from "../../component/icons";
import { FaSearch } from "react-icons/fa";
export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const isScheduleView = searchParams.get("view") === "schedule";
  // Summary cards data
  const summary = [
    { label: "Total Invoices", value: 4, icon: <Docs /> },
    { label: "Paid Total", value: "$ 85,000", icon: <Paid /> },
    { label: "Outstanding Total", value: "$25,000", icon: <Clocking /> },
    { label: "Overdue Total", value: "$10,000", icon: <Paiding /> },
  ];

  // Schedule items data (sample)
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

  // Paid invoices data
  const invoices = [
    {
      id: "INV-2023-012",
      status: "paid",
      title: "2023 Tax Return Preparation",
      date: "Paid Feb 18, 2024",
      method: "Method: Credit Card",
      amount: "$650.00",
      highlight: true,
    },
    {
      id: "INV-2023-011",
      status: "paid",
      title: "Business Tax Planning Session",
      date: "Paid Jun 10, 2024",
      method: "Method: Bank Transfer",
      amount: "$300.00",
    },
    {
      id: "INV-2023-010",
      status: "paid",
      title: "Q4 2023 Bookkeeping Review",
      date: "Paid Dec 28, 2023",
      method: "Method: Credit Card",
      amount: "$450.00",
    },
  ];

  return (
    <div className="mt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((s, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-4 h-28"
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              
            }}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--Palette2-Dark-blue-100, #E8F0FF)" }}
                >
                  <div className="text-lg">{s.icon}</div>
                </div>

                <div
                  className="text-lg font-semibold"
                  style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}
                >
                  {s.value}
                </div>
              </div>

              <div className="mt-4 text-sm" style={{ color: "#6B7280" }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

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
      {/* Bottom content switches by query param: ?view=schedule */}
      <div className="bg-white rounded-xl mt-6 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
              {isScheduleView ? "Upcoming Appointments" : "Paid Invoices"}
            </div>
            <div className="text-xs text-gray-500">
              {isScheduleView ? "Your scheduled meetings" : "Your payment history"}
            </div>
          </div>
        </div>

        {isScheduleView ? (
          <div className="mt-4 flex flex-col gap-3">
            {scheduleItems.map((it) => {
              const isConfirmed = it.status === "confirmed";
              const badgeStyle = isConfirmed
                ? { background: "#DCFCE7", color: "#166534", border: "0.5px solid #166534" }
                : { background: "#FEF9C3", color: "#854D0E", border: "0.5px solid #854D0E" };
              return (
                <div
                  key={it.id}
                  className="rounded-xl p-4 border"
                  style={{
                    background: it.highlight ? "var(--Palette2-Gold-200, #FFF4E6)" : "#FFFFFF",
                    borderColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                  }}
                >
                  {/* Heading with inline status badge on the left (not right) */}
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>{it.title}</div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={badgeStyle}
                    >
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
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={"rounded-xl p-4 border flex items-center justify-between"}
                style={{
                  background: inv.highlight ? "var(--Palette2-Gold-200, #FFF4E6)" : "#FFFFFF",
                  borderColor: inv.highlight ? "var(--Palette2-Gold-800, #F49C2D)" : "var(--Palette2-Dark-blue-100, #E8F0FF)",
                  borderWidth: inv.highlight ? "0.5px" : "1px",
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>{inv.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600">paid</span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>{inv.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{inv.date} <span className="hidden md:inline"> {inv.method}</span></div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Paid Invoice:</div>
                    <div className="text-orange-500 font-semibold text-lg">{inv.amount}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-0 bg-transparent" title="View">
                      <EyeSquareIcon />
                    </button>
                    <button className="p-0 bg-transparent" title="Download">
                      <DownloadIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
