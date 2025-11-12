import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { MailIcon, CallIcon, WatIcon, DollerIcon, AppointIcon, DoccIcon } from '../../Components/icons';
import OverviewTab from './ClientTabs/OverviewTab';
import DocumentsTab from './ClientTabs/DocumentsTab';
import BillingTab from './ClientTabs/BillingTab';
import TimelineTab from './ClientTabs/TimelineTab';
import AppointmentsTab from './ClientTabs/AppointmentsTab';
import DueDiligenceTab from './ClientTabs/DueDiligenceTab';
import NotesTab from './ClientTabs/NotesTab';

const API_BASE_URL = getApiBaseUrl();

export default function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch client details from API
  const fetchClientDetails = useCallback(async () => {
    if (!id) {
      setError('Client ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const url = `${API_BASE_URL}/user/firm-admin/clients/${id}/`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setClient(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch client details on mount
  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

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

  // Map API data to component format
  const clientData = client ? {
    id: client.id,
    initials: client.initials || '',
    name: client.full_name || `${client.first_name} ${client.last_name}`,
    firstName: client.first_name || '',
    lastName: client.last_name || '',
    profilePicture: client.profile_picture || null,
    email: client.email || client.contact_details?.email || '',
    phone: client.phone_number_formatted || client.phone_number || client.contact_details?.phone_formatted || client.contact_details?.phone || '',
    phoneRaw: client.phone_number || client.contact_details?.phone || '',
    ssn: client.ssn || client.personal_information?.ssn || '',
    ssnValue: client.personal_information?.ssn_value || '',
    status: client.status || client.account_details?.status || 'active',
    filingStatus: client.filing_status || client.personal_information?.filing_status || '',
    filingStatusValue: client.personal_information?.filing_status_value || '',

    dob: client.personal_information?.date_of_birth || '',
    dobValue: client.personal_information?.date_of_birth_value || '',
    address: {
      line: client.address?.address_line || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
      zip: client.address?.zip_code || ''
    },
    spouse: {
      name: client.spouse_information?.name || '',
      firstName: client.spouse_information?.first_name || '',
      middleName: client.spouse_information?.middle_name || '',
      lastName: client.spouse_information?.last_name || '',

      dob: client.spouse_information?.date_of_birth || '',
      dobValue: client.spouse_information?.date_of_birth_value || '',
      ssn: client.spouse_information?.ssn || '',
      ssnValue: client.spouse_information?.ssn_value || '',
      filingStatus: client.spouse_information?.filing_status || '',
      filingStatusValue: client.spouse_information?.filing_status_value || ''
    },
    spouseContact: {
      phone: client.spouse_contact_details?.phone || '',
      email: client.spouse_contact_details?.email || ''
    },
    assignedStaff: {
      id: client.account_details?.assigned_staff?.id || null,
      name: client.account_details?.assigned_staff_name || client.account_details?.assigned_staff?.name || '',
      email: client.account_details?.assigned_staff?.email || ''
    },
    joinDate: client.account_details?.join_date || '',
    joinDateValue: client.account_details?.join_date_value || client.date_joined || '',
    accountStatus: client.account_details?.status || 'active',
    accountStatusDisplay: client.account_details?.status_display || 'Active',
    totalBilled: client.statistics?.total_billed_formatted || '$0.00',
    totalBilledRaw: client.statistics?.total_billed || 0,
    documents: client.statistics?.documents || 0,
    appointments: client.statistics?.appointments || 0,
    lastActivity: client.statistics?.last_activity || client.last_activity?.last_active_relative || '',
    lastActivityDetails: {
      lastActive: client.last_activity?.last_active || '',
      lastActiveDisplay: client.last_activity?.last_active_display || '',
      lastActiveRelative: client.last_activity?.last_active_relative || ''
    },
    billingHistory: client.billing_history || [],
    dateJoined: client.date_joined || ''
  } : null;

  const tabs = [
    'Overview',
    'Documents',
    'Billing',
    'Timeline',
    'Appointments',
    'Due-Diligence',
    'Notes'
  ];

  const initials = clientData ? (clientData.initials || clientData.name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() : '';

  // Loading state
  if (loading) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading client details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !clientData) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Details</h4>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || 'Client not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            style={{ borderRadius: '7px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Details</h4>
        </div>
        <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Detailed information about {clientData.name}</p>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white rounded-xl p-6 mb-6 !border border-[#E8F0FF]">
        <div className="flex items-start gap-6">
          {/* Left Side - Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl flex-shrink-0 overflow-hidden relative">
            {clientData.profilePicture ? (
              <img
                src={clientData.profilePicture}
                alt={clientData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center avatar-fallback ${clientData.profilePicture ? 'hidden' : ''}`}>
              {initials}
            </div>
          </div>

          {/* Center - Client Details */}
          <div className="flex-1">
            {/* Name and Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{clientData.name}</h3>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white font-[BasisGrotesquePro] ${clientData.status === 'active' ? 'bg-[#22C55E]' :
                clientData.status === 'pending' ? 'bg-[#F59E0B]' :
                  'bg-gray-500'
                }`}>
                {clientData.status.charAt(0).toUpperCase() + clientData.status.slice(1)}
              </span>
            </div>

            {/* Contact Information - Responsive Grid */}
            <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
              {/* Email - Row 1, Col 1 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Email</div>
                <div className="flex items-center gap-2">
                  <MailIcon />
                  <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.email}</span>
                </div>
              </div>
              {/* Phone - Row 1, Col 2 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
                <div className="flex items-center gap-2">
                  <CallIcon />
                  <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.phone}</span>
                </div>
              </div>
              {/* Filing Status - Row 2, Col 1 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Filing Status</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.filingStatus}</div>
              </div>
              {/* SSN - Row 2, Col 2 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Social Security Number (SSN)</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.ssn || 'N/A'}</div>
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
          { label: 'Total Billed', value: clientData.totalBilled, icon: <DollerIcon /> },
          { label: 'Documents', value: clientData.documents, icon: <DoccIcon /> },
          { label: 'Appointments', value: clientData.appointments, icon: <AppointIcon /> },
          { label: 'Last Activity', value: clientData.lastActivity, icon: <WatIcon /> }
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
        <OverviewTab client={clientData} />
      )}

      {activeTab === 'Documents' && (
        <DocumentsTab client={clientData} />
      )}

      {activeTab === 'Billing' && (
        <BillingTab client={clientData} billingHistory={clientData.billingHistory} />
      )}

      {activeTab === 'Timeline' && (
        <TimelineTab client={clientData} />
      )}

      {activeTab === 'Appointments' && (
        <AppointmentsTab client={clientData} />
      )}

      {activeTab === 'Due-Diligence' && (
        <DueDiligenceTab client={clientData} />
      )}

      {activeTab === 'Notes' && (
        <NotesTab client={clientData} />
      )}
    </div>
  );
}

