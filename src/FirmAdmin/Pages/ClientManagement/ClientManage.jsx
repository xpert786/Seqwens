import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaUpload, FaDownload, FaSearch, FaFilter, FaUsers, FaTrash, FaEllipsisV, FaFileAlt, FaUser, FaCalendar, FaComment, FaEnvelope, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPhone, FaBuilding, FaCopy, FaLink, FaSms } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { SettingIcon, } from '../../../Taxpreparer/component/icons';
import { AddClient, Archived, BulkAction, BulkImport, ExportReport, Filter, SearchIcon, MailIcon, CallIcon, Building, DocumentIcon, AppointmentIcon, CustomerIcon, MsgIcon, Doc, Action } from '../../Components/icons';
import '../../../Taxpreparer/styles/taxdashboard.css';
import '../../styles/ClientManage.css';
import BulkActionModal from './BulkAction';

import BulkImportModal from './BulkImportModal';
import BulkTaxpayerImportModal from './BulkTaxpayerImportModal';
import AddClientModal from "./AddClientModal";
import IntakeFormBuilderModal from './IntakeFormBuilderModal';
import StartWorkflowModal from '../Workflow/StartWorkflowModal';
import ClientMessageModal from './ClientMessageModal';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminStaffAPI, firmAdminClientsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from 'react-toastify';
import { getToastOptions } from '../../../utils/toastConfig';
import { IoMdClose } from 'react-icons/io';

const API_BASE_URL = getApiBaseUrl();

