import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useLocation, useParams, useNavigate, Outlet } from "react-router-dom";
import { BlackEmail, BlackPhone, MailMiniIcon, PhoneMiniIcon, MiniClock, WhiteEdit, Cut } from "../../component/icons";
import { FaChevronDown, FaChevronRight, FaFolder, FaArrowLeft } from "react-icons/fa";
import IntakeFormTab from "./IntakeFormTab";
import FillIntakeFormModal from "./FillIntakeFormModal";
import { getApiBaseUrl, fetchWithCors } from "../../../ClientOnboarding/utils/corsConfig";
import { getAccessToken } from "../../../ClientOnboarding/utils/userUtils";
import { handleAPIError, taxPreparerClientAPI, firmAdminClientsAPI, taxPreparerDocumentsAPI } from "../../../ClientOnboarding/utils/apiUtils";
import { formatDateForDisplay } from "../../../ClientOnboarding/utils/dateUtils";
import { toast } from "react-toastify";
import "../../styles/clientdetails.css";
const FILING_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
  { value: "qualifying_widow", label: "Qualifying Widow" },
];

const normalizeFilingStatus = (value) => {
  if (!value) return "";
  const raw = value.toString().trim().toLowerCase();
  const normalized = raw.replace(/\s+/g, "_").replace(/-/g, "_");

  const directMatch = FILING_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (directMatch) return directMatch.value;

  const labelMatch = FILING_STATUS_OPTIONS.find(
    (option) =>
      option.label.toLowerCase() === raw ||
      option.label.toLowerCase() === normalized.replace(/_/g, " ")
  );
  if (labelMatch) return labelMatch.value;

  const aliasMap = {
    married_joint: "married_filing_jointly",
    married_jointly: "married_filing_jointly",
    married_filing_joint: "married_filing_jointly",
    married_filing_jointly: "married_filing_jointly",
    married_separate: "married_filing_separately",
    married_filing_sep: "married_filing_separately",
    qualifying_widower: "qualifying_widow",
    qualifying_widow_er: "qualifying_widow",
  };

  if (aliasMap[normalized]) {
    return aliasMap[normalized];
  }

  return normalized;
};

const getFilingStatusLabel = (value) => {
  const normalized = normalizeFilingStatus(value);
  const match = FILING_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) return match.label;
  return value || "";
};

