import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiUpload, FiDownload, FiMoreVertical, FiUsers } from 'react-icons/fi';

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Mock data for firms
  const firms = [
    {
      id: 1,
      firmName: 'Johnson & Associates CPA',
      adminName: 'Michael Johnson',
      email: 'admin@johnsonassociates.com',
      plan: 'Professional',
      planColor: 'text-white',
      status: 'Active',
      statusColor: 'text-white',
      users: 15,
      revenue: '$2,999 per month',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      firmName: 'Metro Tax Services',
      adminName: 'Sarah Martinez',
      email: 'contact@metrotax.com',
      plan: 'Team',
      planColor: 'text-white',
      status: 'Active',
      statusColor: 'text-white',
      users: 8,
      revenue: '$1,499 per month',
      lastActive: '1 hours ago'
    },
    {
      id: 3,
      firmName: 'Elite CPA Group',
      adminName: 'David Chen',
      email: 'info@elitecpa.com',
      plan: 'Enterprise',
      planColor: 'text-white',
      status: 'Trial',
      statusColor: 'text-white',
      users: 45,
      revenue: '$0 per month',
      lastActive: '3 hours ago'
    },
    {
      id: 4,
      firmName: 'Coastal Accounting',
      adminName: 'Jennifer Wilson',
      email: 'owner@coastalaccounting.com',
      plan: 'Solo',
      planColor: 'text-white',
      status: 'Suspended',
      statusColor: 'text-white',
      users: 1,
      revenue: '$499 per month',
      lastActive: '2 Day ago'
    }
  ];

  const handleActionClick = (firmId, action) => {
    if (action === 'View Details') {
      navigate(`/superadmin/users/${firmId}`);
    } else {
      console.log(`${action} clicked for firm ${firmId}`);
    }
    setActiveDropdown(null);
  };

  return (
    <div className="p-6 bg-[#F6F7FF] min-h-screen">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage all platform users across firms</p>
      </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
         <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-[#E8F0FF] text-gray-700 hover:bg-gray-50 transition-colors" style={{borderRadius: '7px'}}>
           <FiUpload size={12} />
           Import Report
         </button>
         <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-[#E8F0FF] text-gray-700 hover:bg-gray-50 transition-colors" style={{borderRadius: '7px'}}>
           <FiDownload size={12} />
           Export Report
         </button>
       </div>

       {/* Search and Filters Bar */}
       <div className="mb-6">
         <div className="flex items-center gap-3">
           {/* Search Input */}
           <div className="relative">
             <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
             <input
               type="text"
               placeholder="Search Firm Management"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-[200px] pl-8 pr-3 py-1.5 text-sm border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             />
           </div>

           {/* Status Dropdown */}
           <div className="relative">
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="appearance-none bg-white border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-6 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
             >
               <option value="All Status">All Status</option>
               <option value="Active">Active</option>
               <option value="Trial">Trial</option>
               <option value="Suspended">Suspended</option>
             </select>
             <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
           </div>

           {/* Plan Dropdown */}
           <div className="relative">
             <select
               value={planFilter}
               onChange={(e) => setPlanFilter(e.target.value)}
               className="appearance-none bg-white border border-[#E8F0FF] rounded-lg px-3 py-1.5 pr-6 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
             >
               <option value="All Plans">All Plans</option>
               <option value="Solo">Solo</option>
               <option value="Professional">Professional</option>
               <option value="Team">Team</option>
               <option value="Enterprise">Enterprise</option>
             </select>
             <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
           </div>
         </div>
       </div>

     

      {/* Firms Section */}
      <div className="bg-white rounded-lg border border-[#E8F0FF]">
        {/* Section Header */}
        <div className="p-2  border-[#E8F0FF]">
          <h6 className="text-xs font-semibold text-gray-800 mb-0">Firms (4)</h6>
          <p className="text-xs text-gray-600" style={{fontSize: '10px'}}>Comprehensive list of all firms registered on the platform.</p>
        </div>

        {/* Table Headers */}
        <div className=" px-3 py-2  border-[#E8F0FF]">
          <div className="flex items-center gap-4 text-[#4B5563] uppercase tracking-wider" style={{fontSize: '11px'}}>
            <div className="flex-1 text-left">Firm</div>
            <div className="w-20 text-center">Plan</div>
            <div className="w-20 text-center">Status</div>
            <div className="w-16 text-center">Users</div>
            <div className="w-24 text-center">Revenue</div>
            <div className="w-20 text-center">Last Active</div>
            <div className="w-12 text-center">Actions</div>
          </div>
        </div>

        {/* Firms List with Borders */}
        <div className="space-y-2 p-2">
          {firms.map((firm) => (
            <div key={firm.id} className="border border-[#E8F0FF] rounded-lg p-2  transition-colors">
              <div className="flex items-center gap-4">
                {/* Firm Column */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/superadmin/users/${firm.id}`)}
                    className="text-left hover:underline focus:outline-none"
                  >
                    <h3 className="text-[#4B5563] mb-0 hover:text-blue-600 transition-colors" style={{fontSize: '15px', fontWeight: '600'}}>{firm.firmName}</h3>
                  </button>
                  <p className="text-[#4B5563] mb-0" style={{fontSize: '12px'}}>{firm.adminName}</p>
                  <p className="text-[#4B5563]" style={{fontSize: '11px'}}>{firm.email}</p>
                </div>

                {/* Plan Column */}
                <div className="w-20 text-center">
                  <span 
                    className={`inline-flex items-center px-1.5 py-1 rounded-full font-medium ${firm.planColor}`} 
                    style={{
                      fontSize: '10px',
                      backgroundColor: firm.plan === 'Professional' ? '#1E40AF' : 
                                     firm.plan === 'Team' ? '#22C55E' :
                                     firm.plan === 'Enterprise' ? '#3AD6F2' :
                                     firm.plan === 'Solo' ? '#FBBF24' : '#6B7280'
                    }}
                  >
                    {firm.plan}
                  </span>
                </div>

                {/* Status Column */}
                <div className="w-20 text-center">
                  <span 
                    className={`inline-flex items-center px-1.5 py-1 rounded-full font-medium ${firm.statusColor}`} 
                    style={{
                      fontSize: '10px',
                      backgroundColor: firm.status === 'Trial' ? '#1E40AF' : 
                                     firm.status === 'Active' ? '#22C55E' :
                                     firm.status === 'Suspended' ? '#EF4444' : '#6B7280'
                    }}
                  >
                    {firm.status}
                  </span>
                </div>

                {/* Users Column */}
                <div className="w-16 flex items-center justify-center gap-0.5">
                  <FiUsers className="text-black-700" size={11} />
                  <span className="text-gray-900" style={{fontSize: '11px'}}>{firm.users}</span>
                </div>

                {/* Revenue Column */}
                <div className="w-24 text-center">
                  <span className="text-gray-900" style={{fontSize: '11px'}}>{firm.revenue}</span>
                </div>

                {/* Last Active Column */}
                <div className="w-20 text-center">
                    <span className="text-gray-600" style={{fontSize: '11px'}}>{firm.lastActive}</span>
                </div>

                {/* Actions Column */}
                <div className="w-12 flex justify-center">
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === firm.id ? null : firm.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <FiMoreVertical className="text-gray-500" size={12} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === firm.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8F0FF] rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleActionClick(firm.id, 'View Details')}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            style={{fontSize: '11px'}}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleActionClick(firm.id, 'Manage Billing')}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            style={{fontSize: '11px'}}
                          >
                            Manage Billing
                          </button>
                          <button
                            onClick={() => handleActionClick(firm.id, 'Suspend User')}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                            style={{fontSize: '11px'}}
                          >
                            Suspend User
                          </button>
                          <button
                            onClick={() => handleActionClick(firm.id, 'Delete')}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                            style={{fontSize: '11px'}}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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
