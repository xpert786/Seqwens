import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaUpload, FaDownload, FaSearch, FaFilter, FaUsers, FaTrash, FaEllipsisV, FaFileAlt, FaUser, FaCalendar, FaComment, FaEnvelope, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPhone, FaBuilding } from 'react-icons/fa';
import { SettingIcon, } from '../../../Taxpreparer/component/icons';
import { AddClient, Archived, BulkAction, BulkImport, ExportReport, Filter, SearchIcon, MailIcon, CallIcon, Building, DocumentIcon, AppointmentIcon, CustomerIcon, MsgIcon, Doc, Action, CrossesIcon } from '../../Components/icons';
import '../../../Taxpreparer/styles/taxdashboard.css';
import FirmAdmin from '../../../assets/FirmAdmin.png';
import BulkActionModal from './BulkAction';
import BulkImportModal from './BulkImportModal';
import AddClientModal from "./AddClientModal";
import IntakeFormBuilderModal from './IntakeFormBuilderModal';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

export default function ClientManage() {
  const navigate = useNavigate();
  const [selectedClients, setSelectedClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // Staff members state
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState(null);

  // Clients state
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [overview, setOverview] = useState({
    total_clients: 0,
    active: 0,
    pending: 0,
    high_priority: 0
  });

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    active_clients: 0,
    total_billed: 0,
    outstanding: 0,
    new_this_month: {
      count: 0,
      vs_last_month: 0
    },
    revenue_by_type: {
      individual: 0,
      business: 0
    },
    revenue_by_segment: {
      recurring: 0,
      seasonal: 0
    }
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  // Filter states
  const [statusFilters, setStatusFilters] = useState({
    allStatus: false,
    lead: false,
    prospect: false,
    active: true,
    inactive: false,
    pending: false,
    archived: false
  });

  const [typeFilters, setTypeFilters] = useState({
    allTypes: false,
    individual: false,
    business: false,
    partnership: false,
    corporation: false
  });

  const [returnFilters, setReturnFilters] = useState({
    allReturns: false,
    '1040': false,
    '1065': false,
    '1120': false,
    '990': false
  });

  const [tagFilters, setTagFilters] = useState({
    eicFiler: false,
    smallBusiness: false,
    highIncome: false,
    auditRisk: false
  });

  const [segmentFilters, setSegmentFilters] = useState({
    eicFilers: false,
    highIncome: false
  });

  const [commFilters, setCommFilters] = useState({
    sms: false,
    email: false,
    portal: false
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/dashboard/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDashboardStats(result.data);
      } else {
        throw new Error('Failed to load dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      const errorMsg = handleAPIError(err);
      setDashboardError(errorMsg || 'Failed to load dashboard statistics');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fetch staff members on component mount
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        setStaffLoading(true);
        setStaffError(null);

        const token = getAccessToken();
        const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/list/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.staff_members) {
          setStaffMembers(result.data.staff_members);
          console.log('Staff members loaded:', result.data.staff_members);
        } else {
          setStaffMembers([]);
        }
      } catch (err) {
        console.error('Error fetching staff members:', err);
        setStaffError('Failed to load staff members');
        setStaffMembers([]);
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffMembers();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Fetch clients on component mount and when page or search changes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const token = getAccessToken();
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('page_size', '20');

        if (debouncedSearchTerm.trim()) {
          queryParams.append('search', debouncedSearchTerm.trim());
        }

        const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Set overview data
          if (result.data.overview) {
            setOverview(result.data.overview);
          }

          // Set pagination data
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }

          // Map API response to match the expected structure
          if (result.data.clients) {
            const mappedClients = result.data.clients.map(client => {
              // Handle different API response structures
              const profile = client.profile || client;
              const firstName = profile.first_name || client.first_name || '';
              const lastName = profile.last_name || client.last_name || '';
              
              // Construct name from first_name and last_name, prioritizing first_name + last_name
              let fullName = '';
              if (firstName || lastName) {
                // Always construct from first_name and last_name if available
                fullName = `${firstName} ${lastName}`.trim();
              } else if (profile.name || client.name) {
                // Fallback to name field if first_name/last_name not available
                fullName = profile.name || client.name;
              } else if (profile.full_name || client.full_name) {
                // Fallback to full_name field
                fullName = profile.full_name || client.full_name;
              } else {
                // Last resort: use email
                fullName = profile.email || client.email || 'Unknown Client';
              }
              
              console.log('Client mapping:', {
                original: client,
                firstName,
                lastName,
                fullName
              });
              
              return {
                id: client.id || profile.id,
                name: fullName,
                company: client.client_type || profile.client_type || 'Individual',
                type: client.client_type || profile.client_type || 'Individual',
                email: profile.email || client.email || '',
                phone: profile.phone || profile.phone_formatted || client.phone_number || client.phone || '',
                status: client.status || profile.account_status?.toLowerCase() || 'new',
                lastActivity: client.next_due_date || 'N/A',
                lastActivityType: 'N/A',
                lastActivityIcon: 'DocumentIcon',
                totalBilled: '$0', // Can be calculated from invoices if available
                compliance: (client.status || profile.account_status?.toLowerCase() || 'new') === 'active' ? 'Active' : (client.status || profile.account_status?.toLowerCase() || 'new') === 'pending' ? 'Pending' : 'New',
                pendingTasks: client.pending_tasks_count || 0,
                documentsCount: client.documents_count || 0
              };
            });
            setClients(mappedClients);
            console.log('Clients loaded:', mappedClients);
          } else {
            setClients([]);
          }
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClientsError('Failed to load clients');
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, [currentPage, debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-white';
      case 'Pending': return 'text-white';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case 'Complete': return 'text-white';
      case 'Pending': return 'text-white';
      case 'Missing': return 'text-white';
      case 'Active': return 'text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (compliance) => {
    switch (compliance) {
      case 'Complete': return;
      case 'Pending': return;
      case 'Missing': return;
      case 'Active': return;
      default: return null;
    }
  };

  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case 'DocumentIcon': return <Doc className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'CustomerIcon': return <CustomerIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'AppointmentIcon': return <AppointmentIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'MsgIcon': return <MsgIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      default: return <FaFileAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />;
    }
  };

  // Export Clients List to PDF
  const exportClientsToPDF = async () => {
    try {
      if (clients.length === 0) {
        toast.info("No clients to export", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Fetch all clients (not just current page)
      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('page_size', '1000'); // Get all clients

      if (debouncedSearchTerm.trim()) {
        queryParams.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      let allClients = clients;
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.clients) {
          allClients = result.data.clients.map(client => {
            const profile = client.profile || client;
            const firstName = profile.first_name || client.first_name || '';
            const lastName = profile.last_name || client.last_name || '';
            let fullName = '';
            if (firstName || lastName) {
              fullName = `${firstName} ${lastName}`.trim();
            } else if (profile.name || client.name) {
              fullName = profile.name || client.name;
            } else if (profile.full_name || client.full_name) {
              fullName = profile.full_name || client.full_name;
            } else {
              fullName = profile.email || client.email || 'Unknown Client';
            }
            return {
              id: client.id || profile.id,
              name: fullName,
              company: client.client_type || profile.client_type || 'Individual',
              type: client.client_type || profile.client_type || 'Individual',
              email: profile.email || client.email || '',
              phone: profile.phone || profile.phone_formatted || client.phone_number || client.phone || '',
              status: client.status || profile.account_status?.toLowerCase() || 'new',
              lastActivity: client.next_due_date || 'N/A',
              totalBilled: '$0',
              compliance: (client.status || profile.account_status?.toLowerCase() || 'new') === 'active' ? 'Active' : (client.status || profile.account_status?.toLowerCase() || 'new') === 'pending' ? 'Pending' : 'New',
            };
          });
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Clients List Report", pageWidth / 2, yPosition, { align: "center" });
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

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, yPosition);
      yPosition += 8;

      const activeCount = allClients.filter(c => (c.status || '').toLowerCase() === 'active').length;
      const pendingCount = allClients.filter(c => (c.status || '').toLowerCase() === 'pending').length;
      const inactiveCount = allClients.filter(c => (c.status || '').toLowerCase() === 'inactive').length;

      const summaryData = [
        ["Total Clients", allClients.length.toString()],
        ["Active Clients", activeCount.toString()],
        ["Pending Clients", pendingCount.toString()],
        ["Inactive Clients", inactiveCount.toString()],
      ];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Clients Table
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`All Clients (${allClients.length})`, 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = allClients.map((client) => {
        return [
          client.name || 'N/A',
          client.email || 'N/A',
          client.phone || 'N/A',
          client.company || client.type || 'N/A',
          (client.status || 'N/A').charAt(0).toUpperCase() + (client.status || 'N/A').slice(1),
          client.compliance || 'N/A',
          client.lastActivity || 'N/A',
        ];
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [["Client Name", "Email", "Phone", "Type", "Status", "Compliance", "Last Activity"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
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

      // Open PDF in new window for preview/download
      const fileName = `Clients_List_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.output('dataurlnewwindow', { filename: fileName });
      toast.success("PDF opened in new window. You can download it from there.", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Error generating PDF: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: 'var(--Color-purple-50, #F6F7FF)' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="taxdashboard-title">Client Management</h2>
          <h5 className="taxdashboard-subtitle">Manage all firm clients and assignments</h5>
        </div>
        <div className="d-flex gap-3">
          <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{ fontSize: "15px", borderRadius: "7px" }} onClick={() => setShowFormBuilder(true)}>
            <SettingIcon />
            Build Intake Forms
          </button>
          <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{ fontSize: "15px", borderRadius: "7px" }}
            onClick={() => setShowBulkImportModal(true)}>
            <BulkImport />
            Bulk Import
          </button>
          <button className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2" style={{ fontSize: "15px", borderRadius: "7px" }} onClick={() => setShowAddClientModal(true)}>
            <AddClient />
            Add Client
          </button>
          <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{ fontSize: "15px", borderRadius: "7px" }} onClick={exportClientsToPDF}>
            <ExportReport />
            Export Report
          </button>
        </div>
      </div>
      {/* Dashboard Error Display */}
      {dashboardError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {dashboardError}
        </div>
      )}
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4" style={{ gridAutoRows: '1fr' }}>
        {[
          {
            label: "Active Clients",
            value: dashboardLoading ? '...' : dashboardStats.active_clients || 0,
          },
          {
            label: "Total Billed",
            value: dashboardLoading ? '...' : `$${dashboardStats.total_billed?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
          },
          {
            label: "Outstanding",
            value: dashboardLoading ? '...' : `$${dashboardStats.outstanding?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
          },
          {
            label: "New This Month",
            value: dashboardLoading ? '...' : dashboardStats.new_this_month?.count || 0,
            content: dashboardStats.new_this_month?.vs_last_month !== undefined
              ? `vs Last Month: ${dashboardStats.new_this_month.vs_last_month >= 0 ? '+' : ''}${dashboardStats.new_this_month.vs_last_month}`
              : '',
            contentColor: "gray"
          },
          // {
          //   label: "Revenue by Type",
          //   value: "",
          //   content: dashboardLoading
          //     ? 'Loading...'
          //     : `Individual: $${dashboardStats.revenue_by_type?.individual?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}\nBusiness: $${dashboardStats.revenue_by_type?.business?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
          // },
          // {
            // label: "Revenue by Segment",
            // value: "",
            // content: dashboardLoading
            //   ? 'Loading...'
            //   : `Recurring: $${dashboardStats.revenue_by_segment?.recurring?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}\nSeasonal: $${dashboardStats.revenue_by_segment?.seasonal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
          // },
        ].map((card, index) => (
          <div className="w-full h-full" key={index}>
            <div className="bg-white p-6 rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-medium text-gray-600">{card.label}</div>
                {card.icon}
              </div>
              {card.value && <h5 className="text-3xl font-bold text-gray-900 mb-2">{card.value}</h5>}
              <div className="flex-1">
                <p className="text-sm" style={{ color: card.contentColor || '#6B7280', whiteSpace: 'pre-line' }}>{card.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client List Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Section Header */}
        <div className="p-6">
          <h4 className="taxdashboardr-titler">
            All Clients ({clientsLoading ? '...' : clientsError ? 'Error' : clients.length})
          </h4>
          <h5 className="taxdashboard-subtitle">Complete list of firm clients with status and assignment information</h5>
          {clientsError && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {clientsError}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search clients by name, email or company.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ backgroundColor: 'var(--Palette2-Dark-blue-50, #F3F7FF)' }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <SearchIcon />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* <button
              className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              onClick={() => setShowFiltersModal(true)}
            > */}
              {/* <Filter />
              Filter */}
            {/* </button> */}
            {/* <button
              className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2"
              style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
              onClick={() => setShowBulkActionModal(true)}
            > */}
              {/* <BulkAction />
              Bulk Action ({selectedClients.length}) */}
            {/* </button> */}
            {/* <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
              <Archived className="w-4 h-4" />
              Archived Clients
            </button> */}
          </div>
        </div>

        {/* Client Table */}
        <div className="overflow-x-auto px-6">
          <table className="min-w-full" style={{ minWidth: '940px' }}>
            <thead className="">
              <tr className="flex gap-8" style={{ minWidth: '940px' }}>
                <th className="w-[60px] flex justify-center py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length && clients.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                    style={{
                      border: '1px solid var(--Palette2-SkyBlue-900, #3AD6F2)',
                      backgroundColor: selectedClients.length === clients.length && clients.length > 0
                        ? 'var(--Palette2-SkyBlue-900, #3AD6F2)'
                        : 'transparent',
                      color: selectedClients.length === clients.length && clients.length > 0
                        ? 'white'
                        : 'var(--Palette2-SkyBlue-900, #3AD6F2)'
                    }}
                  />
                </th>
                <th className="flex-1 min-w-[250px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="w-[180px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="w-[140px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="w-[120px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="w-[100px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {clientsLoading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    Loading clients...
                  </td>
                </tr>
              ) : clientsError ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-red-500">
                    {clientsError}
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td colSpan="6" className="p-0">
                      <div className="border border-[#E8F0FF] p-3 mb-3 rounded-lg">
                        <div className="flex items-center gap-8" style={{ minWidth: '940px' }}>
                          {/* Checkbox Column */}
                          <div className="w-[60px] flex justify-center">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => handleSelectClient(client.id)}
                              className="w-4 h-4"
                              style={{
                                border: '1px solid var(--Palette2-SkyBlue-900, #3AD6F2)',
                                backgroundColor: selectedClients.includes(client.id)
                                  ? 'var(--Palette2-SkyBlue-900, #3AD6F2)'
                                  : 'transparent',
                                color: selectedClients.includes(client.id)
                                  ? 'white'
                                  : 'var(--Palette2-SkyBlue-900, #3AD6F2)'
                              }}
                            />
                          </div>

                          {/* Client Column */}
                          <div className="flex-1 min-w-[250px]">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                                <img
                                  src={FirmAdmin}
                                  alt={client.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-semibold text-gray-900 text-sm mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => navigate(`/firmadmin/clients/${client.id}`)}
                                >
                                  {client.name}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center mb-1">
                                  {client.company === "Smith Enterprises" || client.company === "Davis LLC" ? (
                                    <div className="mr-1">
                                      <Building />
                                    </div>
                                  ) : null}
                                  {client.company}
                                </div>
                                <div className="text-xs text-gray-400">{client.type}</div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Column */}
                          <div className="w-[180px]">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <MailIcon />
                                <span className="break-all">{client.email}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <CallIcon />
                                <span>{client.phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Last Activity Column */}
                          <div className="w-[140px]">
                            <div className="flex items-center space-x-2">
                              {getActivityIcon(client.lastActivityIcon)}
                              <div>
                                <div className="text-sm text-gray-600">{client.lastActivity}</div>
                                <div className="text-xs text-gray-400">{client.lastActivityType}</div>
                              </div>
                            </div>
                          </div>

                          {/* Compliance Column */}
                          <div className="w-[120px] flex justify-start">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getComplianceColor(client.compliance)}`}
                              style={client.compliance === 'Complete' || client.compliance === 'Active' ? {
                                background: '#22C55E',
                                border: '0.5px solid #22C55E'
                              } : client.compliance === 'Pending' ? {
                                background: 'var(--color-yellow-400, #FBBF24)',
                                border: '0.5px solid var(--color-yellow-400, #FBBF24)'
                              } : client.compliance === 'Missing' ? {
                                background: 'var(--color-red-500, #EF4444)',
                                border: '0.5px solid var(--color-red-500, #EF4444)'
                              } : {}}
                            >
                              {getComplianceIcon(client.compliance)}
                              <span className="ml-1">{client.compliance}</span>
                            </span>
                          </div>

                          {/* Action Column */}
                          <div className="w-[100px] text-sm font-medium relative dropdown-container flex justify-center">
                            <button
                              onClick={() => setShowDropdown(showDropdown === client.id ? null : client.id)}
                              className="text-gray-400 "
                            >
                              <Action />
                            </button>
                            {showDropdown === client.id && (
                              <div
                                className="absolute mt-2 w-48 bg-white shadow-lg z-10"
                                style={{
                                  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                                  borderRadius: '8px',
                                  marginTop: '8px',
                                  right: '8px',
                                  width: '200px',
                                }}
                              >
                                <div className="p" style={{ paddingLeft: "20px", paddingRight: "20px", paddingTop: "10px" }}>
                                  {/* View Details removed - clicking on client name now redirects to details page */}
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Client</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Timeline</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Send Message</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Schedule Meeting</button>
                                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Reassign Staff</button>
                                  <div style={{ borderTop: '0.2px solid #000000' }}></div>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    style={{ color: 'var(--color-red-500, #EF4444)' }}
                                  >
                                    Delete Client
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">
              Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count} clients
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.has_previous || currentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!pagination.has_previous || currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${currentPage === pageNum
                        ? 'bg-[#3AD6F2] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                disabled={!pagination.has_next || currentPage === pagination.total_pages}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-[BasisGrotesquePro] ${!pagination.has_next || currentPage === pagination.total_pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => setShowFiltersModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-3 max-w-2xl w-full mx-4"
            style={{
              borderRadius: '12px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-3">
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                <h2 className="taxdashboardr-titler text-base font-bold text-gray-900" style={{ color: '#3B4A66' }}>Filters</h2>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <CrossesIcon />
                </button>
              </div>
            </div>

            {/* Filter Columns */}
            <div className="grid grid-cols-4 gap-3 items-start">
              {/* Column 1: Status */}
              <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                <h3 className="taxdashboardr-titler mb-2">Status</h3>
                <div className="space-y-1 flex flex-col">
                  {['All Status', 'Lead', 'Prospect', 'Active', 'Inactive', 'Pending', 'Archived'].map((status) => {
                    const key = status.toLowerCase().replace(' ', '');
                    const filterKey = key === 'allstatus' ? 'allStatus' : key;
                    return (
                      <label key={status} className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilters[filterKey] || false}
                          onChange={(e) => {
                            setStatusFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                          }}
                          className="w-3 h-3 rounded border-gray-300"
                          style={{
                            accentColor: '#3AD6F2',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                        <span className="text-xs text-gray-600 ml-4">{status}</span>
                      </label>
                    );
                  })}

                  {/* Types sub-section */}
                  <div className="mt-3">
                    <h4 className="taxdashboardr-titler mb-2">Types</h4>
                    <div className="space-y-1 flex flex-col">
                      {['All Types', 'Individual', 'Business', 'Partnership', 'Corporation'].map((type) => {
                        const key = type.toLowerCase().replace(' ', '');
                        const filterKey = key === 'alltypes' ? 'allTypes' : key;
                        return (
                          <label key={type} className="flex items-center gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={typeFilters[filterKey] || false}
                              onChange={(e) => {
                                setTypeFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                              }}
                              className="w-3 h-3 rounded border-gray-300"
                              style={{
                                accentColor: '#3AD6F2',
                                border: '1px solid #E5E7EB'
                              }}
                            />
                            <span className="text-xs text-gray-600 ml-4">{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>


              {/* Column 2: Returns */}
              <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                <h3 className="taxdashboardr-titler mb-2">Returns</h3>
                <div className="space-y-1 flex flex-col">
                  {['All Returns', '1040', '1065', '1120', '990'].map((returnType) => {
                    const key = returnType.toLowerCase().replace(' ', '');
                    const filterKey = key === 'allreturns' ? 'allReturns' : key;
                    return (
                      <label key={returnType} className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={returnFilters[filterKey] || false}
                          onChange={(e) => {
                            setReturnFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                          }}
                          className="w-3 h-3 rounded border-gray-300"
                          style={{
                            accentColor: '#3AD6F2',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                        <span className="text-xs text-gray-600 ml-4">{returnType}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: All Tags */}
              <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                <h3 className="taxdashboardr-titler mb-2">All Tags</h3>
                <div className="space-y-1 flex flex-col">
                  {['EIC filer', 'Small Business', 'High Income', 'Audit Risk'].map((tag) => {
                    const key = tag.toLowerCase().replace(' ', '');
                    const filterKey = key === 'eicfiler' ? 'eicFiler' :
                      key === 'smallbusiness' ? 'smallBusiness' :
                        key === 'highincome' ? 'highIncome' :
                          key === 'auditrisk' ? 'auditRisk' : key;
                    return (
                      <label key={tag} className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tagFilters[filterKey] || false}
                          onChange={(e) => {
                            setTagFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                          }}
                          className="w-3 h-3 rounded border-gray-300"
                          style={{
                            accentColor: '#3AD6F2',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                        <span className="text-xs text-gray-600 ml-4">{tag}</span>
                      </label>
                    );
                  })}

                  {/* Segments sub-section */}
                  <div className="mt-3">
                    <h4 className="taxdashboardr-titler mb-2">Segments</h4>
                    <div className="space-y-1 flex flex-col">
                      {['EIC Filers', 'High Income'].map((segment) => {
                        const key = segment.toLowerCase().replace(' ', '');
                        const filterKey = key === 'eicfilers' ? 'eicFilers' : key;
                        return (
                          <label key={segment} className="flex items-center gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={segmentFilters[filterKey] || false}
                              onChange={(e) => {
                                setSegmentFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                              }}
                              className="w-3 h-3 rounded border-gray-300"
                              style={{
                                accentColor: '#3AD6F2',
                                border: '1px solid #E5E7EB'
                              }}
                            />
                            <span className="text-xs text-gray-600 ml-4">{segment}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 4: All Comm */}
              <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                <h4 className="taxdashboardr-titler mb-2">All Comm</h4>
                <div className="space-y-1 flex flex-col">
                  {['SMS', 'Email', 'Portal'].map((comm) => {
                    const key = comm.toLowerCase();
                    return (
                      <label key={comm} className="flex items-center gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commFilters[key] || false}
                          onChange={(e) => {
                            setCommFilters(prev => ({ ...prev, [key]: e.target.checked }));
                          }}
                          className="w-3 h-3 rounded border-gray-300"
                          style={{
                            accentColor: '#3AD6F2',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                        <span className="text-xs text-gray-600 ml-4">{comm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkActionModal}
        onClose={() => setShowBulkActionModal(false)}
        selectedCount={selectedClients.length}
      />
      {/* Bulk Impot modal  */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
      />
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientCreated={() => {
          // Refresh clients list if needed
          console.log('Client created, refresh list');
        }}
      />

      <IntakeFormBuilderModal
        isOpen={showFormBuilder}
        onClose={() => setShowFormBuilder(false)}
      />
    </div>
  );
}
