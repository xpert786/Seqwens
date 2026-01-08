import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminClientsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { MailIcon, CallIcon, WatIcon, DollerIcon, AppointIcon, DoccIcon } from '../../Components/icons';
import OverviewTab from './ClientTabs/OverviewTab';
import DocumentsTab from './ClientTabs/DocumentsTab';
import BillingTab from './ClientTabs/BillingTab';
import TimelineTab from './ClientTabs/TimelineTab';
import AppointmentsTab from './ClientTabs/AppointmentsTab';
import NotesTab from './ClientTabs/NotesTab';
import DataEntryFormTab from './ClientTabs/DataEntryFormTab';
import '../../styles/ClientDetails.css';

const API_BASE_URL = getApiBaseUrl();

export default function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('us');

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
        // Initialize edit form data
        const profile = result.data.profile || {};
        const contact = result.data.contact_details || {};
        const initialFormData = {
          first_name: profile.first_name || result.data.personal_information?.first_name || '',
          last_name: profile.last_name || result.data.personal_information?.last_name || '',
          email: profile.email || contact.email || '',
          phone_number: profile.phone || contact.phone || ''
        };
        setEditFormData(initialFormData);
        setOriginalFormData(initialFormData);
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

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!id || !editFormData) return;

    try {
      setSaving(true);
      
      // Build payload with only changed fields
      const payload = {};
      if (editFormData.first_name !== originalFormData.first_name) {
        payload.first_name = editFormData.first_name;
      }
      if (editFormData.last_name !== originalFormData.last_name) {
        payload.last_name = editFormData.last_name;
      }
      if (editFormData.email !== originalFormData.email) {
        payload.email = editFormData.email;
      }
      if (editFormData.phone_number !== originalFormData.phone_number) {
        payload.phone = editFormData.phone_number;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes to save', {
          position: "top-right",
          autoClose: 3000,
        });
        setIsEditMode(false);
        return;
      }

      const response = await firmAdminClientsAPI.updateClient(id, payload);
      
      if (response.success) {
        toast.success('Client details updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        setIsEditMode(false);
        setOriginalFormData({ ...editFormData });
        // Refresh client data
        await fetchClientDetails();
      } else {
        throw new Error(response.message || 'Failed to update client');
      }
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error(handleAPIError(err) || 'Failed to update client details', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (originalFormData) {
      setEditFormData({ ...originalFormData });
    }
  };

  // Map API data to component format
  const clientData = client ? {
    id: client.profile?.id || client.id,
    initials: client.profile?.initials || '',
    name: isEditMode && editFormData 
      ? `${editFormData.first_name} ${editFormData.last_name}`.trim() || 'Unknown Client'
      : client.profile?.name || client.personal_information?.name || (client.profile?.first_name && client.profile?.last_name ? `${client.profile.first_name} ${client.profile.last_name}` : '') || 'Unknown Client',
    firstName: isEditMode && editFormData ? editFormData.first_name : (client.profile?.first_name || client.personal_information?.first_name || ''),
    lastName: isEditMode && editFormData ? editFormData.last_name : (client.profile?.last_name || client.personal_information?.last_name || ''),
    profilePicture: client.profile?.profile_picture_url || null,
    email: isEditMode && editFormData ? editFormData.email : (client.profile?.email || client.contact_details?.email || ''),
    phone: isEditMode && editFormData ? editFormData.phone_number : (client.profile?.phone_formatted || client.contact_details?.phone_formatted || client.profile?.phone || client.contact_details?.phone || ''),
    phoneRaw: isEditMode && editFormData ? editFormData.phone_number : (client.profile?.phone || client.contact_details?.phone || ''),
    ssn: client.personal_information?.ssn || '',
    ssnValue: client.personal_information?.ssn_value || '',
    status: client.account_details?.status || client.profile?.account_status?.toLowerCase() || 'active',
    filingStatus: client.personal_information?.filing_status || '',
    filingStatusValue: client.personal_information?.filing_status_value || '',
    gender: client.personal_information?.gender || client.personal_information?.gender_value || null,
    dob: client.personal_information?.date_of_birth || '',
    dobValue: client.personal_information?.date_of_birth_value || '',
    address: {
      line: client.address_information?.address_line || '',
      city: client.address_information?.city || '',
      state: client.address_information?.state || '',
      zip: client.address_information?.zip_code || ''
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
    joinDateValue: client.account_details?.join_date_value || '',
    accountStatus: client.account_details?.status || client.profile?.account_status?.toLowerCase() || 'active',
    accountStatusDisplay: client.account_details?.status_display || client.profile?.account_status || 'Active',
    totalBilled: client.summary_cards?.total_billed || client.engagement_metrics?.outstanding_balance || '$0.00',
    totalBilledRaw: 0, // Parse if needed from total_billed string
    documents: client.summary_cards?.documents_uploaded || client.engagement_metrics?.documents_uploaded || 0,
    appointments: client.engagement_metrics?.total_appointments || client.summary_cards?.appointments_scheduled || 0,
    lastActivity: client.summary_cards?.last_activity || client.summary_cards?.last_activity_relative || '',
    lastActivityDetails: {
      lastActive: client.summary_cards?.last_activity_value || '',
      lastActiveDisplay: client.summary_cards?.last_activity || '',
      lastActiveRelative: client.summary_cards?.last_activity_relative || ''
    },
    billingHistory: client.billing_history || [],
    dateJoined: client.account_details?.join_date_value || ''
  } : null;

  const tabs = [
    'Overview',
    'Documents',
    'Data Entry Form',
    'Billing',
    'Timeline',
    'Appointments',
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
              {isEditMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                    placeholder="First Name"
                    className="px-3 py-2 text-xl font-bold text-gray-900 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    style={{ width: '150px' }}
                  />
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                    placeholder="Last Name"
                    className="px-3 py-2 text-xl font-bold text-gray-900 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    style={{ width: '150px' }}
                  />
                </div>
              ) : (
                <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{clientData.name}</h3>
              )}
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
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <MailIcon />
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm text-gray-900 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MailIcon />
                    <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.email}</span>
                  </div>
                )}
              </div>
              {/* Phone - Row 1, Col 2 */}
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <CallIcon />
                    <PhoneInput
                      country={phoneCountry}
                      value={editFormData.phone_number || ''}
                      onChange={(phone) => handleEditFormChange('phone_number', phone)}
                      onCountryChange={(countryCode) => setPhoneCountry(countryCode.toLowerCase())}
                      inputClass="flex-1 px-2 py-1 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                      containerClass="phone-input-container"
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CallIcon />
                    <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{clientData.phone}</span>
                  </div>
                )}
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
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 !rounded-lg hover:bg-gray-300 transition font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-[#3AD6F2] text-white !rounded-lg hover:bg-[#00C0C6] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 1.75H3.5C3.08579 1.75 2.75 2.08579 2.75 2.5V11.5C2.75 11.9142 3.08579 12.25 3.5 12.25H12.5C12.9142 12.25 13.25 11.9142 13.25 11.5V6" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.2813 1.2199C10.5797 0.92153 10.9844 0.753906 11.4063 0.753906C11.8283 0.753906 12.233 0.92153 12.5313 1.2199C12.8297 1.51826 12.9973 1.92294 12.9973 2.3449C12.9973 2.76685 12.8297 3.17153 12.5313 3.4699L6.77157 10.2304C6.59348 10.4083 6.37347 10.5386 6.13182 10.6091L3.97707 11.2391C3.91253 11.258 3.84412 11.2591 3.779 11.2424C3.71388 11.2257 3.65444 11.1918 3.60691 11.1443C3.55937 11.0968 3.52549 11.0373 3.5088 10.9722C3.49212 10.9071 3.49325 10.8387 3.51207 10.7741L4.14207 8.6194C4.21297 8.37793 4.34347 8.15819 4.52157 7.9804L10.2813 1.2199Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (id) {
                      navigate(`/firmadmin/messages?clientId=${id}`);
                    } else {
                      navigate('/firmadmin/messages');
                    }
                  }}
                  className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.8332 1.16797L8.91649 12.3585C8.85665 12.5295 8.61852 12.5392 8.54495 12.3736L6.4165 7.58464M12.8332 1.16797L1.64265 5.08465C1.47168 5.14449 1.46197 5.38262 1.62749 5.45619L6.4165 7.58464M12.8332 1.16797L6.4165 7.58464" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send Message
                </button>
              </>
            )}
            {/* <div className="relative dropdown-container">
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
            </div> */}
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
        <OverviewTab 
          client={clientData} 
          isEditMode={isEditMode}
          editFormData={editFormData}
          onEditFormChange={handleEditFormChange}
          phoneCountry={phoneCountry}
          onPhoneCountryChange={setPhoneCountry}
        />
      )}

      {activeTab === 'Documents' && (
        <DocumentsTab client={clientData} />
      )}

      {activeTab === 'Data Entry Form' && (
        <DataEntryFormTab client={clientData} />
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

      {activeTab === 'Notes' && (
        <NotesTab client={clientData} />
      )}
    </div>
  );
}

