import React, { useState, useEffect, useCallback, useRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaLink, FaEnvelope, FaSms, FaCopy, FaUserCircle } from 'react-icons/fa';
import { TwouserIcon, Mails2Icon, CallIcon, PowersIcon, DownsIcon, UpperDownsIcon, CrossesIcon, UserManage } from "../../Components/icons";
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminStaffAPI } from '../../../ClientOnboarding/utils/apiUtils';
import BulkImportModal from './BulkImportModal';
import BulkTaxPreparerImportModal from './BulkTaxPreparerImportModal';
import DownloadModal from './DownloadModal';
import AddStaffModal from './AddStaffModal';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useFirmSettings } from '../../Context/FirmSettingsContext';
import ConfirmationModal from '../../../components/ConfirmationModal';
import '../../styles/StaffManagement.css';

const API_BASE_URL = getApiBaseUrl();


export default function StaffManagement() {
  const { advancedReportingEnabled } = useFirmSettings();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isBulkTaxPreparerImportModalOpen, setIsBulkTaxPreparerImportModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffData, setStaffData] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingInvitesSearch, setPendingInvitesSearch] = useState('');
  const [pendingInvitesPage, setPendingInvitesPage] = useState(1);
  const [pendingInvitesPagination, setPendingInvitesPagination] = useState({
    total_count: 0,
    page: 1,
    page_size: 20
  });
  const [processingInviteId, setProcessingInviteId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [showCancelInviteConfirm, setShowCancelInviteConfirm] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState(null);
  const [summary, setSummary] = useState({
    active_staff: 0,
    pending_invites: 0,
    avg_performance: 0,
    training_pending: 0
  });
  const isSummaryInitializedRef = useRef(false);
  const dropdownRefs = useRef({});
  const [showInviteActionsModal, setShowInviteActionsModal] = useState(false);
  const [activeInviteDetails, setActiveInviteDetails] = useState(null);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteActionMethod, setInviteActionMethod] = useState(null);
  const [inviteLinkRefreshing, setInviteLinkRefreshing] = useState(false);
  const [smsPhoneOverride, setSmsPhoneOverride] = useState("");
  const [smsPhoneCountry, setSmsPhoneCountry] = useState('us');
  const [showInactiveConfirmModal, setShowInactiveConfirmModal] = useState(false);
  const [showReactivateConfirmModal, setShowReactivateConfirmModal] = useState(false);
  const [selectedStaffForAction, setSelectedStaffForAction] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(false);
  const [staffPage, setStaffPage] = useState(1);
  const staffPageSize = 5;
  const teamMembersRef = useRef(null);

  const handleInviteCreated = (inviteData) => {
    fetchPendingInvites();
    if (inviteData) {
      openInviteActionsModal(inviteData);
    }
  };

  const openInviteActionsModal = (inviteData) => {
    if (!inviteData) return;
    setActiveInviteDetails(inviteData);
    setSmsPhoneOverride(
      inviteData.phone_number ||
      inviteData.phone ||
      inviteData.contact_details?.phone ||
      ""
    );
    setShowInviteActionsModal(true);
  };

  const closeInviteActionsModal = () => {
    setShowInviteActionsModal(false);
    setActiveInviteDetails(null);
    setInviteActionLoading(false);
    setInviteActionMethod(null);
    setInviteLinkRefreshing(false);
    setSmsPhoneOverride("");
  };

  // Fetch staff members from API
  const fetchStaffMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAccessToken();
      const queryParams = new URLSearchParams();

      // Map filter values to API format
      if (activeFilter && activeFilter !== 'all') {
        queryParams.append('status', activeFilter);
      } else {
        queryParams.append('status', 'all');
      }

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      } else {
        queryParams.append('search', '');
      }

      if (roleFilter && roleFilter !== 'all') {
        queryParams.append('role', roleFilter);
      } else {
        queryParams.append('role', 'all');
      }

      if (performanceFilter && performanceFilter !== 'all') {
        queryParams.append('performance', performanceFilter);
      } else {
        queryParams.append('performance', 'all');
      }

      const url = `${API_BASE_URL}/user/firm-admin/staff/tax-preparers/?${queryParams.toString()}`;

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
        setStaffData(result.data.staff_members || []);

        // Only update summary statistics on first load (when activeFilter is 'all' and no filters are applied)
        // This keeps the statistics static when switching tabs
        if (!isSummaryInitializedRef.current && activeFilter === 'all' && !searchTerm && roleFilter === 'all' && performanceFilter === 'all') {
          // Calculate summary from staff data
          const activeCount = result.data.staff_members?.filter(
            (staff) => staff.status?.value === 'active'
          ).length || 0;

          const performances = result.data.staff_members
            ?.map((staff) => staff.performance?.efficiency_percentage || 0)
            .filter((p) => p > 0) || [];
          const avgPerformance = performances.length > 0
            ? (performances.reduce((a, b) => a + b, 0) / performances.length).toFixed(1)
            : 0;

          setSummary(prev => ({
            active_staff: activeCount,
            pending_invites: prev.pending_invites, // Will be updated from fetchPendingInvites on first load
            avg_performance: avgPerformance,
            training_pending: prev.training_pending || 0 // Preserve existing value
          }));

          // Mark as initialized only after we have the staff data
          isSummaryInitializedRef.current = true;
        }
      } else {
        setStaffData([]);
        // Only reset summary if it hasn't been initialized yet
        if (!isSummaryInitializedRef.current) {
          setSummary({
            active_staff: 0,
            pending_invites: 0,
            avg_performance: 0,
            training_pending: 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load staff members. Please try again.');
      setStaffData([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchTerm, roleFilter, performanceFilter]);

  // Download Performance Report
  const handleDownloadPerformanceReport = async () => {
    try {
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/tax-preparers/performance-report/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Performance report downloaded successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error downloading performance report:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to download performance report', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Set Tax Preparer as Inactive
  const handleSetInactive = async (staffId) => {
    try {
      setProcessingStatus(true);
      const response = await firmAdminStaffAPI.setInactive(staffId);

      if (response?.success) {
        toast.success(response.message || 'Staff member has been set as inactive', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowInactiveConfirmModal(false);
        setSelectedStaffForAction(null);
        setShowDropdown(null);
        // Refresh staff list
        await fetchStaffMembers();
      } else {
        throw new Error(response?.message || 'Failed to set staff member as inactive');
      }
    } catch (err) {
      console.error('Error setting staff member as inactive:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to set staff member as inactive', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  // Reactivate Tax Preparer
  const handleReactivate = async (staffId) => {
    try {
      setProcessingStatus(true);
      const response = await firmAdminStaffAPI.reactivateStaff(staffId);

      if (response?.success) {
        toast.success(response.message || 'Staff member has been reactivated', {
          position: "top-right",
          autoClose: 3000,
        });
        setShowReactivateConfirmModal(false);
        setSelectedStaffForAction(null);
        setShowDropdown(null);
        // Refresh staff list
        await fetchStaffMembers();
      } else {
        throw new Error(response?.message || 'Failed to reactivate staff member');
      }
    } catch (err) {
      console.error('Error reactivating staff member:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to reactivate staff member', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  // Fetch pending invites from API
  const fetchPendingInvites = useCallback(async () => {
    try {
      const token = getAccessToken();
      const queryParams = new URLSearchParams();

      if (pendingInvitesSearch.trim()) {
        queryParams.append('search', pendingInvitesSearch.trim());
      }

      queryParams.append('page', pendingInvitesPage.toString());
      queryParams.append('page_size', '20');

      const url = `${API_BASE_URL}/user/firm-admin/staff/invites/pending/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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
        setPendingInvites(result.data.pending_invites || []);
        setPendingInvitesPagination({
          total_count: result.data.total_count || 0,
          page: result.data.page || 1,
          page_size: result.data.page_size || 20
        });

        // Update summary with pending invites count only on first load
        // This keeps the statistics static when switching tabs
        // Only update if summary hasn't been initialized OR if pending_invites is still 0 (initial state)
        setSummary(prev => {
          if (!isSummaryInitializedRef.current || prev.pending_invites === 0) {
            return {
              ...prev,
              pending_invites: result.data.total_count || 0
            };
          }
          return prev; // Keep existing value after initialization
        });
      } else {
        setPendingInvites([]);
        setPendingInvitesPagination({
          total_count: 0,
          page: 1,
          page_size: 20
        });
      }
    } catch (err) {
      console.error('Error fetching pending invites:', err);
      setPendingInvites([]);
    }
  }, [pendingInvitesSearch, pendingInvitesPage, API_BASE_URL]);

  // Debounce search for pending invites
  const [debouncedPendingInvitesSearch, setDebouncedPendingInvitesSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPendingInvitesSearch(pendingInvitesSearch);
      setPendingInvitesPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [pendingInvitesSearch]);

  // Fetch pending invites on mount and when search/page changes
  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites, debouncedPendingInvitesSearch]);

  // Reset pending invites page when filter changes
  useEffect(() => {
    if (activeFilter === 'pending_invites') {
      setPendingInvitesPage(1);
    }
  }, [activeFilter]);

  const sendInviteNotifications = async (inviteId, payload = {}) => {
    try {
      setProcessingInviteId(inviteId);
      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm-admin/staff/invites/${inviteId}/send/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || errorData.detail || `HTTP error! status: ${response.status}`;

        // Parse array format error messages
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage[0] || errorMessage;
        } else if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(errorMessage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              errorMessage = parsed[0];
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Also check errorData.errors or errorData.error fields
        if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors[0] || errorMessage;
          } else if (typeof errorData.errors === 'string') {
            errorMessage = errorData.errors;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Invitation email resent successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        fetchPendingInvites();
        return result;
      } else {
        let errorMsg = result.message || 'Failed to resend invitation';

        // Parse array format error messages
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg[0] || errorMsg;
        }

        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error sending invite notifications:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to send invitation notifications. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: false,
        className: "custom-toast-error",
        bodyClassName: "custom-toast-body",
      });
      throw err;
    } finally {
      setProcessingInviteId(null);
    }
  };

  // Handle resend invite
  const handleResendInvite = async (invite) => {
    if (!invite) return;
    setShowDropdown(null);
    const methods = [];
    if (invite.email || invite.email_address) {
      methods.push('email');
    }
    if (invite.phone_number || invite.phone) {
      methods.push('sms');
    }
    if (methods.length === 0) {
      methods.push('email');
    }
    const payload = { methods };
    if (methods.includes('sms')) {
      payload.phone_number = invite.phone_number || invite.phone || '';
    }
    await sendInviteNotifications(invite.id, payload);
  };

  // Handle cancel invite
  const handleCancelInvite = async (inviteId) => {
    try {
      setProcessingInviteId(inviteId);
      setShowDropdown(null); // Close dropdown

      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm-admin/staff/invites/${inviteId}/cancel/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
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

      if (result.success) {
        toast.success(result.message || 'Invitation cancelled successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh the pending invites list
        fetchPendingInvites();
      } else {
        throw new Error(result.message || 'Failed to cancel invitation');
      }
    } catch (err) {
      console.error('Error cancelling invite:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to cancel invitation. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setProcessingInviteId(null);
    }
  };

  // Confirm cancel invite from modal
  const confirmCancelInvite = async () => {
    if (!inviteToCancel) {
      return;
    }

    const inviteId = inviteToCancel;

    try {
      setProcessingInviteId(inviteId);
      setShowDropdown(null); // Close dropdown

      const token = getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm-admin/staff/invites/${inviteId}/cancel/`;

      const response = await fetchWithCors(url, {
        method: 'POST',
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

      if (result.success) {
        toast.success(result.message || 'Invitation cancelled successfully', {
          position: "top-right",
          autoClose: 3000,
        });
        // Refresh the pending invites list
        fetchPendingInvites();
        // Close modal and reset state after successful cancellation
        setShowCancelInviteConfirm(false);
        setInviteToCancel(null);
      } else {
        throw new Error(result.message || 'Failed to cancel invitation');
      }
    } catch (err) {
      console.error('Error cancelling invite:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to cancel invitation. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      });
      // Keep modal open if there's an error so user can retry
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!activeInviteDetails?.invite_link) return;

    // Fallback for non-secure contexts where navigator.clipboard is unavailable
    if (!navigator.clipboard) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = activeInviteDetails.invite_link;

        // Ensure element is part of document but not visible
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          toast.success("Invite link copied to clipboard!", {
            position: "top-right",
            autoClose: 2000,
          });
        } else {
          throw new Error("Copy command failed");
        }
      } catch (err) {
        console.error("Fallback copy failed:", err);
        toast.error("Could not auto-copy. Please manually copy the link.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(activeInviteDetails.invite_link);
      toast.success("Invite link copied to clipboard!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error('Error copying invite link:', err);
      toast.error("Failed to copy link. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const fetchInviteLinkDetails = async (inviteId, method = 'GET') => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await fetchWithCors(`${API_BASE_URL}/firm-admin/staff/invites/${inviteId}/link/`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const handleRefreshInviteLink = async () => {
    if (!activeInviteDetails?.id) return;
    try {
      setInviteLinkRefreshing(true);
      const result = await fetchInviteLinkDetails(activeInviteDetails.id, 'POST');
      if (result.success && result.data) {
        setActiveInviteDetails((prev) => ({
          ...prev,
          invite_link: result.data.invite_link,
          expires_at: result.data.expires_at || prev?.expires_at,
          expires_at_formatted: result.data.expires_at_formatted || prev?.expires_at_formatted,
        }));
        toast.success("Invite link refreshed successfully.", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error(result.message || "Failed to refresh invite link");
      }
    } catch (error) {
      console.error('Error refreshing invite link:', error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setInviteLinkRefreshing(false);
    }
  };

  const handleOpenShareInvite = async (invite) => {
    if (!invite?.id) return;
    try {
      const result = await fetchInviteLinkDetails(invite.id);
      if (result.success && result.data) {
        openInviteActionsModal({
          ...invite,
          ...result.data,
          invite_link: result.data.invite_link,
        });
      } else {
        throw new Error(result.message || "Failed to fetch invite link");
      }
    } catch (error) {
      console.error('Error opening invite share modal:', error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleSendInviteNotificationsModal = async (methods, options = {}) => {
    if (!activeInviteDetails?.id) return;
    try {
      setInviteActionLoading(true);
      setInviteActionMethod(methods.join(","));
      const result = await sendInviteNotifications(activeInviteDetails.id, {
        methods,
        ...options,
      });
      if (result?.data) {
        setActiveInviteDetails((prev) => ({
          ...prev,
          ...result.data,
        }));
      }
    } catch (error) {
      // handled by sendInviteNotifications
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  const handleSendEmailInviteNow = () => {
    handleSendInviteNotificationsModal(['email']);
  };

  const handleSendSmsInviteNow = () => {
    const phone = smsPhoneOverride?.trim();
    if (!phone) {
      toast.error("Please enter a phone number to send SMS.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    handleSendInviteNotificationsModal(['sms'], { phone_number: phone });
  };

  // Fetch staff members on mount and when filters change
  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown !== null) {
        // Check if click is outside the button and dropdown
        const dropdownElement = dropdownRefs.current[showDropdown];
        const isClickOnButton = event.target.closest('button[data-dropdown-trigger]');
        const isClickOnDropdown = event.target.closest('[data-dropdown-menu]');

        if (!isClickOnButton && !isClickOnDropdown && dropdownElement && !dropdownElement.contains(event.target)) {
          setShowDropdown(null);
        }
      }
    };

    if (showDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'NA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Map API data to UI format
  const mapStaffData = (staff) => {
    const rawName = staff.staff_member?.name;
    const name = (rawName && rawName !== 'undefined') ? rawName : 'N/A';
    const tags = staff.staff_member?.tags || [];
    const rawProfilePicture = staff.staff_member?.profile_picture;
    const profilePicture = (rawProfilePicture && rawProfilePicture !== 'undefined') ? rawProfilePicture : null;

    return {
      id: staff.id,
      name: name,
      title: tags[0] || '',
      subtitle: tags.slice(1).join(', ') || '',
      email: staff.contact?.email || 'N/A',
      phone: staff.contact?.phone || 'N/A',
      role: staff.role?.primary || 'N/A',
      roleLevel: staff.role?.level || '',
      roleType: staff.role?.role_type || '',
      status: staff.status?.display || staff.status?.value || 'N/A',
      statusValue: staff.status?.value || '',
      isActive: staff.status?.is_active || false,
      clients: staff.clients?.count || 0,
      efficiency: staff.performance?.efficiency_percentage || 0,
      tasksCompleted: staff.performance?.tasks_completed || 0,
      compliance: staff.compliance?.percentage || 0,
      onboarding: staff.onboarding?.percentage || 0,
      hireDate: staff.hire_date?.display || staff.hire_date?.date || 'N/A',
      revenue: staff.revenue?.display || `$${staff.revenue?.amount || 0}`,
      avatar: getInitials(name),
      profilePicture: profilePicture
    };
  };

  const filters = [
    { label: 'All Staff', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending Invites', value: 'pending_invites' }
  ];

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    { label: 'Tax Preparer', value: 'tax_preparer' },
    { label: 'Senior Tax Preparer', value: 'senior_tax_preparer' },
    { label: 'Team Leader', value: 'team_leader' },
    { label: 'Mentor', value: 'mentor' },
    { label: 'Specialist', value: 'specialist' }
  ];

  const performanceOptions = [
    { label: 'All Performance', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];

  const handleDropdownToggle = (id, event) => {
    if (showDropdown === id) {
      setShowDropdown(null);
    } else {
      const button = event?.currentTarget;
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right
        });
      }
      setShowDropdown(id);
    }
  };

  const inviteExpiresOn = activeInviteDetails?.expires_at || activeInviteDetails?.expires_at_formatted
    ? new Date(activeInviteDetails.expires_at || activeInviteDetails.expires_at_formatted).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    : null;

  // Export Staff List to PDF
  const exportStaffToPDF = async () => {
    try {
      if (staffData.length === 0 && activeFilter !== 'pending_invites') {
        toast.info("No staff members to export", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Fetch all staff members (not just current page)
      const token = getAccessToken();
      const queryParams = new URLSearchParams();

      if (activeFilter && activeFilter !== 'all') {
        queryParams.append('status', activeFilter);
      } else {
        queryParams.append('status', 'all');
      }

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      if (roleFilter && roleFilter !== 'all') {
        queryParams.append('role', roleFilter);
      }

      if (performanceFilter && performanceFilter !== 'all') {
        queryParams.append('performance', performanceFilter);
      }

      const url = `${API_BASE_URL}/user/firm-admin/staff/tax-preparers/?${queryParams.toString()}`;

      const response = await fetchWithCors(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      let allStaff = staffData;
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.staff_members) {
          allStaff = result.data.staff_members;
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Staff Management Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Report Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, yPosition);
      yPosition += 8;

      const activeCount = allStaff.filter(s => s.status?.value === 'active').length;
      const inactiveCount = allStaff.filter(s => s.status?.value === 'inactive').length;
      const performances = allStaff
        .map((staff) => staff.performance?.efficiency_percentage || 0)
        .filter((p) => p > 0);
      const avgPerformance = performances.length > 0
        ? (performances.reduce((a, b) => a + b, 0) / performances.length).toFixed(1)
        : 0;

      const summaryData = [
        ["Total Staff", allStaff.length.toString()],
        ["Active Staff", activeCount.toString()],
        ["Inactive Staff", inactiveCount.toString()],
        ["Average Performance", `${avgPerformance}%`],
      ];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Staff Table
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`All Staff Members (${allStaff.length})`, 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = allStaff.map((staff) => {
        const mapped = mapStaffData(staff);
        return [
          mapped.name || 'N/A',
          mapped.email || 'N/A',
          mapped.phone || 'N/A',
          mapped.role || 'N/A',
          mapped.status || 'N/A',
          mapped.clients?.toString() || '0',
          `${mapped.efficiency}%`,
          mapped.hireDate || 'N/A',
          mapped.revenue || '$0',
        ];
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [["Name", "Email", "Phone", "Role", "Status", "Clients", "Performance", "Hire Date", "Revenue"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 28, overflow: 'linebreak' },
          1: { cellWidth: 32, overflow: 'linebreak' },
          2: { cellWidth: 25, overflow: 'linebreak' },
          3: { cellWidth: 25, overflow: 'linebreak' },
          4: { cellWidth: 18, overflow: 'linebreak' },
          5: { cellWidth: 15, overflow: 'linebreak' },
          6: { cellWidth: 18, overflow: 'linebreak' },
          7: { cellWidth: 22, overflow: 'linebreak' },
          8: { cellWidth: 18, overflow: 'linebreak' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        didDrawPage: (data) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        }
      });

      // Open PDF in new window for preview/download
      const fileName = `Staff_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.output('dataurlnewwindow', { filename: fileName });
      toast.success("PDF opened in new window. You can download it from there.", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Error generating PDF: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <>
      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onImportSuccess={async () => {
          // Refresh staff list after successful import
          await fetchStaffMembers();
          await fetchPendingInvites();
        }}
      />
      <BulkTaxPreparerImportModal
        isOpen={isBulkTaxPreparerImportModalOpen}
        onClose={() => setIsBulkTaxPreparerImportModalOpen(false)}
        onImportSuccess={async () => {
          // Refresh staff list after successful import
          await fetchStaffMembers();
          await fetchPendingInvites();
        }}
      />
      <DownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onInviteCreated={handleInviteCreated}
        onRefresh={fetchPendingInvites}
      />
      <div className="w-full lg:px-4 px-2 py-4 bg-[#F6F7FF] min-h-screen staff-main-container">
        {/* Header and Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-6 gap-4 staff-header-section">
          {/* Header */}
          <div className="flex-1 staff-header-content">
            <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro] staff-header-title">Staff Management</h4>
            <p className="text-gray-600 font-[BasisGrotesquePro] text-sm staff-header-subtitle">Manage team members and their assignments</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 staff-actions-container">
            {/* Top Row - 3 buttons */}
            <div className="flex flex-wrap items-center gap-2 staff-actions-top-row">
              <button
                onClick={handleDownloadPerformanceReport}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap staff-action-button"
              >
                <PowersIcon />
                Performance Report
              </button>
              {!advancedReportingEnabled && (

                <button
                  onClick={() => setIsBulkTaxPreparerImportModalOpen(true)}
                  className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap staff-action-button"
                >
                  <UpperDownsIcon />
                  Bulk Import Tax Preparers
                </button>
              )}
              <button
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-3 py-2 text-white bg-orange-500 border border-orange-500 !rounded-[7px] hover:bg-orange-600 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap staff-action-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Staff Member
              </button>
            </div>

            {/* Bottom Row - 1 button */}
            <div className="flex items-center staff-actions-bottom-row">
              {!advancedReportingEnabled && (
                <button
                  onClick={exportStaffToPDF}
                  className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap staff-action-button"
                >
                  <DownsIcon />
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4" style={{ gridAutoRows: '1fr' }}>
          <div className="w-full h-full cursor-pointer" onClick={() => {
            setActiveFilter('all');
            setTimeout(() => {
              teamMembersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            <div className="bg-white p-6 rounded-lg border border-gray-200 h-full flex flex-col staff-metric-card hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro] staff-metric-label">Active Staff</div>
              </div>
              <h5 className="text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro] staff-metric-value">{summary.active_staff}</h5>
            </div>
          </div>
          <div className="w-full h-full cursor-pointer" onClick={() => setActiveFilter('pending_invites')}>
            <div className="bg-white p-6 rounded-lg border border-gray-200 h-full flex flex-col staff-metric-card hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro] staff-metric-label">Pending Invites</div>
              </div>
              <h5 className="text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro] staff-metric-value">{summary.pending_invites}</h5>
            </div>
          </div>
          <div className="w-full h-full">
            <div className="bg-white p-6 rounded-lg border border-gray-200 h-full flex flex-col staff-metric-card">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro] staff-metric-label">Avg Performance</div>
              </div>
              <h5 className="text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro] staff-metric-value">{summary.avg_performance}%</h5>
            </div>
          </div>
        </div>

        {/* Staff Status Filters */}
        <div className="bg-white rounded-lg p-3 mb-6 w-fit staff-filters-container">
          <div className="flex items-center gap-1 staff-filters-buttons">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-2 !rounded-[8px] text-sm font-medium font-[BasisGrotesquePro] transition-colors transition-transform focus:outline-none active:scale-[0.98] staff-filter-button ${activeFilter === filter.value
                  ? 'bg-[#3AD6F2] text-white ring-2 ring-[#3AD6F2]/40 shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Team Members Section */}
        <div ref={teamMembersRef} className="bg-white rounded-lg shadow-sm border border-gray-200 staff-team-section">
          <div className="p-4 lg:p-6 border-b border-gray-200 staff-team-header">
            <h4 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] staff-team-title">
              {activeFilter === 'pending_invites'
                ? `Pending Invites (${pendingInvites.length})`
                : `Team Members (${staffData.length})`}
            </h4>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1 staff-team-subtitle">
              {activeFilter === 'pending_invites'
                ? 'Staff members who have been invited but not yet accepted'
                : 'Complete list of staff members with performance metrics'}
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-4 lg:p-6 border-b border-gray-200 staff-search-section">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="relative flex-1 max-w-md staff-search-input-container">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={activeFilter === 'pending_invites' ? "Search pending invites..." : "Search staff by name or email..."}
                  value={activeFilter === 'pending_invites' ? pendingInvitesSearch : searchTerm}
                  onChange={(e) => {
                    if (activeFilter === 'pending_invites') {
                      setPendingInvitesSearch(e.target.value);
                    } else {
                      setSearchTerm(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (activeFilter === 'pending_invites') {
                        fetchPendingInvites();
                      } else {
                        fetchStaffMembers();
                      }
                    }
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 staff-search-input"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">

              </div>
            </div>
          </div>

          {/* Staff Table / Pending Invites Table */}
          <div className="staff-table-container w-full">
            {loading && activeFilter !== 'pending_invites' ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading staff members...</p>
              </div>
            ) : activeFilter === 'pending_invites' ? (
              // Pending Invites Table
              pendingInvites.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No pending invites found</p>
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200 staff-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Invited By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Invited At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Expires At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingInvites.map((invite) => (
                      <tr key={invite.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">{invite.name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Mails2Icon />
                            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{invite.email}</div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{invite.invited_by || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{invite.invited_at_formatted || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-[BasisGrotesquePro] ${invite.is_expired ? 'text-red-600' : 'text-gray-900'}`}>
                            {invite.expires_at_formatted || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${invite.is_expired
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#F59E0B] text-white'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${invite.is_expired
                              ? 'bg-red-700'
                              : 'bg-white'
                              }`}></span>
                            {invite.is_expired ? 'Expired' : (invite.status_display || invite.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative dropdown-container">
                            <button
                              onClick={() => handleDropdownToggle(`invite-${invite.id}`)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {showDropdown === `invite-${invite.id}` && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 staff-dropdown-menu" style={{ zIndex: 9999 }}>
                                <div className="py-1">
                                  <button
                                    onClick={() => handleResendInvite(invite)}
                                    disabled={processingInviteId === invite.id || invite.is_expired}
                                    className={`block w-full text-left px-4 py-2 text-sm font-[BasisGrotesquePro] transition-colors ${processingInviteId === invite.id || invite.is_expired
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 hover:bg-gray-100'
                                      }`}
                                  >
                                    {processingInviteId === invite.id ? 'Processing...' : 'Resend Invite'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setInviteToCancel(invite.id);
                                      setShowCancelInviteConfirm(true);
                                    }}
                                    disabled={processingInviteId === invite.id || invite.is_expired}
                                    className={`block w-full text-left px-4 py-2 text-sm font-[BasisGrotesquePro] transition-colors ${processingInviteId === invite.id || invite.is_expired
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-700 hover:bg-gray-100'
                                      }`}
                                  >
                                    {processingInviteId === invite.id ? 'Processing...' : 'Cancel Invite'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : null}

            {/* Pending Invites Pagination */}
            {activeFilter === 'pending_invites' && pendingInvitesPagination.total_count > pendingInvitesPagination.page_size && (
              <div className="p-4 lg:p-6 border-t border-gray-200 flex items-center justify-between staff-pagination">
                <div className="text-sm text-gray-600 font-[BasisGrotesquePro] staff-pagination-info">
                  Showing {((pendingInvitesPagination.page - 1) * pendingInvitesPagination.page_size) + 1} to {Math.min(pendingInvitesPagination.page * pendingInvitesPagination.page_size, pendingInvitesPagination.total_count)} of {pendingInvitesPagination.total_count} invites
                </div>
                <div className="flex items-center gap-2 staff-pagination-buttons">
                  <button
                    onClick={() => setPendingInvitesPage(prev => Math.max(1, prev - 1))}
                    disabled={pendingInvitesPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] staff-pagination-button"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = Math.ceil(pendingInvitesPagination.total_count / pendingInvitesPagination.page_size);
                      return Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= pendingInvitesPage - 1 && page <= pendingInvitesPage + 1)
                          );
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsisBefore = prevPage && page - prevPage > 1;
                          const showEllipsisAfter = index === array.length - 1 && page < totalPages;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => setPendingInvitesPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] staff-pagination-button ${pendingInvitesPage === page
                                  ? 'bg-[#3B82F6] text-white border border-[#3B82F6]'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                              >
                                {page}
                              </button>
                              {showEllipsisAfter && (
                                <span className="px-2 text-gray-500">...</span>
                              )}
                            </React.Fragment>
                          );
                        });
                    })()}
                  </div>
                  <button
                    onClick={() => setPendingInvitesPage(prev => Math.min(Math.ceil(pendingInvitesPagination.total_count / pendingInvitesPagination.page_size), prev + 1))}
                    disabled={pendingInvitesPage >= Math.ceil(pendingInvitesPagination.total_count / pendingInvitesPagination.page_size)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] staff-pagination-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeFilter !== 'pending_invites' && (
              <>
                {staffData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No staff members found</p>
                  </div>
                ) : (
                  <table className="w-full divide-y divide-gray-200 staff-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Staff Member</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Clients</th>
                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Performance</th> */}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Hire Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffData.slice((staffPage - 1) * staffPageSize, staffPage * staffPageSize).map((staff) => {
                        const mappedStaff = mapStaffData(staff);
                        return (
                          <tr key={mappedStaff.id} className="hover:bg-gray-50">
                            {/* Staff Member */}
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {mappedStaff.profilePicture ? (
                                    <img
                                      src={mappedStaff.profilePicture}
                                      alt={mappedStaff.name}
                                      className="h-10 w-10 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  {!mappedStaff.profilePicture ? (
                                    <div className="h-10 w-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] staff-avatar-fallback shadow-inner">
                                      <FaUserCircle className="w-10 h-10 text-gray-300" />
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-[#E5E7EB] hidden items-center justify-center text-[#9CA3AF] staff-avatar-fallback shadow-inner">
                                      <FaUserCircle className="w-10 h-10 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div
                                    className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => {
                                      navigate(`/firmadmin/staff/${mappedStaff.id}`);
                                    }}
                                  >
                                    {mappedStaff.name}
                                  </div>
                                  {mappedStaff.title && (
                                    <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{mappedStaff.title}</div>
                                  )}
                                  {mappedStaff.subtitle && (
                                    <div className="text-xs text-gray-400 font-[BasisGrotesquePro]">{mappedStaff.subtitle}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Mails2Icon />
                                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{mappedStaff.email}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <CallIcon />
                                <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{mappedStaff.phone}</div>
                              </div>
                            </td>



                            {/* Status */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${mappedStaff.statusValue === 'active' || mappedStaff.isActive
                                ? 'bg-[#22C55E] text-white'
                                : mappedStaff.statusValue === 'pending_invites'
                                  ? 'bg-[#F59E0B] text-white'
                                  : 'bg-[#EF4444] text-white'
                                }`}>
                                {mappedStaff.status}
                              </span>
                            </td>

                            {/* Clients */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <TwouserIcon />
                                </div>
                                <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{mappedStaff.clients}</span>
                              </div>
                            </td>

                            {/* Performance */}
                            {/* <td className="px-4 py-4 w-[150px]">
                              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">Efficiency {mappedStaff.efficiency}%</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-[#3AD6F2] h-2 rounded-full"
                                  style={{ width: `${mappedStaff.efficiency}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">{mappedStaff.tasksCompleted} Tasks Completed</div>
                            </td> */}

                            {/* Hire Date */}
                            <td className="px-4 py-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                              {mappedStaff.hireDate}
                            </td>

                            {/* Revenue */}
                            <td className="px-4 py-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                              {mappedStaff.revenue}
                            </td>

                            {/* Action */}
                            <td className="px-4 py-4 text-sm font-medium">
                              <div
                                ref={(el) => { dropdownRefs.current[mappedStaff.id] = el; }}
                              >
                                <button
                                  onClick={(e) => handleDropdownToggle(mappedStaff.id, e)}
                                  className="text-gray-400 hover:text-gray-600"
                                  data-dropdown-trigger
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Staff Pagination */}
                {activeFilter !== 'pending_invites' && staffData.length > staffPageSize && (
                  <div className="p-4 lg:p-6 border-t border-gray-200 flex items-center justify-between staff-pagination">
                    <div className="text-sm text-gray-600 font-[BasisGrotesquePro] staff-pagination-info">
                      Showing {((staffPage - 1) * staffPageSize) + 1} to {Math.min(staffPage * staffPageSize, staffData.length)} of {staffData.length} members
                    </div>
                    <div className="flex items-center gap-2 staff-pagination-buttons">
                      <button
                        onClick={() => setStaffPage(prev => Math.max(1, prev - 1))}
                        disabled={staffPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] staff-pagination-button"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const totalPages = Math.ceil(staffData.length / staffPageSize);
                          return Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= staffPage - 1 && page <= staffPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              const prevPage = array[index - 1];
                              const showEllipsisBefore = prevPage && page - prevPage > 1;
                              const showEllipsisAfter = index === array.length - 1 && page < totalPages;

                              return (
                                <React.Fragment key={page}>
                                  {showEllipsisBefore && (
                                    <span className="px-2 text-gray-500">...</span>
                                  )}
                                  <button
                                    onClick={() => setStaffPage(page)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg font-[BasisGrotesquePro] staff-pagination-button ${staffPage === page
                                      ? 'bg-[#3B82F6] text-white border border-[#3B82F6]'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                      }`}
                                  >
                                    {page}
                                  </button>
                                  {showEllipsisAfter && (
                                    <span className="px-2 text-gray-500">...</span>
                                  )}
                                </React.Fragment>
                              );
                            });
                        })()}
                      </div>
                      <button
                        onClick={() => setStaffPage(prev => Math.min(Math.ceil(staffData.length / staffPageSize), prev + 1))}
                        disabled={staffPage >= Math.ceil(staffData.length / staffPageSize)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro] staff-pagination-button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu - Rendered outside table to avoid overflow issues */}
      {showDropdown && staffData.find(s => {
        const mapped = mapStaffData(s);
        return mapped.id === showDropdown;
      }) && (
          <div
            className="fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 staff-dropdown-menu"
            data-dropdown-menu
            style={{
              zIndex: 9999,
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            <div className="py-1">
              {/* <button
                onClick={() => setShowDropdown(null)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
              >
                Edit Task
              </button> */}
              <button
                onClick={() => setShowDropdown(null)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
              >
                Send Message
              </button>
              {/* <button
                onClick={() => setShowDropdown(null)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
              >
                Reassign Clients
              </button> */}
              {(() => {
                const staff = staffData.find(s => {
                  const mapped = mapStaffData(s);
                  return mapped.id === showDropdown;
                });
                if (!staff) return null;
                const mappedStaff = mapStaffData(staff);
                const isActive = mappedStaff.isActive || mappedStaff.statusValue === 'active';

                if (isActive) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedStaffForAction(staff.id);
                        setShowInactiveConfirmModal(true);
                        setShowDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-[BasisGrotesquePro] rounded transition-colors"
                    >
                      Set Inactive
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={() => {
                        setSelectedStaffForAction(staff.id);
                        setShowReactivateConfirmModal(true);
                        setShowDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-[BasisGrotesquePro] rounded transition-colors"
                    >
                      Reactivate
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        )}

      {showInviteActionsModal && activeInviteDetails && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeInviteActionsModal();
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
                  Share Staff Invitation
                </h4>
                <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">
                  Send or share the invite link with {activeInviteDetails.first_name || activeInviteDetails.name}
                </p>
              </div>
              <button
                onClick={closeInviteActionsModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <CrossesIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 font-[BasisGrotesquePro]">
                {activeInviteDetails.first_name || activeInviteDetails.name} {activeInviteDetails.last_name || ""}
              </p>
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">{activeInviteDetails.email}</p>
              {inviteExpiresOn && (
                <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                  Expires {inviteExpiresOn}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">
                  <FaLink size={14} /> Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeInviteDetails.invite_link || ""}
                    readOnly
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCopyInviteLink}
                    disabled={!activeInviteDetails.invite_link}
                  >
                    <FaCopy size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleRefreshInviteLink}
                    disabled={inviteLinkRefreshing}
                  >
                    {inviteLinkRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">
                    <FaEnvelope size={14} /> Send Email Invite
                  </label>
                  <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-3">
                    We'll send the invite link to {activeInviteDetails.email}.
                  </p>
                  <button
                    type="button"
                    className="w-full btn btn-primary"
                    disabled={inviteActionLoading}
                    onClick={handleSendEmailInviteNow}
                  >
                    {inviteActionLoading && inviteActionMethod === "email"
                      ? "Sending..."
                      : "Send Email"}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">
                    <FaSms size={14} /> Send SMS Invite
                  </label>
                  <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-2">
                    We'll text the invite link to the number you provide.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <PhoneInput
                      country={smsPhoneCountry}
                      value={smsPhoneOverride || ''}
                      onChange={(phone) => setSmsPhoneOverride(phone)}
                      onCountryChange={(countryCode) => {
                        setSmsPhoneCountry(countryCode.toLowerCase());
                      }}
                      inputClass="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      containerClass="w-100 phone-input-container flex-1"
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full btn btn-primary"
                    disabled={inviteActionLoading}
                    onClick={handleSendSmsInviteNow}
                  >
                    {inviteActionLoading && inviteActionMethod === "sms"
                      ? "Sending..."
                      : "Send SMS"}
                  </button>
                </div>
              </div> */}
            </div>

            <div className="mt-6 text-right">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeInviteActionsModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Inactive Confirmation Modal */}
      {showInactiveConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => {
            if (!processingStatus) {
              setShowInactiveConfirmModal(false);
              setSelectedStaffForAction(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            style={{
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66' }}>Set Staff as Inactive</h3>
              <button
                onClick={() => {
                  if (!processingStatus) {
                    setShowInactiveConfirmModal(false);
                    setSelectedStaffForAction(null);
                  }
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                disabled={processingStatus}
              >
                <CrossesIcon />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                Are you sure you want to set this staff member as inactive? They will no longer be able to access the system, but their data will be preserved.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowInactiveConfirmModal(false);
                  setSelectedStaffForAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                disabled={processingStatus}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedStaffForAction) {
                    handleSetInactive(selectedStaffForAction);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro]"
                style={{ background: '#F59E0B' }}
                disabled={processingStatus}
              >
                {processingStatus ? 'Setting Inactive...' : 'Set Inactive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={() => {
            if (!processingStatus) {
              setShowReactivateConfirmModal(false);
              setSelectedStaffForAction(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            style={{
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900" style={{ color: '#3B4A66' }}>Reactivate Staff</h3>
              <button
                onClick={() => {
                  if (!processingStatus) {
                    setShowReactivateConfirmModal(false);
                    setSelectedStaffForAction(null);
                  }
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                disabled={processingStatus}
              >
                <CrossesIcon />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                Are you sure you want to reactivate this staff member? They will regain access to the system.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReactivateConfirmModal(false);
                  setSelectedStaffForAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                disabled={processingStatus}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedStaffForAction) {
                    handleReactivate(selectedStaffForAction);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity font-[BasisGrotesquePro]"
                style={{ background: '#22C55E' }}
                disabled={processingStatus}
              >
                {processingStatus ? 'Reactivating...' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Invite Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelInviteConfirm}
        onClose={() => {
          if (!processingInviteId) {
            setShowCancelInviteConfirm(false);
            setInviteToCancel(null);
          }
        }}
        onConfirm={confirmCancelInvite}
        title="Cancel Invitation"
        message="Are you sure you want to cancel this invitation? This action cannot be undone."
        confirmText="Cancel Invite"
        cancelText="Keep Invitation"
        isLoading={!!processingInviteId}
        isDestructive={true}
      />
    </>
  );
}