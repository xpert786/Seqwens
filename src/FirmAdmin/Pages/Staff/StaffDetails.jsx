import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import OverviewTab from './StaffTabs/OverviewTab';
import AssignedClientsTab from './StaffTabs/AssignedClientsTab';
import CurrentTasksTab from './StaffTabs/CurrentTasksTab';
import PerformanceTab from './StaffTabs/PerformanceTab';
import ScheduleTab from './StaffTabs/ScheduleTab';
import ActivityLogTab from './StaffTabs/ActivityLogTab';
import TaxPreparerPermissionsModal from './TaxPreparerPermissionsModal';

export default function StaffDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Fetch staff details from API
  useEffect(() => {
    if (id) {
      fetchStaffDetails();
    }
  }, [id]);

  const fetchStaffDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm/staff/${id}/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStaffData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch staff details');
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to construct full profile picture URL
  const getProfilePictureUrl = (url) => {
    if (!url) return null;
    // If URL already starts with http:// or https://, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If URL starts with /, prepend API base URL (remove trailing slash from API_BASE_URL if present)
    if (url.startsWith('/')) {
      const API_BASE_URL = getApiBaseUrl();
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      return `${baseUrl}${url}`;
    }
    // Otherwise, assume it's a relative path and prepend API base URL
    const API_BASE_URL = getApiBaseUrl();
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${baseUrl}${url}`;
  };

  // State to track if profile picture failed to load
  const [profilePictureError, setProfilePictureError] = useState(false);

  // Map API data to component format
  const staffMember = staffData ? {
    id: staffData.profile?.id || id,
    name: staffData.profile?.name || 'N/A',
    title: staffData.profile?.role_display || staffData.profile?.role || 'N/A',
    status: staffData.profile?.status ? staffData.profile.status.charAt(0).toUpperCase() + staffData.profile.status.slice(1) : 'Active',
    email: staffData.profile?.email || staffData.contact_information?.email || 'N/A',
    phone: staffData.profile?.phone_number || staffData.contact_information?.phone || 'N/A',
    address: staffData.contact_information?.address || 'N/A',
    department: staffData.employment_details?.department || 'N/A',
    hireDate: staffData.employment_details?.hire_date || 'N/A',
    hoursWeek: staffData.employment_details?.hours_per_week?.toString() || 'N/A',
    clients: staffData.kpis?.clients || 0,
    tasksDone: staffData.kpis?.tasks_done || 0,
    revenue: staffData.kpis?.revenue ? `$${(staffData.kpis.revenue / 1000).toFixed(0)}K` : '$0',
    hours: staffData.kpis?.hours || 0,
    efficiency: staffData.kpis?.efficiency || 0,
    specialties: staffData.specialties || [],
    initials: staffData.profile?.initials || 'NA',
    profilePicture: getProfilePictureUrl(staffData.profile?.profile_picture_url)
  } : null;

  // Reset profile picture error when staff data changes
  useEffect(() => {
    if (staffData) {
      setProfilePictureError(false);
    }
  }, [staffData]);

  const tabs = [
    'Overview',
    'Assigned Clients',
    'Current Tasks',
    'Performance',
    'Schedule',
    'Activity log'
  ];

  // Mock data for different tabs
  const assignedClients = [
    { id: 1, name: 'John Smith', company: 'Smith Enterprises', status: 'Active', lastContact: '2 days ago', avatar: 'JS' },
    { id: 2, name: 'Sarah Johnson', company: 'Individual', status: 'Active', lastContact: '1 week ago', avatar: 'SJ' },
    { id: 3, name: 'Michael Davis', company: 'Davis LLC', status: 'Pending', lastContact: '3 days ago', avatar: 'MD' },
    { id: 4, name: 'Emily Wilson', company: 'Individual', status: 'Active', lastContact: '5 days ago', avatar: 'EW' }
  ];

  const currentTasks = [
    { id: 1, title: 'Complete 2023 Tax Return - John Smith', dueDate: '20-03-2024', progress: 75, priority: 'High', status: 'In Progress' },
    { id: 2, title: 'Review Business Expenses - Davis LLC', dueDate: '22-03-2024', progress: 50, priority: 'Medium', status: 'In Progress' },
    { id: 3, title: 'Quarterly Filing - Multiple Clients', dueDate: '25-03-2024', progress: 25, priority: 'High', status: 'Pending' }
  ];


  if (loading) {
    return (
      <div className="w-full lg:px-4 px-2 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading staff details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full lg:px-4 px-2 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/firmadmin/staff')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No staff data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/firmadmin/staff')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Staff Details</h4>
        <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Detailed information about staff member</p>
      </div>

      {/* Staff Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {staffMember.profilePicture && !profilePictureError ? (
              <img
                src={staffMember.profilePicture}
                alt={staffMember.name}
                className="h-16 w-16 rounded-full object-cover"
                onError={() => setProfilePictureError(true)}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {staffMember.initials}
              </div>
            )}

            {/* Name and Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.name}</h5>
                {/* Active Badge - Desktop: Next to name */}
                <span className="hidden lg:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[#DCFCE7] !text-[#166534]">
                  {staffMember.status.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-[BasisGrotesquePro]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs">{staffMember.title}</span>
              </div>
              {/* Active Badge - Mobile & Small Laptop: Below title */}
              <div className="lg:hidden mt-1.5">
                <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-[#DCFCE7] !text-[#166534]">
                  {staffMember.status.toLowerCase()}
                </span>
              </div>

              {/* Action Buttons - Mobile & Small Laptop: Below title */}
              <div className="flex flex-wrap items-center gap-2 lg:hidden mt-2">
                {/* Send Message Button - Orange gradient */}
                <button className="px-3 py-1.5 bg-[#F56D2D] text-white !rounded-lg hover:from-orange-500 hover:to-orange-700 transition font-[BasisGrotesquePro] flex items-center gap-1.5 text-xs whitespace-nowrap">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.8334 1.16797L8.91673 12.3585C8.85689 12.5295 8.61877 12.5392 8.5452 12.3736L6.41675 7.58464M12.8334 1.16797L1.64289 5.08465C1.47193 5.14449 1.46221 5.38262 1.62774 5.45619L6.41675 7.58464M12.8334 1.16797L6.41675 7.58464" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Send Message
                </button>

                {/* Edit Staff Button - White with pencil icon */}
                <button className="px-3 py-1.5 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2.00015H3.33333C2.97971 2.00015 2.64057 2.14063 2.39052 2.39068C2.14048 2.64072 2 2.97986 2 3.33348V12.6668C2 13.0204 2.14048 13.3596 2.39052 13.6096C2.64057 13.8597 2.97971 14.0002 3.33333 14.0002H12.6667C13.0203 14.0002 13.3594 13.8597 13.6095 13.6096C13.8595 13.3596 14 13.0204 14 12.6668V8.00015M12.25 1.75015C12.5152 1.48493 12.8749 1.33594 13.25 1.33594C13.6251 1.33594 13.9848 1.48493 14.25 1.75015C14.5152 2.01537 14.6642 2.37508 14.6642 2.75015C14.6642 3.12522 14.5152 3.48493 14.25 3.75015L8 10.0002L5.33333 10.6668L6 8.00015L12.25 1.75015Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit Staff
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons - Desktop: Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Send Message Button - Orange gradient */}
            <button className="px-2 py-1.5 bg-[#F56D2D] text-white !rounded-lg hover:from-orange-500 hover:to-orange-700 transition font-[BasisGrotesquePro] flex items-center gap-1.5 text-xs shadow-sm whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.8334 1.16797L8.91673 12.3585C8.85689 12.5295 8.61877 12.5392 8.5452 12.3736L6.41675 7.58464M12.8334 1.16797L1.64289 5.08465C1.47193 5.14449 1.46221 5.38262 1.62774 5.45619L6.41675 7.58464M12.8334 1.16797L6.41675 7.58464" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Send Message
            </button>

            {/* Permissions Button - White with shield icon */}
            <button 
              onClick={() => setShowPermissionsModal(true)}
              className="px-3 py-1.5 bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3334 8.66566C13.3334 11.999 11.0001 13.6657 8.22675 14.6323C8.08152 14.6815 7.92377 14.6792 7.78008 14.6257C5.00008 13.6657 2.66675 11.999 2.66675 8.66566V3.999C2.66675 3.82219 2.73699 3.65262 2.86201 3.52759C2.98703 3.40257 3.1566 3.33233 3.33341 3.33233C4.66675 3.33233 6.33341 2.53233 7.49341 1.519C7.63465 1.39833 7.81432 1.33203 8.00008 1.33203C8.18585 1.33203 8.36551 1.39833 8.50675 1.519C9.67342 2.539 11.3334 3.33233 12.6667 3.33233C12.8436 3.33233 13.0131 3.40257 13.1382 3.52759C13.2632 3.65262 13.3334 3.82219 13.3334 3.999V8.66566Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Permissions
            </button>

            

            {/* Edit Staff Button - White with pencil icon */}
            
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Clients Card */}
        <div className="bg-white rounded-lg p-4 relative">
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Clients</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mt-3">{staffMember.clients}</div>
        </div>

        {/* Tasks Done Card */}
        <div className="bg-white rounded-lg p-4 relative">
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 3V6.99999C14 7.26521 14.1054 7.51956 14.2929 7.7071C14.4804 7.89463 14.7348 7.99999 15 7.99999H19" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 7.99999V5C5 4.46956 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46956 3 7 3H14L19 7.99999V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46956 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V7.99999Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Tasks Done</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mt-3">{staffMember.tasksDone}</div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg p-4 relative">
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Revenue</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mt-3">{staffMember.revenue}</div>
        </div>

        {/* Hours Card */}
        <div className="bg-white rounded-lg p-4 relative">
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Hours</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mt-3">{staffMember.hours}</div>
        </div>

        {/* Efficiency Card */}
        <div className="bg-white rounded-lg p-4 relative">
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="6" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Efficiency</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mt-3">{staffMember.efficiency}%</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 mb-6">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 !rounded-lg text-sm font-medium transition font-[BasisGrotesquePro] ${activeTab === tab
                ? 'bg-[#3AD6F2] text-white'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <OverviewTab staffMember={staffMember} />
      )}

      {activeTab === 'Assigned Clients' && (
        <AssignedClientsTab staffId={id} />
      )}

      {activeTab === 'Current Tasks' && (
        <CurrentTasksTab staffId={id} />
      )}

      {activeTab === 'Performance' && (
        <PerformanceTab staffId={id} />
      )}

      {activeTab === 'Schedule' && (
        <ScheduleTab staffId={id} />
      )}


      {activeTab === 'Activity log' && (
        <ActivityLogTab staffId={id} staffMember={staffMember} />
      )}

      {/* Permissions Modal */}
      {staffData && (
        <TaxPreparerPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
          preparerId={staffData.profile?.id || staffData.id || id}
          preparerName={staffData.profile?.full_name || staffData.profile?.name || staffMember?.name || 'Tax Preparer'}
          preparerEmail={staffData.profile?.email || staffData.email || staffMember?.email || ''}
        />
      )}
    </div>
  );
}

