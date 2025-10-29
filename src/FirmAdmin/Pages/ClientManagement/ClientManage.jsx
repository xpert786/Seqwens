import React, { useState } from 'react';
import { FaEye, FaUpload, FaDownload, FaSearch, FaFilter, FaUsers, FaTrash, FaEllipsisV, FaFileAlt, FaUser, FaCalendar, FaComment, FaEnvelope, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

export default function ClientManage() {
  const [selectedClients, setSelectedClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);

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
      lastActivity: "2 days ago Document",
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
      lastActivity: "1 week ago Login",
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
      lastActivity: "3 days ago Appointment",
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
      lastActivity: "2 months ago Message",
      totalBilled: "$12,300",
      compliance: "Active",
      dueDiligence: 100
    }
  ];

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
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Missing': return 'bg-red-100 text-red-800';
      case 'Active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (compliance) => {
    switch (compliance) {
      case 'Complete': return <FaCheckCircle className="w-3 h-3" />;
      case 'Pending': return <FaExclamationTriangle className="w-3 h-3" />;
      case 'Missing': return <FaTimesCircle className="w-3 h-3" />;
      case 'Active': return <FaCheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
        <p className="text-gray-600 text-lg">Manage all firm clients and assignments</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <FaEye className="w-4 h-4" />
          Build Intake Forms
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <FaUpload className="w-4 h-4" />
          Bulk Import
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          <span className="text-lg">+</span>
          Add Client
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <FaDownload className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Active Clients */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Active Clients</h3>
          <p className="text-3xl font-bold text-gray-900">2</p>
        </div>

        {/* Total Billed */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Billed</h3>
          <p className="text-3xl font-bold text-gray-900">$36,470</p>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Outstanding</h3>
          <p className="text-3xl font-bold text-gray-900">$3,700</p>
        </div>

        {/* New This Month */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">New This Month</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-red-600 mt-1">vs 8 last month</p>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue by Type */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Revenue by Type</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Individual:</span>
              <span className="font-medium">$21,050</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Business:</span>
              <span className="font-medium">$15,420</span>
            </div>
          </div>
        </div>

        {/* Revenue by Segment */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Revenue by Segment</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Recurring:</span>
              <span className="font-medium">$27,720</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seasonal:</span>
              <span className="font-medium">$8,750</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client List Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Section Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clients (4)</h2>
          <p className="text-gray-600">Complete list of firm clients with status and assignment information</p>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients by name, email or company.."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FaFilter className="w-4 h-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FaUsers className="w-4 h-4" />
              Bulk Action ({selectedClients.length})
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FaTrash className="w-4 h-4" />
              Archived Clients
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Billed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Diligence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-medium">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.company}</div>
                        <div className="text-xs text-gray-400">{client.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{client.assignedStaff}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      {client.lastActivity.includes('Document') && <FaFileAlt className="w-3 h-3 mr-1" />}
                      {client.lastActivity.includes('Login') && <FaUser className="w-3 h-3 mr-1" />}
                      {client.lastActivity.includes('Appointment') && <FaCalendar className="w-3 h-3 mr-1" />}
                      {client.lastActivity.includes('Message') && <FaComment className="w-3 h-3 mr-1" />}
                      {client.lastActivity}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.totalBilled}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceColor(client.compliance)}`}>
                      {getComplianceIcon(client.compliance)}
                      {client.compliance}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${client.dueDiligence}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{client.dueDiligence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowDropdown(showDropdown === client.id ? null : client.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaEllipsisV className="w-4 h-4" />
                      </button>
                      {showDropdown === client.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Client</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Timeline</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Send Message</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Schedule Meeting</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Request Docs</button>
                            <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete Client</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
