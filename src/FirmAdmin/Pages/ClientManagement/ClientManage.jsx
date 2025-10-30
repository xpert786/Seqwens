import React, { useState, useEffect } from 'react';
import { FaEye, FaUpload, FaDownload, FaSearch, FaFilter, FaUsers, FaTrash, FaEllipsisV, FaFileAlt, FaUser, FaCalendar, FaComment, FaEnvelope, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPhone, FaBuilding } from 'react-icons/fa';
import { SettingIcon, } from '../../../Taxpreparer/component/icons';
import { AddClient, Archived, BulkAction, BulkImport, ExportReport, Filter, SearchIcon, MailIcon, CallIcon, Building, DocumentIcon, AppointmentIcon, CustomerIcon, MsgIcon, Doc, Action, CrossesIcon } from '../../Components/icons';
import '../../../Taxpreparer/styles/taxdashboard.css';
import FirmAdmin from '../../../assets/FirmAdmin.png';
import BulkActionModal from './BulkAction';
import BulkImportModal from './BulkImportModal';
import AddClientModal from "./AddClientModal";
import IntakeFormBuilderModal from './IntakeFormBuilderModal';
export default function ClientManage() {
  const [selectedClients, setSelectedClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
const [showFormBuilder, setShowFormBuilder] = useState(false);
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

  const clients = [
    {
      id: 1,
      name: "John Smith",
      company: "Smith Enterprises",
      type: "Business - Recurring",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      status: "Active",
      tags: ["High Priority", "VIP"],
      assignedStaff: "Michael Chen",
      lastActivity: "2 days ago",
      lastActivityType: "Document",
      lastActivityIcon: "DocumentIcon",
      totalBilled: "$15,420",
      compliance: "Complete",
      dueDiligence: 100
    },
    {
      id: 2,
      name: "Sarah Johnson",
      company: "Individual - Seasonal",
      type: "Individual - Seasonal",
      email: "sarah.johnson@email.com",
      phone: "(555) 234-5678",
      status: "Active",
      tags: ["Tax Season", "Referral"],
      assignedStaff: "Sarah Martinez",
      lastActivity: "1 week ago",
      lastActivityType: "Login",
      lastActivityIcon: "CustomerIcon",
      totalBilled: "$8,750",
      compliance: "Pending",
      dueDiligence: 50
    },
    {
      id: 3,
      name: "Michael Davis",
      company: "Davis LLC",
      type: "Business - One-Time",
      email: "michael.davis@email.com",
      phone: "(555) 345-6789",
      status: "Pending",
      tags: ["New Client", "Needs Review"],
      assignedStaff: "David Rodriguez",
      lastActivity: "3 days ago",
      lastActivityType: "Appointment",
      lastActivityIcon: "AppointmentIcon",
      totalBilled: "$0",
      compliance: "Missing",
      dueDiligence: 0
    },
    {
      id: 4,
      name: "Emily Wilson",
      company: "Individual - Recurring",
      type: "Individual - Recurring",
      email: "emily.wilson@email.com",
      phone: "(555) 456-7890",
      status: "Inactive",
      tags: ["Follow-Up Needed", "Inactive"],
      assignedStaff: "Lisa Thompson",
      lastActivity: "2 months ago",
      lastActivityType: "Message",
      lastActivityIcon: "MsgIcon",
      totalBilled: "$12,300",
      compliance: "Active",
      dueDiligence: 100
    }
  ];


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
      case 'Complete': return ;
      case 'Pending': return ;
      case 'Missing': return ;
      case 'Active': return ;
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

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: 'var(--Color-purple-50, #F6F7FF)' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="taxdashboard-title">Client Management</h2>
            <h5 className="taxdashboard-subtitle">Manage all firm clients and assignments</h5>
          </div>
          <div className="d-flex gap-3">
          <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{fontSize:"15px"}} onClick={() => setShowFormBuilder(true)}>
              <SettingIcon />
              Build Intake Forms
            </button>
            <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{fontSize:"15px"}}
            onClick={() => setShowBulkImportModal(true)}>
              <BulkImport />
              Bulk Import
            </button>
            <button className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2" style={{fontSize:"15px"}} onClick={() => setShowAddClientModal(true)}>
              <AddClient />
              Add Client
            </button>
            <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{fontSize:"15px"}}>
              <ExportReport />
              Export Report
            </button>
          </div>
        </div>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4" style={{ gridAutoRows: '1fr' }}>
        {[
          {
            label:"Active Clients",
            value: "2",
           
          },
          {
            label:"Total Billed",
            value: "$36,470",
           
          },
          {
            label:"Outstanding",
            value: "$3,700",
           
          },
            {
              label:"New This Month",
              value: "0",
              content: "vs 8 last month",
              contentColor: "red"
            },
            {
              label:"Revenue by Type",
              value: "",
              content: "Individual: $21,050\nBusiness: $15,420"
            },
            {
              label:"Revenue by Segment",
              value: "",
              content: "Recurring: $27,720\nSeasonal: $8,750"
            },
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
          <h2 className="taxdashboardr-titler">All Clients (4)</h2>
          <h5 className="taxdashboard-subtitle">Complete list of firm clients with status and assignment information</h5>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search clients by name, email or company.."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ backgroundColor: 'var(--Palette2-Dark-blue-50, #F3F7FF)' }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <SearchIcon />
              </div>
            </div>
             <button 
               className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" 
               style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
               onClick={() => setShowFiltersModal(true)}
             >
               <Filter />
               Filter
             </button>
             <button 
               className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" 
               style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}
               onClick={() => setShowBulkActionModal(true)}
             >
               <BulkAction/>
               Bulk Action ({selectedClients.length})
             </button>
             <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
               <Archived className="w-4 h-4" />
               Archived Clients
             </button>
          </div>
        </div>

        {/* Client Table */}
        <div className="overflow-x-auto px-6">
          <table className="min-w-full" style={{ minWidth: '1800px' }}>
            <thead className="">
              <tr className="flex gap-8" style={{ minWidth: '1800px' }}>
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
                <th className="w-[120px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-[180px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="w-[140px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                <th className="w-[140px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="w-[120px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Billed</th>
                <th className="w-[120px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="w-[140px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Diligence</th>
                <th className="w-[100px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td colSpan="11" className="p-0">
                    <div className="border border-[#E8F0FF] p-3 mb-3 rounded-lg">
                      <div className="flex items-center gap-8" style={{ minWidth: '1800px' }}>
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
                              <div className="font-semibold text-gray-900 text-sm mb-1">{client.name}</div>
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

                        {/* Status Column */}
                        <div className="w-[120px] flex justify-start">
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}
                            style={client.status === 'Active' ? {
                              background: '#22C55E',
                              border: '0.5px solid #22C55E'
                            } : client.status === 'Pending' ? {
                              background: 'var(--color-yellow-400, #FBBF24)',
                              border: '0.5px solid var(--color-yellow-400, #FBBF24)'
                            } : {}}
                          >
                            {client.status}
                          </span>
                        </div>

                        {/* Tags Column */}
                        <div className="w-[180px]">
                          <div className="flex flex-wrap gap-1">
                            {client.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-800 mb-1"
                                style={{
                                  background: 'var(--Palette2-Dark-blue-100, #E8F0FF)',
                                  border: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Assigned Staff Column */}
                        <div className="w-[140px] text-sm text-gray-900">
                          <div className="font-medium">{client.assignedStaff}</div>
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

                        {/* Total Billed Column */}
                        <div className="w-[120px]">
                          <span className="font-semibold text-gray-900 text-sm">{client.totalBilled}</span>
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
                        {/* Due Diligence Column */}
                        <div className="w-[140px] flex items-center justify-start">
                          <div className="flex items-center w-full">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${client.dueDiligence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 font-medium">{client.dueDiligence}%</span>
                          </div>
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
                              <div className="p" style={{paddingLeft:"20px", paddingRight:"20px",paddingTop:"10px"}}>
                                <button 
                                  className="block w-full text-center py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  style={{ 
                                    backgroundColor: 'var(--Palette2-Gold-200, #FFF4E6)',
                                    border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                                    borderRadius: '8px',
                                    marginTop: '4px',
                                    marginLeft: '4px',
                                    marginRight: '4px',
                                    marginBottom: '4px',
                                    paddingLeft: '16px',
                                    paddingRight: '16px'
                                  }}
                                >
                                  View Details
                                </button>
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
              ))}
            </tbody>
          </table>
        </div>
         
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
              <div className="p-2 rounded-lg self-start" style={{border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
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
              <div className="p-2 rounded-lg self-start" style={{  border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
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
      />
 
      <IntakeFormBuilderModal
        isOpen={showFormBuilder}
        onClose={() => setShowFormBuilder(false)}
      />
    </div>
  );
}
