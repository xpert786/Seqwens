import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiUpload, FiDownload, FiMoreVertical, FiUsers } from 'react-icons/fi';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl } from '../../ClientOnboarding/utils/corsConfig';

const API_BASE_URL = getApiBaseUrl();

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch firms from API
  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAccessToken();
        const apiUrl = `${API_BASE_URL}/user/superadmin/firms/`;
        console.log('Fetching firms from:', apiUrl);
        console.log('Using token:', token ? 'Token present' : 'No token');
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch firms');
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.firms) {
          // Transform API data to match component structure
          const transformedFirms = data.data.firms.map(firm => ({
            id: firm.id,
            firmName: firm.name,
            adminName: firm.admin_user_name || 'N/A',
            email: firm.admin_user_email || firm.email || 'N/A',
            plan: firm.subscription_plan ? firm.subscription_plan.charAt(0).toUpperCase() + firm.subscription_plan.slice(1) : 'N/A',
            planColor: 'text-white',
            status: firm.status ? firm.status.charAt(0).toUpperCase() + firm.status.slice(1) : 'N/A',
            statusColor: 'text-white',
            users: firm.staff_count || 0,
            revenue: `$${(parseFloat(firm.total_revenue) || 0).toFixed(2)}`,
            lastActive: firm.trial_days_remaining ? `${firm.trial_days_remaining} days left` : 'N/A',
            // Additional API data
            clientCount: firm.client_count || 0,
            monthlyFee: firm.monthly_fee || '0.00',
            trialEndDate: firm.trial_end_date,
            subscriptionStartDate: firm.subscription_start_date,
            rawPlan: firm.subscription_plan || '',
            rawStatus: firm.status || '',
          }));
          
          setFirms(transformedFirms);
        } else {
          setFirms([]);
        }
      } catch (err) {
        console.error('Error fetching firms:', err);
        setError(err.message || 'Failed to load firms');
      } finally {
        setLoading(false);
      }
    };

    fetchFirms();
  }, []);

  const handleActionClick = (firmId, action) => {
    if (action === 'View Details') {
      navigate(`/superadmin/users/${firmId}`);
    } else {
      console.log(`${action} clicked for firm ${firmId}`);
    }
    setActiveDropdown(null);
  };

  return (
    <div className="p-6 bg-[#F6F7FF]">
      {/* Page Title and Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <p className="text-sm">Manage all platform users across firms</p>
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

     

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <div className="spinner-border text-primary mx-auto" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-gray-600">Loading firms...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="text-red-600 text-center">
            <p className="font-semibold">Error loading firms</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Firms Message */}
      {!loading && !error && firms.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF] p-12 text-center">
          <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Firms Found</h3>
          <p className="text-gray-600">There are no firms registered on the platform yet.</p>
        </div>
      )}

      {/* Firms Section */}
      {!loading && !error && firms.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E8F0FF]">
          {/* Section Header */}
          <div className="p-2  border-[#E8F0FF]">
            <h6 className="text-xs font-semibold text-gray-800 mb-0">Firms ({firms.length})</h6>
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
                      backgroundColor: firm.rawPlan === 'professional' ? '#1E40AF' : 
                                     firm.rawPlan === 'team' ? '#22C55E' :
                                     firm.rawPlan === 'enterprise' ? '#3AD6F2' :
                                     firm.rawPlan === 'solo' ? '#FBBF24' : '#6B7280'
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
                      backgroundColor: firm.rawStatus === 'trial' ? '#1E40AF' : 
                                     firm.rawStatus === 'active' ? '#22C55E' :
                                     firm.rawStatus === 'suspended' ? '#EF4444' : '#6B7280'
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
      )}
    </div>
  );
}
