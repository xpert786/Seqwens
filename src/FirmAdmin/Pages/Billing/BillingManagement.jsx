import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError } from "../../../ClientOnboarding/utils/apiUtils";
import CreateInvoiceModal from "./CreateInvoiceModal";
import SavedPaymentMethods from "./SavedPaymentMethods";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useFirmSettings } from "../../Context/FirmSettingsContext";

const API_BASE_URL = getApiBaseUrl();

export default function BillingManagement() {
  const { advancedReportingEnabled } = useFirmSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices"); // Add tab state
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    outstanding_balance: 0,
    paid_this_year: 0,
    next_due_date: null,
    total_invoices: 0,
    outstanding_count: 0,
    overdue_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    client_id: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Changed from 5 to 4 to show top 4
  const [activeMetricFilter, setActiveMetricFilter] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAccessToken();
      const queryParams = new URLSearchParams();

      if (filters.status) {
        queryParams.append("status", filters.status);
      }
      if (filters.client_id) {
        queryParams.append("client_id", filters.client_id);
      }

      const url = `${API_BASE_URL}/firm/invoices/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await fetchWithCors(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Default summary structure
      const defaultSummary = {
        outstanding_balance: 0,
        paid_this_year: 0,
        next_due_date: null,
        total_invoices: 0,
        outstanding_count: 0,
        overdue_count: 0
      };

      // Handle different response structures
      if (result.success && result.data) {
        // New API structure with invoices and summary in data
        setInvoices(result.data.invoices || []);
        setSummary(result.data.summary || defaultSummary);
      } else if (result.invoices) {
        // Direct response with invoices and summary
        setInvoices(result.invoices || []);
        setSummary(result.summary || defaultSummary);
      } else if (Array.isArray(result)) {
        // Array of invoices
        setInvoices(result);
        setSummary(defaultSummary);
      } else {
        setInvoices([]);
        setSummary(defaultSummary);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || "Failed to load invoices. Please try again.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch invoices from API
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calculate pagination
  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = invoices.slice(startIndex, endIndex);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount === "string") {
      amount = parseFloat(amount);
    }
    return amount ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00";
  };

  // Add ref for invoice list section
  const invoiceListRef = React.useRef(null);

  // Handle metric card click
  const handleMetricCardClick = (metricType) => {
    if (!metricType) return; // Skip if no filter

    // Update active metric filter
    setActiveMetricFilter(metricType);

    // Update filters based on metric type
    if (metricType === 'outstanding') {
      setFilters(prev => ({ ...prev, status: '' })); // Show all invoices
    } else if (metricType === 'overdue') {
      setFilters(prev => ({ ...prev, status: 'overdue' }));
    } else if (metricType === 'paid') {
      setFilters(prev => ({ ...prev, status: 'paid' }));
    } else if (metricType === 'total') {
      setFilters(prev => ({ ...prev, status: '' }));
    }

    // Reset to page 1
    setCurrentPage(1);

    // Scroll to invoice list
    setTimeout(() => {
      invoiceListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Export invoices to PDF
  const exportInvoicesToPDF = () => {
    try {
      if (invoices.length === 0) {
        alert("No invoices to export");
        return;
      }

      console.log("Starting PDF export...", invoices.length, "invoices");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Billing & Invoicing Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Report Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryData = [
        ["Outstanding Balance", formatCurrency(summary.outstanding_balance || 0)],
        ["Paid This Year", formatCurrency(summary.paid_this_year || 0)],
        ["Total Invoices", summary.total_invoices || invoices.length],
        ["Outstanding Invoices", summary.outstanding_count || 0],
        ["Overdue Invoices", summary.overdue_count || 0],
        ["Next Due Date", summary.next_due_date || "N/A"]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 80 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Invoice Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`All Invoices (${invoices.length})`, 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = invoices.map((invoice) => {
        const invoiceNumber = invoice.invoice_number || invoice.invoiceNumber || `INV-${invoice.id}`;
        const clientName = invoice.client_name ||
          (invoice.client ? `${invoice.client.first_name || ''} ${invoice.client.last_name || ''}`.trim() : '') ||
          invoice.client || 'N/A';
        const amount = parseFloat(invoice.amount || invoice.total_amount || 0);
        const paidAmount = parseFloat(invoice.paid_amount || 0);
        const remainingAmount = parseFloat(invoice.remaining_amount || invoice.remainingAmount || amount - paidAmount);
        const issueDate = invoice.formatted_issue_date || formatDate(invoice.issue_date || invoice.issueDate);
        const dueDate = invoice.formatted_due_date || formatDate(invoice.due_date || invoice.dueDate);
        const status = invoice.status_display || (invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft');

        return [
          invoiceNumber,
          clientName,
          formatCurrency(amount),
          formatCurrency(paidAmount),
          formatCurrency(remainingAmount),
          status,
          issueDate,
          dueDate
        ];
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [["Invoice #", "Client", "Amount", "Paid", "Remaining", "Status", "Issue Date", "Due Date"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25, overflow: 'linebreak' },
          1: { cellWidth: 30, overflow: 'linebreak' },
          2: { cellWidth: 20, overflow: 'linebreak' },
          3: { cellWidth: 20, overflow: 'linebreak' },
          4: { cellWidth: 20, overflow: 'linebreak' },
          5: { cellWidth: 20, overflow: 'linebreak' },
          6: { cellWidth: 25, overflow: 'linebreak' },
          7: { cellWidth: 25, overflow: 'linebreak' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        didDrawPage: (data) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        }
      });

      // Open PDF in a new tab instead of downloading directly
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message}`);
    }
  };

  const getStatusBadge = (invoice) => {
    // Use API provided status_color and status_display if available
    const status = invoice.status || 'draft';
    const statusDisplay = invoice.status_display || status.charAt(0).toUpperCase() + status.slice(1);
    const statusColor = invoice.status_color || status;

    const configs = {
      paid: {
        color: "bg-[#22C55E]",
        text: "Paid",
        iconColor: 'text-green-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2311_1979)">
            <path d="M12.8334 6.46407V7.00073C12.8327 8.25865 12.4254 9.48263 11.6722 10.4901C10.919 11.4976 9.86033 12.2347 8.65404 12.5913C7.44775 12.948 6.15848 12.9052 4.97852 12.4692C3.79856 12.0333 2.79113 11.2276 2.10647 10.1724C1.42182 9.11709 1.09663 7.86877 1.17939 6.61358C1.26216 5.3584 1.74845 4.16359 2.56574 3.20736C3.38304 2.25113 4.48754 1.58471 5.71452 1.30749C6.94151 1.03027 8.22524 1.1571 9.37425 1.66907M5.25008 6.4174L7.00008 8.1674L12.8334 2.33407" stroke="#22C55E" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2311_1979">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      },
      sent: {
        color: "bg-[#1E40AF]",
        text: "Sent",
        iconColor: 'text-blue-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8334 1.16797L9.16671 11.6443C9.01711 12.0717 8.42179 12.096 8.23787 11.6822L6.41675 7.58464M12.8334 1.16797L2.35711 4.83468C1.92969 4.98427 1.9054 5.57959 2.31922 5.76351L6.41675 7.58464M12.8334 1.16797L6.41675 7.58464" stroke="#1E40AF" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      },
      pending: {
        color: "bg-[#F59E0B]",
        text: "Pending",
        iconColor: 'text-yellow-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      },
      overdue: {
        color: "bg-[#EF4444]",
        text: "Overdue",
        iconColor: 'text-red-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      },
      draft: {
        color: "bg-[#131323]",
        text: "Draft",
        iconColor: 'text-gray-500',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      },
      partial: {
        color: "bg-[#F59E0B]",
        text: "Partially Paid",
        iconColor: 'text-yellow-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      },
      partially_paid: {
        color: "bg-[#F59E0B]",
        text: "Partially Paid",
        iconColor: 'text-yellow-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      },
      yellow: {
        color: "bg-[#F59E0B]",
        text: "Pending",
        iconColor: 'text-yellow-500',
        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2312_2064)">
            <path d="M7.00008 4.66797V7.0013M7.00008 9.33464H7.00592M12.8334 7.0013C12.8334 10.223 10.2217 12.8346 7.00008 12.8346C3.77842 12.8346 1.16675 10.223 1.16675 7.0013C1.16675 3.77964 3.77842 1.16797 7.00008 1.16797C10.2217 1.16797 12.8334 3.77964 12.8334 7.0013Z" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_2312_2064">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      }
    };

    // Normalize status keys for lookup
    const normalizedStatus = (statusColor || status || '').toLowerCase().replace(/\s+/g, '_');

    // Use status_color from API if available, otherwise use status
    const config = configs[normalizedStatus] || configs[statusColor] || configs[status] || configs.draft;
    // Use status_display from API if available, otherwise use config text
    const displayText = statusDisplay || config.text;

    return (
      <span className={`${config.color} text-white px-2 py-0.5 !rounded-[10px] text-xs font-medium whitespace-nowrap`}>
        {displayText}
      </span>
    );
  };

  return (
    <div className="p-6 !bg-[#F3F7FF]" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h4 className="text-3xl font-bold mb-2" style={{ color: '#1F2937' }}>
            Billing & Invoicing
          </h4>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Manage invoices, payments, and saved payment methods
          </p>
        </div>
        <div className="flex gap-3">
          {!advancedReportingEnabled && activeTab === "invoices" && (
            <button
              onClick={exportInvoicesToPDF}
              className="px-4 py-2 !rounded-lg !border border-gray-300 bg-white flex items-center gap-2 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
          )}
          {activeTab === "invoices" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 !rounded-lg flex items-center gap-2 text-white font-medium"
              style={{ backgroundColor: '#F97316' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-4 px-2 font-medium transition-colors ${activeTab === "invoices"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
              }`}
            style={
              activeTab === "invoices"
                ? { borderColor: '#3B82F6', color: '#3B82F6' }
                : {}
            }
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Invoices
            </span>
          </button>

          <button
            onClick={() => setActiveTab("payment-methods")}
            className={`pb-4 px-2 font-medium transition-colors ${activeTab === "payment-methods"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
              }`}
            style={
              activeTab === "payment-methods"
                ? { borderColor: '#3B82F6', color: '#3B82F6' }
                : {}
            }
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h10m4 0a1 1 0 11-2 0 1 1 0 012 0zM7 6h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
              Saved Cards
            </span>
          </button>
        </div>
      </div>

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div
              onClick={() => handleMetricCardClick('outstanding')}
              className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-all ${activeMetricFilter === 'outstanding' ? 'border-2 border-[#3AD6F2] ring-1 ring-[#3AD6F2]' : ''
                }`}
            >
              <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Outstanding Balance</h6>
              <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {formatCurrency(summary.outstanding_balance || 0)}
              </p>
            </div>
            <div
              onClick={() => handleMetricCardClick('paid')}
              className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-all ${activeMetricFilter === 'paid' ? 'border-2 border-[#3AD6F2] ring-1 ring-[#3AD6F2]' : ''
                }`}
            >
              <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Paid This Year</h6>
              <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {formatCurrency(summary.paid_this_year || 0)}
              </p>
            </div>
            <div
              onClick={() => handleMetricCardClick('total')}
              className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-all ${activeMetricFilter === 'total' ? 'border-2 border-[#3AD6F2] ring-1 ring-[#3AD6F2]' : ''
                }`}
            >
              <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Total Invoices</h6>
              <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {summary.total_invoices || invoices.length}
              </p>
            </div>
            <div
              onClick={() => handleMetricCardClick('overdue')}
              className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-all ${activeMetricFilter === 'overdue' ? 'border-2 border-[#3AD6F2] ring-1 ring-[#3AD6F2]' : ''
                }`}
            >
              <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Overdue Invoices</h6>
              <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>
                {summary.overdue_count || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h6 className="text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Next Due Date</h6>
              <p className="text-lg font-semibold" style={{ color: '#1F2937' }}>
                {summary.next_due_date || 'N/A'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Invoice List */}
          <div ref={invoiceListRef} className="bg-white rounded-lg p-6">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h5 className="text-xl font-bold mb-1" style={{ color: '#1F2937' }}>
                  All Invoices ({invoices.length})
                </h5>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Complete list of invoices with payment status and details
                </p>
              </div>
              {invoices.length > itemsPerPage && (
                <div className="text-sm" style={{ color: '#6B7280' }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, invoices.length)} of {invoices.length}
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#6B7280' }}>No invoices found</p>
              </div>
            ) : (
              /* Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Paid</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Remaining</th>
                      <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Issue Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Due Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: '#6B7280' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice) => {
                      // Map API response fields to display fields
                      const invoiceNumber = invoice.invoice_number || invoice.invoiceNumber || `INV-${invoice.id}`;
                      const clientName = invoice.client_name ||
                        (invoice.client ? `${invoice.client.first_name || ''} ${invoice.client.last_name || ''}`.trim() : '') ||
                        invoice.client || 'N/A';
                      const amount = parseFloat(invoice.amount || invoice.total_amount || 0);
                      const paidAmount = parseFloat(invoice.paid_amount || 0);
                      const remainingAmount = parseFloat(invoice.remaining_amount || invoice.remainingAmount || amount - paidAmount);
                      const issueDate = invoice.formatted_issue_date || formatDate(invoice.issue_date || invoice.issueDate);
                      const dueDate = invoice.formatted_due_date || formatDate(invoice.due_date || invoice.dueDate);
                      const description = invoice.description || '';

                      return (
                        <tr
                          key={invoice.id}
                          onClick={() => navigate(`/firmadmin/billing/${invoice.id}`)}
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          style={{ borderColor: '#F3F4F6' }}
                        >
                          <td className="py-4 px-4 text-sm font-medium" style={{ color: '#1F2937' }}>
                            {invoiceNumber}
                          </td>
                          <td className="py-4 px-4 text-sm" style={{ color: '#1F2937' }}>
                            {clientName}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium" style={{ color: '#1F2937' }}>
                            {formatCurrency(amount)}
                          </td>
                          <td className="py-4 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {formatCurrency(paidAmount)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium" style={{ color: remainingAmount > 0 ? '#EF4444' : '#22C55E' }}>
                            {formatCurrency(remainingAmount)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {getStatusBadge(invoice)}
                          </td>
                          <td className="py-4 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {issueDate}
                          </td>
                          <td className="py-4 px-4 text-sm" style={{ color: '#6B7280' }}>
                            {dueDate}
                          </td>
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/firmadmin/billing/${invoice.id}`)}
                              className="p-2 hover:bg-gray-100 !rounded-lg transition"
                              title="View Details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3B82F6' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && invoices.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 !rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: currentPage === 1 ? '#D1D5DB' : '#3B82F6',
                      color: currentPage === 1 ? '#9CA3AF' : '#3B82F6',
                      backgroundColor: currentPage === 1 ? '#F9FAFB' : 'white'
                    }}
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 !rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? 'text-white'
                              : 'border'
                              }`}
                            style={
                              currentPage === page
                                ? { backgroundColor: '#3B82F6' }
                                : {
                                  borderColor: '#D1D5DB',
                                  color: '#6B7280',
                                  backgroundColor: 'white'
                                }
                            }
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-sm" style={{ color: '#6B7280' }}>
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 !rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: currentPage === totalPages ? '#D1D5DB' : '#3B82F6',
                      color: currentPage === totalPages ? '#9CA3AF' : '#3B82F6',
                      backgroundColor: currentPage === totalPages ? '#F9FAFB' : 'white'
                    }}
                  >
                    Next
                  </button>
                </div>

                <div className="text-sm" style={{ color: '#6B7280' }}>
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "payment-methods" && (
        <SavedPaymentMethods />
      )}

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onInvoiceCreated={fetchInvoices}
        />
      )}
    </div>
  );
}