export default function ClientDetails() {
  const { clientId } = useParams();
  const location = useLocation();
  const currentPath = location.pathname;
  const isDocuments = currentPath.includes('/documents');
  const isInvoices = currentPath.includes('/invoices');
  const isSchedulePath = currentPath.includes('/schedule');
  const isESignLogs = currentPath.includes('/esign-logs');
  const isSecurity = currentPath.includes('/security');

  // Tab state for sections that don't use routing
  const [activeTab, setActiveTab] = useState('info');
  // If user is on invoices with ?view=schedule, treat Schedules as active
  const viewParam = new URLSearchParams(location.search).get('view');
  const isScheduleViaQuery = isInvoices && viewParam === 'schedule';
  const isSchedule = isSchedulePath || isScheduleViaQuery;
  const isInvoicesActive = isInvoices && !isScheduleViaQuery;

  const navigate = useNavigate();

  // API state
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [phoneCountry, setPhoneCountry] = useState('us');
  const [originalFormData, setOriginalFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [canEditClient, setCanEditClient] = useState(false);
  const [customTags, setCustomTags] = useState([]);
  const [originalCustomTags, setOriginalCustomTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [lockedFields, setLockedFields] = useState(new Set());

  // Unsaved changes protection
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const isFieldLocked = (fieldName) => lockedFields.has(fieldName);
  const renderLockedHelperText = (fieldName) =>
    isFieldLocked(fieldName) ? (
      <small className="text-danger d-block mt-1">Locked by admin</small>
    ) : null;

  const handleAddCustomTag = () => {
    if (isFieldLocked('tags')) {
      toast.error('Tags are locked by your administrator.');
      return;
    }
    const value = newTagInput.trim();
    if (!value) {
      return;
    }
    const exists = customTags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    if (exists) {
      toast.info('Tag already added.');
      return;
    }
    setCustomTags((prev) => [...prev, value]);
    setNewTagInput("");
  };

  const handleRemoveCustomTag = (tagToRemove) => {
    if (isFieldLocked('tags')) {
      toast.error('Tags are locked by your administrator.');
      return;
    }
    setCustomTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddCustomTag();
    }
  };

  useEffect(() => {
    if ((!canEditClient || client?.status === 'former') && isEditMode) {
      setIsEditMode(false);
    }
  }, [canEditClient, client?.status, isEditMode]);

  // Handle browser navigation (back/forward/close) with unsaved changes
  useEffect(() => {
    const checkUnsavedChanges = () => {
      if (!isEditMode || !editFormData || !originalFormData) {
        return false;
      }

      // Check form data changes
      const fieldMap = [
        'first_name', 'last_name', 'middle_name', 'email', 'phone_number',
        'filing_status', 'address_line', 'city', 'state', 'zip_code',
        'spouse_first_name', 'spouse_last_name', 'spouse_date_of_birth'
      ];

      for (const field of fieldMap) {
        const nextValue = editFormData[field] ?? '';
        const prevValue = originalFormData[field] ?? '';
        const sanitizedNext = typeof nextValue === 'string' ? nextValue.trim() : nextValue;
        const sanitizedPrev = typeof prevValue === 'string' ? prevValue.trim() : prevValue;
        if (sanitizedNext !== sanitizedPrev) {
          return true;
        }
      }

      // Check tags changes
      const normalizeTags = (arr) =>
        arr
          .map((item) => item?.toString().trim())
          .filter(Boolean)
          .map((item) => item.toLowerCase())
          .sort();
      if (JSON.stringify(normalizeTags(customTags)) !== JSON.stringify(normalizeTags(originalCustomTags))) {
        return true;
      }

      return false;
    };

    const handleBeforeUnload = (e) => {
      if (checkUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for some browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditMode, editFormData, originalFormData, customTags, originalCustomTags]);

  // Create Task Modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showFillIntakeModal, setShowFillIntakeModal] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);
  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const folderDropdownRef = useRef(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [parentFolderForNewFolder, setParentFolderForNewFolder] = useState(null);
  const [formData, setFormData] = useState({
    task_type: 'signature_request',
    task_title: '',
    client_ids: [],
    folder_id: '',
    due_date: '',
    priority: '',
    description: '',
    files: [],
    spouse_signature_required: false
  });

  // Fetch client details from API
  const fetchClientDetails = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);

      const result = await taxPreparerClientAPI.getTaxpayerDetails(clientId);
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch client details');
      }

      const apiData = result.data;
      const normalizedFilingStatus = normalizeFilingStatus(
        apiData.personal_information?.filing_status_value ||
        apiData.filing_status ||
        ''
      );
      const normalizedSpouseFilingStatus = normalizeFilingStatus(
        apiData.spouse_information?.filing_status ||
        apiData.spouse_information?.filing_status_value ||
        ''
      );

      const spouseName = apiData.spouse_information?.name ||
        (apiData.spouse_information?.first_name || apiData.spouse_information?.last_name
          ? `${apiData.spouse_information.first_name || ''} ${apiData.spouse_information.middle_name || ''} ${apiData.spouse_information.last_name || ''}`.trim()
          : '');

      const statistics = apiData.statistics ? {
        total_billed: apiData.statistics.total_billed || 0,
        total_billed_formatted: apiData.statistics.total_billed_formatted || '$0.00',
        documents: apiData.statistics.documents || 0,
        appointments: apiData.statistics.appointments || 0,
        last_activity: apiData.statistics.last_activity || apiData.last_activity?.last_active_relative || '',
        tasks: apiData.statistics.tasks || { total: 0, pending: 0, completed: 0, high_priority: 0 },
        invoices: apiData.statistics.invoices || { total: 0, pending: 0, overdue: 0, outstanding_balance: 0, total_invoiced: 0, total_paid: 0 }
      } : {
        tasks: { total: 0, pending: 0, completed: 0, high_priority: 0 },
        documents: { total: 0, archived: 0 },
        invoices: { total: 0, pending: 0, overdue: 0, outstanding_balance: 0, total_invoiced: 0, total_paid: 0 },
        appointments: { total: 0, upcoming: 0 },
        total_billed: 0,
        total_billed_formatted: '$0.00',
        last_activity: ''
      };

      const profileInfo = apiData.profile || {};
      const contactInfo = apiData.contact_details || {};
      const addressInfo = apiData.address_information || apiData.address || {};
      const personalInfo = apiData.personal_information || {};
      const spouseInfo = apiData.spouse_information || {};
      const spouseContactInfo = apiData.spouse_contact_details || {};

      const profilePictureUrl =
        profileInfo.profile_picture_url ||
        profileInfo.profile_picture ||
        apiData.profile_picture_url ||
        apiData.profile_picture ||
        personalInfo.profile_picture_url ||
        null;

      const mappedClient = {
        id: apiData.id || profileInfo.id || clientId,
        first_name: profileInfo.first_name || apiData.first_name || '',
        last_name: profileInfo.last_name || apiData.last_name || '',
        middle_name: profileInfo.middle_name || apiData.middle_name || '',
        name:
          profileInfo.name ||
          apiData.full_name ||
          `${profileInfo.first_name || apiData.first_name || ''} ${profileInfo.last_name || apiData.last_name || ''}`.trim(),
        email: profileInfo.email || apiData.email || contactInfo.email || '',
        phone: profileInfo.phone_formatted || profileInfo.phone || contactInfo.phone_formatted || contactInfo.phone || '',
        ssn: personalInfo.ssn || personalInfo.ssn_value || '',
        status: apiData.account_details?.status || apiData.status || 'active',
        priority: apiData.priority || 'medium',
        filingStatus: getFilingStatusLabel(normalizedFilingStatus),
        dob: formatDateForDisplay(personalInfo.date_of_birth || personalInfo.date_of_birth_value || ''),
        gender: personalInfo.gender || personalInfo.gender_value || '',
        initials:
          profileInfo.initials ||
          apiData.initials ||
          `${(profileInfo.first_name || apiData.first_name || '').charAt(0)}${(profileInfo.last_name || apiData.last_name || '').charAt(0)}`.toUpperCase(),
        profile_picture: profilePictureUrl,
        address: {
          line: addressInfo.address_line || '',
          city: addressInfo.city || '',
          state: addressInfo.state || '',
          zip: addressInfo.zip_code || '',
        },
        spouse: {
          name: spouseInfo.name || '',
          first_name: spouseInfo.first_name || '',
          middle_name: spouseInfo.middle_name || '',
          last_name: spouseInfo.last_name || '',
          ssn: spouseInfo.ssn || spouseInfo.ssn_value || '',
          phone: spouseContactInfo.phone || '',
          email: spouseContactInfo.email || '',
          gender: spouseInfo.gender || spouseInfo.gender_value || '',
          dob: formatDateForDisplay(spouseInfo.date_of_birth || spouseInfo.date_of_birth_value || ''),
          filing_status: getFilingStatusLabel(normalizedSpouseFilingStatus),
        },
        statistics,
        account_details: apiData.account_details ? {
          assigned_staff: apiData.account_details.assigned_staff || null,
          assigned_staff_name: apiData.account_details.assigned_staff_name || '',
          join_date: apiData.account_details.join_date || '',
          join_date_value: apiData.account_details.join_date_value || '',
          status: apiData.account_details.status || 'active',
          status_display: apiData.account_details.status_display || 'Active'
        } : null,
        last_activity: apiData.last_activity ? {
          last_active: apiData.last_activity.last_active || '',
          last_active_display: apiData.last_activity.last_active_display || '',
          last_active_relative: apiData.last_activity.last_active_relative || ''
        } : null,
        date_joined: apiData.date_joined || apiData.account_details?.join_date_value || '',
        client_tags: apiData.tags || [],
        tags: apiData.tags || [],
        custom_tags: apiData.custom_tags || [],
      };
      setClient(mappedClient);
      setCanEditClient(
        apiData.permissions && typeof apiData.permissions.can_edit === 'boolean'
          ? !!apiData.permissions.can_edit
          : true
      );

      const formState = {
        first_name: profileInfo.first_name || apiData.first_name || '',
        last_name: profileInfo.last_name || apiData.last_name || '',
        middle_name: profileInfo.middle_name || apiData.middle_name || '',
        email: profileInfo.email || apiData.email || contactInfo.email || '',
        phone_number: profileInfo.phone || contactInfo.phone || apiData.phone_number || '',
        filing_status: normalizedFilingStatus,
        address_line: addressInfo.address_line || '',
        city: addressInfo.city || '',
        state: addressInfo.state || '',
        zip_code: addressInfo.zip_code || '',
        spouse_first_name: spouseInfo.first_name || '',
        spouse_last_name: spouseInfo.last_name || '',
        spouse_date_of_birth: spouseInfo.date_of_birth_value || '',
      };
      setEditFormData(formState);
      setOriginalFormData({ ...formState });

      const editableTags = apiData.custom_tags ? [...apiData.custom_tags] : [];
      setCustomTags(editableTags);
      setOriginalCustomTags([...editableTags]);
      setNewTagInput("");

      setLockedFields(new Set(apiData.locked_fields || []));
    } catch (error) {
      console.error('Error fetching client details:', error);
      setError(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  // Fetch client details on component mount
  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  // Click outside handler for folder dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFolderDropdown && folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setShowFolderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFolderDropdown]);

  // Fetch folders when modal opens
  useEffect(() => {
    if (showAddTaskModal) {
      fetchRootFolders();
    }
  }, [showAddTaskModal]);

  // Fetch root folders from API
  const fetchRootFolders = async () => {
    if (!showAddTaskModal) return;

    try {
      setLoadingFolders(true);

      // Use the new optimized folder endpoint
      const result = await taxPreparerDocumentsAPI.getSharedFolders({
        folder_id: null
      });

      if (result.success && result.data) {
        let rootFolders = result.data.folders || [];

        const foldersTree = rootFolders.map(folder => ({
          id: folder.id,
          name: folder.title || folder.name,
          title: folder.title || folder.name,
          description: folder.description || '',
          children: [],
          expanded: false,
          loaded: false,
        }));
        setFolderTree(foldersTree);
      } else {
        setFolderTree([]);
      }
    } catch (error) {
      console.error('Error fetching root folders:', error);
      setFolderTree([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Fetch subfolders for a specific folder
  const fetchSubfolders = async (folderId) => {
    try {
      // Use the new optimized folder endpoint
      const result = await taxPreparerDocumentsAPI.getSharedFolders({
        folder_id: folderId
      });

      if (result.success && result.data && result.data.folders) {
        return result.data.folders.map(folder => ({
          id: folder.id,
          name: folder.title || folder.name,
          title: folder.title || folder.name,
          description: folder.description || '',
          children: [],
          expanded: false,
          loaded: false,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching subfolders:', error);
      return [];
    }
  };

  // Update folder tree with subfolders
  const updateFolderWithSubfolders = (tree, targetFolderId, subfolders) => {
    return tree.map(folder => {
      if (folder.id === targetFolderId) {
        return {
          ...folder,
          children: subfolders,
          loaded: true,
        };
      }
      if (folder.children && folder.children.length > 0) {
        return {
          ...folder,
          children: updateFolderWithSubfolders(folder.children, targetFolderId, subfolders),
        };
      }
      return folder;
    });
  };

  const toggleExpand = async (folder, path = []) => {
    const isCurrentlyExpanded = expandedFolders.has(folder.id);

    const newExpandedFolders = new Set(expandedFolders);
    if (isCurrentlyExpanded) {
      newExpandedFolders.delete(folder.id);
    } else {
      newExpandedFolders.add(folder.id);
    }
    setExpandedFolders(newExpandedFolders);

    // If expanding and subfolders haven't been loaded, fetch them
    if (!isCurrentlyExpanded && !folder.loaded && folder.id) {
      const subfolders = await fetchSubfolders(folder.id);
      setFolderTree(prevTree => updateFolderWithSubfolders(prevTree, folder.id, subfolders));
    }
  };

  const handleFolderSelect = (path, folderId) => {
    setSelectedFolderPath(path);
    handleInputChange('folder_id', folderId || '');
    setShowFolderDropdown(false);
  };

  // Helper function to find folder by ID
  const findFolderById = (tree, folderId) => {
    for (const folder of tree) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children && folder.children.length > 0) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const arraysEqualIgnoreCase = (a = [], b = []) => {
    const normalize = (arr) =>
      arr
        .map((item) => item?.toString().trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase())
        .sort();
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!isEditMode || !editFormData || !originalFormData) {
      return false;
    }

    // Check form data changes
    const fieldMap = [
      'first_name', 'last_name', 'middle_name', 'email', 'phone_number',
      'filing_status', 'address_line', 'city', 'state', 'zip_code',
      'spouse_first_name', 'spouse_last_name', 'spouse_date_of_birth'
    ];

    for (const field of fieldMap) {
      const nextValue = editFormData[field] ?? '';
      const prevValue = originalFormData[field] ?? '';
      const sanitizedNext = typeof nextValue === 'string' ? nextValue.trim() : nextValue;
      const sanitizedPrev = typeof prevValue === 'string' ? prevValue.trim() : prevValue;
      if (sanitizedNext !== sanitizedPrev) {
        return true;
      }
    }

    // Check tags changes
    if (!arraysEqualIgnoreCase(customTags, originalCustomTags)) {
      return true;
    }

    return false;
  };

  // Handle navigation with unsaved changes check
  const handleNavigation = (targetPath, tab = null) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(targetPath);
      setShowUnsavedChangesModal(true);
    } else {
      if (tab) {
        setActiveTab(tab);
      }
      navigate(targetPath);
    }
  };

  // Handle save and proceed
  const handleSaveAndProceed = async () => {
    try {
      await handleSaveTaxpayer();
      // Check if save was successful (no errors thrown)
      if (pendingNavigation) {
        setShowUnsavedChangesModal(false);
        const targetPath = pendingNavigation;
        setPendingNavigation(null);
        navigate(targetPath);
      }
    } catch (error) {
      // If save failed, don't navigate - user can try again or cancel
      console.error('Error saving before navigation:', error);
    }
  };

  // Handle cancel navigation
  const handleCancelNavigation = () => {
    setShowUnsavedChangesModal(false);
    setPendingNavigation(null);
  };

  // Save taxpayer updates
  const handleSaveTaxpayer = async () => {
    if (!editFormData || !originalFormData || !clientId) {
      toast.error('Invalid client data');
      throw new Error('Invalid client data');
    }

    const fieldMap = [
      { form: 'first_name', api: 'first_name' },
      { form: 'last_name', api: 'last_name' },
      { form: 'middle_name', api: 'middle_name' },
      { form: 'email', api: 'email' },
      { form: 'phone_number', api: 'phone' },
      { form: 'filing_status', api: 'filing_status' },
      { form: 'address_line', api: 'address' },
      { form: 'city', api: 'city' },
      { form: 'state', api: 'state' },
      { form: 'zip_code', api: 'zip_code' },
      { form: 'spouse_first_name', api: 'spouse_first_name' },
      { form: 'spouse_last_name', api: 'spouse_last_name' },
      { form: 'spouse_date_of_birth', api: 'spouse_date_of_birth' },
    ];

    const payload = {};

    fieldMap.forEach(({ form, api }) => {
      const nextValue = editFormData[form] ?? '';
      const prevValue = originalFormData[form] ?? '';
      const sanitizedNext = typeof nextValue === 'string' ? nextValue.trim() : nextValue;
      const sanitizedPrev = typeof prevValue === 'string' ? prevValue.trim() : prevValue;
      if (sanitizedNext !== sanitizedPrev) {
        payload[api] = sanitizedNext || '';
      }
    });

    if (!arraysEqualIgnoreCase(customTags, originalCustomTags)) {
      payload.tags = customTags;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save.');
      setIsEditMode(false);
      return;
    }

    try {
      setSaving(true);
      const response = await taxPreparerClientAPI.updateTaxpayer(clientId, payload);

      if (response.success) {
        toast.success(response.message || 'Client profile updated successfully!', {
          position: "top-right",
          autoClose: 3000
        });
        setIsEditMode(false);
        setOriginalFormData({ ...editFormData });
        setOriginalCustomTags([...customTags]);
        if (response.data?.locked_fields) {
          setLockedFields(new Set(response.data.locked_fields));
        }
        fetchClientDetails();
        return true; // Indicate success
      } else {
        throw new Error(response.message || 'Failed to update client profile');
      }
    } catch (error) {
      console.error('Error updating taxpayer:', error);
      const lockedFromError = error?.data?.errors?.locked_fields || error?.data?.locked_fields;
      if (lockedFromError && Array.isArray(lockedFromError) && lockedFromError.length > 0) {
        setLockedFields((prev) => new Set([...prev, ...lockedFromError]));
        toast.error('Some fields are locked by your firm administrator and cannot be edited.', {
          position: "top-right",
          autoClose: 4000
        });
      } else {
        toast.error(handleAPIError(error), {
          position: "top-right",
          autoClose: 3000
        });
      }
      throw error; // Re-throw to allow caller to handle
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (originalFormData) {
      setEditFormData({ ...originalFormData });
    }
    setCustomTags(originalCustomTags);
    setNewTagInput("");
  };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // Validate password inputs
  const validatePasswords = () => {
    const errors = {};

    if (!newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm the new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordReset = async () => {
    if (!clientId) {
      toast.error('Client ID is missing');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    try {
      setResettingPassword(true);

      const response = await taxPreparerClientAPI.resetTaxpayerPassword(clientId, {
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.success) {
        toast.success(response.message || 'Password reset successfully.', {
          position: "top-right",
          autoClose: 5000,
        });
        // Close modal and reset form
        setShowPasswordDialog(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error(err.message || 'Failed to reset password. Please try again.', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setResettingPassword(false);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreatingFolderLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        toast.error('No authentication token found. Please login again.');
        return;
      }

      const folderData = {
        title: newFolderName.trim(),
        description: `Documents folder: ${newFolderName.trim()}`
      };

      if (parentFolderForNewFolder) {
        folderData.parent_id = parentFolderForNewFolder;
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData)
      };

      const response = await fetchWithCors(`${API_BASE_URL}/firm/staff/documents/folders/create/`, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing create folder response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      let folderInfo = result;
      if (result.data) {
        folderInfo = result.data;
      }

      const newFolderObj = {
        name: folderInfo.title || folderInfo.name || newFolderName.trim(),
        id: folderInfo.id,
        title: folderInfo.title || folderInfo.name || newFolderName.trim(),
        description: folderInfo.description || '',
        children: [],
        expanded: false,
        loaded: false
      };

      let updatedTree;
      if (parentFolderForNewFolder) {
        updatedTree = updateFolderWithSubfolders(folderTree, parentFolderForNewFolder, [
          ...(findFolderById(folderTree, parentFolderForNewFolder)?.children || []),
          newFolderObj
        ]);
      } else {
        updatedTree = [...folderTree, newFolderObj];
      }

      setFolderTree(updatedTree);
      setNewFolderName("");
      setCreatingFolder(false);
      setParentFolderForNewFolder(null);

      toast.success('Folder created successfully!');

    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(handleAPIError(error));
    } finally {
      setCreatingFolderLoading(false);
    }
  };

  // Render folder tree
  const renderFolderTree = (folders, path = []) =>
    folders.map((folder, idx) => {
      const fullPath = [...path, folder.name].join(" > ");
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const showExpandIcon = hasChildren || (!folder.loaded && folder.id);

      return (
        <div key={folder.id || idx} style={{ paddingLeft: '8px', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showExpandIcon ? (
              <span
                onClick={() => toggleExpand(folder, path)}
                style={{ cursor: 'pointer', width: '12px', display: 'inline-block' }}
              >
                {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
              </span>
            ) : <span style={{ width: '12px' }} />}
            <div
              onClick={() => handleFolderSelect(fullPath, folder.id)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '2px 0' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FaFolder style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '14px' }}>{folder.name}</span>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ paddingLeft: '12px' }}>
              {renderFolderTree(folder.children, [...path, folder.name])}
            </div>
          )}
        </div>
      );
    });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field === 'client_ids') {
      setFormData(prev => ({
        ...prev,
        client_ids: Array.isArray(value) ? value : [value]
      }));
    } else if (field === 'files') {
      setFormData(prev => ({
        ...prev,
        files: Array.from(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle spouse signature toggle with validation
  const handleSpouseSignatureToggle = async (checked) => {
    // If unchecking, allow it
    if (!checked) {
      handleInputChange('spouse_signature_required', false);
      return;
    }

    // If checking, validate that client has a spouse
    if (!clientId) {
      toast.error('Client ID is missing. Cannot check spouse information.');
      return;
    }

    try {
      const response = await taxPreparerClientAPI.checkClientSpouse(clientId);

      if (response.success && response.data) {
        if (response.data.has_spouse) {
          // Client has spouse, allow toggle
          handleInputChange('spouse_signature_required', true);
        } else {
          // Client doesn't have spouse, show error and don't allow toggle
          toast.error('This client does not have a partner/spouse. Spouse signature cannot be required.');
        }
      } else {
        toast.error('Failed to check spouse information. Please try again.');
      }
    } catch (error) {
      console.error('Error checking spouse:', error);
      toast.error(handleAPIError(error) || 'Failed to check spouse information. Please try again.');
    }
  };

  // Create task API call
  const createTask = async (e) => {
    if (e) e.preventDefault();

    if (!formData.task_title || !formData.client_ids || formData.client_ids.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that files are uploaded for signature_request and review_request
    if (formData.task_type !== 'document_request' && (!formData.files || formData.files.length === 0)) {
      toast.error('Please upload at least one document for this task type');
      return;
    }

    try {
      setLoadingTask(true);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('task_type', formData.task_type || 'signature_request');
      formDataToSend.append('task_title', formData.task_title);
      formDataToSend.append('client_ids', JSON.stringify(formData.client_ids));

      if (formData.due_date) {
        formDataToSend.append('due_date', formData.due_date);
      }

      if (formData.priority) {
        formDataToSend.append('priority', formData.priority);
      }

      if (formData.folder_id) {
        formDataToSend.append('folder_id', formData.folder_id);
      }

      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      if (formData.task_type === 'signature_request') {
        const spouseSignValue = !!(formData.spouse_signature_required === true ||
          formData.spouse_signature_required === 'true' ||
          formData.spouse_signature_required === 'True' ||
          formData.spouse_signature_required === 1 ||
          formData.spouse_signature_required === '1');
        const spouseSignString = spouseSignValue ? '1' : '0';
        formDataToSend.append('spouse_sign', spouseSignString);
        formDataToSend.append('spouse_signature_required', spouseSignString);
      }

      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file) => {
          formDataToSend.append('files', file);
        });
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      };

      const apiUrl = `${API_BASE_URL}/taxpayer/tax-preparer/tasks/create/`;
      const response = await fetchWithCors(apiUrl, config);

      const result = await response.json();

      // Check if API returned success: false with errors
      if (!response.ok || (result.success === false && result.errors)) {
        // Extract all error messages from the errors object
        const errorMessages = [];

        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach(field => {
            const fieldErrors = result.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => errorMessages.push(err));
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
        }

        // Show all error messages in toast notifications
        if (errorMessages.length > 0) {
          errorMessages.forEach(msg => {
            toast.error(msg, { position: "top-right", autoClose: 5000 });
          });
        } else {
          // Fallback to general error message
          toast.error(result.message || result.detail || 'Failed to create task. Please try again.', { position: "top-right", autoClose: 5000 });
        }

        // Mark that errors have been shown and throw
        const error = new Error(result.message || result.detail || `HTTP error! status: ${response.status}`);
        error.errorsShown = true;
        throw error;
      }

      console.log('Task created successfully:', result);

      // Reset form and close modal
      setFormData({
        task_type: 'signature_request',
        task_title: '',
        client_ids: [],
        folder_id: '',
        due_date: '',
        priority: '',
        description: '',
        files: [],
        spouse_signature_required: false
      });
      setSelectedFolderPath('');
      setCreatingFolder(false);
      setNewFolderName('');
      setParentFolderForNewFolder(null);
      setShowAddTaskModal(false);

      toast.success('Task created successfully!');
      // Refresh client details to update task count
      fetchClientDetails();

    } catch (error) {
      console.error('Error creating task:', error);
      // Only show generic error if we haven't already shown specific errors
      if (!error.errorsShown) {
        toast.error(handleAPIError(error), { position: "top-right", autoClose: 5000 });
      }
    } finally {
      setLoadingTask(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading client details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 font-['BasisGrotesquePro']">
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
          <button className="btn btn-outline-danger ms-2" onClick={fetchClientDetails}>
            Retry
          </button>
          <button className="btn btn-outline-secondary ms-2" onClick={() => navigate('/taxdashboard/clients')}>
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  // Show nothing if client data is not loaded
  if (!client) {
    return null;
  }

  const initials = client.initials || (client.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Build statuses to render in the header badges
  const statusesForHeader = (() => {
    const statuses = [];
    if (client.status) {
      statuses.push(client.status.charAt(0).toUpperCase() + client.status.slice(1));
    }
    if (client.priority && client.priority !== 'medium') {
      const priorityLabel = client.priority === 'high' ? 'High Priority' :
        client.priority;
      statuses.push(priorityLabel);
    }
    // Add client tags
    if (client.tags && Array.isArray(client.tags)) {
      statuses.push(...client.tags);
    }
    return statuses;
  })();

  const tagsAreLocked = isFieldLocked('tags');

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setPendingNavigation('/taxdashboard/clients');
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/taxdashboard/clients');
    }
  };

  return (
    <div className="lg:p-4 md:p-2 px-1 font-['BasisGrotesquePro']">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-[#E8F0FF] rounded-lg transition-colors"
          style={{
            fontFamily: 'BasisGrotesquePro',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--Palette2-Dark-blue-900, #3B4A66)',
            border: '1px solid var(--Palette2-Dark-blue-100, #E8F0FF)',
            cursor: 'pointer'
          }}
        >
          <FaArrowLeft size={16} />
          <span>Back to Clients</span>
        </button>
      </div>

      {client.status === 'former' && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <MiniClock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-0">Former Client (Read-Only)</h4>
            <p className="text-xs text-gray-500 mb-0">
              This client is no longer active with your firm. You have read-only access to records from your active tenure.
              {client.account_details?.join_date && ` (Tenure: ${client.account_details.join_date} - Present)`}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold font-grotesque">Client Details</h3>
          <small className="text-gray-500">Detailed information about {client.name}</small>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 ">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 aspect-square rounded-full overflow-hidden flex items-center justify-center text-xl font-bold"
                style={{
                  backgroundColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
                  color: "var(--Palette2-Dark-blue-900, #3B4A66)",
                }}
              >
                {client.profile_picture ? (
                  <img
                    src={client.profile_picture}
                    alt={client.name || "Client avatar"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              <div>
                {/* Name + Status badges */}
                <div
                  className="text-lg font-semibold flex items-center gap-3"
                  style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}
                >
                  {client.name}
                  <div className="flex flex-wrap gap-2">
                    {statusesForHeader.map((s, i) => (
                      <span key={i} className={
                        (s || '').toLowerCase().includes('high')
                          ? 'px-2 py-1 rounded-full bg-red-100 text-red-600 text-[10px] capitalize'
                          : (s || '').toLowerCase().includes('active')
                            ? 'px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] capitalize'
                            : (s || '').toLowerCase().includes('former')
                              ? 'px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-[10px] capitalize font-bold'
                              : 'px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] capitalize'
                      }>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons: visible on all tabs */}
            <div className="flex gap-3 align-items-center" style={{ flexWrap: "nowrap" }}>
              {/* Send Message Button */}
              <button
                className="rounded-md text-sm"
                style={{
                  fontSize: "15px",
                  width: "131px",
                  gap: "6px",
                  borderRadius: "6px",
                  border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
                  backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
                  color: "#fff",
                  padding: "5px 12px",
                  opacity: 1,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
                onClick={() => {
                  if (clientId) {
                    navigate(`/taxdashboard/messages?clientId=${clientId}`);
                  } else {
                    navigate('/taxdashboard/messages');
                  }
                }}
              >
                Send Message
              </button>

              {/* Fill Intake Form Button - Visible for Unlinked or Pending */}
              {['Unlinked', 'Pending'].includes(client.status) && client.status !== 'former' && (
                <button
                  className="rounded-md text-sm"
                  style={{
                    fontSize: "15px",
                    width: "auto",
                    gap: "6px",
                    borderRadius: "6px",
                    border: "1px solid var(--Palette2-TealBlue-900, #00C0C6)",
                    backgroundColor: "#fff",
                    color: "var(--Palette2-TealBlue-900, #00C0C6)",
                    padding: "5px 12px",
                    opacity: 1,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                  onClick={() => setShowFillIntakeModal(true)}
                >
                  Fill Intake Form
                </button>
              )}

              {/* Add Task Button */}
              {client.status !== 'former' && (
                <button
                  className="rounded-md text-sm"
                  style={{
                    fontSize: "15px",
                    width: "110px",
                    gap: "6px",
                    borderRadius: "6px",
                    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                    backgroundColor: "#fff",
                    color: "var(--Palette2-Dark-blue-900, #3B4A66)",
                    padding: "5px 12px",
                    opacity: 1,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                  onClick={() => {
                    if (clientId) {
                      setFormData(prev => ({
                        ...prev,
                        client_ids: [clientId.toString()]
                      }));
                    }
                    setShowAddTaskModal(true);
                  }}
                >
                  Add Task
                </button>
              )}

              {/* Edit Details Button */}
              {canEditClient && client.status !== 'former' && (
                <div className="d-flex gap-2">
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      style={{
                        fontSize: "15px",
                        borderRadius: "6px",
                        border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
                        backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
                        color: "#fff",
                        padding: "5px 12px",
                        opacity: 1,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <WhiteEdit />
                      <span>Edit Details</span>
                    </button>

                  ) : (
                    <>
                      <button
                        className="btn btn-light"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        style={{
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "15px",
                          border: "1px solid #E5E7EB",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveTaxpayer}
                        disabled={saving}
                        style={{
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "15px",
                          backgroundColor: "#FF7A2F",
                          borderColor: "#FF7A2F",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-2 ml-0 md:ml-20">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-20">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">Email</span>
                <div className="flex items-center gap-2">
                  <MailMiniIcon />
                  <span className="text-gray-700 text-sm font-medium break-all">{client.email}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1"> Phone</span>
                <div className="flex items-center gap-2">
                  <PhoneMiniIcon />
                  <span className="text-gray-700 text-sm font-medium">{client.phone}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">Filing Status</span>
                <span className="text-gray-700 text-sm font-medium">{client.filingStatus || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">SSN / ITIN (Tax ID)</span>
                <span className="text-gray-700 text-sm font-medium">{client.ssn || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="w-full bg-white rounded-xl mt-6 md:mt-10 p-4 overflow-x-auto"
        style={{
          border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        }}
      >
        <div className="flex gap-3 min-w-max">
          {/* Info (active-like) */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: activeTab === 'info'
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff",
              color: activeTab === 'info'
                ? "#ffffff"
                : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation(`/taxdashboard/clients/${clientId}`, "info");
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                activeTab === 'info'
                  ? "var(--Palette2-TealBlue-900, #00C0C6)"
                  : "#fff";
              e.currentTarget.style.color = activeTab === 'info' ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
          >
            Info
          </button>

          {/* Documents */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: isDocuments ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: isDocuments ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDocuments
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff";
              e.currentTarget.style.color = isDocuments ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={() => handleNavigation(`/taxdashboard/clients/${clientId}/documents`, "documents")}

          >
            Documents
          </button>

          {/* Invoices */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: isInvoicesActive ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: isInvoicesActive ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isInvoicesActive
                ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff";
              e.currentTarget.style.color = isInvoicesActive ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={() => handleNavigation(`/taxdashboard/clients/${clientId}/invoices`, "invoices")}
          >
            Invoices
          </button>

          {/* Schedules */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: isSchedule ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: isSchedule ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isSchedule
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff";
              e.currentTarget.style.color = isSchedule ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={() => handleNavigation(`/taxdashboard/clients/${clientId}/schedule`, "schedule")}
          >
            Schedules
          </button>

          {/* E-Sign Activity */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: isESignLogs ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: isESignLogs ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isESignLogs
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff";
              e.currentTarget.style.color = isESignLogs ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={() => handleNavigation(`/taxdashboard/clients/${clientId}/esign-logs`, "esign-logs")}
          >
            E-Sign Activity
          </button>

          {/* Security */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: activeTab === 'security' ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: activeTab === 'security' ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = activeTab === 'security'
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff";
              e.currentTarget.style.color = activeTab === 'security' ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation(`/taxdashboard/clients/${clientId}/security`, "security");
            }}
          >
            Security
          </button>

          {/* Intake Form */}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              display: "inline-flex",
              width: "auto",
              whiteSpace: "nowrap",
              padding: "5px 12px",
              border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
              backgroundColor: activeTab === 'intake' ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
              color: activeTab === 'intake' ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
              borderRadius: "7px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--Palette2-TealBlue-900, #00C0C6)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = activeTab === 'intake'
                ? "var(--Palette2-TealBlue-900, #00C0C6)"
                : "#fff";
              e.currentTarget.style.color = activeTab === 'intake' ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
            }}
            onClick={(e) => {
              e.preventDefault();
              // Navigate to base path but set active tab to intake
              handleNavigation(`/taxdashboard/clients/${clientId}`, "intake");
            }}
          >
            Intake Form
          </button>
        </div>
      </div>
      <Outlet context={{ client, clientStatus: client?.status }} />

      {!(isDocuments || isInvoices || isSchedule || isESignLogs || isSecurity) && activeTab === 'intake' && (
        <IntakeFormTab onOpenFillModal={() => setShowFillIntakeModal(true)} />
      )}

      {!(isDocuments || isInvoices || isSchedule || isESignLogs || isSecurity) && activeTab === 'info' && (
        <div className="flex flex-col gap-6 mt-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl p-6 ">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  Personal Information
                </div>
                <div className="text-gray-500 text-xs mt-1">Your basic personal and contact information</div>
              </div>
              <div />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs "
                  style={{
                    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                  }}>Name</div>
                {isEditMode && editFormData ? (
                  <div className="d-flex gap-2 w-100">
                    <div className="flex-grow-1">
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.first_name}
                        onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                        placeholder="First Name"
                        style={{ borderRadius: "6px", fontSize: "14px" }}
                        disabled={isFieldLocked('first_name')}
                      />
                      {renderLockedHelperText('first_name')}
                    </div>
                    <div className="flex-grow-1">
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.last_name}
                        onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                        placeholder="Last Name"
                        style={{ borderRadius: "6px", fontSize: "14px" }}
                        disabled={isFieldLocked('last_name')}
                      />
                      {renderLockedHelperText('last_name')}
                    </div>
                  </div>
                ) : (
                  <div className="font-medium" style={{
                    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                  }}>{client.name}</div>
                )}
                <div className="text-xs text-gray-500 mt-3">SSN / ITIN (Tax ID)</div>
                <div className="font-medium " style={{
                  color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                }}>{client.ssn || "N/A"}</div>
                {client.gender && (
                  <>
                    <div className="text-xs text-gray-500 mt-3">Gender</div>
                    <div className="font-medium " style={{
                      color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                    }}>{client.gender}</div>
                  </>
                )}
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-gray-500 mt-3">Filing Status</div>
                  {isEditMode && editFormData ? (
                    <>
                      <select
                        className="form-select"
                        value={editFormData.filing_status}
                        onChange={(e) => handleEditFormChange('filing_status', e.target.value)}
                        style={{ borderRadius: "6px", fontSize: "14px", maxWidth: "220px" }}
                        disabled={isFieldLocked('filing_status')}
                      >
                        <option value="">Select filing status</option>
                        {FILING_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {renderLockedHelperText('filing_status')}
                    </>
                  ) : (
                    <div className="font-medium " style={{
                      color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                    }}>{client.filingStatus || "N/A"}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs " style={{
                    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                  }}>Date of Birth</div>
                  <div className="font-medium " style={{
                    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
                  }}>{client.dob || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Address and Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 ">
              <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                Address
              </div>
              <div className="mt-4">
                {isEditMode && editFormData ? (
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.address_line}
                        onChange={(e) => handleEditFormChange('address_line', e.target.value)}
                        placeholder="Address Line"
                        style={{ borderRadius: "6px", fontSize: "14px" }}
                        disabled={isFieldLocked('address')}
                      />
                      {renderLockedHelperText('address')}
                    </div>
                    <div className="d-flex gap-2">
                      <div className="flex-grow-1">
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.city}
                          onChange={(e) => handleEditFormChange('city', e.target.value)}
                          placeholder="City"
                          style={{ borderRadius: "6px", fontSize: "14px" }}
                          disabled={isFieldLocked('city')}
                        />
                        {renderLockedHelperText('city')}
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.state}
                          onChange={(e) => handleEditFormChange('state', e.target.value)}
                          placeholder="State"
                          style={{ borderRadius: "6px", fontSize: "14px", maxWidth: "100px" }}
                          disabled={isFieldLocked('state')}
                        />
                        {renderLockedHelperText('state')}
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.zip_code}
                          onChange={(e) => handleEditFormChange('zip_code', e.target.value)}
                          placeholder="ZIP Code"
                          style={{ borderRadius: "6px", fontSize: "14px", maxWidth: "120px" }}
                          disabled={isFieldLocked('zip_code')}
                        />
                        {renderLockedHelperText('zip_code')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Labels Row */}
                    <div className="grid grid-cols-4 gap-6 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                      <div>Address Line</div>
                      <div>City</div>
                      <div>State</div>
                      <div>ZIP Code</div>
                    </div>
                    {/* Values Row */}
                    <div className="grid grid-cols-4 gap-6 mt-1">
                      <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                        {client.address.line || "N/A"}
                      </div>
                      <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                        {client.address.city || "N/A"}
                      </div>
                      <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                        {client.address.state || "N/A"}
                      </div>
                      <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                        {client.address.zip || "N/A"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 ">
              <div className="font-semibold " style={{
                color: "var(--Palette2-Dark-blue-100, #4B5563)",
              }}>Contact Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                    <BlackPhone />
                    <span>Phone</span>
                  </div>
                  {isEditMode && editFormData ? (
                    <PhoneInput
                      country={phoneCountry}
                      value={editFormData.phone_number || ''}
                      onChange={(phone) => handleEditFormChange('phone_number', phone)}
                      onCountryChange={(countryCode) => {
                        setPhoneCountry(countryCode.toLowerCase());
                      }}
                      inputClass="form-control mt-1"
                      containerClass="w-100 phone-input-container"
                      inputStyle={{ borderRadius: "6px", fontSize: "14px" }}
                      disabled={isFieldLocked('phone')}
                      enableSearch={true}
                      countryCodeEditable={false}
                    />
                  ) : (
                    <div className="mt-1 text-[15px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                      {client.phone}
                    </div>
                  )}
                  {isEditMode && renderLockedHelperText('phone')}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                    <BlackEmail />
                    <span>Email</span>
                  </div>
                  {isEditMode && editFormData ? (
                    <input
                      type="email"
                      className="form-control mt-1"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      placeholder="Email Address"
                      style={{ borderRadius: "6px", fontSize: "14px" }}
                      disabled={isFieldLocked('email')}
                    />
                  ) : (
                    <div className="mt-1 text-[15px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                      {client.email}
                    </div>
                  )}
                  {isEditMode && renderLockedHelperText('email')}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">Tags</div>
                <div className="text-gray-500 text-xs">Labels shared across your firm for this client</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Active Tags</div>
              <div className="flex flex-wrap gap-2">
                {(client.tags && client.tags.length > 0) ? (
                  client.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs capitalize"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No tags assigned</span>
                )}
              </div>
            </div>
            {isEditMode && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Custom Tags (editable)</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {customTags.length > 0 ? (
                    customTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs d-inline-flex align-items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          className="border-0 bg-transparent text-indigo-700"
                          onClick={() => handleRemoveCustomTag(tag)}
                          aria-label={`Remove ${tag}`}
                          disabled={tagsAreLocked}
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No custom tags yet.</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add tag (e.g., VIP, Priority)"
                    style={{ borderRadius: "6px", fontSize: "14px" }}
                    disabled={tagsAreLocked}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddCustomTag}
                    style={{ borderRadius: "6px", backgroundColor: "#00C0C6", borderColor: "#00C0C6" }}
                    disabled={tagsAreLocked}
                  >
                    Add Tag
                  </button>
                </div>
                {tagsAreLocked && (
                  <small className="text-danger d-block mt-2">Tags are locked by your administrator.</small>
                )}
              </div>
            )}
          </div>

          {/* Spouse Information */}
          <div className="bg-white rounded-xl p-6 ">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">Spouse Information</div>
                <div className="text-gray-500 text-xs">Your spouse's information for joint filing</div>
              </div>
              {/* <button
                className="flex items-center gap-2 rounded-md text-sm"
                style={{
                  fontSize: "15px",
                  borderRadius: "6px",
                  border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
                  backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
                  color: "#fff",
                  padding: "5px 12px",
                  opacity: 1,
                }}
              >
                <WhiteEdit />
                Edit
              </button> */}
            </div>
            {isEditMode && editFormData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">First Name</div>
                  <input
                    type="text"
                    className="form-control mt-1"
                    value={editFormData.spouse_first_name || ''}
                    onChange={(e) => handleEditFormChange('spouse_first_name', e.target.value)}
                    placeholder="First Name"
                    style={{ borderRadius: "6px", fontSize: "14px" }}
                    disabled={isFieldLocked('spouse_first_name')}
                  />
                  {renderLockedHelperText('spouse_first_name')}
                  <div className="text-xs text-gray-500 mt-3">Last Name</div>
                  <input
                    type="text"
                    className="form-control mt-1"
                    value={editFormData.spouse_last_name || ''}
                    onChange={(e) => handleEditFormChange('spouse_last_name', e.target.value)}
                    placeholder="Last Name"
                    style={{ borderRadius: "6px", fontSize: "14px" }}
                    disabled={isFieldLocked('spouse_last_name')}
                  />
                  {renderLockedHelperText('spouse_last_name')}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date of Birth</div>
                  <input
                    type="date"
                    className="form-control mt-1"
                    value={editFormData.spouse_date_of_birth || ''}
                    onChange={(e) => handleEditFormChange('spouse_date_of_birth', e.target.value)}
                    style={{ borderRadius: "6px", fontSize: "14px" }}
                    disabled={isFieldLocked('spouse_date_of_birth')}
                  />
                  {renderLockedHelperText('spouse_date_of_birth')}
                  <div className="text-xs text-gray-500 mt-3">Filed With Client</div>
                  <div className="font-medium text-gray-900">{client.spouse.filing_status || client.filingStatus || "N/A"}</div>
                </div>
              </div>
            ) : client.spouse.name ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="font-medium text-gray-900">{client.spouse.name}</div>
                  <div className="text-xs text-gray-500 mt-3">SSN / ITIN (Tax ID)</div>
                  <div className="font-medium text-gray-900">{client.spouse.ssn || "N/A"}</div>
                  {client.spouse.gender && (
                    <>
                      <div className="text-xs text-gray-500 mt-3">Gender</div>
                      <div className="font-medium text-gray-900">{client.spouse.gender}</div>
                    </>
                  )}
                </div>
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mt-3">Filing Status</div>
                    <div className="font-medium text-gray-900">{client.spouse.filing_status || client.filingStatus || "N/A"}</div>
                    {client.spouse.dob && (
                      <>
                        <div className="text-xs text-gray-500 mt-3">Date of Birth</div>
                        <div className="font-medium text-gray-900">{client.spouse.dob}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center text-gray-500">
                <p>No spouse information available</p>
              </div>
            )}
          </div>

          {client.spouse.name && (client.spouse.phone || client.spouse.email) && (
            <div className="bg-white rounded-xl p-6 ">
              <div className="font-semibold " style={{
                color: "var(--Palette2-Dark-blue-100, #4B5563)",
              }}>Spouse Contact Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {client.spouse.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                      <BlackPhone />
                      <span>Phone</span>
                    </div>
                    <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                      {client.spouse.phone}
                    </div>
                  </div>
                )}
                {client.spouse.email && (
                  <div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                      <BlackEmail />
                      <span>Email</span>
                    </div>
                    <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                      {client.spouse.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9999] p-6 lg:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-[550px] bg-white rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="border-b border-[#E8F0FF] flex justify-between items-center bg-white z-20">
              <div className="py-3 px-3 flex flex-col justify-center">
                <h5 className="text-lg font-bold text-[#3B4A66] leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Create New Task
                </h5>
                <span className="text-xs text-gray-500 leading-tight" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Add a new task to your workflow
                </span>
              </div>
              <button
                type="button"
                className="py-1 px-2.5 rounded-full text-gray-400 transition-colors"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setFormData({
                    task_type: 'signature_request',
                    task_title: '',
                    client_ids: [],
                    folder_id: '',
                    due_date: '',
                    priority: '',
                    description: '',
                    files: [],
                    spouse_signature_required: false
                  });
                  setSelectedFolderPath('');
                  setCreatingFolder(false);
                  setNewFolderName('');
                  setParentFolderForNewFolder(null);
                }}
              >
                <Cut />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <form onSubmit={createTask} className="space-y-5">
                {/* Task Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Task Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.task_type}
                      onChange={(e) => handleInputChange('task_type', e.target.value)}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      style={{ fontFamily: 'BasisGrotesquePro' }}
                    >
                      <option value="signature_request">Signature Request</option>
                      <option value="review_request">Review Request</option>
                      <option value="document_request">Document Request</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <FaChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Spouse Signature Required Toggle */}
                {formData.task_type === 'signature_request' && (
                  <div className="flex items-center gap-3 py-1 cursor-pointer select-none" onClick={() => handleSpouseSignatureToggle(!formData.spouse_signature_required)}>
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${formData.spouse_signature_required ? 'bg-[#00C0C6]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.spouse_signature_required ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Spouse's signature required
                    </span>
                  </div>
                )}

                {/* Task Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.task_title}
                    onChange={(e) => handleInputChange('task_title', e.target.value)}
                    placeholder="Enter task title"
                    required
                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter task description"
                    rows="4"
                    className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[100px] leading-relaxed"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Client - Disabled */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 flex items-center text-gray-500 italic">
                    {client ? client.name : 'Loading...'}
                  </div>
                  <p className="text-[11px] text-gray-400 pl-1">
                    Client is pre-filled and cannot be changed
                  </p>
                </div>

                {/* Folder Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Folder (Optional)
                    </label>
                    {!creatingFolder ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreatingFolder(true);
                          setParentFolderForNewFolder(formData.folder_id || null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                      >
                        + Create New Folder
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          disabled={creatingFolderLoading}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim() && !creatingFolderLoading) handleCreateFolder();
                            if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
                          }}
                          className="h-8 px-3 border border-gray-200 rounded-lg text-xs w-32 focus:outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          onClick={handleCreateFolder}
                          disabled={creatingFolderLoading || !newFolderName.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {creatingFolderLoading ? '...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatingFolder(false)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={folderDropdownRef}>
                    <div
                      onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                      className={`w-full h-11 px-4 border rounded-xl text-sm flex items-center justify-between cursor-pointer transition-all ${showFolderDropdown ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className={`truncate ${selectedFolderPath ? 'text-gray-800' : 'text-gray-400'}`}>
                        {selectedFolderPath || 'Select a folder (optional)'}
                      </span>
                      <div className="flex items-center gap-2 pr-1">
                        {selectedFolderPath && (
                          <div
                            onClick={(e) => { e.stopPropagation(); setSelectedFolderPath(''); handleInputChange('folder_id', ''); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </div>
                        )}
                        <FaChevronDown size={12} className={`text-gray-400 transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {showFolderDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto z-[1001] p-2 animate-in fade-in zoom-in-95 duration-150 origin-top">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Folders
                        </div>
                        {loadingFolders ? (
                          <div className="p-4 text-center text-xs text-gray-500 italic">Loading folders...</div>
                        ) : folderTree.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500 italic">No folders available</div>
                        ) : (
                          <div className="mt-1">{renderFolderTree(folderTree)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority and Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                      >
                        <option value="">Select Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <FaChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      style={{ fontFamily: 'BasisGrotesquePro' }}
                    />
                  </div>
                </div>

                {/* File Upload */}
                {formData.task_type !== 'document_request' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Files <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleInputChange('files', e.target.files)}
                        className="w-full h-11 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm flex items-center cursor-pointer hover:border-blue-400 transition-colors file:hidden pt-2 pl-4"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs">
                        Select files to upload
                      </div>
                    </div>
                    {formData.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-medium border border-blue-100 flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                          {formData.files.length} file(s) selected
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="py-3 px-6 border-t border-[#E8F0FF] flex justify-end gap-3 bg-gray-50/50 sticky bottom-0 z-20">
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setFormData({
                    task_type: 'signature_request',
                    task_title: '',
                    client_ids: [],
                    folder_id: '',
                    due_date: '',
                    priority: '',
                    description: '',
                    files: [],
                    spouse_signature_required: false
                  });
                  setSelectedFolderPath('');
                  setCreatingFolder(false);
                  setNewFolderName('');
                  setParentFolderForNewFolder(null);
                }}
                className="px-6 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-800 transition-all shadow-sm"
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createTask}
                disabled={loadingTask}
                className={`px-8 py-2 text-sm font-bold text-white rounded-xl transition-all shadow-md active:scale-95 ${loadingTask ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F56D2D]  shadow-[#F56D2D]/20 style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                {loadingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fill Intake Form Modal */}
      <FillIntakeFormModal
        isOpen={showFillIntakeModal}
        onClose={() => setShowFillIntakeModal(false)}
        clientId={clientId}
        clientData={client}
        onSuccess={() => {
          // Refresh client data (signature status might change in real check)
        }}
      />
    </div>
 );
}
