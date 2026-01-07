import React, { useState, useRef, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus, FaUserPlus, FaEnvelope, FaSms, FaLink, FaCopy, FaClock } from "react-icons/fa";
import { AwaitingIcon, CompletedIcon, Dot, DoubleUserIcon, FaildIcon, FiltIcon, Phone } from "../../component/icons";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerClientAPI, firmAdminClientsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { toast } from "react-toastify";
import BulkTaxpayerImportModal from "./BulkTaxpayerImportModal";
import "../../styles/MyClients.css";

export default function MyClients() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  const navigate = useNavigate();

  // API state
  const [clients, setClients] = useState([]);
  const [overview, setOverview] = useState({
    total_clients: 0,
    active: 0,
    pending: 0,
    high_priority: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'pending-invites', or 'unlinked-taxpayers'

  // Permission check state
  const [hasUnlinkedTaxpayersPermission, setHasUnlinkedTaxpayersPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Unlinked taxpayers state
  const [unlinkedTaxpayers, setUnlinkedTaxpayers] = useState([]);
  const [loadingUnlinkedTaxpayers, setLoadingUnlinkedTaxpayers] = useState(false);
  const [unlinkedTaxpayersError, setUnlinkedTaxpayersError] = useState(null);
  const [unlinkedTaxpayersPagination, setUnlinkedTaxpayersPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [invitesError, setInvitesError] = useState(null);
  const [invitesPagination, setInvitesPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 1
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // null = all, "active", "pending"
  const [priorityFilter, setPriorityFilter] = useState(null); // null = all, "high", "medium", "low"
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Create/Invite taxpayer modals state
  const [showCreateTaxpayerModal, setShowCreateTaxpayerModal] = useState(false);
  const [showInviteTaxpayerModal, setShowInviteTaxpayerModal] = useState(false);
  const [showInviteActionsModal, setShowInviteActionsModal] = useState(false);
  const [showSendInviteModal, setShowSendInviteModal] = useState(false);
  const [editedInviteEmail, setEditedInviteEmail] = useState('');
  const [showBulkTaxpayerImportModal, setShowBulkTaxpayerImportModal] = useState(false);
  const [selectedClientForInvite, setSelectedClientForInvite] = useState(null);
  const [inviteLinkForClient, setInviteLinkForClient] = useState(null);
  const [loadingInviteLink, setLoadingInviteLink] = useState(false);
  const [createTaxpayerLoading, setCreateTaxpayerLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [sendInviteLoading, setSendInviteLoading] = useState(false);
  const [sendInviteMethod, setSendInviteMethod] = useState(null);
  const [inviteActionMethod, setInviteActionMethod] = useState(null);
  const [inviteLinkRefreshing, setInviteLinkRefreshing] = useState(false);
  const [activeInviteDetails, setActiveInviteDetails] = useState(null);
  const [smsPhoneOverride, setSmsPhoneOverride] = useState("");
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [invitePhoneCountry, setInvitePhoneCountry] = useState('us');
  const [smsPhoneCountry, setSmsPhoneCountry] = useState('us');

  // Create taxpayer form state
  const [createTaxpayerForm, setCreateTaxpayerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    filing_status: "",
    tags: []
  });

  // Invite existing taxpayer form state
  const [inviteExistingForm, setInviteExistingForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: ""
  });

  useEffect(() => {
    if (activeInviteDetails?.phone_number) {
      setSmsPhoneOverride(activeInviteDetails.phone_number);
    } else if (!showInviteActionsModal) {
      setSmsPhoneOverride("");
    }
  }, [activeInviteDetails, showInviteActionsModal]);

  const openInviteActionsModal = async (inviteData) => {
    setActiveInviteDetails(inviteData);
    setShowInviteActionsModal(true);
    // Pre-fill editable email with the invite's current email
    if (inviteData?.email) {
      setEditedInviteEmail(inviteData.email);
    } else {
      setEditedInviteEmail('');
    }
    
    // If invite link is missing, try to fetch it
    if (!inviteData.invite_link && (inviteData.id || inviteData.invite_id || inviteData.client_id)) {
      try {
        const params = {};
        if (inviteData.id || inviteData.invite_id) {
          params.invite_id = inviteData.id || inviteData.invite_id;
        } else if (inviteData.client_id) {
          params.client_id = inviteData.client_id;
        }
        
        const linkResponse = await taxPreparerClientAPI.getInviteLink(params);
        if (linkResponse.success) {
          const inviteLink = linkResponse.invite_link || linkResponse.data?.invite_link;
          if (inviteLink) {
            setActiveInviteDetails((prev) => ({
              ...prev,
              invite_link: inviteLink,
              expires_at: linkResponse.data?.expires_at || prev.expires_at
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching invite link:", error);
        // Silently fail - user can regenerate if needed
      }
    }
  };

  const closeInviteActionsModal = () => {
    setShowInviteActionsModal(false);
    setActiveInviteDetails(null);
    setSmsPhoneOverride("");
    setEditedInviteEmail('');
  };

  // Fetch pending invites from API
  const fetchPendingInvites = async (page = 1) => {
    try {
      setLoadingInvites(true);
      setInvitesError(null);

      const response = await taxPreparerClientAPI.getPendingInvites({
        page,
        page_size: invitesPagination.page_size
      });

      if (response.success && response.data) {
        setPendingInvites(response.data.invites || []);
        setInvitesPagination({
          page: response.data.page || page,
          page_size: response.data.page_size || 20,
          total_count: response.data.total_count || 0,
          total_pages: response.data.total_pages || 1
        });
      } else {
        throw new Error(response.message || 'Failed to fetch pending invites');
      }
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      setInvitesError(handleAPIError(error));
      setPendingInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (priorityFilter) {
        params.append('priority', priorityFilter);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/taxpayer/tax-preparer/clients/${queryString ? `?${queryString}` : ''}`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      console.log('Fetching clients from:', url);

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        // Check content-type before parsing JSON
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text().catch(() => '');
          console.error('Non-JSON error response:', text.substring(0, 200));
        }
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Check content-type before parsing JSON
      const contentType = response.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Server returned non-JSON response. Expected JSON but got: ${contentType || 'unknown content type'}`);
        }
      }
      console.log('Clients API response:', result);

      if (result.success && result.data) {
        setClients(result.data.clients || []);
        setOverview(result.data.overview || {
          total_clients: 0,
          active: 0,
          pending: 0,
          high_priority: 0
        });
      } else {
        throw new Error(result.message || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(handleAPIError(error));
      setClients([]);
      setOverview({
        total_clients: 0,
        active: 0,
        pending: 0,
        high_priority: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients on component mount and when filters change
  useEffect(() => {
    fetchClients();
  }, [searchQuery, statusFilter, priorityFilter]);

  // Check permission for unlinked taxpayers on component mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        setCheckingPermission(true);
        const response = await taxPreparerClientAPI.checkUnlinkedTaxpayersPermission();
        if (response.success && response.data) {
          setHasUnlinkedTaxpayersPermission(response.data.has_permission || false);
        } else {
          setHasUnlinkedTaxpayersPermission(false);
        }
      } catch (error) {
        console.error('Error checking unlinked taxpayers permission:', error);
        setHasUnlinkedTaxpayersPermission(false);
      } finally {
        setCheckingPermission(false);
      }
    };
    checkPermission();
  }, []);

  // Fetch pending invites when tab is switched to pending invites
  useEffect(() => {
    if (activeTab === 'pending-invites') {
      fetchPendingInvites();
    }
  }, [activeTab]);

  // Fetch unlinked taxpayers when tab is switched to unlinked taxpayers or search changes
  useEffect(() => {
    if (activeTab === 'unlinked-taxpayers' && hasUnlinkedTaxpayersPermission) {
      fetchUnlinkedTaxpayers(1, unlinkedTaxpayersPagination.page_size);
    }
  }, [activeTab, hasUnlinkedTaxpayersPermission, searchQuery]);

  // Fetch unlinked taxpayers
  const fetchUnlinkedTaxpayers = async (page = 1, pageSize = 20) => {
    try {
      setLoadingUnlinkedTaxpayers(true);
      setUnlinkedTaxpayersError(null);

      const params = {
        page,
        page_size: pageSize
      };

      // Add search if available
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await taxPreparerClientAPI.getUnlinkedTaxpayers(params);

      if (response.success && response.data) {
        setUnlinkedTaxpayers(response.data.taxpayers || []);
        // Update pagination
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
      setLoadingUnlinkedTaxpayers(false);
    }
  };

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      for (let id in dropdownRefs.current) {
        if (dropdownRefs.current[id] && !dropdownRefs.current[id].contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      // Close filter dropdown if clicking outside
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  // Prepare card data from overview stats
  const cardData = [
    { label: "Total Clients", icon: <DoubleUserIcon />, count: overview.total_clients, color: "#00bcd4" },
    { label: "Active", icon: <CompletedIcon />, count: overview.active, color: "#4caf50" },
    { label: "Pending", icon: <AwaitingIcon />, count: overview.pending, color: "#3f51b5" },
    { label: "High Priority", icon: <FaildIcon />, count: overview.high_priority, color: "#EF4444" },
  ];

  // Process client data for display
  const processedClients = clients.map(client => {
    // Build statuses array from API data
    const statuses = [];
    if (client.status) {
      statuses.push(client.status.charAt(0).toUpperCase() + client.status.slice(1));
    }
    if (client.priority) {
      const priorityLabel = client.priority === 'high' ? 'High Priority' :
        client.priority === 'medium' ? 'Medium' :
          client.priority;
      statuses.push(priorityLabel);
    }
    // Add client tags
    if (client.client_tags && Array.isArray(client.client_tags)) {
      statuses.push(...client.client_tags);
    }

    return {
      ...client,
      name: client.full_name || `${client.first_name} ${client.last_name}`,
      phone: client.phone_number || '',
      statuses: statuses,
      tasks: client.pending_tasks_count || 0,
      documents: client.documents_count || 0,
      due: client.next_due_date || null,
      initials: client.initials || `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase()
    };
  });

  const getBadgeStyle = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active":
        return "badge-active";
      case "pending":
      case "new":
      case "medium":
        return "badge-pending";
      case "high priority":
      case "high":
        return "badge-higher";
      case "low":
      case "low priority":
        return "badge-default";
      default:
        return "badge-default";
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // Handle filter changes
  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? null : status);
    setShowFilterDropdown(false);
  };

  const handlePriorityFilter = (priority) => {
    setPriorityFilter(priority === priorityFilter ? null : priority);
    setShowFilterDropdown(false);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setSearchQuery("");
    setShowFilterDropdown(false);
  };

  // Handle create taxpayer form changes
  const handleCreateTaxpayerChange = (field, value) => {
    setCreateTaxpayerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create taxpayer
  const handleCreateTaxpayer = async (e) => {
    e.preventDefault();

    if (!createTaxpayerForm.first_name || !createTaxpayerForm.last_name || !createTaxpayerForm.email) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email)", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      setCreateTaxpayerLoading(true);
      const response = await taxPreparerClientAPI.createTaxpayer(createTaxpayerForm);

      if (response.success && response.data) {
        setShowCreateTaxpayerModal(false);

        // Reset form
        setCreateTaxpayerForm({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: "",
          filing_status: "",
          tags: []
        });

        // Refresh clients list
        fetchClients();

        toast.success("Taxpayer created successfully!", {
          position: "top-right",
          autoClose: 3000
        });

        const createdProfile = {
          first_name: response.data.first_name || createTaxpayerForm.first_name,
          last_name: response.data.last_name || createTaxpayerForm.last_name,
          email: response.data.email || createTaxpayerForm.email,
          phone_number: response.data.phone_number || createTaxpayerForm.phone_number
        };

        try {
          // Generate invite link using the new tax preparer API
          // POST /accounts/tax-preparer/clients/invite/link/ with { client_id: X }
          const inviteResponse = await taxPreparerClientAPI.generateInviteLink({
            client_id: response.data.id || response.data.client_id
          });

          if (inviteResponse.success) {
            // Format the response to match the expected structure for openInviteActionsModal
            const inviteData = {
              id: inviteResponse.data?.invite_id,
              invite_id: inviteResponse.data?.invite_id,
              client_id: response.data.id || response.data.client_id,
              first_name: response.data.first_name || createTaxpayerForm.first_name,
              last_name: response.data.last_name || createTaxpayerForm.last_name,
              email: response.data.email || createTaxpayerForm.email,
              phone_number: response.data.phone_number || createTaxpayerForm.phone_number,
              invite_link: inviteResponse.invite_link || inviteResponse.data?.invite_link,
              expires_at: inviteResponse.data?.expires_at,
              status: inviteResponse.data?.status || 'pending'
            };
            
            openInviteActionsModal(inviteData);
            toast.info("Invite link created. Share or send it below.", {
              position: "top-right",
              autoClose: 3000
            });
          } else {
            throw new Error(inviteResponse.message || "Failed to create invite");
          }
        } catch (inviteError) {
          console.error("Error creating invite for taxpayer:", inviteError);
          toast.error(handleAPIError(inviteError) || "Failed to create invite. You can send it later from Invite Taxpayer.", {
            position: "top-right",
            autoClose: 4000
          });
        }
      } else {
        throw new Error(response.message || "Failed to create taxpayer");
      }
    } catch (error) {
      console.error("Error creating taxpayer:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setCreateTaxpayerLoading(false);
    }
  };

  // Handle invite existing taxpayer
  const handleInviteExistingTaxpayer = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!inviteExistingForm.first_name.trim()) {
      toast.error("First name is required", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    if (!inviteExistingForm.last_name.trim()) {
      toast.error("Last name is required", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    if (!inviteExistingForm.email.trim()) {
      toast.error("Email is required", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      setInviteLoading(true);

      // Prepare payload - only include phone_number if provided
      const payload = {
        first_name: inviteExistingForm.first_name.trim(),
        last_name: inviteExistingForm.last_name.trim(),
        email: inviteExistingForm.email.trim()
      };

      if (inviteExistingForm.phone_number && inviteExistingForm.phone_number.trim()) {
        payload.phone_number = inviteExistingForm.phone_number.trim();
      }

      const response = await firmAdminClientsAPI.inviteClient({
        ...payload,
        delivery_methods: ["link"]
      });

      if (response.success && response.data) {
        toast.success("Invite created successfully!", {
          position: "top-right",
          autoClose: 3000
        });
        // Reset form and close modal
        setInviteExistingForm({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: ""
        });
        setShowInviteTaxpayerModal(false);
        openInviteActionsModal(response.data);
        fetchClients();
      } else {
        throw new Error(response.message || "Failed to invite taxpayer");
      }
    } catch (error) {
      console.error("Error inviting existing taxpayer:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!activeInviteDetails?.invite_link) return;
    try {
      await navigator.clipboard.writeText(activeInviteDetails.invite_link);
      toast.success("Invite link copied to clipboard!", {
        position: "top-right",
        autoClose: 2000
      });
      // Close the modal after copying
      closeInviteActionsModal();
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast.error("Failed to copy invite link. Please try again.", {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleRefreshInviteLink = async () => {
    if (!activeInviteDetails) return;
    
    try {
      setInviteLinkRefreshing(true);
      
      // Use the new tax preparer API to regenerate invite link
      // If we have invite_id, use it; otherwise use client_id
      let response;
      if (activeInviteDetails.id || activeInviteDetails.invite_id) {
        // Regenerate by invite_id
        response = await taxPreparerClientAPI.generateInviteLink({
          invite_id: activeInviteDetails.id || activeInviteDetails.invite_id,
          regenerate: true
        });
      } else if (activeInviteDetails.client_id) {
        // Regenerate by client_id
        response = await taxPreparerClientAPI.generateInviteLink({
          client_id: activeInviteDetails.client_id,
          regenerate: true
        });
      } else {
        throw new Error("No invite ID or client ID available");
      }
      
      if (response.success) {
        // Update invite link from response
        const newInviteLink = response.invite_link || response.data?.invite_link;
        const newExpiresAt = response.data?.expires_at;
        
        setActiveInviteDetails((prev) => ({
          ...prev,
          invite_link: newInviteLink,
          expires_at: newExpiresAt || prev.expires_at
        }));
        
        toast.success("Invite link regenerated successfully.", {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        throw new Error(response.message || "Failed to regenerate invite link");
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

  // Helper function to parse phone number and extract country code and main number
  const parsePhoneNumber = (phoneValue, countryCode = 'us') => {
    if (!phoneValue || !phoneValue.trim()) {
      return { country_code: null, phone_number: null };
    }

    // Remove all non-digit characters
    const digitsOnly = phoneValue.replace(/\D/g, '');
    
    // Country code (ISO) to dial code mapping
    // Source: https://countrycode.org/
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
      'ie': '353', 'ie': '353',
      'br': '55', 'mx': '52', 'ar': '54', 'cl': '56', 'co': '57', 'pe': '51', 've': '58',
      'za': '27', 'ng': '234', 'ke': '254', 'eg': '20', 'et': '251', 'gh': '233',
      'ma': '212', 'dz': '213', 'tn': '216', 'ly': '218', 'sd': '249', 'sn': '221',
      'ae': '971', 'sa': '966', 'il': '972', 'tr': '90', 'iq': '964', 'ir': '98',
      'ru': '7', 'kz': '7',
      'th': '66', 'sg': '65', 'my': '60', 'ph': '63', 'id': '62', 'vn': '84',
      'bd': '880', 'pk': '92', 'lk': '94', 'np': '977', 'mm': '95'
    };

    // Get dial code for the country (default to '1' if not found)
    const dialCode = countryToDialCode[countryCode.toLowerCase()] || '1';
    
    // PhoneInput value format: [dialCode][phoneNumber] (e.g., "1234567890" for US)
    // If phone starts with the dial code, extract it
    let extractedCountryCode = dialCode;
    let extractedPhoneNumber = digitsOnly;

    if (digitsOnly.startsWith(dialCode)) {
      extractedPhoneNumber = digitsOnly.substring(dialCode.length);
    } else {
      // Fallback: if dial code doesn't match, try to infer from length
      // This handles cases where the country might have been changed after entering the number
      if (digitsOnly.length >= 11) {
        // Try 1-digit country code first (US, Canada)
        if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
          extractedCountryCode = '1';
          extractedPhoneNumber = digitsOnly.substring(1);
        }
        // Try 2-digit country codes
        else if (digitsOnly.length >= 12) {
          const firstTwo = digitsOnly.substring(0, 2);
          if (['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98'].includes(firstTwo)) {
            extractedCountryCode = firstTwo;
            extractedPhoneNumber = digitsOnly.substring(2);
          }
        }
        // Try 3-digit country codes
        if (extractedPhoneNumber === digitsOnly && digitsOnly.length >= 13) {
          const firstThree = digitsOnly.substring(0, 3);
          if (['212', '234', '254', '233', '255', '256', '257', '258', '260', '261', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374', '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972', '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998'].includes(firstThree)) {
            extractedCountryCode = firstThree;
            extractedPhoneNumber = digitsOnly.substring(3);
          }
        }
      }
    }

    return {
      country_code: extractedCountryCode,
      phone_number: extractedPhoneNumber
    };
  };

  const handleSendInviteNotifications = async (methods, options = {}) => {
    if (!activeInviteDetails?.id || !methods?.length) return;
    try {
      setInviteActionLoading(true);
      setInviteActionMethod(methods.join(","));
      const payload = { methods };
      if (options.email) {
        payload.email = options.email;
      }
      if (options.phone_number) {
        // Parse phone number to extract country code and main number
        const phoneData = parsePhoneNumber(options.phone_number, smsPhoneCountry);
        if (phoneData.country_code && phoneData.phone_number) {
          payload.country_code = phoneData.country_code;
          payload.phone_number = phoneData.phone_number;
        } else {
          // Fallback: send as is if parsing fails
          payload.phone_number = options.phone_number;
        }
      }
      const response = await firmAdminClientsAPI.sendInvite(activeInviteDetails.id, payload);
      if (response.success && response.data) {
        setActiveInviteDetails((prev) => ({
          ...prev,
          ...response.data
        }));
        
        // Check for errors in delivery_summary
        const deliverySummary = response.data?.delivery_summary;
        
        // Show SMS error if present
        if (deliverySummary?.sms_error) {
          toast.error(deliverySummary.sms_error, {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        // Show success message if at least one method was sent successfully
        const emailSent = deliverySummary?.email_sent === true;
        const smsSent = deliverySummary?.sms_sent === true;
        const hasError = deliverySummary?.sms_error || (deliverySummary?.email_sent === false && methods.includes('email'));
        
        if ((emailSent || smsSent) && !hasError) {
          toast.success(response.message || "Invite notifications processed.", {
            position: "top-right",
            autoClose: 3000
          });
          // Close the modal after successful send
          closeInviteActionsModal();
        } else if (emailSent && deliverySummary?.sms_error) {
          // If email was sent but SMS failed, show both messages
          toast.success("Email sent successfully.", {
            position: "top-right",
            autoClose: 3000
          });
          // Close the modal even if SMS failed but email succeeded
          closeInviteActionsModal();
        } else if (deliverySummary?.sms_error && !emailSent) {
          // Only SMS was attempted and failed - don't close modal so user can try again
        }
      } else {
        throw new Error(response.message || "Failed to send invite notifications");
      }
    } catch (error) {
      console.error("Error sending invite notifications:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setInviteActionLoading(false);
      setInviteActionMethod(null);
    }
  };

  const handleSendEmailInviteNow = () => {
    const trimmed = (editedInviteEmail || '').trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error("Please enter a valid email address.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }
    handleSendInviteNotifications(["email"], { email: trimmed });
  };

  const handleSendSmsInviteNow = () => {
    const trimmedPhone = smsPhoneOverride?.trim();
    if (!trimmedPhone) {
      toast.error("Please enter a phone number to send the SMS invite.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }
    handleSendInviteNotifications(["sms"], { phone_number: trimmedPhone });
    // Close the modal after sending SMS
    closeInviteActionsModal();
  };

  // Fetch or create invite link for the selected client
  const fetchInviteLinkForClient = async (client) => {
    if (!client || !client.id) return;

    try {
      setLoadingInviteLink(true);

      // Use the new tax preparer API to get invite link by client_id
      // GET /accounts/tax-preparer/clients/invite/link/?client_id=X
      const linkResponse = await taxPreparerClientAPI.getInviteLink({ client_id: client.id });

      if (linkResponse.success) {
        // The API returns invite_link directly in the response
        if (linkResponse.invite_link) {
          setInviteLinkForClient(linkResponse.invite_link);
        } else if (linkResponse.data?.invite_link) {
          setInviteLinkForClient(linkResponse.data.invite_link);
        }
      }
    } catch (error) {
      console.error("Error fetching invite link:", error);
      // Don't show error toast here, just silently fail
    } finally {
      setLoadingInviteLink(false);
    }
  };

  // Regenerate invite link for the selected client
  const regenerateInviteLinkForClient = async (client) => {
    if (!client || !client.id) return;

    try {
      setLoadingInviteLink(true);

      // Use POST to regenerate invite link
      // POST /accounts/tax-preparer/clients/invite/link/ with { client_id: X, regenerate: true }
      const linkResponse = await taxPreparerClientAPI.generateInviteLink({ 
        client_id: client.id, 
        regenerate: true 
      });

      if (linkResponse.success) {
        // The API returns invite_link directly in the response
        if (linkResponse.invite_link) {
          setInviteLinkForClient(linkResponse.invite_link);
        } else if (linkResponse.data?.invite_link) {
          setInviteLinkForClient(linkResponse.data.invite_link);
        }
        toast.success("Invite link regenerated successfully!", {
          position: "top-right",
          autoClose: 2000
        });
      } else {
        throw new Error(linkResponse.message || "Failed to regenerate invite link");
      }
    } catch (error) {
      console.error("Error regenerating invite link:", error);
      toast.error(handleAPIError(error) || "Failed to regenerate invite link", {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setLoadingInviteLink(false);
    }
  };

  // Copy invite link to clipboard
  const handleCopyInviteLinkForClient = async () => {
    if (!inviteLinkForClient) return;
    try {
      await navigator.clipboard.writeText(inviteLinkForClient);
      toast.success("Invite link copied to clipboard!", {
        position: "top-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast.error("Failed to copy invite link. Please try again.", {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  // Handle sending invite via email from Send Invite modal
  const handleSendInviteEmail = async () => {
    if (!selectedClientForInvite) return;

    const client = selectedClientForInvite;
    if (!client.id) {
      toast.error("Invalid client data.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    if (!client.email) {
      toast.error("This client does not have an email address.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      setSendInviteLoading(true);
      setSendInviteMethod("email");

      // Use the new tax preparer API to send invite via email
      const sendPayload = {
        client_id: client.id,
        delivery_method: "email"
      };

      const sendResponse = await taxPreparerClientAPI.sendInvite(sendPayload);

      if (sendResponse.success) {
        // Update invite link if available in response
        if (sendResponse.invite_link) {
          setInviteLinkForClient(sendResponse.invite_link);
        } else if (sendResponse.data?.invite_link) {
          setInviteLinkForClient(sendResponse.data.invite_link);
        }

        toast.success("Invite email sent successfully!", {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        throw new Error(sendResponse.message || "Failed to send invite email");
      }
    } catch (error) {
      console.error("Error sending invite email:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setSendInviteLoading(false);
      setSendInviteMethod(null);
    }
  };

  // Handle sending invite via SMS from Send Invite modal
  const handleSendInviteSms = async () => {
    if (!selectedClientForInvite) return;

    const client = selectedClientForInvite;
    if (!client.id) {
      toast.error("Invalid client data.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    const phoneNumber = client.phone_number || client.phone;

    if (!phoneNumber) {
      toast.error("This client does not have a phone number.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    try {
      setSendInviteLoading(true);
      setSendInviteMethod("sms");

      // Use the new tax preparer API to send invite via SMS
      const sendPayload = {
        client_id: client.id,
        delivery_method: "sms",
        phone_number: phoneNumber
      };

      const sendResponse = await taxPreparerClientAPI.sendInvite(sendPayload);

      if (sendResponse.success) {
        // Update invite link if available in response
        if (sendResponse.invite_link) {
          setInviteLinkForClient(sendResponse.invite_link);
        } else if (sendResponse.data?.invite_link) {
          setInviteLinkForClient(sendResponse.data.invite_link);
        }

        toast.success("Invite SMS sent successfully!", {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        throw new Error(sendResponse.message || "Failed to send invite SMS");
      }
    } catch (error) {
      console.error("Error sending invite SMS:", error);
      toast.error(handleAPIError(error), {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setSendInviteLoading(false);
      setSendInviteMethod(null);
    }
  };

  const inviteExpiresOn = activeInviteDetails?.expires_at
    ? new Date(activeInviteDetails.expires_at).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    })
    : null;

  // Handle invite confirmation (send now or later)
  const openClientDetails = (client, options = {}) => {
    setOpenDropdown(null);
    navigate(`/taxdashboard/clients/${client.id}`, { state: { client, ...options } });
  };

  const handleMenuSelect = (event, action, client) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setOpenDropdown(null);

    switch (action) {
      case "invite":
        setSelectedClientForInvite(client);
        setInviteLinkForClient(null);
        setShowSendInviteModal(true);
        // Fetch invite link when modal opens
        fetchInviteLinkForClient(client);
        break;
      case "details":
        openClientDetails(client);
        break;
      case "tasks":
        navigate("/taxdashboard/tasks", { state: { clientId: client.id, client } });
        break;
      case "documents":
        navigate("/taxdashboard/documents", { state: { clientId: client.id, client } });
        break;
      case "messages":
        navigate("/taxdashboard/messages", { state: { clientId: client.id, client } });
        break;
      case "schedule":
        navigate("/taxdashboard/calendar", { state: { clientId: client.id, client } });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="myclients-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="myclients-container">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchClients} style={{ borderRadius: '8px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="myclients-container">
      {/* Header */}
      <div className="header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-semibold">My Clients</h3>
          <small className="text-muted">Manage your assigned clients</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowInviteTaxpayerModal(true)}
            style={{
              backgroundColor: "#00C0C6",
              borderColor: "#00C0C6",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <FaUserPlus size={14} />
            Create Taxpayer
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowBulkTaxpayerImportModal(true)}
            style={{
              backgroundColor: "#F56D2D",
              borderColor: "#F56D2D",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            <FaPlus size={14} />
            Bulk Import Taxpayers
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {cardData.map((item, index) => (
          <div className="col-md-3 col-sm-12" key={index}>
            <div className="stat-card ">
              <div className="d-flex justify-content-between align-items-start">
                <div className="stat-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
              </div>
              <div className="stat-count-wrapper">
                <div className="stat-count">{item.count}</div>
              </div>
              <div className="mt-2">
                <p className="mb-0 text-muted small fw-semibold">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 align-items-center" style={{ 
        borderBottom: '2px solid #E8F0FF',
        paddingBottom: '0',
        marginTop: '20px',
        minHeight: '50px'
      }}>
        <button
          className={`btn border-0 ${activeTab === 'clients' ? '' : ''}`}
          onClick={() => setActiveTab('clients')}
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
          onClick={() => setActiveTab('pending-invites')}
          style={{
            borderRadius: '8px 8px 0 0',
            borderBottom: activeTab === 'pending-invites' ? '3px solid #00C0C6' : '3px solid transparent',
            marginBottom: '-2px',
            fontWeight: activeTab === 'pending-invites' ? '600' : '500',
            padding: '10px 20px',
            fontSize: '14px',
            color: activeTab === 'pending-invites' ? '#00C0C6' : '#6B7280',
            backgroundColor: activeTab === 'pending-invites' ? '#F0FDFF' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Pending Invites
          {(pendingInvites.length > 0 || invitesPagination.total_count > 0) && (
            <span className="badge bg-danger text-white ms-2" style={{ 
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              color: '#ffffff'
            }}>
              {invitesPagination.total_count > 0 ? invitesPagination.total_count : pendingInvites.length}
            </span>
          )}
        </button>
        {hasUnlinkedTaxpayersPermission && (
          <button
            className={`btn border-0`}
            onClick={() => setActiveTab('unlinked-taxpayers')}
            style={{
              borderRadius: '8px 8px 0 0',
              borderBottom: activeTab === 'unlinked-taxpayers' ? '3px solid #00C0C6' : '3px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'unlinked-taxpayers' ? '600' : '500',
              padding: '10px 20px',
              fontSize: '14px',
              color: activeTab === 'unlinked-taxpayers' ? '#00C0C6' : '#6B7280',
              backgroundColor: activeTab === 'unlinked-taxpayers' ? '#F0FDFF' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Unlinked Taxpayers
          </button>
        )}
      </div>

      {/* Search & Filter - Show for clients and unlinked taxpayers tabs */}
      {(activeTab === 'clients' || activeTab === 'unlinked-taxpayers') && (
      <div className="d-flex align-items-center gap-2 mb-3 mt-3" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
        <div className="position-relative " style={{ width: '260px', flexShrink: 0 }}>
          <input
            type="text"
            className="form-control rounded"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              paddingLeft: "38px",
              paddingRight: "12px",
              paddingTop: "10px",
              paddingBottom: "8px",
              width: "100%",
              height: "38px",
              fontSize: "14px",
              lineHeight: "22px"
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="search-icon"
            style={{
              position: 'absolute',
              left: '14px',
              top: '12px',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <path d="M11 11L8.49167 8.49167M9.83333 5.16667C9.83333 7.74399 7.74399 9.83333 5.16667 9.83333C2.58934 9.83333 0.5 7.74399 0.5 5.16667C0.5 2.58934 2.58934 0.5 5.16667 0.5C7.74399 0.5 9.83333 2.58934 9.83333 5.16667Z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="position-relative filter-dropdown-container" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="btn btn-filter d-flex align-items-center justify-content-center rounded px-3"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              background: "#fff",
              height: "38px",
              paddingLeft: "38px",
              paddingRight: "12px",
              paddingTop: "10px",
              paddingBottom: "8px",
              fontSize: "14px",
              lineHeight: "22px",
              marginTop: "-9px",
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiltIcon className="me-2 text-muted" style={{ fontSize: "14px" }} />
            <span>Filter</span>
            {(statusFilter || priorityFilter) && (
              <span className="badge bg-danger text-white ms-2" style={{ fontSize: "10px", color: "#ffffff" }}>
                {(statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0)}
              </span>
            )}
          </button>
          {showFilterDropdown && (
            <div
              className="card shadow-sm"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                zIndex: 1000,
                minWidth: "200px",
                marginTop: "8px",
                padding: "12px"
              }}
            >
              <div className="mb-2">
                <label className="form-label small fw-semibold">Status</label>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`btn btn-sm ${statusFilter === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter(null)}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusFilter('pending')}
                  >
                    Pending
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small fw-semibold">Priority</label>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`btn btn-sm ${priorityFilter === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter(null)}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'high' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('high')}
                  >
                    High
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'medium' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('medium')}
                  >
                    Medium
                  </button>
                  <button
                    className={`btn btn-sm ${priorityFilter === 'low' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handlePriorityFilter('low')}
                  >
                    Low
                  </button>
                </div>
              </div>
              {(statusFilter || priorityFilter || searchQuery) && (
                <button
                  className="btn btn-sm btn-outline-danger w-100 mt-2"
                  onClick={clearFilters}
                  style={{ borderRadius: '8px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Client List Card - Only show for clients tab */}
      {activeTab === 'clients' && (
        <div className="card client-list-card p-3" style={{
          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        }}>
          <h6 className="fw-semibold mb-3">Client List</h6>
          <div className="mb-3">All clients assigned to you</div>

        {processedClients.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No clients found</p>
            {(searchQuery || statusFilter || priorityFilter) && (
              <button className="btn btn-sm btn-outline-primary mt-2" onClick={clearFilters}>
                Clear filters to see all clients
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {processedClients.map((client) => (
              <div
                key={client.id}
                className={processedClients.length === 1 ? "col-12" : "col-md-6 col-12"}
              >
                <div
                  className="card client-card"
                  style={{
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)"
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => openClientDetails(client)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openClientDetails(client);
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    {/* Left */}
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        className="client-initials"
                        onClick={(event) => {
                          event.stopPropagation();
                          openClientDetails(client);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            openClientDetails(client);
                          }
                        }}
                        aria-label={`Open ${client.name} details`}
                      >
                        {client.initials}
                      </button>
                      <div>
                        <button
                          type="button"
                          className="client-name-button fw-semibold"
                          onClick={(event) => {
                            event.stopPropagation();
                            openClientDetails(client);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              openClientDetails(client);
                            }
                          }}
                        >
                          {client.name}
                        </button>
                        <div className="client-contact-info">
                          <small className="text-muted client-email">
                            {client.email}
                          </small>
                          {client.phone && (
                            <small className="text-muted client-phone">
                              <Phone /> {client.phone}
                            </small>
                          )}
                        </div>
                        <div className="info-left">
                          <span className="info-item">{client.tasks} pending tasks</span>
                          <span className="info-item">{client.documents} documents</span>
                          {client.due && (
                            <span className="info-item">Due: {client.due}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Info + Dot Dropdown */}
                    <div className="info-row" style={{ position: 'relative', alignSelf: 'flex-start' }}>
                      <div className="info-right" style={{ position: 'relative' }}>
                        <div
                          className="dot-container"
                          ref={el => dropdownRefs.current[client.id] = el}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenDropdown(openDropdown === client.id ? null : client.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              setOpenDropdown(openDropdown === client.id ? null : client.id);
                            }
                          }}
                          tabIndex={0}
                          style={{ position: 'relative' }}
                        >
                          <Dot />
                          {openDropdown === client.id && (
                            <ul className="dot-dropdown" style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px' }}>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "invite", client)}
                                onClick={(e) => handleMenuSelect(e, "invite", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Send Invite
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "details", client)}
                                onClick={(e) => handleMenuSelect(e, "details", client)}
                                tabIndex={0}
                                role="button"
                              >
                                View Details
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "tasks", client)}
                                onClick={(e) => handleMenuSelect(e, "tasks", client)}
                                tabIndex={0}
                                role="button"
                              >
                                View Tasks
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "documents", client)}
                                onClick={(e) => handleMenuSelect(e, "documents", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Documents
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "messages", client)}
                                onClick={(e) => handleMenuSelect(e, "messages", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Send Message
                              </li>
                              <li
                                onMouseDown={(e) => handleMenuSelect(e, "schedule", client)}
                                onClick={(e) => handleMenuSelect(e, "schedule", client)}
                                tabIndex={0}
                                role="button"
                              >
                                Schedule Meeting
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Pending Invites Card - Only show for pending invites tab */}
      {activeTab === 'pending-invites' && (
        <div className="card client-list-card p-3" style={{
          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        }}>
          <h6 className="fw-semibold mb-3">Pending Invites</h6>
          <div className="mb-3">Client invites awaiting acceptance</div>

          {loadingInvites ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading pending invites...</p>
            </div>
          ) : invitesError ? (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {invitesError}
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => fetchPendingInvites()}>
                Retry
              </button>
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No pending invites found</p>
            </div>
          ) : (
            <div className="row g-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="col-md-6 col-12">
                  <div
                    className="card client-card"
                    onClick={() => openInviteActionsModal(invite)}
                    style={{
                      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                      cursor: "pointer"
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
                          <div className="fw-semibold mb-1">
                            {invite.first_name} {invite.last_name}
                          </div>
                          <div className="text-muted small mb-2">
                            <FaEnvelope className="me-1" size={12} />
                            {invite.email}
                          </div>
                          {invite.phone_number && (
                            <div className="text-muted small mb-2">
                              <Phone className="me-1" />
                              {invite.phone_number}
                            </div>
                          )}
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            <span className="badge bg-info" style={{ fontSize: '10px' }}>
                              {invite.firm_name}
                            </span>
                            {invite.is_expired ? (
                              <span className="badge bg-danger text-white" style={{ fontSize: '10px', color: '#ffffff' }}>
                                Expired
                              </span>
                            ) : (
                              <span className="badge bg-warning" style={{ fontSize: '10px' }}>
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="text-muted small mt-2">
                            <div>Invited by: {invite.invited_by_name}</div>
                            <div>Invited: {new Date(invite.invited_at).toLocaleDateString()}</div>
                            {invite.expires_at && (
                              <div>
                                Expires: {new Date(invite.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        {invite.invite_link && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(invite.invite_link);
                              toast.success('Invite link copied to clipboard!');
                            }}
                            title="Copy invite link"
                          >
                            <FaCopy size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination for invites */}
          {invitesPagination.total_pages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Showing {((invitesPagination.page - 1) * invitesPagination.page_size) + 1} to{' '}
                {Math.min(invitesPagination.page * invitesPagination.page_size, invitesPagination.total_count)} of{' '}
                {invitesPagination.total_count} invites
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => fetchPendingInvites(invitesPagination.page - 1)}
                  disabled={invitesPagination.page === 1 || loadingInvites}
                >
                  Previous
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => fetchPendingInvites(invitesPagination.page + 1)}
                  disabled={invitesPagination.page >= invitesPagination.total_pages || loadingInvites}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unlinked Taxpayers Card - Only show for unlinked taxpayers tab */}
      {activeTab === 'unlinked-taxpayers' && hasUnlinkedTaxpayersPermission && (
        <div className="card client-list-card p-3" style={{
          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        }}>
          <h6 className="fw-semibold mb-3">Unlinked Taxpayers</h6>
          <div className="mb-3">Clients not assigned to any tax preparer</div>

          {loadingUnlinkedTaxpayers ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading unlinked taxpayers...</p>
            </div>
          ) : unlinkedTaxpayersError ? (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {unlinkedTaxpayersError}
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => fetchUnlinkedTaxpayers()}>
                Retry
              </button>
            </div>
          ) : unlinkedTaxpayers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No unlinked taxpayers found</p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {unlinkedTaxpayers.map((taxpayer) => (
                  <div key={taxpayer.id} className="col-md-6 col-12">
                    <div
                      className="card client-card"
                      style={{
                        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        // Navigate to client details if needed
                        navigate(`/taxdashboard/clients/${taxpayer.id}`);
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
                            {taxpayer.first_name?.[0]?.toUpperCase() || ''}{taxpayer.last_name?.[0]?.toUpperCase() || ''}
                          </div>
                          <div className="flex-1">
                            <div className="fw-semibold mb-1">
                              {taxpayer.full_name || `${taxpayer.first_name} ${taxpayer.last_name}`}
                            </div>
                            {taxpayer.email && (
                              <div className="text-muted small mb-2">
                                <FaEnvelope className="me-1" size={12} />
                                {taxpayer.email}
                              </div>
                            )}
                            {taxpayer.phone_number && (
                              <div className="text-muted small mb-2">
                                <Phone className="me-1" />
                                {taxpayer.phone_number}
                              </div>
                            )}
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {taxpayer.is_active ? (
                                <span className="badge bg-success" style={{ fontSize: '10px' }}>
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-secondary" style={{ fontSize: '10px' }}>
                                  Inactive
                                </span>
                              )}
                              {taxpayer.is_email_verified && (
                                <span className="badge bg-info" style={{ fontSize: '10px' }}>
                                  Email Verified
                                </span>
                              )}
                              {taxpayer.is_phone_verified && (
                                <span className="badge bg-info" style={{ fontSize: '10px' }}>
                                  Phone Verified
                                </span>
                              )}
                              {taxpayer.is_suspended && (
                                <span className="badge bg-danger text-white" style={{ fontSize: '10px', color: '#ffffff' }}>
                                  Suspended
                                </span>
                              )}
                            </div>
                            {taxpayer.last_login_formatted && (
                              <div className="text-muted small mt-2">
                                Last login: {taxpayer.last_login_formatted}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for unlinked taxpayers */}
              {unlinkedTaxpayersPagination.total_pages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing {((unlinkedTaxpayersPagination.page - 1) * unlinkedTaxpayersPagination.page_size) + 1} to{' '}
                    {Math.min(unlinkedTaxpayersPagination.page * unlinkedTaxpayersPagination.page_size, unlinkedTaxpayersPagination.total_count)} of{' '}
                    {unlinkedTaxpayersPagination.total_count} taxpayers
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => fetchUnlinkedTaxpayers(unlinkedTaxpayersPagination.page - 1)}
                      disabled={unlinkedTaxpayersPagination.page === 1 || loadingUnlinkedTaxpayers}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => fetchUnlinkedTaxpayers(unlinkedTaxpayersPagination.page + 1)}
                      disabled={unlinkedTaxpayersPagination.page >= unlinkedTaxpayersPagination.total_pages || loadingUnlinkedTaxpayers}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Taxpayer Modal */}
      {showCreateTaxpayerModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '500px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>Create New Taxpayer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateTaxpayerModal(false);
                    setCreateTaxpayerForm({
                      first_name: "",
                      last_name: "",
                      email: "",
                      phone_number: "",
                      filing_status: "",
                      tags: []
                    });
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleCreateTaxpayer}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTaxpayerForm.first_name}
                      onChange={(e) => handleCreateTaxpayerChange('first_name', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTaxpayerForm.last_name}
                      onChange={(e) => handleCreateTaxpayerChange('last_name', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={createTaxpayerForm.email}
                      onChange={(e) => handleCreateTaxpayerChange('email', e.target.value)}
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <PhoneInput
                      country={phoneCountry}
                      value={createTaxpayerForm.phone_number || ''}
                      onChange={(phone) => handleCreateTaxpayerChange('phone_number', phone)}
                      onCountryChange={(countryCode) => {
                        setPhoneCountry(countryCode.toLowerCase());
                      }}
                      inputClass="form-control"
                      containerClass="w-100 phone-input-container"
                      inputStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Filing Status</label>
                    <select
                      className="form-select"
                      value={createTaxpayerForm.filing_status}
                      onChange={(e) => handleCreateTaxpayerChange('filing_status', e.target.value)}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    >
                      <option value="">Select filing status</option>
                      <option value="single">Single</option>
                      <option value="married_joint">Married Filing Jointly</option>
                      <option value="married_separate">Married Filing Separately</option>
                      <option value="head_of_household">Head of Household</option>
                      <option value="qualifying_widow">Qualifying Widow(er)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowCreateTaxpayerModal(false);
                      setCreateTaxpayerForm({
                        first_name: "",
                        last_name: "",
                        email: "",
                        phone_number: "",
                        filing_status: "",
                        tags: []
                      });
                    }}
                    style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createTaxpayerLoading}
                    style={{
                      backgroundColor: '#FF7A2F',
                      borderColor: '#FF7A2F',
                      borderRadius: '8px'
                    }}
                  >
                    {createTaxpayerLoading ? 'Creating...' : 'Create Taxpayer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite actions modal */}
      {showInviteActionsModal && activeInviteDetails && (
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
                    We'll text the invite link to the phone number you provide2222.
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
              <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                <button className="btn btn-light" style={{ borderRadius: '8px' }} onClick={closeInviteActionsModal}>
                  Invite Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Taxpayer Modal (existing clients) */}
      {showInviteTaxpayerModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ overflow: 'visible' }}>
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '500px', overflow: 'visible' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66' }}>
                  Invite Taxpayer
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowInviteTaxpayerModal(false);
                    setInviteExistingForm({
                      first_name: "",
                      last_name: "",
                      email: "",
                      phone_number: ""
                    });
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '24px', overflow: 'visible' }}>
                <form onSubmit={handleInviteExistingTaxpayer}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#3B4A66' }}>
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={inviteExistingForm.first_name}
                      onChange={(e) => setInviteExistingForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter first name"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#3B4A66' }}>
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={inviteExistingForm.last_name}
                      onChange={(e) => setInviteExistingForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter last name"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#3B4A66' }}>
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={inviteExistingForm.email}
                      onChange={(e) => setInviteExistingForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#3B4A66' }}>
                      Phone Number <span className="text-muted" style={{ fontSize: '12px' }}>(Optional)</span>
                    </label>
                    <PhoneInput
                      country={invitePhoneCountry}
                      value={inviteExistingForm.phone_number || ''}
                      onChange={(phone) => setInviteExistingForm(prev => ({ ...prev, phone_number: phone }))}
                      onCountryChange={(countryCode) => {
                        setInvitePhoneCountry(countryCode.toLowerCase());
                      }}
                      inputClass="form-control"
                      containerClass="w-100 phone-input-container invite-taxpayer-phone-container"
                      inputStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      dropdownStyle={{ zIndex: 1061 }}
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 0 0 0', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => {
                        setShowInviteTaxpayerModal(false);
                        setInviteExistingForm({
                          first_name: "",
                          last_name: "",
                          email: "",
                          phone_number: ""
                        });
                      }}
                      style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={inviteLoading}
                      style={{
                        backgroundColor: '#00C0C6',
                        borderColor: '#00C0C6',
                        borderRadius: '8px'
                      }}
                    >
                      {inviteLoading ? 'Creating Invite...' : 'Create Invite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Invite Modal - Simple modal with Email and SMS buttons */}
      {showSendInviteModal && selectedClientForInvite && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', maxWidth: '450px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #E8F0FF', padding: '20px 24px' }}>
                <h5 className="modal-title fw-semibold" style={{ color: '#3B4A66', margin: 0 }}>
                  Send Invite
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowSendInviteModal(false);
                    setSelectedClientForInvite(null);
                    setInviteLinkForClient(null);
                    setSendInviteMethod(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="mb-4">
                  <p className="mb-2 fw-semibold" style={{ color: '#3B4A66', fontSize: '16px' }}>
                    {selectedClientForInvite.first_name} {selectedClientForInvite.last_name}
                  </p>
                  {selectedClientForInvite.email && (
                    <p className="mb-1 text-muted" style={{ fontSize: '14px' }}>
                      {selectedClientForInvite.email}
                    </p>
                  )}
                  {selectedClientForInvite.phone_number && (
                    <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                      {selectedClientForInvite.phone_number}
                    </p>
                  )}
                </div>

                {/* Invite Link Section */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: '#3B4A66', marginBottom: '8px' }}>
                    <FaLink size={14} /> Shareable Link
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      value={inviteLinkForClient || ""}
                      readOnly
                      placeholder={loadingInviteLink ? "Loading invite link..." : "No invite link available"}
                      disabled={!inviteLinkForClient}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        fontSize: '14px',
                        backgroundColor: inviteLinkForClient ? '#fff' : '#F3F4F6',
                        cursor: 'not-allowed'
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                      onClick={handleCopyInviteLinkForClient}
                      disabled={!inviteLinkForClient || loadingInviteLink}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        padding: '8px 12px',
                        whiteSpace: 'nowrap',
                        minWidth: '45px'
                      }}
                      title="Copy invite link"
                    >
                      <FaCopy size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                      onClick={() => regenerateInviteLinkForClient(selectedClientForInvite)}
                      disabled={loadingInviteLink || !selectedClientForInvite}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #00C0C6',
                        color: '#00C0C6',
                        padding: '8px 12px',
                        whiteSpace: 'nowrap',
                        fontSize: '13px'
                      }}
                      title="Regenerate invite link"
                    >
                      {loadingInviteLink ? '...' : 'Regenerate'}
                    </button>
                  </div>
                  {loadingInviteLink && (
                    <small className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                      {inviteLinkForClient ? 'Regenerating invite link...' : 'Generating invite link...'}
                    </small>
                  )}
                </div>

                <div className="d-flex flex-column gap-3">
                  {/* Send Email Button */}
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    onClick={handleSendInviteEmail}
                    disabled={sendInviteLoading || !selectedClientForInvite.email}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#00C0C6',
                      borderColor: '#00C0C6',
                      padding: '12px 20px',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  >
                    <FaEnvelope size={16} />
                    {sendInviteLoading && sendInviteMethod === "email" ? "Sending..." : "Send Email"}
                  </button>

                  {/* Send SMS Button */}
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    onClick={handleSendInviteSms}
                    disabled={sendInviteLoading || (!selectedClientForInvite.phone_number && !selectedClientForInvite.phone)}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#00C0C6',
                      borderColor: '#00C0C6',
                      padding: '12px 20px',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  >
                    <FaSms size={16} />
                    {sendInviteLoading && sendInviteMethod === "sms" ? "Sending..." : "Send SMS"}
                  </button>
                </div>

                {(!selectedClientForInvite.email || (!selectedClientForInvite.phone_number && !selectedClientForInvite.phone)) && (
                  <div className="mt-3">
                    <small className="text-muted" style={{ fontSize: '12px' }}>
                      {!selectedClientForInvite.email && !selectedClientForInvite.phone_number && !selectedClientForInvite.phone
                        ? "This client does not have an email or phone number."
                        : !selectedClientForInvite.email
                          ? "This client does not have an email address."
                          : "This client does not have a phone number."}
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #E8F0FF', padding: '16px 24px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowSendInviteModal(false);
                    setSelectedClientForInvite(null);
                    setInviteLinkForClient(null);
                    setSendInviteMethod(null);
                  }}
                  style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Taxpayer Import Modal */}
      <BulkTaxpayerImportModal
        isOpen={showBulkTaxpayerImportModal}
        onClose={() => setShowBulkTaxpayerImportModal(false)}
        onImportSuccess={async () => {
          // Refresh clients list after successful import
          await fetchClients();
        }}
      />
    </div>
  );
}