export default function ClientManage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDropdown, setShowDropdown] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showBulkTaxpayerImportModal, setShowBulkTaxpayerImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showReassignStaffModal, setShowReassignStaffModal] = useState(false);
  const [selectedClientForReassign, setSelectedClientForReassign] = useState(null);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedClientForDelete, setSelectedClientForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [selectedStaffIdForModal, setSelectedStaffIdForModal] = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef(null);
  const [selectedClientForWorkflow, setSelectedClientForWorkflow] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedClientForMessage, setSelectedClientForMessage] = useState(null);
  const clientsListRef = useRef(null);

  // Staff members state
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState(null);

  // Clients state
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [overview, setOverview] = useState({
    total_clients: 0,
    active: 0,
    pending: 0,
    high_priority: 0
  });

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    active_clients: {
      count: 0,
      vs_last_month: 0
    },
    total_billed: {
      amount: 0,
      vs_last_month: 0
    },
    outstanding: {
      amount: 0,
      vs_last_month: 0
    },
    new_this_month: {
      count: 0,
      vs_last_month: 0
    },
    archived_clients: {
      count: 0
    },
    revenue_by_type: {
      individual: 0,
      business: 0
    },
    revenue_by_segment: {
      recurring: 0,
      seasonal: 0
    }
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('true'); // 'true' for active, 'false' for inactive, 'all' for all
  const [linkStatusFilter, setLinkStatusFilter] = useState('all'); // 'all', 'linked', 'unlinked'

  // Tab state
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'pending-requests'

  // Handle URL parameter for tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['clients', 'pending-requests'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (tabParam === 'pending-invites' || tabParam === 'unlinked-taxpayers') {
      // Backward compatibility/redirect
      setActiveTab('pending-requests');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === 'clients') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', tab);
    }
    setSearchParams(newSearchParams);
  };

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState([]);
  const [pendingInvitesLoading, setPendingInvitesLoading] = useState(false);
  const [pendingInvitesError, setPendingInvitesError] = useState(null);
  const [pendingInvitesPagination, setPendingInvitesPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Share Taxpayer Invite modal state
  const [showInviteActionsModal, setShowInviteActionsModal] = useState(false);
  const [activeInviteDetails, setActiveInviteDetails] = useState(null);
  const [editedInviteEmail, setEditedInviteEmail] = useState('');
  const [smsPhoneOverride, setSmsPhoneOverride] = useState("");
  const [smsPhoneCountry, setSmsPhoneCountry] = useState('us');
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteActionMethod, setInviteActionMethod] = useState(null);
  const [inviteLinkRefreshing, setInviteLinkRefreshing] = useState(false);
  const [deletingInvite, setDeletingInvite] = useState(false);
  const [showDeleteInviteConfirmModal, setShowDeleteInviteConfirmModal] = useState(false);

  // Unlinked taxpayers state
  const [unlinkedTaxpayers, setUnlinkedTaxpayers] = useState([]);
  const [unlinkedTaxpayersLoading, setUnlinkedTaxpayersLoading] = useState(false);
  const [unlinkedTaxpayersError, setUnlinkedTaxpayersError] = useState(null);
  const [unlinkedTaxpayersPagination, setUnlinkedTaxpayersPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });
  // Filter states
  const [statusFilters, setStatusFilters] = useState({
    allStatus: false,
    lead: false,
    prospect: false,
    active: true,
    inactive: false,
    pending: false,
    archived: false
  });

  const [typeFilters, setTypeFilters] = useState({
    allTypes: false,
    individual: false,
    business: false,
    partnership: false,
    corporation: false
  });

  const [returnFilters, setReturnFilters] = useState({
    allReturns: false,
    '1040': false,
    '1065': false,
    '1120': false,
    '990': false
  });

  const [tagFilters, setTagFilters] = useState({
    eicFiler: false,
    smallBusiness: false,
    highIncome: false,
    auditRisk: false
  });

  const [segmentFilters, setSegmentFilters] = useState({
    eicFilers: false,
    highIncome: false
  });

  const [commFilters, setCommFilters] = useState({
    sms: false,
    email: false,
    portal: false
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);

      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/dashboard/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDashboardStats(result.data);
      } else {
        throw new Error('Failed to load dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      const errorMsg = handleAPIError(err);
      setDashboardError(errorMsg || 'Failed to load dashboard statistics');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fetch staff members on component mount
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        setStaffLoading(true);
        setStaffError(null);

        // Fetch all tax preparers (handle pagination if needed)
        const result = await firmAdminStaffAPI.listTaxPreparers({ page_size: 100 });

        // Handle different response formats
        let dataArray = [];
        if (result.success) {
          if (result.data) {
            // Check if it's a paginated response with 'results' array
            if (Array.isArray(result.data.results)) {
              dataArray = result.data.results;
            } else if (Array.isArray(result.data)) {
              dataArray = result.data;
            } else if (Array.isArray(result.data.data)) {
              dataArray = result.data.data;
            }
          } else if (Array.isArray(result.results)) {
            // Direct results array
            dataArray = result.results;
          }
        }

        if (dataArray.length > 0) {
          // Transform the data to match the expected format
          const transformedData = dataArray.map(item => ({
            id: item.id,
            name: item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
            email: item.email || '',
            first_name: item.first_name || '',
            last_name: item.last_name || '',
            full_name: item.full_name || '',
            phone_number: item.phone_number || '',
            role: item.role || '',
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_firm_admin: item.is_firm_admin || false,
            clients_count: item.clients_count || 0,
            profile_picture_url: item.profile_picture_url || null,
            type: item.is_firm_admin ? 'firm' : 'tax_preparer' // Map is_firm_admin to type
          }));
          setStaffMembers(transformedData);
          console.log('Tax preparers loaded:', transformedData);
        } else {
          console.warn('No tax preparers data found in response:', result);
          setStaffMembers([]);
        }
      } catch (err) {
        console.error('Error fetching tax preparers:', err);
        const errorMsg = handleAPIError(err);
        setStaffError(errorMsg || 'Failed to load tax preparers');
        setStaffMembers([]);
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffMembers();
  }, []);

  // Filtered staff members for the custom dropdown
  const filteredStaffMembers = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffMembers;
    const query = staffSearchQuery.toLowerCase();
    return staffMembers.filter(staff =>
      (staff.name || '').toLowerCase().includes(query) ||
      (staff.email || '').toLowerCase().includes(query)
    );
  }, [staffMembers, staffSearchQuery]);

  // Handle outside click for staff dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
        setIsStaffDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Fetch clients on component mount and when page or search changes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const token = getAccessToken();
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('page_size', '10');

        // Add active filter parameter
        if (activeFilter === 'all') {
          queryParams.append('active', 'all');
        } else {
          queryParams.append('active', activeFilter);
        }

        if (debouncedSearchTerm.trim()) {
          queryParams.append('search', debouncedSearchTerm.trim());
        }

        const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Set overview data
          if (result.data.overview) {
            setOverview(result.data.overview);
          }

          // Set pagination data
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }

          // Map API response to match the expected structure
          if (result.data.clients) {
            const mappedClients = result.data.clients.map(client => {
              // Handle different API response structures
              const profile = client.profile || client;
              const firstName = profile.first_name || client.first_name || '';
              const lastName = profile.last_name || client.last_name || '';

              // Construct name from first_name and last_name, prioritizing first_name + last_name
              let fullName = '';
              if (firstName || lastName) {
                // Always construct from first_name and last_name if available
                fullName = `${firstName} ${lastName}`.trim();
              } else if (profile.name || client.name) {
                // Fallback to name field if first_name/last_name not available
                fullName = profile.name || client.name;
              } else if (profile.full_name || client.full_name) {
                // Fallback to full_name field
                fullName = profile.full_name || client.full_name;
              } else {
                // Last resort: use email
                fullName = profile.email || client.email || 'Unknown Client';
              }

              console.log('Client mapping:', {
                original: client,
                firstName,
                lastName,
                fullName
              });

              return {
                id: client.id || profile.id,
                name: fullName,
                company: client.client_type || profile.client_type || 'Individual',
                type: client.client_type || profile.client_type || 'Individual',
                email: profile.email || client.email || '',
                phone: profile.phone || profile.phone_formatted || client.phone_number || client.phone || '',
                status: client.status || profile.account_status?.toLowerCase() || 'new',
                lastActivity: client.last_activity?.last_active_relative || client.next_due_date || 'N/A',
                lastActivityType: client.last_activity?.activity_title || 'N/A',
                lastActivityIcon: (() => {
                  const type = client.last_activity?.activity_type;
                  if (type === 'document_upload' || type === 'form_submission') return 'DocumentIcon';
                  if (type === 'appointment_scheduled') return 'AppointmentIcon';
                  if (type === 'message_sent') return 'MsgIcon';
                  if (type === 'login' || type === 'profile_update') return 'CustomerIcon';
                  return 'DocumentIcon';
                })(),
                totalBilled: '$0', // Can be calculated from invoices if available
                clientStatus: client.is_active !== undefined
                  ? (client.is_active ? 'Active' : 'Inactive')
                  : (client.status || profile.account_status?.toLowerCase() || 'new') === 'active' ? 'Active' : 'Inactive',
                pendingTasks: client.pending_tasks_count || 0,
                documentsCount: client.documents_count || 0,
                assignedStaff: client.assigned_staff || [],
                is_linked: client.is_linked !== undefined ? client.is_linked : true, // Default to true if not provided
                link_status: client.link_status || (client.is_linked ? 'linked' : 'unlinked'),
                is_deleted: client.is_deleted || false
              };
            });
            setClients(mappedClients);
            console.log('Clients loaded:', mappedClients);
          } else {
            setClients([]);
          }
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClientsError('Failed to load clients');
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, [currentPage, debouncedSearchTerm, activeFilter]);

  // Filter clients by link status
  const filteredClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    const filtered = clients.filter(client => {
      if (linkStatusFilter === 'linked') {
        return client.is_linked === true || client.link_status === 'linked';
      } else if (linkStatusFilter === 'unlinked') {
        return client.is_linked === false || client.link_status === 'unlinked';
      }
      return true; // 'all' - show all clients
    });

    return filtered;
  }, [clients, linkStatusFilter]);

  // Reset to page 1 when active filter changes
  useEffect(() => {
    if (activeFilter !== undefined) {
      setCurrentPage(1);
    }
  }, [activeFilter]);

  // Reset to page 1 when link status filter changes
  useEffect(() => {
    if (linkStatusFilter !== undefined) {
      setCurrentPage(1);
    }
  }, [linkStatusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);


  // Fetch unlinked taxpayers
  const fetchUnlinkedTaxpayers = useCallback(async (page = 1, pageSize = 20) => {
    try {
      setUnlinkedTaxpayersLoading(true);
      setUnlinkedTaxpayersError(null);

      const params = {
        page,
        page_size: pageSize
      };

      // Add search if available
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      const response = await firmAdminClientsAPI.getUnlinkedTaxpayers(params);

      if (response.success && response.data) {
        setUnlinkedTaxpayers(response.data.taxpayers || []);
        setUnlinkedTaxpayersPagination({
          page: response.data.page || page,
          page_size: response.data.page_size || pageSize,
          total_count: response.data.total_count || 0,
          total_pages: response.data.total_pages || 1,
          has_next: response.data.has_next || false,
          has_previous: response.data.has_previous || false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch unlinked taxpayers');
      }
    } catch (error) {
      console.error('Error fetching unlinked taxpayers:', error);
      setUnlinkedTaxpayersError(handleAPIError(error));
      setUnlinkedTaxpayers([]);
    } finally {
      setUnlinkedTaxpayersLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Fetch unlinked taxpayers when tab is switched to pending-requests or search changes
  useEffect(() => {
    if (activeTab === 'pending-requests') {
      fetchUnlinkedTaxpayers(1, unlinkedTaxpayersPagination.page_size);
    }
  }, [activeTab, debouncedSearchTerm, fetchUnlinkedTaxpayers]);

  // Fetch pending invites
  const fetchPendingInvites = useCallback(async (page = 1) => {
    try {
      setPendingInvitesLoading(true);
      setPendingInvitesError(null);

      const response = await firmAdminClientsAPI.getPendingInvites({
        page,
        page_size: pendingInvitesPagination.page_size,
        search: debouncedSearchTerm.trim() || undefined
      });

      if (response.success && response.data) {
        // API returns data.taxpayers array
        setPendingInvites(response.data.taxpayers || []);
        setPendingInvitesPagination({
          page: response.data.page || page,
          page_size: response.data.page_size || 20,
          total_count: response.data.total_count || 0,
          total_pages: response.data.total_pages || 1,
          has_next: response.data.has_next || false,
          has_previous: response.data.has_previous || false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch pending invites');
      }
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      setPendingInvitesError(handleAPIError(error));
      setPendingInvites([]);
    } finally {
      setPendingInvitesLoading(false);
    }
  }, [debouncedSearchTerm, pendingInvitesPagination.page_size]);

  // Fetch pending invites when tab is switched to pending-requests or search changes
  useEffect(() => {
    if (activeTab === 'pending-requests') {
      fetchPendingInvites(1);
    }
  }, [activeTab, debouncedSearchTerm, fetchPendingInvites]);

  // Helper functions for Share Taxpayer Invite modal
  useEffect(() => {
    if (activeInviteDetails?.phone_number) {
      setSmsPhoneOverride(activeInviteDetails.phone_number);
    } else if (!showInviteActionsModal) {
      setSmsPhoneOverride("");
    }
  }, [activeInviteDetails, showInviteActionsModal]);

  const openInviteActionsModal = async (inviteData) => {
    // Map the API response structure to match what the modal expects
    const mappedInviteData = {
      id: inviteData.invite_id || inviteData.id,
      invite_id: inviteData.invite_id || inviteData.id,
      client_id: inviteData.id,
      first_name: inviteData.first_name,
      last_name: inviteData.last_name,
      email: inviteData.email,
      phone_number: inviteData.phone_number,
      invite_link: inviteData.invite_link,
      expires_at: inviteData.expires_at,
      invited_at: inviteData.invited_at,
      status: inviteData.status,
      invited_by_name: inviteData.invited_by?.name,
      invited_by_email: inviteData.invited_by?.email,
      firm_name: inviteData.firm_name,
      is_expired: inviteData.is_expired
    };

    setActiveInviteDetails(mappedInviteData);
    setShowInviteActionsModal(true);
    if (mappedInviteData?.email) {
      setEditedInviteEmail(mappedInviteData.email);
    } else {
      setEditedInviteEmail('');
    }

    // If invite link is missing, try to fetch it
    if (!mappedInviteData.invite_link && mappedInviteData.invite_id) {
      try {
        const linkResponse = await firmAdminClientsAPI.getInviteLink(mappedInviteData.invite_id);
        if (linkResponse.success) {
          const link = linkResponse.data?.invite_link || linkResponse.invite_link;
          if (link) {
            setActiveInviteDetails(prev => ({
              ...prev,
              invite_link: link
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching invite link:", error);
      }
    }
  };

  const closeInviteActionsModal = () => {
    setShowInviteActionsModal(false);
    setActiveInviteDetails(null);
    setEditedInviteEmail('');
    setSmsPhoneOverride('');
  };

  // Helper function to parse phone number
  const parsePhoneNumber = (phoneValue, countryCode = 'us') => {
    if (!phoneValue || !phoneValue.trim()) {
      return { country_code: null, phone_number: null };
    }
    const digitsOnly = phoneValue.replace(/\D/g, '');
    const countryToDialCode = {
      'us': '1', 'ca': '1', 'do': '1', 'pr': '1', 'vi': '1', 'gu': '1', 'as': '1',
      'gb': '44', 'im': '44', 'je': '44', 'gg': '44', 'ax': '358',
      'au': '61', 'cx': '61', 'cc': '61', 'nz': '64', 'pn': '64',
      'in': '91', 'jp': '81', 'kr': '82', 'cn': '86', 'tw': '886', 'hk': '852', 'mo': '853',
      'de': '49', 'at': '43', 'ch': '41', 'li': '423',
      'fr': '33', 'mc': '377', 're': '262', 'bl': '590', 'mf': '590', 'gp': '590', 'pm': '508',
      'it': '39', 'va': '39', 'sm': '378',
      'es': '34', 'ad': '376', 'gi': '350', 'pt': '351',
      'nl': '31', 'be': '32', 'lu': '352',
      'se': '46', 'no': '47', 'dk': '45', 'fi': '358', 'is': '354', 'fo': '298',
      'pl': '48', 'cz': '420', 'sk': '421', 'hu': '36', 'ro': '40', 'bg': '359',
      'gr': '30', 'cy': '357', 'mt': '356',
      'ie': '353',
      'br': '55', 'mx': '52', 'ar': '54', 'cl': '56', 'co': '57', 'pe': '51', 've': '58',
      'za': '27', 'ng': '234', 'ke': '254', 'eg': '20', 'et': '251', 'gh': '233',
      'ma': '212', 'dz': '213', 'tn': '216', 'ly': '218', 'sd': '249', 'sn': '221',
      'ae': '971', 'sa': '966', 'il': '972', 'tr': '90', 'iq': '964', 'ir': '98',
      'ru': '7', 'kz': '7',
      'th': '66', 'sg': '65', 'my': '60', 'ph': '63', 'id': '62', 'vn': '84',
      'bd': '880', 'pk': '92', 'lk': '94', 'np': '977', 'mm': '95'
    };
    const dialCode = countryToDialCode[countryCode.toLowerCase()] || '1';
    if (digitsOnly.startsWith(dialCode)) {
      const phoneNumber = digitsOnly.substring(dialCode.length);
      return {
        country_code: `+${dialCode}`,
        phone_number: phoneNumber
      };
    }
    return {
      country_code: `+${dialCode}`,
      phone_number: digitsOnly
    };
  };

  const handleSendInviteNotifications = async (methods, options = {}) => {
    if (!methods?.length) return;

    try {
      setInviteActionLoading(true);
      setInviteActionMethod(methods.join(","));

      // Use invite_id if available, otherwise fall back to id
      const inviteId = activeInviteDetails?.invite_id || activeInviteDetails?.id;

      if (!inviteId) {
        toast.error("Unable to send invite. Invite ID is missing. Please try refreshing the page.", getToastOptions());
        return;
      }

      const payload = { methods };
      if (options.email) {
        payload.email = options.email;
      }
      if (options.phone_number) {
        const phoneData = parsePhoneNumber(options.phone_number, smsPhoneCountry);
        if (phoneData.country_code && phoneData.phone_number) {
          payload.country_code = phoneData.country_code.replace(/^\+/, '');
          payload.phone_number = phoneData.phone_number;
        } else {
          payload.phone_number = options.phone_number;
        }
      }
      const response = await firmAdminClientsAPI.sendInvite(inviteId, payload);
      if (response.success && response.data) {
        setActiveInviteDetails((prev) => ({
          ...prev,
          ...response.data
        }));

        const deliverySummary = response.data?.delivery_summary;

        if (deliverySummary?.sms_error) {
          toast.error(deliverySummary.sms_error, getToastOptions({ autoClose: 5000 }));
        }

        const emailSent = deliverySummary?.email_sent === true;
        const smsSent = deliverySummary?.sms_sent === true;
        const hasError = deliverySummary?.sms_error || (deliverySummary?.email_sent === false && methods.includes('email'));

        if ((emailSent || smsSent) && !hasError) {
          toast.success(response.message || "Invite notifications processed.", getToastOptions());
          closeInviteActionsModal();
        } else if (emailSent && deliverySummary?.sms_error) {
          toast.success("Email sent successfully.", getToastOptions());
          closeInviteActionsModal();
        } else if (deliverySummary?.sms_error && !emailSent) {
          // Only SMS was attempted and failed - don't close modal so user can try again
        }
      } else {
        throw new Error(response.message || "Failed to send invite notifications");
      }
    } catch (error) {
      console.error("Error sending invite notifications:", error);
      toast.error(handleAPIError(error), getToastOptions());
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!activeInviteDetails?.invite_link) return;

    // Fallback for non-secure contexts where navigator.clipboard is unavailable
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
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
          toast.success("Invite link copied to clipboard!", getToastOptions({ autoClose: 2000 }));
          closeInviteActionsModal();
        } else {
          throw new Error("Copy command failed");
        }
      } catch (err) {
        console.error("Fallback copy failed:", err);
        toast.error("Could not auto-copy. Please manually copy the link.", getToastOptions());
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(activeInviteDetails.invite_link);
      toast.success("Invite link copied to clipboard!", getToastOptions({ autoClose: 2000 }));
      closeInviteActionsModal();
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast.error("Failed to copy invite link. Please try again.", getToastOptions());
    }
  };

  const handleRefreshInviteLink = async () => {
    if (!activeInviteDetails) return;
    try {
      setInviteLinkRefreshing(true);
      const payload = {};
      // Use invite_id if available, otherwise fall back to id
      const inviteId = activeInviteDetails.invite_id || activeInviteDetails.id;
      if (inviteId) {
        payload.invite_id = inviteId;
      } else if (activeInviteDetails.client_id) {
        payload.client_id = activeInviteDetails.client_id;
      } else {
        throw new Error("No invite ID or client ID available");
      }
      payload.regenerate = true;

      const response = await firmAdminClientsAPI.generateInviteLink(payload);
      if (response.success) {
        const newLink = response.data?.invite_link || response.invite_link;
        if (newLink) {
          setActiveInviteDetails((prev) => ({
            ...prev,
            invite_link: newLink,
            expires_at: response.data?.expires_at || prev.expires_at
          }));
          toast.success("Invite link regenerated successfully.", {
            position: "top-right",
            autoClose: 3000
          });
        }
      }
    } catch (error) {
      console.error("Error regenerating invite link:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteLinkRefreshing(false);
    }
  };

  const handleSendEmailInviteNow = () => {
    const trimmed = (editedInviteEmail || '').trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error("Please enter a valid email address.", getToastOptions());
      return;
    }
    handleSendInviteNotifications(["email"], { email: trimmed });
  };

  const handleSendSmsInviteNow = () => {
    const trimmedPhone = smsPhoneOverride?.trim();
    if (!trimmedPhone) {
      toast.error("Please enter a phone number to send the SMS invite.", getToastOptions());
      return;
    }
    handleSendInviteNotifications(["sms"], { phone_number: trimmedPhone });
  };

  const handleDeleteInvite = () => {
    const inviteId = activeInviteDetails?.id || activeInviteDetails?.invite_id;

    if (!inviteId) {
      toast.error("No invite found to delete.", getToastOptions());
      return;
    }

    // Show confirmation modal
    setShowDeleteInviteConfirmModal(true);
  };

  const confirmDeleteInvite = async () => {
    const inviteId = activeInviteDetails?.id || activeInviteDetails?.invite_id;

    if (!inviteId) {
      toast.error("No invite found to delete.", getToastOptions());
      setShowDeleteInviteConfirmModal(false);
      return;
    }

    try {
      setDeletingInvite(true);
      setShowDeleteInviteConfirmModal(false);

      const response = await firmAdminClientsAPI.deleteInvite(inviteId);

      if (response.success) {
        toast.success(response.message || "Invitation deleted successfully.", getToastOptions());
        closeInviteActionsModal();

        // Refresh pending invites list
        if (activeTab === 'pending-invites') {
          await fetchPendingInvites(pendingInvitesPagination.page);
        }
      } else {
        throw new Error(response.message || "Failed to delete invitation");
      }
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error(handleAPIError(error) || "Failed to delete invitation. Please try again.", getToastOptions());
    } finally {
      setDeletingInvite(false);
    }
  };

  const inviteExpiresOn = activeInviteDetails?.expires_at
    ? new Date(activeInviteDetails.expires_at).toLocaleDateString()
    : null;

  // Helper function to refresh clients list
  const refreshClientsList = async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);

      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('page_size', '10');

      // Add active filter parameter
      if (activeFilter === 'all') {
        queryParams.append('active', 'all');
      } else {
        queryParams.append('active', activeFilter);
      }

      if (debouncedSearchTerm.trim()) {
        queryParams.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.overview) {
          setOverview(result.data.overview);
        }

        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }

        if (result.data.clients) {
          const mappedClients = result.data.clients.map(client => {
            const profile = client.profile || client;
            const firstName = profile.first_name || client.first_name || '';
            const lastName = profile.last_name || client.last_name || '';

            let fullName = '';
            if (firstName || lastName) {
              fullName = `${firstName} ${lastName}`.trim();
            } else if (profile.name || client.name) {
              fullName = profile.name || client.name;
            } else if (profile.full_name || client.full_name) {
              fullName = profile.full_name || client.full_name;
            } else {
              fullName = profile.email || client.email || 'Unknown Client';
            }

            return {
              id: client.id || profile.id,
              name: fullName,
              company: client.client_type || profile.client_type || 'Individual',
              type: client.client_type || profile.client_type || 'Individual',
              email: profile.email || client.email || '',
              phone: profile.phone || profile.phone_formatted || client.phone_number || client.phone || '',
              status: client.status || profile.account_status?.toLowerCase() || 'new',
              lastActivity: client.last_activity?.last_active_relative || client.next_due_date || 'N/A',
              lastActivityType: client.last_activity?.activity_title || 'N/A',
              lastActivityIcon: (() => {
                const type = client.last_activity?.activity_type;
                if (type === 'document_upload' || type === 'form_submission') return 'DocumentIcon';
                if (type === 'appointment_scheduled') return 'AppointmentIcon';
                if (type === 'message_sent') return 'MsgIcon';
                if (type === 'login' || type === 'profile_update') return 'CustomerIcon';
                return 'DocumentIcon';
              })(),
              totalBilled: '$0',
              clientStatus: client.is_active !== undefined
                ? (client.is_active ? 'Active' : 'Inactive')
                : (client.status || profile.account_status?.toLowerCase() || 'new') === 'active' ? 'Active' : 'Inactive',
              pendingTasks: client.pending_tasks_count || 0,
              documentsCount: client.documents_count || 0,
              assignedStaff: client.assigned_staff || [],
              is_linked: client.is_linked !== undefined ? client.is_linked : true,
              link_status: client.link_status || (client.is_linked ? 'linked' : 'unlinked')
            };
          });
          setClients(mappedClients);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClientsError('Failed to load clients');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  // Permanently remove taxpayer from firm (Hard Delete from firm perspective)
  const handleDeleteTaxpayer = async (clientId) => {
    try {
      setDeleting(true);
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/taxpayers/${clientId}/soft-delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Client removed from firm successfully', getToastOptions());
        setShowDeleteConfirmModal(false);
        setSelectedClientForDelete(null);
        // Refresh clients list
        await refreshClientsList();
      } else {
        throw new Error(result.message || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to delete client', getToastOptions());
    } finally {
      setDeleting(false);
    }
  };

  // Restore archived taxpayer
  const handleRestoreClient = async (clientId) => {
    try {
      setRestoring(true);
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/taxpayers/${clientId}/restore/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Client restored successfully', getToastOptions());
        // Refresh clients list
        await refreshClientsList();
      } else {
        throw new Error(result.message || 'Failed to restore client');
      }
    } catch (err) {
      console.error('Error restoring client:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to restore client', getToastOptions());
    } finally {
      setRestoring(false);
    }
  };

  // Reassign/Assign Tax Preparer (uses same API for both)
  const handleReassignTaxPreparer = async (clientId, selectedStaffId, isFirm = false) => {
    try {
      setReassigning(true);
      const token = getAccessToken();

      // Build payload based on whether it's a firm or tax preparer
      // Always use tax_preparer_id since selectedStaffId is a User ID (even for firm admins)
      const payload = { tax_preparer_id: parseInt(selectedStaffId) };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/taxpayers/${clientId}/reassign-tax-preparer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const successMessage = isAssignMode
          ? (result.message || 'Tax preparer assigned successfully')
          : (result.message || 'Tax preparer reassigned successfully');
        toast.success(successMessage, getToastOptions());
        setShowReassignStaffModal(false);
        setSelectedClientForReassign(null);
        setIsAssignMode(false);
        // Refresh clients list
        await refreshClientsList();
        // Refresh unlinked taxpayers list if on that tab
        if (activeTab === 'unlinked-taxpayers') {
          await fetchUnlinkedTaxpayers(unlinkedTaxpayersPagination.page, unlinkedTaxpayersPagination.page_size);
        }
        // Refresh pending invites list if on that tab
        if (activeTab === 'pending-invites') {
          await fetchPendingInvites(pendingInvitesPagination.page);
        }
      } else {
        throw new Error(result.message || 'Failed to assign/reassign tax preparer');
      }
    } catch (err) {
      console.error('Error assigning/reassigning tax preparer:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to assign/reassign tax preparer', getToastOptions());
    } finally {
      setReassigning(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-white';
      case 'Pending': return 'text-white';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case 'DocumentIcon': return <Doc className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'CustomerIcon': return <CustomerIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'AppointmentIcon': return <AppointmentIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      case 'MsgIcon': return <MsgIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />;
      default: return <FaFileAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />;
    }
  };

  // Export Clients List to PDF
  const exportClientsToPDF = async () => {
    try {
      if (clients.length === 0) {
        toast.info("No clients to export", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Fetch all clients (not just current page)
      const token = getAccessToken();
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('page_size', '1000'); // Get all clients

      // Add active filter parameter
      if (activeFilter === 'all') {
        queryParams.append('active', 'all');
      } else {
        queryParams.append('active', activeFilter);
      }

      if (debouncedSearchTerm.trim()) {
        queryParams.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      let allClients = clients;
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.clients) {
          allClients = result.data.clients.map(client => {
            const profile = client.profile || client;
            const firstName = profile.first_name || client.first_name || '';
            const lastName = profile.last_name || client.last_name || '';
            let fullName = '';
            if (firstName || lastName) {
              fullName = `${firstName} ${lastName}`.trim();
            } else if (profile.name || client.name) {
              fullName = profile.name || client.name;
            } else if (profile.full_name || client.full_name) {
              fullName = profile.full_name || client.full_name;
            } else {
              fullName = profile.email || client.email || 'Unknown Client';
            }
            return {
              id: client.id || profile.id,
              name: fullName,
              company: client.client_type || profile.client_type || 'Individual',
              type: client.client_type || profile.client_type || 'Individual',
              email: profile.email || client.email || '',
              phone: profile.phone || profile.phone_formatted || client.phone_number || client.phone || '',
              status: client.status || profile.account_status?.toLowerCase() || 'new',
              lastActivity: client.last_activity?.last_active_display || client.next_due_date || 'N/A',
              totalBilled: '$0',
              clientStatus: client.is_active !== undefined
                ? (client.is_active ? 'Active' : 'Inactive')
                : (client.status || profile.account_status?.toLowerCase() || 'new') === 'active' ? 'Active' : 'Inactive',
              assignedStaff: client.assigned_staff || [],
              is_linked: client.is_linked !== undefined ? client.is_linked : true,
              link_status: client.link_status || (client.is_linked ? 'linked' : 'unlinked')
            };
          });
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Clients List Report", pageWidth / 2, yPosition, { align: "center" });
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

      const activeCount = allClients.filter(c => (c.status || '').toLowerCase() === 'active').length;
      const pendingCount = allClients.filter(c => (c.status || '').toLowerCase() === 'pending').length;
      const inactiveCount = allClients.filter(c => (c.status || '').toLowerCase() === 'inactive').length;

      const summaryData = [
        ["Total Clients", allClients.length.toString()],
        ["Active Clients", activeCount.toString()],
        ["Pending Clients", pendingCount.toString()],
        ["Inactive Clients", inactiveCount.toString()],
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

      // Clients Table
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`All Clients (${allClients.length})`, 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = allClients.map((client) => {
        return [
          client.name || 'N/A',
          client.email || 'N/A',
          client.phone || 'N/A',
          client.company || client.type || 'N/A',
          (client.status || 'N/A').charAt(0).toUpperCase() + (client.status || 'N/A').slice(1),
          client.clientStatus || 'Inactive',
          client.lastActivity || 'N/A',
        ];
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [["Client Name", "Email", "Phone", "Type", "Status", "Client Status", "Last Activity"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 35, overflow: 'linebreak' },
          1: { cellWidth: 40, overflow: 'linebreak' },
          2: { cellWidth: 30, overflow: 'linebreak' },
          3: { cellWidth: 25, overflow: 'linebreak' },
          4: { cellWidth: 25, overflow: 'linebreak' },
          5: { cellWidth: 22, overflow: 'linebreak' },
          6: { cellWidth: 25, overflow: 'linebreak' }
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
      const fileName = `Clients_List_${new Date().toISOString().split('T')[0]}.pdf`;
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
    <div className="p-4 sm:p-6 min-h-screen" style={{ backgroundColor: 'var(--Color-purple-50, #F6F7FF)' }}>
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-6 gap-4 clientmanage-header">
        <div className="flex-1 clientmanage-header-content">
          <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro] clientmanage-header-title">Client Management</h4>
          <p className="text-gray-600 font-[BasisGrotesquePro] text-sm clientmanage-header-subtitle">Manage all firm clients and assignments</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 clientmanage-buttons-container">
          {/* Top Row - 2-3 buttons */}
          <div className="flex flex-wrap items-center gap-2 clientmanage-actions-top-row">
            <button
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap clientmanage-action-button"
              onClick={() => setShowBulkTaxpayerImportModal(true)}
            >
              <BulkImport />
              Bulk Import Taxpayers
            </button>
            <button
              className="px-3 py-2 text-white bg-firm-primary !rounded-[7px] hover:brightness-90 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap clientmanage-action-button"
              onClick={() => setShowAddClientModal(true)}
            >
              <AddClient />
              Add Client
            </button>
          </div>

          {/* Bottom Row - 1 button */}
          <div className="flex items-center clientmanage-actions-bottom-row">
            <button
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap clientmanage-action-button"
              onClick={exportClientsToPDF}
            >
              <ExportReport />
              Export Report
            </button>
          </div>
        </div>
      </div>
      {/* Dashboard Error Display */}
      {dashboardError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {dashboardError}
        </div>
      )}
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 mt-4" style={{ gridAutoRows: '1fr' }}>
        {[
          {
            label: "Active Clients",
            value: dashboardLoading ? '...' : dashboardStats.active_clients?.count || 0,
            change: dashboardStats.active_clients?.vs_last_month,
            isCurrency: false,
            clickable: true,
            onClick: () => {
              handleTabChange('clients');
              setTimeout(() => {
                clientsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          },
          {
            label: "Total Billed",
            value: dashboardLoading ? '...' : `$${(dashboardStats.total_billed?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: dashboardStats.total_billed?.vs_last_month,
            isCurrency: true
          },
          {
            label: "Outstanding",
            value: dashboardLoading ? '...' : `$${(dashboardStats.outstanding?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: dashboardStats.outstanding?.vs_last_month,
            isCurrency: true
          },
          {
            label: "New This Month",
            value: dashboardLoading ? '...' : dashboardStats.new_this_month?.count || 0,
            change: dashboardStats.new_this_month?.vs_last_month,
            isCurrency: false
          },
          {
            label: "Archived Clients",
            value: dashboardLoading ? '...' : dashboardStats.archived_clients?.count || 0,
            isCurrency: false,
            clickable: true,
            onClick: () => {
              handleTabChange('clients');
              setActiveFilter('archived');
              setTimeout(() => {
                clientsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          },
        ].map((card, index) => {
          const changeValue = card.change !== undefined && card.change !== null ? card.change : null;
          const isPositive = changeValue !== null && changeValue > 0;
          const isNegative = changeValue !== null && changeValue < 0;
          const isNeutral = changeValue === 0 || changeValue === null;

          return (
            <div className={`w-full h-full ${card.clickable ? 'cursor-pointer' : ''}`} key={index} onClick={card.onClick}>
              <div className={`bg-white p-4 sm:p-6 rounded-lg border border-gray-200 h-full flex flex-col transition-all duration-200 ${card.clickable ? 'hover:shadow-md hover:border-blue-300' : ''}`}>
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-600">{card.label}</div>
                  {card.icon}
                </div>
                {card.value && <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{card.value}</h5>}
                {changeValue !== null && (
                  <p className="text-xs sm:text-sm flex items-center gap-1" style={{ color: isPositive ? '#22C55E' : isNegative ? '#EF4444' : '#6B7280' }}>
                    {isPositive ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
                      </svg>
                    ) : isNegative ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    ) : null}
                    <span>
                      {isPositive ? '+' : ''}
                      {card.isCurrency ? `$${Math.abs(changeValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : Math.abs(changeValue)}
                      {' vs last month'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 align-items-center" style={{
        borderBottom: '2px solid #E8F0FF',
        paddingBottom: '0',
        marginTop: '20px',
        minHeight: '50px'
      }}>
        <button
          className={`btn border-0`}
          onClick={() => handleTabChange('clients')}
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'clients' ? '3px solid #00C0C6' : '3px solid transparent',
            marginBottom: '-2px',
            fontWeight: activeTab === 'clients' ? '600' : '500',
            padding: '10px 20px',
            fontSize: '14px',
            color: activeTab === 'clients' ? '#00C0C6' : '#6B7280',
            backgroundColor: activeTab === 'clients' ? '#F0FDFF' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          All Clients
        </button>
        <button
          className={`btn border-0 position-relative`}
          onClick={() => handleTabChange('pending-requests')}
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'pending-requests' ? '3px solid #00C0C6' : '3px solid transparent',
            marginBottom: '-2px',
            fontWeight: activeTab === 'pending-requests' ? '600' : '500',
            padding: '10px 20px',
            fontSize: '14px',
            color: activeTab === 'pending-requests' ? '#00C0C6' : '#6B7280',
            backgroundColor: activeTab === 'pending-requests' ? '#F0FDFF' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Pending & Unlinked
          {(pendingInvitesPagination.total_count + unlinkedTaxpayersPagination.total_count > 0) && (
            <span className="badge bg-danger text-white ms-2" style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              color: '#ffffff'
            }}>
              {pendingInvitesPagination.total_count + unlinkedTaxpayersPagination.total_count}
            </span>
          )}
        </button>
      </div>

      {/* Pending & Unlinked Section - Only show for pending-requests tab */}
      {activeTab === 'pending-requests' && (
        <div className="flex flex-col gap-6">
          {/* Unlinked Taxpayers Section */}
          <div className="card client-list-card p-4" style={{
            border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
            backgroundColor: 'white',
            borderRadius: '12px'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#131323', fontSize: '16px' }}>Unlinked Taxpayers</h6>
                <p className="text-muted small mb-0">Users not yet assigned to a specific tax preparer</p>
              </div>
              <span className="badge bg-warning px-3 py-2" style={{ borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                {unlinkedTaxpayersPagination.total_count} Unlinked
              </span>
            </div>

            {unlinkedTaxpayersLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading unlinked taxpayers...</p>
              </div>
            ) : unlinkedTaxpayersError ? (
              <div className="alert alert-danger" role="alert">
                <strong>Error:</strong> {unlinkedTaxpayersError}
                <button className="btn  btn-outline-danger ms-2" onClick={() => fetchUnlinkedTaxpayers(1, unlinkedTaxpayersPagination.page_size)}>
                  Retry
                </button>
              </div>
            ) : unlinkedTaxpayers.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <p className="text-muted mb-0">No unlinked taxpayers found</p>
              </div>
            ) : (
              <>
                <div className="row g-3">
                  {unlinkedTaxpayers.map((taxpayer) => (
                    <div key={taxpayer.id} className="col-md-4 col-12">
                      <div
                        className="card client-card h-100"
                        style={{
                          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                          padding: '6px',
                          borderRadius: '10px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start" style={{ gap: '12px' }}>
                          <div
                            className="d-flex gap-3 flex-grow-1"
                            onClick={() => navigate(`/firmadmin/clients/${taxpayer.id}`)}
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              className="client-initials"
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#00C0C6",
                                color: "white",
                                fontWeight: "600",
                                fontSize: "16px",
                                flexShrink: 0
                              }}
                            >
                              {taxpayer.first_name?.[0]?.toUpperCase() || ''}{taxpayer.last_name?.[0]?.toUpperCase() || ''}
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-1" style={{ color: '#131323' }}>
                                {taxpayer.full_name || `${taxpayer.first_name} ${taxpayer.last_name}`}
                              </div>
                              {taxpayer.email && (
                                <div className="text-muted small mb-2 d-flex align-items-center gap-1">
                                  <FaEnvelope className="text-info" size={12} />
                                  {taxpayer.email}
                                </div>
                              )}
                              {taxpayer.phone_number && (
                                <div className="text-muted small mb-2 d-flex align-items-center gap-1">
                                  <FaPhone className="text-info" size={12} />
                                  {taxpayer.phone_number}
                                </div>
                              )}
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {taxpayer.is_active ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10px' }}>
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle" style={{ fontSize: '10px' }}>
                                    Inactive
                                  </span>
                                )}
                                {taxpayer.is_email_verified && (
                                  <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '10px' }}>
                                    Email Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-2 align-items-end" style={{ marginLeft: '12px', minWidth: 'fit-content' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClientForReassign(taxpayer.id);
                                setIsAssignMode(true);
                                setShowReassignStaffModal(true);
                              }}
                              style={{
                                backgroundColor: '#F56D2D',
                                color: 'white',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '600',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                transition: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Assign
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClientForDelete(taxpayer.id);
                                setShowDeleteConfirmModal(true);
                              }}
                              style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: '600',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                transition: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination for unlinked taxpayers */}
                {unlinkedTaxpayersPagination.total_pages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <div className="text-muted small">
                      Showing {((unlinkedTaxpayersPagination.page - 1) * unlinkedTaxpayersPagination.page_size) + 1} to{' '}
                      {Math.min(unlinkedTaxpayersPagination.page * unlinkedTaxpayersPagination.page_size, unlinkedTaxpayersPagination.total_count)} of{' '}
                      {unlinkedTaxpayersPagination.total_count}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-xs btn-outline-secondary px-3"
                        onClick={() => fetchUnlinkedTaxpayers(unlinkedTaxpayersPagination.page - 1, unlinkedTaxpayersPagination.page_size)}
                        disabled={unlinkedTaxpayersPagination.page === 1 || unlinkedTaxpayersLoading}
                      >
                        Prev
                      </button>
                      <button
                        className="btn btn-xs btn-outline-secondary px-3"
                        onClick={() => fetchUnlinkedTaxpayers(unlinkedTaxpayersPagination.page + 1, unlinkedTaxpayersPagination.page_size)}
                        disabled={unlinkedTaxpayersPagination.page >= unlinkedTaxpayersPagination.total_pages || unlinkedTaxpayersLoading}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pending Invites Section */}
          <div className="card client-list-card p-4" style={{
            border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
            backgroundColor: 'white',
            borderRadius: '12px'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h6 className="fw-bold mb-1" style={{ color: '#131323', fontSize: '16px' }}>Pending Invites</h6>
                <p className="text-muted small mb-0">Client invites awaiting acceptance</p>
              </div>
              <span className="badge bg-danger text-white px-3 py-2" style={{ borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                {pendingInvitesPagination.total_count} Pending
              </span>
            </div>

            {pendingInvitesLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading pending invites...</p>
              </div>
            ) : pendingInvitesError ? (
              <div className="alert alert-danger" role="alert">
                <strong>Error:</strong> {pendingInvitesError}
                <button className="btn  btn-outline-danger ms-2" onClick={() => fetchPendingInvites()}>
                  Retry
                </button>
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <p className="text-muted mb-0">No pending invites found</p>
              </div>
            ) : (
              <>
                <div className="row g-3">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="col-md-4 col-12">
                      <div
                        className="card client-card h-100"
                        onClick={() => navigate(`/firmadmin/pending-invites/${invite.id || invite.invite_id || invite.client_id}`)}
                        style={{
                          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                          cursor: "pointer",
                          padding: '6px',
                          borderRadius: '10px'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex gap-3">
                            <div
                              className="client-initials"
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#00C0C6",
                                color: "white",
                                fontWeight: "600",
                                fontSize: "16px",
                                flexShrink: 0
                              }}
                            >
                              {invite.first_name?.[0]?.toUpperCase() || ''}{invite.last_name?.[0]?.toUpperCase() || ''}
                            </div>
                            <div>
                              <div className="fw-semibold mb-1" style={{ color: '#131323' }}>
                                {invite.first_name} {invite.last_name}
                              </div>
                              <div className="text-muted small mb-1 d-flex align-items-center gap-1">
                                <FaEnvelope className="text-info" size={12} />
                                {invite.email}
                              </div>
                              <div className="text-muted small italic">
                                Invited: {invite.invited_at_formatted || (invite.invited_at ? new Date(invite.invited_at).toLocaleDateString() : 'N/A')}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-2 align-items-end" style={{ marginLeft: '12px', minWidth: 'fit-content' }}>
                            <button
                              className="btn "
                              onClick={(e) => {
                                e.stopPropagation();
                                const clientId = invite.client_id || invite.taxpayer_id || invite.id;
                                if (clientId) {
                                  setSelectedClientForReassign(clientId);
                                  setIsAssignMode(true);
                                  setShowReassignStaffModal(true);
                                }
                              }}
                              style={{
                                backgroundColor: '#F56D2D',
                                color: 'white',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '4px 10px',
                                borderRadius: '5px'
                              }}
                            >
                              Assign
                            </button>
                            <button
                              className="btn  d-flex align-items-center justify-content-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInviteActionsModal(invite);
                              }}
                              style={{
                                backgroundColor: '#00C0C6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              <FaLink size={10} />
                              <span>Invite</span>
                            </button>
                            <button
                              className="btn d-flex align-items-center justify-content-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveInviteDetails(invite);
                                handleDeleteInvite();
                              }}
                              style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              <FaTrash size={10} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination for invites */}
                {pendingInvitesPagination.total_pages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <div className="text-muted small">
                      Showing {((pendingInvitesPagination.page - 1) * pendingInvitesPagination.page_size) + 1} to {Math.min(pendingInvitesPagination.page * pendingInvitesPagination.page_size, pendingInvitesPagination.total_count)} of {pendingInvitesPagination.total_count}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-xs btn-outline-secondary px-3"
                        onClick={() => fetchPendingInvites(pendingInvitesPagination.page - 1)}
                        disabled={pendingInvitesPagination.page === 1 || pendingInvitesLoading}
                      >
                        Prev
                      </button>
                      <button
                        className="btn btn-xs btn-outline-secondary px-3"
                        onClick={() => fetchPendingInvites(pendingInvitesPagination.page + 1)}
                        disabled={pendingInvitesPagination.page >= pendingInvitesPagination.total_pages || pendingInvitesLoading}
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
      )}

      {/* Client List Section - Only show for clients tab */}
      {activeTab === 'clients' && (
        <div ref={clientsListRef} className="bg-white rounded-lg border border-gray-200">
          {/* Section Header */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="taxdashboardr-titler text-lg sm:text-xl">
                  All Clients
                </h4>
                <h5 className="taxdashboard-subtitle text-sm sm:text-base">Complete list of firm clients with status and assignment information</h5>
              </div>
            </div>
            {clientsError && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {clientsError}
              </div>
            )}
          </div>

          {/* Toolbar - Only show for clients tab */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="d-flex flex-column gap-4">
              {/* Search Bar Row */}
              <div className="w-100 position-relative">
                <input
                  type="text"
                  placeholder="Search clients by name, email or company.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1);
                    }
                  }}
                  className="w-100 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{
                    backgroundColor: 'var(--Palette2-Dark-blue-50, #F3F7FF)',
                    height: '45px',
                    paddingLeft: '40px'
                  }}
                />
                <div className="position-absolute left-3 top-50 translate-middle-y" style={{ left: '12px', zIndex: 1 }}>
                  <SearchIcon />
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="position-absolute right-3 top-50 translate-middle-y text-gray-400 hover:text-gray-600 border-0 bg-transparent"
                    style={{ right: '12px' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filters Section */}
              <div className="d-flex flex-column gap-3">
                {/* Status Filter Row */}
                <div className="d-flex align-items-center gap-3">
                  <span className="text-secondary small fw-bold" style={{ minWidth: '85px', fontFamily: 'BasisGrotesquePro' }}>Filter Status:</span>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'true'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setActiveFilter('true');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '80px' }}
                    >
                      Active
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'false'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setActiveFilter('false');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '80px' }}
                    >
                      Inactive
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'all'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setActiveFilter('all');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '80px' }}
                    >
                      All
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors ${activeFilter === 'archived'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setActiveFilter('archived');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '80px' }}
                    >
                      Archived
                    </button>
                  </div>
                </div>

                {/* Link Status Filter Row */}
                <div className="d-flex align-items-center gap-3">
                  <span className="text-secondary small fw-bold" style={{ minWidth: '85px', fontFamily: 'BasisGrotesquePro' }}>Link Status:</span>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors ${linkStatusFilter === 'all'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setLinkStatusFilter('all');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '80px' }}
                    >
                      All
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors d-flex align-items-center justify-content-center gap-1 ${linkStatusFilter === 'linked'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setLinkStatusFilter('linked');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '100px' }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ width: '16px' }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Linked
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors d-flex align-items-center justify-content-center gap-1 ${linkStatusFilter === 'unlinked'
                        ? 'bg-[#00C0C6] text-white border-0'
                        : 'bg-white text-gray-700 border border-[#E8F0FF] hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        setLinkStatusFilter('unlinked');
                        setCurrentPage(1);
                      }}
                      style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '7px', minWidth: '100px' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Unlinked
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Client Table */}
          <div className="overflow-x-auto px-4 sm:px-6">
            <table className="min-w-full">
              <thead className="">
                <tr className="flex gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                  <th className="flex-1 min-w-[150px] sm:min-w-[200px] md:min-w-[250px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="w-[120px] sm:w-[150px] md:w-[180px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="w-[100px] sm:w-[120px] md:w-[140px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="w-[90px] sm:w-[100px] md:w-[120px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Status</th>
                  <th className="w-[120px] sm:w-[140px] md:w-[160px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                  <th className="w-[70px] sm:w-[80px] md:w-[100px] py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {clientsLoading ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      Loading clients...
                    </td>
                  </tr>
                ) : clientsError ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-red-500">
                      {clientsError}
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td colSpan="6" className="p-0">
                        <div
                          className="border border-[#E8F0FF] p-3 mb-3 rounded-lg"
                        >
                          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                            {/* Client Column */}
                            <div className="flex-1 min-w-[150px] sm:min-w-[200px] md:min-w-[250px]">
                              <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <div
                                      className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-blue-600"
                                      onClick={() => navigate(`/firmadmin/clients/${client.id}`)}
                                    >
                                      {client.name}
                                    </div>
                                    {/* Link Status Badge */}
                                    {client.is_linked === true || client.link_status === 'linked' ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Linked
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Unlinked
                                      </span>
                                    )}
                                  </div>
                                  {/* <div className="text-xs text-gray-600 flex items-center mb-1">
                                  {client.company === "Smith Enterprises" || client.company === "Davis LLC" ? (
                                    <div className="mr-1">
                                      <Building />
                                    </div>
                                  ) : null}
                                  {client.company}
                                </div> */}
                                  <div className="text-xs text-gray-400">{client.type}</div>
                                </div>
                              </div>
                            </div>

                            {/* Contact Column */}
                            <div className="w-[120px] sm:w-[150px] md:w-[180px] flex-shrink-0">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  <MailIcon />
                                  <span className="break-all truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  <CallIcon />
                                  <span className="truncate">{client.phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Last Activity Column */}
                            <div className="w-[100px] sm:w-[120px] md:w-[140px] flex-shrink-0">
                              <div className="flex items-center space-x-2">
                                {getActivityIcon(client.lastActivityIcon)}
                                <div className="min-w-0">
                                  <div className="text-sm text-gray-600 truncate">{client.lastActivity}</div>
                                  <div className="text-xs text-gray-400 truncate">{client.lastActivityType}</div>
                                </div>
                              </div>
                            </div>

                            <div className="w-[90px] sm:w-[100px] md:w-[120px] flex justify-start flex-shrink-0">
                              <span
                                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white`}
                                style={client.is_deleted ? {
                                  background: '#6B7280',
                                  border: '0.5px solid #6B7280'
                                } : client.clientStatus === 'Active' ? {
                                  background: '#22C55E',
                                  border: '0.5px solid #22C55E'
                                } : {
                                  background: 'var(--color-red-500, #EF4444)',
                                  border: '0.5px solid var(--color-red-500, #EF4444)'
                                }}
                              >
                                {client.is_deleted ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>
                                    <span className="">Archived</span>
                                  </>
                                ) : (
                                  <>
                                    {client.clientStatus === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>}
                                    {client.clientStatus === 'Inactive' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>}
                                    <span className="">{client.clientStatus}</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Assigned Staff Column */}
                            <div className="w-[120px] sm:w-[140px] md:w-[160px] flex-shrink-0">
                              {client.assignedStaff && client.assignedStaff.length > 0 ? (
                                <div className="space-y-1">
                                  {client.assignedStaff.map((staff, index) => (
                                    <div key={staff.id || index} className="text-xs text-gray-600 truncate" title={staff.name}>
                                      {staff.name}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClientForReassign(client.id);
                                    setIsAssignMode(true);
                                    setShowReassignStaffModal(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-md font-[BasisGrotesquePro]
             hover:bg-[inherit] hover:text-[inherit] hover:border-[inherit]
             active:bg-[inherit] active:text-[inherit]
             focus:bg-[inherit] focus:text-[inherit]
             !opacity-100"
                                  style={{
                                    backgroundColor: 'var(--firm-primary-color, #3AD6F2)',
                                    color: 'white',
                                    borderRadius: '10px',
                                    outline: 'none',
                                    transition: 'none',
                                    opacity: 1
                                  }}
                                >
                                  Assign Staff
                                </button>

                              )}
                            </div>

                            {/* Action Column */}
                            <div className="w-[70px] sm:w-[80px] md:w-[100px] text-sm font-medium relative dropdown-container flex justify-center flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDropdown(showDropdown === client.id ? null : client.id);
                                }}
                                className="text-gray-400 "
                              >
                                <Action />
                              </button>
                              {showDropdown === client.id && (
                                <div
                                  className="absolute mt-2 w-48 bg-white shadow-lg z-10"
                                  style={{
                                    border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    right: '8px',
                                    width: '200px',
                                  }}
                                >
                                  <div className="p" style={{ paddingLeft: "20px", paddingRight: "20px", paddingTop: "10px" }}>
                                    {client.is_deleted ? (
                                      <button
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 font-bold"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestoreClient(client.id);
                                          setShowDropdown(null);
                                        }}
                                      >
                                        Restore Client
                                      </button>
                                    ) : (
                                      <>
                                        {client.assignedStaff && client.assignedStaff.length > 0 ? (
                                          <button
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700"
                                            style={{
                                              transition: 'none',
                                              backgroundColor: 'transparent',
                                              color: '#374151'
                                            }}
                                            onClick={() => {
                                              setSelectedClientForReassign(client.id);
                                              setIsAssignMode(false);
                                              setShowReassignStaffModal(true);
                                              setShowDropdown(null);
                                            }}
                                          >
                                            Reassign Staff
                                          </button>
                                        ) : (
                                          <button
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700"
                                            style={{
                                              transition: 'none',
                                              backgroundColor: 'transparent',
                                              color: '#374151'
                                            }}
                                            onClick={() => {
                                              setSelectedClientForReassign(client.id);
                                              setIsAssignMode(true);
                                              setShowReassignStaffModal(true);
                                              setShowDropdown(null);
                                            }}
                                          >
                                            Assign Staff
                                          </button>
                                        )}
                                      </>
                                    )}
                                    {!client.is_deleted && (
                                      <>
                                        <button
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedClientForWorkflow({
                                              id: client.id,
                                              name: client.name || client.company || 'Client',
                                              assignedPreparerId: client.assignedStaff?.[0]?.id || null
                                            });
                                            setShowStartWorkflowModal(true);
                                            setShowDropdown(null);
                                          }}
                                        >
                                          Start Workflow
                                        </button>
                                        <button
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedClientForMessage({
                                              id: client.id,
                                              name: client.name || 'Client'
                                            });
                                            setIsMessageModalOpen(true);
                                            setShowDropdown(null);
                                          }}
                                        >
                                          Send Message
                                        </button>
                                        <div style={{ borderTop: '0.2px solid #000000' }}></div>
                                      </>
                                    )}
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                      style={{ color: 'var(--color-red-500, #EF4444)' }}
                                      onClick={() => {
                                        setSelectedClientForDelete(client.id);
                                        setShowDeleteConfirmModal(true);
                                        setShowDropdown(null);
                                      }}
                                    >
                                      {client.is_deleted ? 'Permanently Remove' : 'Remove from Firm'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_count > 0 && (
            <div className="p-3 sm:p-4 border-t border-gray-200 flex flex-nowrap items-center justify-between gap-2 overflow-x-auto">
              <div className="text-[10px] sm:text-xs text-gray-600 font-[BasisGrotesquePro] whitespace-nowrap">
                Showing {((pagination.page - 1) * pagination.page_size) + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total_count)} of {pagination.total_count}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.has_previous || currentPage === 1}
                  className={`px-2 py-1 text-[10px] sm:text-xs font-medium !rounded-[6px] transition-colors font-[BasisGrotesquePro] h-7 flex items-center justify-center ${!pagination.has_previous || currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="hidden sm:inline">Prev</span>
                  <span className="sm:hidden">&lt;</span>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 text-[10px] sm:text-xs font-medium !rounded-[6px] transition-colors font-[BasisGrotesquePro] flex items-center justify-center ${currentPage === pageNum
                          ? 'text-white shadow-sm hover:brightness-90'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        style={currentPage === pageNum ? { backgroundColor: 'var(--firm-primary-color, #3AD6F2)' } : {}}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                  disabled={!pagination.has_next || currentPage === pagination.total_pages}
                  className={`px-2 py-1 text-[10px] sm:text-xs font-medium !rounded-[6px] transition-colors font-[BasisGrotesquePro] h-7 flex items-center justify-center ${!pagination.has_next || currentPage === pagination.total_pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">&gt;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Bar for Pending Invites Tab */}
      {activeTab === 'pending-invites' && (
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search invites by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: 'var(--Palette2-Dark-blue-50, #F3F7FF)' }}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Client Message Modal */}
      <ClientMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        clientId={selectedClientForMessage?.id}
        clientName={selectedClientForMessage?.name}
      />

      {/* Filters Modal */}
      {
        showFiltersModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={() => setShowFiltersModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-3 max-w-2xl w-full mx-4"
              style={{
                borderRadius: '12px',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex justify-between items-center pb-2" style={{ borderBottom: '0.5px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                  <h3 className="taxdashboardr-titler text-base font-bold text-gray-900" style={{ color: '#3B4A66' }}>Filters</h3>
                  <button
                    onClick={() => setShowFiltersModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 text-gray-500"
                  >
                    <IoMdClose size={22} />
                  </button>
                </div>
              </div>

              {/* Filter Columns */}
              <div className="grid grid-cols-4 gap-3 items-start">
                {/* Column 1: Status */}
                <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                  <h3 className="taxdashboardr-titler mb-2">Status</h3>
                  <div className="space-y-1 flex flex-col">
                    {['All Status', 'Lead', 'Prospect', 'Active', 'Inactive', 'Pending', 'Archived'].map((status) => {
                      const key = status.toLowerCase().replace(' ', '');
                      const filterKey = key === 'allstatus' ? 'allStatus' : key;
                      return (
                        <label key={status} className="flex items-center gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={statusFilters[filterKey] || false}
                            onChange={(e) => {
                              setStatusFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                            }}
                            className="w-3 h-3 rounded border-gray-300"
                            style={{
                              accentColor: '#3AD6F2',
                              border: '1px solid #E5E7EB'
                            }}
                          />
                          <span className="text-xs text-gray-600 ml-4">{status}</span>
                        </label>
                      );
                    })}

                    {/* Types sub-section */}
                    <div className="mt-3">
                      <h4 className="taxdashboardr-titler mb-2">Types</h4>
                      <div className="space-y-1 flex flex-col">
                        {['All Types', 'Individual', 'Business', 'Partnership', 'Corporation'].map((type) => {
                          const key = type.toLowerCase().replace(' ', '');
                          const filterKey = key === 'alltypes' ? 'allTypes' : key;
                          return (
                            <label key={type} className="flex items-center gap-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={typeFilters[filterKey] || false}
                                onChange={(e) => {
                                  setTypeFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                                }}
                                className="w-3 h-3 rounded border-gray-300"
                                style={{
                                  accentColor: '#3AD6F2',
                                  border: '1px solid #E5E7EB'
                                }}
                              />
                              <span className="text-xs text-gray-600 ml-4">{type}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>


                {/* Column 2: Returns */}
                <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                  <h3 className="taxdashboardr-titler mb-2">Returns</h3>
                  <div className="space-y-1 flex flex-col">
                    {['All Returns', '1040', '1065', '1120', '990'].map((returnType) => {
                      const key = returnType.toLowerCase().replace(' ', '');
                      const filterKey = key === 'allreturns' ? 'allReturns' : key;
                      return (
                        <label key={returnType} className="flex items-center gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={returnFilters[filterKey] || false}
                            onChange={(e) => {
                              setReturnFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                            }}
                            className="w-3 h-3 rounded border-gray-300"
                            style={{
                              accentColor: '#3AD6F2',
                              border: '1px solid #E5E7EB'
                            }}
                          />
                          <span className="text-xs text-gray-600 ml-4">{returnType}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: All Tags */}
                <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                  <h3 className="taxdashboardr-titler mb-2">All Tags</h3>
                  <div className="space-y-1 flex flex-col">
                    {['EIC filer', 'Small Business', 'High Income', 'Audit Risk'].map((tag) => {
                      const key = tag.toLowerCase().replace(' ', '');
                      const filterKey = key === 'eicfiler' ? 'eicFiler' :
                        key === 'smallbusiness' ? 'smallBusiness' :
                          key === 'highincome' ? 'highIncome' :
                            key === 'auditrisk' ? 'auditRisk' : key;
                      return (
                        <label key={tag} className="flex items-center gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tagFilters[filterKey] || false}
                            onChange={(e) => {
                              setTagFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                            }}
                            className="w-3 h-3 rounded border-gray-300"
                            style={{
                              accentColor: '#3AD6F2',
                              border: '1px solid #E5E7EB'
                            }}
                          />
                          <span className="text-xs text-gray-600 ml-4">{tag}</span>
                        </label>
                      );
                    })}

                    {/* Segments sub-section */}
                    <div className="mt-3">
                      <h4 className="taxdashboardr-titler mb-2">Segments</h4>
                      <div className="space-y-1 flex flex-col">
                        {['EIC Filers', 'High Income'].map((segment) => {
                          const key = segment.toLowerCase().replace(' ', '');
                          const filterKey = key === 'eicfilers' ? 'eicFilers' : key;
                          return (
                            <label key={segment} className="flex items-center gap-4 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={segmentFilters[filterKey] || false}
                                onChange={(e) => {
                                  setSegmentFilters(prev => ({ ...prev, [filterKey]: e.target.checked }));
                                }}
                                className="w-3 h-3 rounded border-gray-300"
                                style={{
                                  accentColor: '#3AD6F2',
                                  border: '1px solid #E5E7EB'
                                }}
                              />
                              <span className="text-xs text-gray-600 ml-4">{segment}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 4: All Comm */}
                <div className="p-2 rounded-lg self-start" style={{ border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)' }}>
                  <h4 className="taxdashboardr-titler mb-2">All Comm</h4>
                  <div className="space-y-1 flex flex-col">
                    {['SMS', 'Email', 'Portal'].map((comm) => {
                      const key = comm.toLowerCase();
                      return (
                        <label key={comm} className="flex items-center gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={commFilters[key] || false}
                            onChange={(e) => {
                              setCommFilters(prev => ({ ...prev, [key]: e.target.checked }));
                            }}
                            className="w-3 h-3 rounded border-gray-300"
                            style={{
                              accentColor: '#3AD6F2',
                              border: '1px solid #E5E7EB'
                            }}
                          />
                          <span className="text-xs text-gray-600 ml-4">{comm}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkActionModal}
        onClose={() => setShowBulkActionModal(false)}
        selectedCount={0}
      />
      {/* Bulk Import modal  */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportSuccess={async () => {
          // Refresh clients list after successful import
          await refreshClientsList();
        }}
      />
      {/* Bulk Taxpayer Import modal  */}
      <BulkTaxpayerImportModal
        isOpen={showBulkTaxpayerImportModal}
        onClose={() => setShowBulkTaxpayerImportModal(false)}
        onImportSuccess={async () => {
          // Refresh clients list after successful import
          await refreshClientsList();
        }}
      />
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onClientCreated={() => {
          // Refresh clients list if needed
          console.log('Client created, refresh list');
        }}
      />

      <IntakeFormBuilderModal
        isOpen={showFormBuilder}
        onClose={() => setShowFormBuilder(false)}
      />

      {/* Start Workflow Modal */}
      <StartWorkflowModal
        isOpen={showStartWorkflowModal}
        onClose={() => {
          setShowStartWorkflowModal(false);
          setSelectedClientForWorkflow(null);
        }}
        onSuccess={() => {
          // Toast is already shown in StartWorkflowModal component, no need to show it again
          // Optionally refresh data or navigate
        }}
        clientId={selectedClientForWorkflow?.id}
        clientName={selectedClientForWorkflow?.name}
        assignedPreparerId={selectedClientForWorkflow?.assignedPreparerId}
      />

      {/* Share Taxpayer Invite Modal */}
      {
        showInviteActionsModal && activeInviteDetails && (
          <div className="modal invite-actions-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ overflow: 'visible' }}>
              <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '520px', overflow: 'visible' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                  <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>Share Taxpayer Invite</h5>
                  <button type="button" className="btn-close" onClick={closeInviteActionsModal} aria-label="Close"></button>
                </div>
                <div className="modal-body" style={{ padding: '24px', overflow: 'visible' }}>
                  <div className="p-3 mb-4" style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E8F0FF' }}>
                    <p className="mb-1 fw-semibold" style={{ color: '#3B4A66' }}>
                      {activeInviteDetails.first_name} {activeInviteDetails.last_name}
                    </p>
                    <p className="mb-1 text-muted" style={{ fontSize: '14px' }}>{activeInviteDetails.email}</p>
                    {activeInviteDetails.phone_number && (
                      <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>{activeInviteDetails.phone_number}</p>
                    )}
                    {inviteExpiresOn && (
                      <small className="text-muted">Expires {inviteExpiresOn}</small>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                      <FaLink size={14} /> Shareable Link
                    </label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        value={activeInviteDetails.invite_link || ""}
                        readOnly
                        style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCopyInviteLink}
                        disabled={!activeInviteDetails.invite_link}
                        style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                      >
                        <FaCopy size={12} className="me-1" />
                        Copy
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleRefreshInviteLink}
                        disabled={inviteLinkRefreshing}
                        style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                      >
                        {inviteLinkRefreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <small className="text-muted d-block mt-1">
                      Share this link with the taxpayer. They can use it anytime before it expires.
                    </small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                      <FaEnvelope size={14} /> Send Email Invite
                    </label>
                    <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                      We'll email a secure link to the address below.
                    </p>
                    <div className="d-flex gap-2">
                      <input
                        type="email"
                        className="form-control"
                        value={editedInviteEmail}
                        onChange={(e) => setEditedInviteEmail(e.target.value)}
                        placeholder={activeInviteDetails.email || 'Enter email'}
                        style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSendEmailInviteNow}
                        disabled={inviteActionLoading}
                        style={{ borderRadius: '8px', backgroundColor: '#00C0C6', borderColor: '#00C0C6', whiteSpace: 'nowrap' }}
                      >
                        {inviteActionLoading && inviteActionMethod === "email" ? "Sending..." : "Send Email"}
                      </button>
                    </div>
                    {activeInviteDetails.delivery_summary && (
                      <div className="mt-2 text-muted small">
                        Email sent: {activeInviteDetails.delivery_summary.email_sent ? "Yes" : "No"}
                      </div>
                    )}
                  </div>

                  <div className="mb-1">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66' }}>
                      <FaSms size={14} /> Send SMS Invite
                    </label>
                    <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                      We'll text the invite link to the phone number you provide3333.
                    </p>
                    <div className="d-flex gap-2 mb-2">
                      <PhoneInput
                        country={smsPhoneCountry}
                        value={smsPhoneOverride || ''}
                        onChange={(phone) => setSmsPhoneOverride(phone)}
                        onCountryChange={(countryCode) => {
                          setSmsPhoneCountry(countryCode.toLowerCase());
                        }}
                        inputClass="form-control"
                        containerClass="w-100 phone-input-container flex-1 invite-actions-phone-container"
                        inputStyle={{ width: '100%', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        dropdownStyle={{ zIndex: 2002, maxHeight: 240, overflowY: 'auto', width: '100%', minWidth: '100%', boxSizing: 'border-box' }}
                        enableSearch={true}
                        countryCodeEditable={false}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSendSmsInviteNow}
                        disabled={inviteActionLoading}
                        style={{ borderRadius: '8px', backgroundColor: '#00C0C6', borderColor: '#00C0C6', whiteSpace: 'nowrap' }}
                      >
                        {inviteActionLoading && inviteActionMethod === "sms" ? "Sending..." : "Send SMS"}
                      </button>
                    </div>
                    {activeInviteDetails.delivery_summary && (
                      <div className="text-muted small">
                        SMS sent: {activeInviteDetails.delivery_summary.sms_sent ? "Yes" : "No"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-end align-items-center gap-2" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                  {(activeInviteDetails?.id || activeInviteDetails?.invite_id) && (
                    <button
                      className="btn btn-outline-danger d-flex align-items-center"
                      style={{ borderRadius: '8px' }}
                      onClick={handleDeleteInvite}
                      disabled={deletingInvite}
                    >
                      <FaTrash size={12} className="me-1" />
                      {deletingInvite ? 'Deleting...' : 'Delete Invite'}
                    </button>
                  )}
                  <button className="btn btn-light" style={{ borderRadius: '8px' }} onClick={closeInviteActionsModal}>
                    Invite Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Reassign/Assign Staff Modal */}
      {
        showReassignStaffModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={() => {
              if (!reassigning) {
                setShowReassignStaffModal(false);
                setSelectedClientForReassign(null);
                setIsAssignMode(false);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full mx-4"
              style={{
                borderRadius: '12px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-base font-bold text-gray-900" style={{ color: '#3B4A66' }}>
                  {isAssignMode ? 'Assign Tax Preparer' : 'Reassign Tax Preparer'}
                </h4>
                <button
                  onClick={() => {
                    if (!reassigning) {
                      setShowReassignStaffModal(false);
                      setSelectedClientForReassign(null);
                      setIsAssignMode(false);
                      setSelectedStaffIdForModal(null);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 text-gray-500"
                  disabled={reassigning}
                >
                  <IoMdClose size={20} />
                </button>
              </div>

              {staffLoading ? (
                <div className="text-center py-4 text-gray-500">Loading staff members...</div>
              ) : staffError ? (
                <div className="text-center py-4 text-red-500">{staffError}</div>
              ) : staffMembers.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-600 mb-2 font-medium">No preparers found</div>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a staff member or this client will remain unassigned.
                  </p>
                  <button
                    onClick={() => {
                      setShowReassignStaffModal(false);
                      navigate('/firmadmin/staff');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:brightness-90 transition-opacity font-[BasisGrotesquePro]"
                    style={{ background: 'var(--firm-primary-color, #3AD6F2)' }}
                  >
                    Add Staff Member
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative" ref={staffDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                      Select Tax Preparer
                    </label>
                    <div
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white cursor-pointer flex justify-between items-center ${isStaffDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                      onClick={() => !reassigning && setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                    >
                      <span className={`text-sm font-[BasisGrotesquePro] ${selectedStaffIdForModal ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selectedStaffIdForModal
                          ? staffMembers.find(s => s.id === selectedStaffIdForModal)?.name || 'Selected'
                          : 'Select a tax preparer'}
                      </span>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${isStaffDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isStaffDropdownOpen && (
                      <div className="absolute z-[10000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Search preparers..."
                              value={staffSearchQuery}
                              onChange={(e) => setStaffSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredStaffMembers.length > 0 ? (
                            filteredStaffMembers.map((staff) => (
                              <div
                                key={staff.id}
                                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex flex-col gap-0.5 ${selectedStaffIdForModal === staff.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                  setSelectedStaffIdForModal(staff.id);
                                  setIsStaffDropdownOpen(false);
                                }}
                              >
                                <div className="font-medium flex items-center gap-1.5">
                                  {staff.name}
                                  {staff.is_firm_admin && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold uppercase">Admin</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">{staff.email}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500 italic">
                              No preparers found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {reassigning && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      {isAssignMode ? 'Assigning...' : 'Reassigning...'}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (!reassigning) {
                          setShowReassignStaffModal(false);
                          setSelectedClientForReassign(null);
                          setIsAssignMode(false);
                          setSelectedStaffIdForModal(null);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 !rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro]"
                      disabled={reassigning}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (selectedStaffIdForModal && selectedClientForReassign) {
                          const selectedStaff = staffMembers.find(staff => staff.id === selectedStaffIdForModal);
                          const isFirm = selectedStaff?.is_firm_admin === true;
                          handleReassignTaxPreparer(selectedClientForReassign, selectedStaffIdForModal, isFirm);
                        } else {
                          toast.error('Please select a tax preparer', getToastOptions());
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white !rounded-lg font-[BasisGrotesquePro]"
                      style={{
                        background: 'var(--Palette2-SkyBlue-900, #3AD6F2)',
                        transition: 'none'
                      }}
                      disabled={reassigning || !selectedStaffIdForModal}
                    >
                      {reassigning
                        ? (isAssignMode ? 'Assigning...' : 'Reassigning...')
                        : (isAssignMode ? 'Assign' : 'Reassign')
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Delete Invite Confirmation Modal */}
      {
        showDeleteInviteConfirmModal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 shadow-2xl"
            style={{
              zIndex: 10000,
              backgroundColor: "rgba(19, 19, 35, 0.4)",
              backdropFilter: "blur(4px)",
              animation: "fadeIn 0.2s ease-out"
            }}
            onClick={() => !deletingInvite && setShowDeleteInviteConfirmModal(false)}
          >
            <div
              className="bg-white w-full max-w-sm overflow-hidden"
              style={{
                borderRadius: '24px',
                padding: '32px',
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex items-center justify-center"
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#FFF5F5",
                    color: "#FF4D4F",
                    borderRadius: "18px",
                    fontSize: "24px"
                  }}
                >
                  <FaTrash />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Delete Invitation</h3>
                <p className="text-sm text-gray-500 mb-8 font-[BasisGrotesquePro] leading-relaxed">
                  Are you sure you want to delete this invitation? This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmDeleteInvite}
                  disabled={deletingInvite}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-200"
                  style={{
                    backgroundColor: '#FF4D4F',
                    boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)"
                  }}
                >
                  {deletingInvite && <div className="spinner-border spinner-border-sm" role="status" />}
                  {deletingInvite ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteInviteConfirmModal(false)}
                  disabled={deletingInvite}
                  className="w-full px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Client Confirmation Modal */}
      {
        showDeleteConfirmModal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 shadow-2xl"
            style={{
              zIndex: 10000,
              backgroundColor: "rgba(19, 19, 35, 0.4)",
              backdropFilter: "blur(4px)",
              animation: "fadeIn 0.2s ease-out"
            }}
            onClick={() => !deleting && setShowDeleteConfirmModal(false)}
          >
            <div
              className="bg-white w-full max-w-sm overflow-hidden"
              style={{
                borderRadius: '24px',
                padding: '32px',
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex items-center justify-center"
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#FFF5F5",
                    color: "#FF4D4F",
                    borderRadius: "18px",
                    fontSize: "24px"
                  }}
                >
                  <FaExclamationTriangle />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Remove Client</h3>
                <p className="text-sm text-gray-500 mb-8 font-[BasisGrotesquePro] leading-relaxed">
                  Are you sure you want to remove this client? This will permanently remove their record and free up their email address.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => selectedClientForDelete && handleDeleteTaxpayer(selectedClientForDelete)}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-200"
                  style={{
                    backgroundColor: '#FF4D4F',
                    boxShadow: "0 4px 12px rgba(255, 77, 79, 0.2)",
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    borderRadius: "12px"
                  }}
                >
                  {deleting && <div className="spinner-border spinner-border-sm" role="status" />}
                  {deleting ? 'Removing...' : 'Confirm removal'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setSelectedClientForDelete(null);
                  }}
                  disabled={deleting}
                  style={{ borderRadius: "12px" }}
                  className="w-full px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

              <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                `}
              </style>
            </div>
          </div>
        )
      }
    </div >
  );
}
