import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import SecurityTab from './SecurityTab';

const API_BASE_URL = getApiBaseUrl();

const SecurityTabPage = () => {
  const navigate = useNavigate();
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch client details from API
  const fetchClientDetails = useCallback(async () => {
    if (!clientId) {
      setError('Client ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const url = `${API_BASE_URL}/user/firm-admin/clients/${clientId}/`;

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
  }, [clientId]);

  // Fetch client details on mount
  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  // Map API data to component format (same as ClientDetails)
  const clientData = client ? {
    id: client.profile?.id || client.id,
    initials: client.profile?.initials || '',
    name: client.profile?.name || client.personal_information?.name || (client.profile?.first_name && client.profile?.last_name ? `${client.profile.first_name} ${client.profile.last_name}` : '') || 'Unknown Client',
    firstName: client.profile?.first_name || client.personal_information?.first_name || '',
    lastName: client.profile?.last_name || client.personal_information?.last_name || '',
    profilePicture: client.profile?.profile_picture_url || null,
    email: client.profile?.email || client.contact_details?.email || '',
    phone: client.profile?.phone_formatted || client.contact_details?.phone_formatted || client.profile?.phone || client.contact_details?.phone || '',
    phoneRaw: client.profile?.phone || client.contact_details?.phone || '',
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
    lastLogin: client.account_details?.last_login || '',
    lastLoginValue: client.account_details?.last_login_value || '',
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

  // Loading state
  if (loading) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading client security details...</p>
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
            <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Security</h4>
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
            onClick={() => navigate(`/firmadmin/clients/${clientId}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            style={{ borderRadius: '7px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Client
          </button>
          <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Security Settings</h4>
        </div>
        <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Security settings for {clientData.name}</p>
      </div>

      {/* Security Tab Content */}
      <SecurityTab client={clientData} />
    </div>
  );
};

export default SecurityTabPage;
