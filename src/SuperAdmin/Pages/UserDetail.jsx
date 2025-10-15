import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX, FiUsers, FiUserCheck, FiDollarSign, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { XIcon ,BlueUserIcon, ClientsIcon, DollarIcon, ActiveIcon } from '../Components/icons';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);

  // Mock data for the specific user (in real app, this would come from API)
  const userData = {
    id: userId,
    firmName: 'Johnson & Associates CPA',
    subtitle: 'Comprehensive firm management and analytics',
    owner: 'Michael Johnson',
    email: 'admin@johnsonassociates.com',
    phone: '+1 (555) 123-4567',
    taxId: '12-3456789',
    joinDate: '2024-01-15',
    users: 15,
    clients: 234,
    revenue: '$2,990',
    overallHealth: 98,
    storageUsed: 45,
    storageTotal: 200,
    lastActive: '2 hours ago',
    plan: 'Professional',
    planColor: '#1E40AF',
    status: 'Active',
    statusColor: '#22C55E'
  };

  const handleClose = () => {
    navigate('/superadmin/users');
  };

  const handleViewBilling = (billing) => {
    setSelectedBilling(billing);
    setShowBillingModal(true);
  };

  const handleCloseModal = () => {
    setShowBillingModal(false);
    setSelectedBilling(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FF] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className=" rounded-lg p-6 mb-6 ">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-[#3B4A66] mb-2">{userData.firmName}</h3>
              <p className="text-[#3B4A66] text-sm">{userData.subtitle}</p>
            </div>
            <button
              onClick={handleClose}
              
            >   
              <XIcon size={24} />
            </button>
          </div>
        </div>

         {/* Navigation Tabs */}
         <div className="bg-white rounded-lg border border-[#E8F0FF] px-4 py-2 mb-6 w-fit">
           <div className="flex space-x-1">
             <button
               onClick={() => setActiveTab('overview')}
               className={`px-6 py-3 font-medium transition-colors ${
                 activeTab === 'overview'
                   ? 'bg-[#3B4A66] text-white'
                   : 'text-gray-700 hover:text-gray-900'
               }`}
               style={{borderRadius: '7px'}}
             >
               Overview
             </button>
             <button
               onClick={() => setActiveTab('subscription')}
               className={`px-6 py-3 font-medium transition-colors ${
                 activeTab === 'subscription'
                   ? 'bg-[#3B4A66] text-white'
                   : 'text-gray-700 hover:text-gray-900'
               }`}
               style={{borderRadius: '7px'}}
             >
               Subscription Plan
             </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab userData={userData} />}
        {activeTab === 'subscription' && <SubscriptionTab userData={userData} onViewBilling={handleViewBilling} />}
      </div>

      {/* Billing Details Modal */}
      {showBillingModal && (
        <BillingModal 
          billing={selectedBilling} 
          userData={userData}
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ userData }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-[#3B4A66] text-sm font-medium mb-1">Users</p>
               <p className="text-3xl font-bold text-[#3B4A66]">{userData.users}</p>
               <p className="text-[#3B4A66] text-sm">Active staff members</p>
            </div>
            <div >
              <BlueUserIcon size={35} />
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-[#3B4A66] text-sm font-medium mb-1">Clients</p>
               <p className="text-3xl font-bold text-[#3B4A66]">{userData.clients}</p>
               <p className="text-[#3B4A66] text-sm">Staff members with access</p>
            </div>
            <div >
              <ClientsIcon size={35} />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-[#3B4A66] text-sm font-medium mb-1">Revenue</p>
               <p className="text-3xl font-bold text-[#3B4A66]">{userData.revenue}</p>
               <p className="text-[#3B4A66] text-sm">Monthly subscription</p>
            </div>
            <div >
              <DollarIcon size={35} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm Information */}
        <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
          <h5  className="text-md font-semibold text-[#3B4A66] mb-4">Firm Information</h5>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#3B4A66] text-sm font-medium">Owner:</span>
              <span className="text-gray-[#3B4A66] font-medium">{userData.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3B4A66] text-sm font-medium   ">Email:</span>
              <span className="text-[#3B4A66] font-medium">{userData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3B4A66] text-sm font-medium">Phone:</span>
              <span className="text-[#3B4A66]    font-medium">{userData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3B4A66] text-sm font-medium">Tax ID:</span>
              <span className="text-[#3B4A66]    font-medium">{userData.taxId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3B4A66] text-sm font-medium">Join Date:</span>
              <span className="text-[#3B4A66]    font-medium">{userData.joinDate}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
          <h5 className="text-md font-semibold text-[#3B4A66] mb-4">System Health</h5>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#3B4A66] text-sm">Overall Health</span>
                <span className="text-[#3B4A66] font-medium">{userData.overallHealth}%</span>
              </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="bg-[#3B4A66] h-2 rounded-full" 
                   style={{ width: `${userData.overallHealth}%` }}
                 ></div>
               </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#3B4A66] text-sm">Storage Used</span>
                <span className="text-[#3B4A66] font-medium">{userData.storageUsed}GB / {userData.storageTotal}GB</span>
              </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="bg-[#3B4A66] h-2 rounded-full" 
                   style={{ width: `${(userData.storageUsed / userData.storageTotal) * 100}%` }}
                 ></div>
               </div>
            </div>
              <div className="flex items-center text-[#3B4A66] text-sm">
               <div className="mr-2">
                 <ActiveIcon />
               </div>
               Last active: {userData.lastActive}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subscription Plan Tab Component
const SubscriptionTab = ({ userData, onViewBilling }) => {
  // Mock billing data
  const billingHistory = [
    {
      invoiceId: '#001',
      planName: 'Professional',
      amount: '$2,999',
      purchaseDate: '14-01-2024',
      endDate: '14-01-2025'
    },
    {
      invoiceId: '#001',
      planName: 'Pro',
      amount: '$19.00',
      purchaseDate: '14-01-2024',
      endDate: '14-01-2025'
    },
    {
      invoiceId: '#001',
      planName: 'Business',
      amount: '$15.00',
      purchaseDate: '14-01-2024',
      endDate: '14-01-2025'
    },
    {
      invoiceId: '#001',
      planName: 'Professional',
      amount: '$2,999',
      purchaseDate: '14-01-2024',
      endDate: '14-01-2025'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
        <h5 className="text-md font-semibold text-[#3B4A66] mb-4">Current Plan</h5>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[#3B4A66] text-sm font-medium">Plan:</span>
            <span 
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: userData.planColor }}
            >
              {userData.plan}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[#3B4A66] text-sm font-medium">Monthly Cost:</span>
            <span className="text-[#3B4A66] font-medium">$2,999</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[#3B4A66] text-sm font-medium">Next Billing:</span>
            <span className="text-[#3B4A66] font-medium">15-01-2025</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[#3B4A66] text-sm font-medium">Status:</span>
            <span 
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: userData.statusColor }}
            >
              {userData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Billing And Subscription Section */}
      <div className="bg-white rounded-lg p-6 border border-[#E8F0FF]">
        <h5 className="text-md font-semibold text-[#3B4A66] mb-4">Billing And Subscription</h5>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">Invoice ID</th>
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">Plan Name</th>
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">Amounts</th>
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">Purchase Date</th>
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">End Date</th>
                <th className="text-left py-3 px-2 text-[#3B4A66] text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((billing, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-[#3B4A66] text-sm">{billing.invoiceId}</td>
                  <td className="py-3 px-2 text-[#3B4A66] text-sm">{billing.planName}</td>
                  <td className="py-3 px-2 text-[#3B4A66] text-sm">{billing.amount}</td>
                  <td className="py-3 px-2 text-[#3B4A66] text-sm">{billing.purchaseDate}</td>
                  <td className="py-3 px-2 text-[#3B4A66] text-sm">{billing.endDate}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onViewBilling(billing)}
                        className="text-[#3B4A66] hover:text-blue-600"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="text-[#3B4A66] hover:text-blue-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
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
};

// Billing Details Modal Component
const BillingModal = ({ billing, userData, onClose }) => {
  if (!billing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] ">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto" style={{borderRadius: '10px'}}>
        {/* Modal Header */}
        <div className="flex justify-between items-start p-4 border-gray-200">
          <div>
            <h5 className="text-xl font-bold text-[#3B4A66] mb-1">Billing Details</h5>
            <p className="text-gray-600 text-sm">View and download your subscription invoices, including add-ons.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-2">
          {/* Invoice Details */}
          <div className="flex flex-col gap-4 py-2 ">
            <div>
              <h6 className="text-xs font-semibold text-[#3B4A66] mb-2">Invoice Details</h6>
               <div className="space-y-1 text-xs grid grid-cols-3 gap-4">
                 <div>
                   <span className="text-gray-600">Name:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">Michael Chen</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Phone:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">(555) 987-6543</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Email:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">michael.chen@firm.com</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Invoice:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">#INV-2025-001</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Billing Period:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">01/08/2024 - 01/08/2025</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Plan:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">Pro Plan - Yearly</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Status:</span>
                   <br />
                   <span className="text-[#3B4A66] font-medium">Paid</span>
                 </div>
               </div>
            </div>

            <div>
              <h6 className="text-xs font-semibold text-[#3B4A66] mb-2">Billing Information</h6>
               <div className="space-y-1 text-xs flex flex-row gap-31">
                 <div className="flex flex-col">
                    <span className="text-gray-600">Billed To:</span>
                    <span className="text-[#3B4A66] font-medium">Michael Chen<br />123 Main Street<br />New York, NY</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-[#3B4A66] font-medium">Visa .... 5423</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#E8F0FF] p-2 rounded-lg">
           
             <div >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-[#3B4A66] font-semibold text-xs">Description</th>
                    <th className="text-center py-2 px-2 text-[#3B4A66] font-semibold text-xs">Qty</th>
                    <th className="text-right py-2 px-2 text-[#3B4A66] font-semibold text-xs">Unit Price</th>
                    <th className="text-right py-2 px-2 text-[#3B4A66] font-semibold text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                   <tr className="border border-[#E8F0FF] p-2 rounded-lg mb-2">
                    <td className="py-2 px-2 text-[#3B4A66] text-xs">#Pro Plan - Monthly Subscription</td>
                    <td className="py-2 px-2 text-center text-[#3B4A66] text-xs">1</td>
                    <td className="py-2 px-2 text-right text-[#3B4A66] text-xs">$49.00</td>
                    <td className="py-2 px-2 text-right text-[#3B4A66] text-xs">$49.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add-ons Section */}
            <div className="mt-4">
              <h6 className="text-xs font-semibold text-[#3B4A66] mb-2">Add-ons</h6>
              <div className="space-y-2">
                <div className="border border-[#E8F0FF] p-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3B4A66] text-xs">Extra Storage (50GB)</span>
                    <span className="text-[#3B4A66] text-xs">1</span>
                    <span className="text-[#3B4A66] text-xs">$5.00</span>
                    <span className="text-[#3B4A66] text-xs">$5.00</span>
                  </div>
                </div>
                <div className="border border-[#E8F0FF] p-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3B4A66] text-xs">Priority Support</span>
                    <span className="text-[#3B4A66] text-xs">1</span>
                    <span className="text-[#3B4A66] text-xs">$10.00</span>
                    <span className="text-[#3B4A66] text-xs">$10.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
             <div className="mt-2 space-y-2">
               <div className="flex justify-between items-center border border-[#E8F0FF] p-2 rounded-lg">
                  <span className="text-[#3B4A66] text-xs">Taxes (8%):</span>
                  <span className="text-[#3B4A66] font-medium text-xs">$5.12</span>
                </div>
               <div className="flex justify-between items-center text-sm font-bold border border-[#E8F0FF] p-2 rounded-lg">
                <span className="text-[#3B4A66]">Grand Total:</span>
                <span className="text-[#3B4A66]">$69.12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className=" border border-[#E8F0FF] p-4" style={{borderRadius: '0 0 10px 10px'}}>
          <div className="flex justify-start">
            <button 
              className="bg-[#F56D2D] text-white py-2 px-4 font-medium hover:bg-[#E55A1A] transition-colors"
              style={{borderRadius: '10px'}}
              onClick={() => {
                // Handle download logic here
                console.log('Download invoice');
              }}
            >
              Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
