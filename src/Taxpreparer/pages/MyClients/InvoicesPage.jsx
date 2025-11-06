import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlinePhone, AiOutlineUser, AiOutlineFileText } from "react-icons/ai";
import { Clocking,MiniClock, Docs, DownloadIcon,Calender, Paid,PhoneMiniIcon,MiniDocument, Paiding, EyeSquareIcon, FiltIcon, Clock, MiniContact } from "../../component/icons";
import { FaSearch } from "react-icons/fa";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const { clientId } = useParams();
  const isScheduleView = searchParams.get("view") === "schedule";
  
  // API state
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [summary, setSummary] = useState({
    total_invoices: 0,
    paid_invoices_count: 0,
    paid_total: 0,
    outstanding_total: 0,
    overdue_total: 0
  });
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch paid invoices from API (only if clientId is available)
  const fetchPaidInvoices = async () => {
    if (!clientId) {
      // If no clientId, use default summary values
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${clientId}/invoices/paid/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching paid invoices from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Paid invoices API response:', result);

      if (result.success && result.data) {
        setPaidInvoices(result.data.paid_invoices || []);
        setSummary(result.data.summary || {
          total_invoices: 0,
          paid_invoices_count: 0,
          paid_total: 0,
          outstanding_total: 0,
          overdue_total: 0
        });
        setClientInfo(result.data.client || null);
      } else {
        throw new Error(result.message || 'Failed to fetch paid invoices');
      }
    } catch (error) {
      console.error('Error fetching paid invoices:', error);
      setError(handleAPIError(error));
      setPaidInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && !isScheduleView) {
      fetchPaidInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, isScheduleView, searchQuery]);

  // Format currency - handles both string and number amounts
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Summary cards data - use API data if available, otherwise use defaults
  const summaryCards = [
    { label: "Total Invoices", value: clientId ? summary.total_invoices : 4, icon: <Docs /> },
    { label: "Paid Total", value: clientId ? formatCurrency(summary.paid_total) : "$ 85,000", icon: <Paid /> },
    { label: "Outstanding Total", value: clientId ? formatCurrency(summary.outstanding_total) : "$25,000", icon: <Clocking /> },
    { label: "Overdue Total", value: clientId ? formatCurrency(summary.overdue_total) : "$10,000", icon: <Paiding /> },
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

  // Filter invoices based on search query
  const filteredInvoices = clientId 
    ? paidInvoices.filter(invoice => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          invoice.invoice_number?.toLowerCase().includes(query) ||
          invoice.description?.toLowerCase().includes(query) ||
          invoice.payment_method?.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="mt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s, idx) => (
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
             <div className="position-relative search-box flex-grow-1" >
               <FaSearch className="search-icon" />
               <input 
                 type="text" 
                 className="form-control ps-5 rounded mt-2" 
                 placeholder="Search invoices..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{
                   border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                 }} 
               />
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
              {isScheduleView 
                ? "Upcoming Appointments" 
                : clientId 
                  ? (clientInfo?.name ? `${clientInfo.name}'s Paid Invoices` : "Paid Invoices")
                  : "Paid Invoices"}
            </div>
            <div className="text-xs text-gray-500">
              {isScheduleView 
                ? "Your scheduled meetings" 
                : clientId 
                  ? `${filteredInvoices.length} ${filteredInvoices.length === 1 ? 'invoice' : 'invoices'} found`
                  : "Your payment history"}
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
          <>
            {loading ? (
              <div className="text-center py-5 mt-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading invoices...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger mt-4" role="alert">
                <strong>Error:</strong> {error}
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchPaidInvoices}>
                  Retry
                </button>
              </div>
            ) : clientId && filteredInvoices.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={"rounded-xl p-4 border flex items-center justify-between"}
                    style={{
                      background: "#FFFFFF",
                      borderColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                      borderWidth: "1px",
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
                          {invoice.invoice_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600">
                          {invoice.status || 'paid'}
                        </span>
                      </div>
                      <div className="text-sm mt-1" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>
                        {invoice.description || 'Tax preparation services'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Paid {formatDate(invoice.paid_date)}
                        {invoice.payment_method && (
                          <span className="hidden md:inline"> • Method: {invoice.payment_method}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Paid Invoice:</div>
                        <div className="text-orange-500 font-semibold text-lg">
                          {formatCurrency(invoice.amount)}
                        </div>
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
            ) : clientId ? (
              <div className="text-center py-5 mt-4">
                <p className="text-muted">
                  {searchQuery ? 'No invoices found matching your search' : 'No paid invoices found'}
                </p>
                {searchQuery && (
                  <button 
                    className="btn btn-sm btn-outline-primary mt-2" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              // Fallback to mock data if no clientId (standalone invoices page)
              <div className="mt-4 flex flex-col gap-3">
                <div className="text-center py-5">
                  <p className="text-muted">Select a client to view invoices</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
