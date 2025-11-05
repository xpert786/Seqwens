import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MailIcon, CallIcon, WatIcon,DollerIcon, AppointIcon,DoccIcon } from '../../Components/icons';
import OverviewTab from './ClientTabs/OverviewTab';
import DocumentsTab from './ClientTabs/DocumentsTab';
import BillingTab from './ClientTabs/BillingTab';
import TimelineTab from './ClientTabs/TimelineTab';
import AppointmentsTab from './ClientTabs/AppointmentsTab';
import DueDiligenceTab from './ClientTabs/DueDiligenceTab';
import NotesTab from './ClientTabs/NotesTab';

export default function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Mock data for the client - in real app, this would come from an API
  const client = {
    id: id || 1,
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    ssn: '123-45-6789',
    status: 'active',
    filingStatus: 'Married',
    gender: 'Male',
    dob: 'August 27th, 1999',
    address: {
      line: 'No 35 Jimmy Ebi Street',
      city: 'Yenagoa',
      state: 'Bayelsa',
      zip: '654133'
    },
    spouse: {
      name: 'Xavier Woods',
      gender: 'Male',
      dob: 'March 27th, 1999',
      ssn: '515424561LN23',
      filingStatus: 'Married Filing Jointly'
    },
    assignedStaff: 'Michael Chen',
    joinDate: '15-01-2024',
    totalBilled: '$15,420',
    documents: 10,
    appointments: 3,
    lastActivity: '2 days ago'
  };

  const tabs = [
    'Overview',
    'Documents',
    'Billing',
    'Timeline',
    'Appointments',
    'Due-Diligence',
    'Notes'
  ];

  const initials = (client.name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Details</h4>
        <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Detailed information about {client.name}</p>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white rounded-xl p-6 mb-6 !border border-[#E8F0FF]">
        <div className="flex items-start gap-6">
          {/* Left Side - Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl flex-shrink-0">
            {initials}
          </div>

          {/* Center - Client Details */}
          <div className="flex-1">
            {/* Name and Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{client.name}</h3>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#22C55E] text-white font-[BasisGrotesquePro]">
                {client.status}
              </span>
            </div>

            {/* Contact Information - Responsive Grid */}
            <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
              {/* Email - Row 1, Col 1 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Email</div>
                <div className="flex items-center gap-2">
                  <MailIcon />
                  <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.email}</span>
                </div>
              </div>
              {/* Phone - Row 1, Col 2 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
                <div className="flex items-center gap-2">
                  <CallIcon />
                  <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.phone}</span>
                </div>
              </div>
              {/* Filing Status - Row 2, Col 1 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Filing Status</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.filingStatus}</div>
              </div>
              {/* SSN - Row 2, Col 2 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Social Security Number (SSN)</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.ssn}</div>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.8332 1.16797L8.91649 12.3585C8.85665 12.5295 8.61852 12.5392 8.54495 12.3736L6.4165 7.58464M12.8332 1.16797L1.64265 5.08465C1.47168 5.14449 1.46197 5.38262 1.62749 5.45619L6.4165 7.58464M12.8332 1.16797L6.4165 7.58464" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Send Message
            </button>
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 !border border-[#E8F0FF]">
                  <div className="py-1">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors">
                      Edit Client
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors">
                      View Timeline
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors">
                      Reassign Staff
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors">
                      Delete Client
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Billed', value: client.totalBilled, icon: <DollerIcon /> },
          { label: 'Documents', value: client.documents, icon: <DoccIcon /> },
          { label: 'Appointments', value: client.appointments, icon: <AppointIcon /> },
          { label: 'Last Activity', value: client.lastActivity, icon: <WatIcon /> }
        ].map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 !border border-[#E8F0FF] relative">
            {/* Icon at top right */}
            <div className="absolute top-4 right-4 text-blue-500">
              {metric.icon}
            </div>
            {/* Label at top left */}
            <div className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-2">{metric.label}</div>
            {/* Value below label */}
            <div className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white !rounded-lg p-3 mb-6 !border border-[#E8F0FF] w-fit">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 !rounded-lg text-sm font-medium font-[BasisGrotesquePro] whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab
                  ? 'bg-[#3AD6F2] text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <OverviewTab client={client} />
      )}

      {activeTab === 'Documents' && (
        <DocumentsTab client={client} />
      )}

      {activeTab === 'Billing' && (
        <BillingTab client={client} />
      )}

      {activeTab === 'Timeline' && (
        <TimelineTab client={client} />
      )}

      {activeTab === 'Appointments' && (
        <AppointmentsTab client={client} />
      )}

      {activeTab === 'Due-Diligence' && (
        <DueDiligenceTab client={client} />
      )}

      {activeTab === 'Notes' && (
        <NotesTab client={client} />
      )}
    </div>
  );
}

