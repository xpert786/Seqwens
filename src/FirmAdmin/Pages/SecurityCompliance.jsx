import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';
import { useFirmSettings } from '../Context/FirmSettingsContext';
import { securityAPI, handleAPIError, firmAdminBlockedAccountsAPI, firmAdminGeoRestrictionsAPI, firmComplianceAPI } from '../../ClientOnboarding/utils/apiUtils';
import { FiSearch, FiUnlock, FiClock, FiUser, FiShield, FiAlertCircle, FiLock, FiCheck, FiX, FiGlobe } from 'react-icons/fi';
import ConfirmationModal from '../../components/ConfirmationModal';
import { toast } from 'react-toastify';
import Pagination from '../../ClientOnboarding/components/Pagination';
const tabs = [
    'Security Overview',
    'Compliance Readiness',
    'Active Sessions',
    'Audits Logs',
    'Blocked Accounts',
    'Geo Restrictions'
];

const metrics = [
    {
        label: 'Security Score',
        value: '94/100',
        subtitle: 'Excellent security posture',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0.4375L22 3.9375V11.9975C22 16.1245 19.467 19.0095 17.104 20.8005C15.6786 21.872 14.1143 22.7449 12.454 23.3955L12.367 23.4285L12.342 23.4375L12.335 23.4395L12.332 23.4405C12.331 23.4405 12.33 23.4405 12 22.4975L11.669 23.4415L11.665 23.4395L11.658 23.4375L11.633 23.4275L11.546 23.3955C11.0744 23.2131 10.6106 23.0109 10.156 22.7895C9.00838 22.232 7.91674 21.566 6.896 20.8005C4.534 19.0095 2 16.1245 2 11.9975V3.9375L12 0.4375ZM12 22.4975L11.669 23.4415L12 23.5575L12.331 23.4415L12 22.4975ZM12 21.4255L12.009 21.4215C13.3927 20.8496 14.6986 20.1054 15.896 19.2065C18.034 17.5875 20 15.2205 20 11.9975V5.3575L12 2.5575L4 5.3575V11.9975C4 15.2205 5.966 17.5855 8.104 19.2075C9.304 20.1081 10.613 20.8533 12 21.4255ZM18.072 8.3405L11.001 15.4115L6.758 11.1695L8.173 9.7545L11 12.5835L16.657 6.9265L18.072 8.3405Z" fill="#3AD6F2" />
            </svg>
        )
    },
    {
        label: 'Active Alerts',
        value: '3',
        subtitle: '1 critical, 2 warnings',
        icon: (
            <svg width="20" height="20" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.433 0.75L20.067 15.704C20.1986 15.932 20.2679 16.1907 20.2679 16.454C20.2679 16.7173 20.1986 16.976 20.067 17.204C19.9353 17.432 19.746 17.6214 19.518 17.753C19.2899 17.8847 19.0313 17.954 18.768 17.954H1.49996C1.23666 17.954 0.977999 17.8847 0.749975 17.753C0.521952 17.6214 0.3326 17.432 0.200952 17.204C0.0693043 16.976 0 16.7173 0 16.454C0 16.1907 0.0693109 15.932 0.200962 15.704L8.83496 0.75C9.41196 -0.25 10.855 -0.25 11.433 0.75ZM10.134 2.5L2.36596 15.954H17.902L10.134 2.5ZM10.134 12.602C10.3992 12.602 10.6535 12.7074 10.8411 12.8949C11.0286 13.0824 11.134 13.3368 11.134 13.602C11.134 13.8672 11.0286 14.1216 10.8411 14.3091C10.6535 14.4966 10.3992 14.602 10.134 14.602C9.86874 14.602 9.61439 14.4966 9.42686 14.3091C9.23932 14.1216 9.13396 13.8672 9.13396 13.602C9.13396 13.3368 9.23932 13.0824 9.42686 12.8949C9.61439 12.7074 9.86874 12.602 10.134 12.602ZM10.134 5.602C10.3992 5.602 10.6535 5.70736 10.8411 5.89489C11.0286 6.08243 11.134 6.33678 11.134 6.602V10.602C11.134 10.8672 11.0286 11.1216 10.8411 11.3091C10.6535 11.4966 10.3992 11.602 10.134 11.602C9.86874 11.602 9.61439 11.4966 9.42686 11.3091C9.23932 11.1216 9.13396 10.8672 9.13396 10.602V6.602C9.13396 6.33678 9.23932 6.08243 9.42686 5.89489C9.61439 5.70736 9.86874 5.602 10.134 5.602Z" fill="#3AD6F2" />
            </svg>
        )
    },
    {
        label: 'Active Sessions',
        value: '12',
        subtitle: 'Across 8 users',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14.1663 16.6667V15.8333C14.1663 14.9493 13.8151 14.1014 13.1909 13.4772C12.5667 12.853 11.7187 12.5017 10.8346 12.5017H4.16634C3.28228 12.5017 2.43443 12.853 1.81026 13.4772C1.18609 14.1014 0.834961 14.9493 0.834961 15.8333V16.6667" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.49932 9.16634C9.34028 9.16634 10.8327 7.67389 10.8327 5.83293C10.8327 3.99197 9.34028 2.49951 7.49932 2.49951C5.65836 2.49951 4.1659 3.99197 4.1659 5.83293C4.1659 7.67389 5.65836 9.16634 7.49932 9.16634Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.1671 16.6685V15.8352C19.1666 15.1127 18.9258 14.4104 18.4846 13.8397C18.0434 13.2691 17.4282 12.8616 16.7329 12.6768" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.3994 2.73911C14.096 2.92261 14.713 3.32993 15.1553 3.90224C15.5977 4.47454 15.8391 5.17825 15.8391 5.90245C15.8391 6.62665 15.5977 7.33036 15.1553 7.90267C14.713 8.47497 14.096 8.88229 13.3994 9.06579" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        label: 'Failed Logins',
        value: '7',
        subtitle: 'Last 24 hours',
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM10 0C4.47 0 0 4.47 0 10C0 15.53 4.47 20 10 20C15.53 20 20 15.53 20 10C20 4.47 15.53 0 10 0ZM12.59 6L10 8.59L7.41 6L6 7.41L8.59 10L6 12.59L7.41 14L10 11.41L12.59 14L14 12.59L11.41 10L14 7.41L12.59 6Z" fill="#3AD6F2" />
            </svg>
        )
    }
];

const mapSessionResponseToViewModel = (session) => {
    // Format last activity timestamp
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Format login timestamp
    const formatLoginDate = (dateString) => {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Calculate duration from last_activity to current time (time since last activity)
    const calculateDuration = (lastActivity) => {
        if (!lastActivity) return 'Unknown';
        try {
            const last = new Date(lastActivity);
            const now = new Date();
            const diffMs = now - last;

            // If negative or zero, return "Just now"
            if (diffMs <= 0) return 'Just now';

            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ago`;
            if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m ago`;
            if (diffMins > 0) return `${diffMins}m ago`;
            return `${diffSecs}s ago`;
        } catch {
            return 'Unknown';
        }
    };

    // Extract device info from user_agent
    const getDeviceInfo = (userAgent) => {
        if (!userAgent) return 'Unknown Device';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Macintosh')) return 'Mac';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        return 'Unknown Device';
    };

    return {
        sessionKey: session.session_key || '',
        user: session.username || 'Unknown User',
        email: session.email || '',
        role: session.role || '',
        userType: session.user_type || '',
        userId: session.user_id || '',
        device: getDeviceInfo(session.user_agent),
        location: session.ip_address || 'Unknown',
        ipAddress: session.ip_address || '',
        userAgent: session.user_agent || '',
        lastActivity: formatDate(session.last_activity),
        loginAt: formatLoginDate(session.login_at),
        duration: calculateDuration(session.last_activity),
        isActiveUser: Boolean(session.is_active_user),
        isFirmMember: Boolean(session.is_firm_member),
        isAnonymous: false,
    };
};

const alerts = [
    {
        id: 'ALT-001',
        type: 'Warning',
        title: 'Multiple failed login attempts',
        description: 'User john.smith@example.com - 5 failed attempts',
        timestamp: '2024-01-15 14:30:00',
        status: 'Active'
    },
    {
        id: 'ALT-002',
        type: 'Info',
        title: 'New device login',
        description: 'User jane.doe@example.com logged in from new device',
        timestamp: '2024-01-15 13:45:00',
        status: 'Resolved'
    },
    {
        id: 'ALT-003',
        type: 'Critical',
        title: 'Suspicious IP access attempt',
        description: 'Access attempt from blacklisted IP: 192.168.11.00',
        timestamp: '2024-01-15 12:15:00',
        status: 'Blocked'
    }
];

const typeBadgeStyles = {
    warning: 'border border-[#FBBF24] text-[#FBBF24]',
    Warning: 'border border-[#FBBF24] text-[#FBBF24]',
    info: 'border border-[#22C55E] text-[#22C55E]',
    Info: 'border border-[#22C55E] text-[#22C55E]',
    critical: 'border border-[#EF4444] text-[#EF4444]',
    Critical: 'border border-[#EF4444] text-[#EF4444]'
};

const statusBadgeStyles = {
    active: 'bg-[#FBBF24] text-white',
    Active: 'bg-[#FBBF24] text-white',
    resolved: 'bg-[#22C55E] text-white',
    Resolved: 'bg-[#22C55E] text-white',
    blocked: 'bg-[#EF4444] text-white',
    Blocked: 'bg-[#EF4444] text-white',
    dismissed: 'bg-[#6B7280] text-white',
    Dismissed: 'bg-[#6B7280] text-white'
};



export default function SecurityCompliance() {
    const { advancedReportingEnabled } = useFirmSettings();
    const [activeTab, setActiveTab] = useState('Security Overview');
    const [auditLoggingEnabled, setAuditLoggingEnabled] = useState(true);
    const [csvExportEnabled, setCsvExportEnabled] = useState(true);
    const [printPdfEnabled, setPrintPdfEnabled] = useState(true);
    const [trackedEvents, setTrackedEvents] = useState({
        documentAccess: true,
        eSignatureEvents: false,
        clientEdits: true,
        returnSubmissions: false
    });
    const [sessionTimeout, setSessionTimeout] = useState('60');
    const [searchQuery, setSearchQuery] = useState('');
    const [complianceSearch, setComplianceSearch] = useState('');
    const [soc2Enabled, setSoc2Enabled] = useState(true);
    const [hipaaEnabled, setHipaaEnabled] = useState(true);
    const [dataRetention, setDataRetention] = useState('7');
    const [encryptionLevel, setEncryptionLevel] = useState('AES-256');

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedCompliance, setSelectedCompliance] = useState(null);
    const [checklistItems, setChecklistItems] = useState({
        eic: true,
        ctc: false,
        hoh: true
    });
    const [notes, setNotes] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [roleBasedAccess, setRoleBasedAccess] = useState('Manager (Limited)');
    const [twoFactorAuth, setTwoFactorAuth] = useState(true);

    // Security Settings state
    const [require2FA, setRequire2FA] = useState(true);
    const [enableSSO, setEnableSSO] = useState(true);
    const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('60');
    const [passwordPolicy, setPasswordPolicy] = useState('Strong (12+ chars, mixed case, numbers)');
    const [ssnViewers, setSsnViewers] = useState({ owner: true, admin: true, manager: true, preparer: true, staff: false, viewer: false });
    const [paymentViewers, setPaymentViewers] = useState({ owner: true, admin: true, manager: true, preparer: true, staff: false, viewer: false });
    const [irsFormViewers, setIrsFormViewers] = useState({ owner: true, admin: true, manager: true, preparer: true, staff: false, viewer: false });
    const [enforce2FARoles, setEnforce2FARoles] = useState({ owner: true, admin: true, manager: true, preparer: false, staff: false, viewer: false });
    const [encryptionAtRest, setEncryptionAtRest] = useState('Policy Control only');
    const [encryptionInTransit, setEncryptionInTransit] = useState('Policy Control only');

    const [enableRedaction, setEnableRedaction] = useState(true);
    const [redactionTypes, setRedactionTypes] = useState({ ssn: true, itin: true, acct: true });
    const [securePortalOnly, setSecurePortalOnly] = useState(false);
    const [includeIRSPub, setIncludeIRSPub] = useState(false);
    const [dataSharingConsent, setDataSharingConsent] = useState(false);
    const [glbaAligned, setGlbaAligned] = useState(true);
    const [soc2Aligned, setSoc2Aligned] = useState(true);
    const [hipaaAligned, setHipaaAligned] = useState(true);
    const [eSignConsent, setESignConsent] = useState(false);
    const [consentLogs, setConsentLogs] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [enableActiveSessionsView, setEnableActiveSessionsView] = useState(false);
    const [allowForceLogout, setAllowForceLogout] = useState(true);
    const [enableStaffReports, setEnableStaffReports] = useState(false);
    const [activeSessions, setActiveSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [sessionsError, setSessionsError] = useState('');
    const [sessionsSummary, setSessionsSummary] = useState(null);

    // Blocked Accounts state
    const [blockedAccounts, setBlockedAccounts] = useState([]);
    const [blockedAccountsLoading, setBlockedAccountsLoading] = useState(false);
    const [blockedAccountsError, setBlockedAccountsError] = useState(null);
    const [blockedAccountsSearch, setBlockedAccountsSearch] = useState('');
    const [blockedAccountsPagination, setBlockedAccountsPagination] = useState({
        page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 1,
    });
    const [blockedAccountsCurrentPage, setBlockedAccountsCurrentPage] = useState(1);
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
    const [accountToUnblock, setAccountToUnblock] = useState(null);
    const [unblocking, setUnblocking] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [accountToBlock, setAccountToBlock] = useState(null);
    const [blocking, setBlocking] = useState(false);
    const [blockDuration, setBlockDuration] = useState(24);
    const [blockReason, setBlockReason] = useState('');

    // Geo Restrictions Management state
    const [geoLocationsList, setGeoLocationsList] = useState([]);
    const [geoRestrictionsList, setGeoRestrictionsList] = useState([]);
    const [geoRestrictionsLoading, setGeoRestrictionsLoading] = useState(false);
    const [geoRestrictionsError, setGeoRestrictionsError] = useState(null);
    const [showGeoRestrictionModal, setShowGeoRestrictionModal] = useState(false);
    const [selectedGeoRegion, setSelectedGeoRegion] = useState(null);
    const [currentRestrictionData, setCurrentRestrictionData] = useState(null);
    const [geoRestrictionForm, setGeoRestrictionForm] = useState({
        region: '',
        session_timeout_minutes: 30,
        description: '',
        country_codes: [],
        is_active: true
    });
    const [savingGeoRestriction, setSavingGeoRestriction] = useState(false);
    const [deletingGeoRestrictionId, setDeletingGeoRestrictionId] = useState(null);
    const [countryCodeInput, setCountryCodeInput] = useState('');

    // Audit Logs state
    const [auditLogsData, setAuditLogsData] = useState([]);
    const [auditLogsLoading, setAuditLogsLoading] = useState(false);
    const [auditLogsError, setAuditLogsError] = useState('');
    const [auditLogsPagination, setAuditLogsPagination] = useState({
        page: 1,
        page_size: 5,
        total_count: 0,
        total_pages: 0
    });

    const [activeSessionsPagination, setActiveSessionsPagination] = useState({
        page: 1,
        page_size: 5,
        total_count: 0,
        total_pages: 0
    });
    const [auditLogFilters, setAuditLogFilters] = useState({
        action: '',
        user_id: '',
        start_date: '',
        end_date: ''
    });
    const [auditLogSettings, setAuditLogSettings] = useState({
        enabled: false,
        track_document_access: false,
        track_client_edits: false,
        track_esignature_events: false,
        track_return_submissions: false
    });
    const [auditLogSettingsLoading, setAuditLogSettingsLoading] = useState(false);
    const [auditLogSettingsSaving, setAuditLogSettingsSaving] = useState(false);

    // Security Alerts state
    const [securityAlerts, setSecurityAlerts] = useState([]);
    const [securityAlertsLoading, setSecurityAlertsLoading] = useState(false);
    const [securityAlertsError, setSecurityAlertsError] = useState('');
    const [securityAlertsStatistics, setSecurityAlertsStatistics] = useState({
        total_active: 0,
        critical_active: 0,
        warning_active: 0
    });
    const [securityAlertsPagination, setSecurityAlertsPagination] = useState({
        page: 1,
        page_size: 5,
        total_count: 0,
        total_pages: 0
    });
    const [securityAlertsFilters, setSecurityAlertsFilters] = useState({
        alert_type: '',
        alert_category: '',
        status: 'active'
    });

    // Compliance Readiness State
    const [complianceData, setComplianceData] = useState({
        issueBreakdown: [],
        roiComparison: [],
        complianceDetails: []
    });
    const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);

    useEffect(() => {
        if (activeTab === 'Compliance Readiness') {
            fetchComplianceData();
        }
    }, [activeTab]);

    const fetchComplianceData = async () => {
        try {
            setIsLoadingCompliance(true);
            const response = await firmComplianceAPI.getComplianceReadiness();
            if (response && response.success) {
                setComplianceData({
                    issueBreakdown: response.data.issue_breakdown || [],
                    roiComparison: response.data.roi_comparison || [],
                    complianceDetails: response.data.compliance_details || []
                });
            }
        } catch (error) {
            console.error('Error fetching compliance data:', error);
            handleAPIError(error);
        } finally {
            setIsLoadingCompliance(false);
        }
    };

    // Handle body scroll lock when modal is open
    useEffect(() => {
        if (isReviewModalOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
            // Prevent scrolling on iOS and preserve scroll position
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Restore scroll position when modal closes
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isReviewModalOpen]);

    const fetchActiveSessions = async () => {
        try {
            setIsLoadingSessions(true);
            setSessionsError('');

            const response = await securityAPI.getAdminSessions();

            if (response && response.success && Array.isArray(response.data)) {
                const mapped = response.data.map(mapSessionResponseToViewModel);
                setActiveSessions(mapped);

                // Set summary data if available
                if (response.summary) {
                    setSessionsSummary({
                        totalActiveSessions: response.summary.total_active_sessions || 0,
                        taxPreparerSessions: response.summary.tax_preparer_sessions || 0,
                        taxpayerSessions: response.summary.taxpayer_sessions || 0
                    });
                }
            } else {
                setSessionsError(response?.message || 'Failed to load active sessions');
                setActiveSessions([]);
                setSessionsSummary(null);
            }
        } catch (error) {
            console.error('Error fetching active sessions:', error);
            setSessionsError(error.message || 'Failed to load active sessions');
            setActiveSessions([]);
            setSessionsSummary(null);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Active Sessions') {
            fetchActiveSessions();
        } else if (activeTab === 'Audits Logs') {
            fetchAuditLogSettings();
            // Reset to page 1 when switching to audit logs tab
            setAuditLogsPagination(prev => ({ ...prev, page: 1 }));
        } else if (activeTab === 'Security Overview') {
            fetchSecurityAlerts();
            // Also fetch active sessions for the metrics
            fetchActiveSessions();
        }
    }, [activeTab]);

    // Reset page when filters change
    useEffect(() => {
        if (activeTab === 'Audits Logs') {
            setAuditLogsPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [auditLogFilters, activeTab]);

    // Fetch audit logs when filters or page changes
    useEffect(() => {
        if (activeTab === 'Audits Logs') {
            fetchAuditLogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditLogFilters, auditLogsPagination.page, activeTab]);

    // Fetch security alerts when filters or page changes
    useEffect(() => {
        if (activeTab === 'Security Overview') {
            fetchSecurityAlerts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [securityAlertsFilters, securityAlertsPagination.page, activeTab]);

    // Update active sessions pagination when data changes
    useEffect(() => {
        setActiveSessionsPagination(prev => ({
            ...prev,
            total_count: activeSessions.length,
            total_pages: Math.ceil(activeSessions.length / prev.page_size)
        }));
    }, [activeSessions]);

    // Fetch blocked accounts
    const fetchBlockedAccounts = async () => {
        try {
            setBlockedAccountsLoading(true);
            setBlockedAccountsError(null);

            const response = await firmAdminBlockedAccountsAPI.getBlockedAccounts({
                search: blockedAccountsSearch.trim(),
                page: blockedAccountsCurrentPage,
                page_size: blockedAccountsPagination.page_size,
            });

            if (response.success && response.data) {
                setBlockedAccounts(response.data.blocked_accounts || []);
                setBlockedAccountsPagination(response.data.pagination || {
                    page: blockedAccountsCurrentPage,
                    page_size: 20,
                    total_count: 0,
                    total_pages: 1,
                });
            } else {
                throw new Error(response.message || 'Failed to fetch blocked accounts');
            }
        } catch (err) {
            console.error('Error fetching blocked accounts:', err);
            setBlockedAccountsError(handleAPIError(err));
            setBlockedAccounts([]);
        } finally {
            setBlockedAccountsLoading(false);
        }
    };

    // Fetch blocked accounts when tab is active or filters change
    useEffect(() => {
        if (activeTab === 'Blocked Accounts') {
            fetchBlockedAccounts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockedAccountsCurrentPage, blockedAccountsSearch, activeTab]);

    const handleTerminateSession = async (sessionKey) => {
        if (!sessionKey) return;

        try {
            setSessionsError('');
            await securityAPI.terminateAdminSession(sessionKey);
            await fetchActiveSessions();
        } catch (error) {
            console.error('Error terminating session:', error);
            setSessionsError(error.message || 'Failed to terminate session');
        }
    };

    // Fetch audit log settings
    const fetchAuditLogSettings = async () => {
        try {
            setAuditLogSettingsLoading(true);
            const response = await securityAPI.getAuditLogSettings();

            if (response && response.success && response.data) {
                setAuditLogSettings({
                    enabled: response.data.enabled || false,
                    track_document_access: response.data.track_document_access || false,
                    track_client_edits: response.data.track_client_edits || false,
                    track_esignature_events: response.data.track_esignature_events || false,
                    track_return_submissions: response.data.track_return_submissions || false
                });
                // Sync with local state
                setAuditLoggingEnabled(response.data.enabled || false);
                setTrackedEvents({
                    documentAccess: response.data.track_document_access || false,
                    eSignatureEvents: response.data.track_esignature_events || false,
                    clientEdits: response.data.track_client_edits || false,
                    returnSubmissions: response.data.track_return_submissions || false
                });
            }
        } catch (error) {
            console.error('Error fetching audit log settings:', error);
            handleAPIError(error);
            toast.error('Failed to load audit log settings');
        } finally {
            setAuditLogSettingsLoading(false);
        }
    };

    // Update audit log settings
    const updateAuditLogSettings = async (settings) => {
        try {
            setAuditLogSettingsSaving(true);
            const response = await securityAPI.updateAuditLogSettings(settings);

            if (response && response.success) {
                setAuditLogSettings(settings);
                toast.success('Audit log settings updated successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating audit log settings:', error);
            handleAPIError(error);
            toast.error('Failed to update audit log settings');
            return false;
        } finally {
            setAuditLogSettingsSaving(false);
        }
    };

    // Fetch audit logs
    const fetchAuditLogs = async () => {
        try {
            setAuditLogsLoading(true);
            setAuditLogsError('');

            const params = {
                ...auditLogFilters,
                page: auditLogsPagination.page,
                page_size: auditLogsPagination.page_size
            };

            // Remove empty filter values
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const response = await securityAPI.getAuditLogs(params);

            if (response && response.success) {
                setAuditLogsData(response.data || []);
                if (response.pagination) {
                    setAuditLogsPagination(prev => ({
                        ...prev,
                        total_count: response.pagination.total_count || 0,
                        total_pages: response.pagination.total_pages || 0
                    }));
                }
            } else {
                setAuditLogsError(response?.message || 'Failed to load audit logs');
                setAuditLogsData([]);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setAuditLogsError(error.message || 'Failed to load audit logs');
            setAuditLogsData([]);
            handleAPIError(error);
        } finally {
            setAuditLogsLoading(false);
        }
    };

    // Handle audit logging toggle
    const handleAuditLoggingToggle = async (enabled) => {
        const newSettings = {
            ...auditLogSettings,
            enabled
        };
        const success = await updateAuditLogSettings(newSettings);
        if (success) {
            setAuditLoggingEnabled(enabled);
        }
    };

    // Handle tracked event change
    const handleTrackedEventChange = async (eventKey) => {
        const apiKeyMap = {
            documentAccess: 'track_document_access',
            eSignatureEvents: 'track_esignature_events',
            clientEdits: 'track_client_edits',
            returnSubmissions: 'track_return_submissions'
        };

        const newTrackedEvents = {
            ...trackedEvents,
            [eventKey]: !trackedEvents[eventKey]
        };

        const newSettings = {
            ...auditLogSettings,
            [apiKeyMap[eventKey]]: newTrackedEvents[eventKey]
        };

        const success = await updateAuditLogSettings(newSettings);
        if (success) {
            setTrackedEvents(newTrackedEvents);
        }
    };

    // Fetch security alerts
    const fetchSecurityAlerts = async () => {
        try {
            setSecurityAlertsLoading(true);
            setSecurityAlertsError('');

            const params = {
                ...securityAlertsFilters,
                page: securityAlertsPagination.page,
                page_size: securityAlertsPagination.page_size
            };

            // Remove empty filter values
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const response = await securityAPI.getSecurityAlerts(params);

            if (response && response.success) {
                setSecurityAlerts(response.data || []);
                if (response.statistics) {
                    setSecurityAlertsStatistics({
                        total_active: response.statistics.total_active || 0,
                        critical_active: response.statistics.critical_active || 0,
                        warning_active: response.statistics.warning_active || 0
                    });
                }
                if (response.pagination) {
                    setSecurityAlertsPagination(prev => ({
                        ...prev,
                        total_count: response.pagination.total_count || 0,
                        total_pages: response.pagination.total_pages || 0
                    }));
                }
            } else {
                setSecurityAlertsError(response?.message || 'Failed to load security alerts');
                setSecurityAlerts([]);
            }
        } catch (error) {
            console.error('Error fetching security alerts:', error);
            setSecurityAlertsError(error.message || 'Failed to load security alerts');
            setSecurityAlerts([]);
            handleAPIError(error);
        } finally {
            setSecurityAlertsLoading(false);
        }
    };

    // Update security alert status (resolve, dismiss, block)
    const handleUpdateSecurityAlert = async (alertId, status, reason = '') => {
        try {
            await securityAPI.updateSecurityAlert(alertId, { status, resolved_reason: reason });
            toast.success(`Alert ${status === 'resolved' ? 'resolved' : status === 'dismissed' ? 'dismissed' : 'blocked'} successfully`);
            await fetchSecurityAlerts();
        } catch (error) {
            console.error('Error updating security alert:', error);
            handleAPIError(error);
            toast.error('Failed to update security alert');
        }
    };

    const renderSecurityOverview = () => {
        // Calculate metrics from real data
        const calculatedMetrics = [
            {
                label: 'Security Score',
                value: '94/100',
                subtitle: 'Excellent security posture',
                icon: metrics[0].icon
            },
            {
                label: 'Active Alerts',
                value: securityAlertsStatistics.total_active?.toString() || '0',
                subtitle: `${securityAlertsStatistics.critical_active || 0} critical, ${securityAlertsStatistics.warning_active || 0} warnings`,
                icon: metrics[1].icon
            },
            {
                label: 'Active Sessions',
                value: sessionsSummary?.totalActiveSessions?.toString() || '0',
                subtitle: sessionsSummary ? `${sessionsSummary.taxPreparerSessions || 0} preparers, ${sessionsSummary.taxpayerSessions || 0} taxpayers` : 'No active sessions',
                icon: metrics[2].icon
            },
            {
                label: 'Failed Logins',
                value: '7',
                subtitle: 'Last 24 hours',
                icon: metrics[3].icon
            }
        ];

        return (
            <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    {calculatedMetrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="
    bg-white
    border border-[#dee2e6]
    rounded-2xl
    p-4
    shadow-sm
    hover:shadow-md
    transition-all
    duration-200
  "
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium tracking-wide text-[#6B7280]">{metric.label}</span>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F9FF] text-[#3AD6F2]">
                                    {metric.icon}
                                </span>
                            </div>
                            <p className="mt-4 text-xl font-semibold text-[#1F2937]">{metric.value}</p>
                            <p className="mt-2 text-sm text-[#6B7280]">{metric.subtitle}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl bg-white p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h5 className="text-base font-semibold text-[#1F2937]">Security Alerts</h5>
                            <p className="text-sm text-[#6B7280]">Recent security events requiring attention</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {securityAlertsError && (
                                <span className="text-xs text-red-500">{securityAlertsError}</span>
                            )}
                            <button
                                onClick={fetchSecurityAlerts}
                                disabled={securityAlertsLoading}
                                className="inline-flex items-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#4B5563] bg-white hover:bg-white transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderRadius: '8px' }}
                            >
                                <span style={{ pointerEvents: 'none' }}>
                                    {securityAlertsLoading ? 'Refreshing...' : 'Refresh'}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('Audits Logs')}
                                className="inline-flex items-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#4B5563] bg-white hover:bg-white transition-none"
                                style={{ borderRadius: '8px' }}
                            >
                                <span style={{ pointerEvents: 'none' }}>
                                    View Audit Logs
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#4B5563]">
                            <thead className="bg-[#F8FAFF] text-[10px] font-semibold tracking-wide text-[#6B7280]">
                                <tr>
                                    <th className="px-2 py-3">Alert ID</th>
                                    <th className="px-2 py-3">Type</th>
                                    <th className="px-2 py-3">Category</th>
                                    <th className="px-2 py-3">Title</th>
                                    <th className="px-2 py-3">Description</th>
                                    <th className="px-2 py-3">Timestamp</th>
                                    <th className="px-2 py-3">Status</th>
                                    <th className="px-2 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] bg-white">
                                {securityAlertsLoading && securityAlerts.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={8}>
                                            Loading security alerts...
                                        </td>
                                    </tr>
                                )}
                                {!securityAlertsLoading && securityAlerts.length === 0 && !securityAlertsError && (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={8}>
                                            No security alerts found.
                                        </td>
                                    </tr>
                                )}
                                {securityAlerts.map((alert) => (
                                    <tr key={alert.id || alert.alert_id} className="hover:bg-[#F8FAFF]">
                                        <td className="px-2 py-3 text-[11px] font-semibold text-gray-600 whitespace-nowrap">{alert.alert_id || `ALT-${alert.id}`}</td>
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadgeStyles[alert.alert_type] || 'border border-gray-300 text-gray-400'}`}>
                                                {alert.alert_type_display || alert.alert_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{alert.alert_category_display || alert.alert_category || 'N/A'}</td>
                                        <td className="px-2 py-3 text-[11px] font-semibold text-gray-600 whitespace-nowrap">{alert.title || 'N/A'}</td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600">{alert.description || 'N/A'}</td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{alert.timestamp_formatted || alert.timestamp || 'N/A'}</td>
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeStyles[alert.status] || 'bg-gray-300 text-white'}`}>
                                                {alert.status_display || alert.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                {alert.status === 'active' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateSecurityAlert(alert.alert_id || alert.id, 'resolved', 'Resolved by admin')}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#22C55E] text-[#22C55E] transition-colors hover:bg-[#22C55E] hover:text-white"
                                                            title="Resolve"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateSecurityAlert(alert.alert_id || alert.id, 'dismissed', 'Dismissed by admin')}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#6B7280] text-[#6B7280] transition-colors hover:bg-[#6B7280] hover:text-white"
                                                            title="Dismiss"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Security Alerts Pagination */}
                    {(securityAlertsPagination.total_count > 5 || securityAlertsPagination.total_pages > 1) && (
                        <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                            <Pagination
                                currentPage={securityAlertsPagination.page}
                                totalPages={securityAlertsPagination.total_pages}
                                onPageChange={(page) => setSecurityAlertsPagination(prev => ({ ...prev, page }))}
                                totalItems={securityAlertsPagination.total_count}
                                itemsPerPage={securityAlertsPagination.page_size}
                                startIndex={(securityAlertsPagination.page - 1) * securityAlertsPagination.page_size}
                                endIndex={Math.min(securityAlertsPagination.page * securityAlertsPagination.page_size, securityAlertsPagination.total_count)}
                            />
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderActiveSessions = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            {sessionsSummary && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4 border border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#6B7280]">Total Active Sessions</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1F2937]">{sessionsSummary.totalActiveSessions}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F9FF]">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M14.1663 16.6667V15.8333C14.1663 14.9493 13.8151 14.1014 13.1909 13.4772C12.5667 12.853 11.7187 12.5017 10.8346 12.5017H4.16634C3.28228 12.5017 2.43443 12.853 1.81026 13.4772C1.18609 14.1014 0.834961 14.9493 0.834961 15.8333V16.6667" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7.49932 9.16634C9.34028 9.16634 10.8327 7.67389 10.8327 5.83293C10.8327 3.99197 9.34028 2.49951 7.49932 2.49951C5.65836 2.49951 4.1659 3.99197 4.1659 5.83293C4.1659 7.67389 5.65836 9.16634 7.49932 9.16634Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 border border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#6B7280]">Tax Preparer Sessions</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1F2937]">{sessionsSummary.taxPreparerSessions}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F9FF]">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2.5 17.5C2.5 14.4624 5.46243 12 10 12C14.5376 12 17.5 14.4624 17.5 17.5" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 border border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#6B7280]">Taxpayer Sessions</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1F2937]">{sessionsSummary.taxpayerSessions}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F9FF]">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2.5 17.5C2.5 14.4624 5.46243 12 10 12C14.5376 12 17.5 14.4624 17.5 17.5" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sessions Table */}
            <div className="rounded-xl bg-white p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-base font-semibold text-gray-600 mb-0">Active User Sessions</p>
                        <p className="text-sm text-[#6B7280] mb-0">Monitor and manage active user sessions</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        {sessionsError && (
                            <span className="text-xs text-red-500">{sessionsError}</span>
                        )}
                        <button
                            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F3F7FF]"
                            style={{ borderRadius: '8px' }}
                            type="button"
                            onClick={fetchActiveSessions}
                            disabled={isLoadingSessions}
                        >
                            {isLoadingSessions ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#4B5563]">
                        <thead className="bg-[#F8FAFF] text-[10px] font-semibold tracking-wide text-[#6B7280]">
                            <tr>
                                <th className="px-2 py-3">User</th>
                                <th className="px-2 py-3">Role / Type</th>
                                <th className="px-2 py-3">Device</th>
                                <th className="px-2 py-3">IP Address</th>
                                <th className="px-2 py-3">Login Time</th>
                                <th className="px-2 py-3">Last Activity</th>
                                <th className="px-2 py-3">Time Since Last Activity</th>
                                <th className="px-2 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] bg-white">
                            {isLoadingSessions && activeSessions.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={8}>
                                        Loading active sessions...
                                    </td>
                                </tr>
                            )}
                            {!isLoadingSessions && activeSessions.length === 0 && !sessionsError && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={8}>
                                        No active sessions found.
                                    </td>
                                </tr>
                            )}
                            {activeSessions
                                .slice((activeSessionsPagination.page - 1) * activeSessionsPagination.page_size, activeSessionsPagination.page * activeSessionsPagination.page_size)
                                .map((session) => (
                                    <tr key={session.sessionKey || session.user || session.email || Math.random()} className="hover:bg-[#F8FAFF]">
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-semibold text-gray-600">{session.user}</span>
                                                {session.email && (
                                                    <span className="text-[10px] text-[#6B7280]">{session.email}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-center">
                                                {session.role && (
                                                    <span className="text-[10px] font-medium text-[#4B5563] text-center">{session.role}</span>
                                                )}
                                                {session.userType && (
                                                    <span className="inline-flex items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-1 py-0.5 text-[10px] font-medium text-[#6B7280] w-[75px]">
                                                        {session.userType.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{session.device}</td>
                                        <td className="px-2 py-3 whitespace-nowrap">
                                            <span className="text-[11px] text-gray-600 font-mono">{session.ipAddress}</span>
                                        </td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{session.loginAt}</td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{session.lastActivity}</td>
                                        <td className="px-2 py-3 text-[11px] text-gray-600 whitespace-nowrap">{session.duration}</td>
                                        <td className="px-2 py-3 text-right whitespace-nowrap">
                                            <button
                                                className="text-[11px] font-semibold text-red-500 transition-colors hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ borderRadius: '8px' }}
                                                type="button"
                                                onClick={() => handleTerminateSession(session.sessionKey)}
                                                disabled={!session.sessionKey || isLoadingSessions}
                                            >
                                                Terminate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                {/* Active Sessions Pagination */}
                {activeSessionsPagination.total_pages > 1 && (
                    <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                        <Pagination
                            currentPage={activeSessionsPagination.page}
                            totalPages={activeSessionsPagination.total_pages}
                            onPageChange={(page) => setActiveSessionsPagination(prev => ({ ...prev, page }))}
                            totalItems={activeSessionsPagination.total_count}
                            itemsPerPage={activeSessionsPagination.page_size}
                            startIndex={(activeSessionsPagination.page - 1) * activeSessionsPagination.page_size}
                            endIndex={Math.min(activeSessionsPagination.page * activeSessionsPagination.page_size, activeSessionsPagination.total_count)}
                        />
                    </div>
                )}
            </div>
        </div>
    );


    const renderAuditLogs = () => (
        <div className="flex flex-col gap-6">
            {/* Audit Logs Configuration Section */}
            <div className="rounded-xl bg-white p-6">
                <div className="mb-6">
                    <h5 className="text-base font-semibold text-[#1F2937] mb-1">Audit Logs</h5>
                    <p className="text-sm text-[#6B7280] mb-0">Enable tamper-evident logging and export filtered logs for audits.</p>
                </div>

                {/* Enable Audit Logging */}
                <div className="mb-8 pb-8 border-b border-[#E5E7EB]" style={{ visibility: 'visible', opacity: 1, display: 'block' }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h6 className="text-sm font-semibold text-[#1F2937]">Enable Audit Logging</h6>
                                <div className="flex items-center" style={{ visibility: 'visible', opacity: 1, display: 'flex' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleAuditLoggingToggle(!auditLoggingEnabled)}
                                        disabled={auditLogSettingsSaving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${auditLoggingEnabled ? 'bg-[#F56D2D]' : 'bg-[#9CA3AF]'
                                            } ${auditLogSettingsSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={{ borderRadius: '999px', visibility: 'visible', display: 'inline-flex', opacity: 1 }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${auditLoggingEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px', visibility: 'visible' }}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Grid to divide 6/6 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {/* Tracked Events */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-xs font-medium text-[#6B7280]">Tracked Events</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { key: 'documentAccess', label: 'Document Access' },
                                            { key: 'eSignatureEvents', label: 'eSignature Events' },
                                            { key: 'clientEdits', label: 'Client Edits' },
                                            { key: 'returnSubmissions', label: 'Return Submissions' },
                                        ].map((event) => (
                                            <label
                                                key={event.key}
                                                className="flex items-center space-x-3 cursor-pointer select-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={trackedEvents[event.key]}
                                                    onChange={() => handleTrackedEventChange(event.key)}
                                                    disabled={auditLogSettingsSaving || !auditLoggingEnabled}
                                                    className="h-4 w-4 rounded-full accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <span className={`text-sm text-[#4B5563] ml-2 ${!auditLoggingEnabled ? 'opacity-50' : ''}`}>{event.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Session Timeout */}

                            </div>

                        </div>
                    </div>
                </div>

            </div>
            {/* Active User Sessions Section */}
            <div className="rounded-xl bg-white p-6">
                <div className="gap-4 mb-6">
                    <div>
                        <h5 className="text-base font-semibold text-[#1F2937] mb-1">Audit Logs History</h5>
                        <p className="text-sm text-[#6B7280] mb-0">Detailed history of security and compliance events</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                        <select
                            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#4B5563] outline-none transition-colors hover:bg-[#F3F7FF]"
                            style={{ borderRadius: '8px' }}
                            value={auditLogFilters.action}
                            onChange={(e) => setAuditLogFilters(prev => ({ ...prev, action: e.target.value }))}
                        >
                            <option value="">All Actions</option>
                            <option value="invite_sent">Invite Sent</option>
                            <option value="data_sharing_selection">Data Sharing Selection</option>
                            <option value="invite_created">Invite Created</option>
                            <option value="access_grant">Access Grant</option>
                            {/* Dynamically add other actions found in data but not in static list */}
                            {[...new Set(auditLogsData.map(log => log.action_display || log.action))]
                                .filter(Boolean)
                                .filter(action => !['invite_sent', 'data_sharing_selection', 'invite_created', 'access_grant'].includes(action))
                                .sort()
                                .map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))
                            }
                        </select>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F3F7FF] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderRadius: '8px' }}
                            type="button"
                            onClick={fetchAuditLogs}
                            disabled={auditLogsLoading}
                        >
                            {auditLogsLoading ? 'Refreshing...' : 'Refresh'}
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.14664 7.58334L1.83864 7.89367C1.92057 7.97489 2.03127 8.02046 2.14664 8.02046C2.26201 8.02046 2.37271 7.97489 2.45464 7.89367L2.14664 7.58334ZM3.43464 6.92184C3.5171 6.84 3.56367 6.72875 3.56411 6.61257C3.56455 6.49639 3.51881 6.3848 3.43697 6.30234C3.39645 6.26151 3.34828 6.22906 3.29522 6.20685C3.24215 6.18463 3.18523 6.17309 3.12771 6.17287C3.01153 6.17243 2.89993 6.21816 2.81747 6.30001L3.43464 6.92184ZM1.47464 6.30001C1.3918 6.22059 1.28108 6.1769 1.16633 6.17836C1.05159 6.17981 0.942005 6.22629 0.861206 6.30778C0.780407 6.38927 0.734859 6.49924 0.734379 6.61399C0.733899 6.72875 0.778525 6.83909 0.85864 6.92126L1.47464 6.30001ZM10.8593 4.31201C10.8886 4.3625 10.9278 4.40662 10.9744 4.44175C11.0211 4.47689 11.0743 4.50233 11.1309 4.51657C11.1875 4.53082 11.2464 4.53359 11.3042 4.52471C11.3619 4.51583 11.4172 4.49548 11.467 4.46488C11.5167 4.43427 11.5598 4.39401 11.5937 4.34648C11.6276 4.29895 11.6517 4.24511 11.6645 4.18813C11.6773 4.13116 11.6786 4.07219 11.6682 4.01472C11.6578 3.95725 11.6361 3.90244 11.6042 3.85351L10.8593 4.31201ZM7.04606 1.31251C4.10197 1.31251 1.70856 3.68142 1.70856 6.61092H2.58356C2.58356 4.17142 4.57856 2.18751 7.04606 2.18751V1.31251ZM1.70856 6.61092V7.58334H2.58356V6.61092H1.70856ZM2.45522 7.89426L3.43464 6.92184L2.81747 6.30001L1.83747 7.27242L2.45522 7.89426ZM2.45522 7.27301L1.47464 6.30001L0.858056 6.92126L1.83806 7.89309L2.45522 7.27301ZM11.6042 3.85467C11.1253 3.07664 10.4548 2.43441 9.65689 1.98935C8.85898 1.54429 7.9597 1.31125 7.04606 1.31251V2.18751C7.81035 2.18603 8.56282 2.38062 9.23044 2.75268C9.89806 3.12474 10.4591 3.66182 10.8599 4.31259L11.6042 3.85467ZM11.8498 6.41667L12.1572 6.10576C12.0753 6.02489 11.9649 5.97954 11.8498 5.97954C11.7347 5.97954 11.6243 6.02489 11.5424 6.10576L11.8498 6.41667ZM10.5583 7.07759C10.5174 7.118 10.4849 7.16606 10.4626 7.21903C10.4403 7.27201 10.4287 7.32885 10.4284 7.38632C10.4277 7.50239 10.4732 7.61397 10.5548 7.69651C10.6364 7.77904 10.7475 7.82578 10.8635 7.82644C10.9796 7.82709 11.0912 7.78161 11.1737 7.70001L10.5583 7.07759ZM12.5259 7.70001C12.5665 7.74147 12.615 7.77443 12.6685 7.79697C12.722 7.81951 12.7794 7.83118 12.8375 7.8313C12.8955 7.83141 12.953 7.81997 13.0066 7.79765C13.0602 7.77532 13.1088 7.74255 13.1496 7.70125C13.1904 7.65995 13.2226 7.61095 13.2443 7.55709C13.2659 7.50323 13.2766 7.4456 13.2758 7.38756C13.275 7.32951 13.2626 7.27221 13.2394 7.21899C13.2162 7.16578 13.1827 7.11771 13.1407 7.07759L12.5259 7.70001ZM3.10214 9.68684C3.04118 9.58806 2.94348 9.51754 2.83053 9.49079C2.71758 9.46404 2.59863 9.48326 2.49985 9.54421C2.40107 9.60517 2.33054 9.70287 2.3038 9.81582C2.27705 9.92877 2.29627 10.0477 2.35722 10.1465L3.10214 9.68684ZM6.93172 12.6875C9.88456 12.6875 12.2867 10.3203 12.2867 7.38909H11.4117C11.4117 9.82742 9.41089 11.8125 6.93172 11.8125V12.6875ZM12.2867 7.38909V6.41667H11.4117V7.38909H12.2867ZM11.5424 6.10576L10.5583 7.07759L11.1737 7.70001L12.1572 6.72759L11.5424 6.10576ZM11.5424 6.72759L12.5259 7.70001L13.1407 7.07759L12.1572 6.10576L11.5424 6.72759ZM2.35664 10.1459C2.83884 10.9248 3.51237 11.5672 4.31311 12.0121C5.11384 12.457 6.01512 12.6895 6.93114 12.6875V11.8125C6.16446 11.8145 5.41003 11.6202 4.73969 11.2481C4.06935 10.876 3.50599 10.3385 3.10214 9.68684L2.35664 10.1459Z" fill="#3B4A66" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#4B5563]">
                        <thead className="text-sm font-medium tracking-wide text-[#6B7280]">
                            <tr>
                                <th className="px-4 py-3">Log ID</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Resource</th>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] bg-white">
                            {auditLogsLoading && auditLogsData.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={6}>
                                        Loading audit logs...
                                    </td>
                                </tr>
                            )}
                            {!auditLogsLoading && auditLogsData.length === 0 && !auditLogsError && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-[#6B7280]" colSpan={6}>
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                            {auditLogsError && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-sm text-red-600" colSpan={6}>
                                        {auditLogsError}
                                    </td>
                                </tr>
                            )}
                            {auditLogsData.map((log) => (
                                <tr key={log.id || log.log_id} className="hover:bg-[#F8FAFF]">
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.log_id || `LOG-${log.id}`}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.action_display || log.action || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.user_email || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.resource || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.timestamp_formatted || log.timestamp || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-600">{log.ip_address || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {(auditLogsPagination.total_count > 5 || auditLogsPagination.total_pages > 1) && (
                    <div className="mt-6 border-t border-[#E5E7EB] pt-4">
                        <Pagination
                            currentPage={auditLogsPagination.page}
                            totalPages={auditLogsPagination.total_pages}
                            onPageChange={(page) => setAuditLogsPagination(prev => ({ ...prev, page }))}
                            totalItems={auditLogsPagination.total_count}
                            itemsPerPage={auditLogsPagination.page_size}
                            startIndex={(auditLogsPagination.page - 1) * auditLogsPagination.page_size}
                            endIndex={Math.min(auditLogsPagination.page * auditLogsPagination.page_size, auditLogsPagination.total_count)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
    const renderCompliance = () => (
        <div className="flex flex-col gap-6">
            {/* Header Section - Export only */}
            <div className="flex justify-end mb-4">
                {!advancedReportingEnabled && (
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F3F7FF]"
                        style={{ borderRadius: '8px' }}
                        type="button"
                    >
                        Export CSV
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6L8 10L12 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Charts Section - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Issue Breakdown Card */}
                <div className="rounded-xl bg-white p-6">
                    <h5 className="text-base font-semibold text-[#1F2937] mb-4">Issue Breakdown</h5>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        {/* Pie Chart Representation */}
                        <div className="relative w-full sm:w-64 h-64 flex-shrink-0">
                            {isLoadingCompliance ? (
                                <div className="flex h-full items-center justify-center">Loading...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={complianceData.issueBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ value }) => value}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {complianceData.issueBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            {isLoadingCompliance ? (
                                <span>Loading details...</span>
                            ) : (
                                complianceData.issueBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm text-[#4B5563]">{item.name}: {item.value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ROI Comparison Card */}
                <div className="rounded-xl bg-white p-6">
                    <h5 className="text-base font-semibold text-[#1F2937] mb-4">ROI Comparison</h5>
                    <div className="w-full" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={complianceData.roiComparison}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                barCategoryGap="60%" // Increases space between bars → thinner bars
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                />
                                <YAxis
                                    domain={[0, 8]}
                                    ticks={[0, 2, 4, 6, 8]}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            if (data.name === 'EIC') {
                                                return (
                                                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-2 shadow-lg">
                                                        <p className="text-sm font-semibold text-[#1F2937]">{data.name}</p>
                                                        <p className="text-xs text-[#4B5563]">Complete: {data.complete}</p>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    }}
                                />

                                {/* Slim Foreground Bar */}
                                <Bar
                                    dataKey="complete"
                                    fill="#22C55E"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20} // 👈 Controls bar thickness directly (try 10, 15, or 20)
                                />
                            </BarChart>
                        </ResponsiveContainer>

                    </div>
                </div>
            </div>




        </div>
    );


    const handleCheckboxChange = (setter, key) => {
        setter(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRedactionChange = (key) => {
        setRedactionTypes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderSecuritySettings = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
                {/* Authentication Settings Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">Authentication Settings</p>
                    <p className="text-sm text-[#6B7280] mb-4">Configure authentication and access controls</p>

                    <div className="space-y-4">
                        {/* Two-Factor Authentication */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold text-gray-600 mb-0">Two-Factor Authentication</p>
                                <span className="text-sm font-medium text-gray-500">Require 2FA For All Users</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setRequire2FA(!require2FA)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${require2FA ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${require2FA ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    style={{ borderRadius: '999px' }}
                                />
                            </button>
                        </div>


                        {/* Single Sign-On */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Left side text */}
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-600 mb-0">Single Sign-On (SSO)</span>
                                <span className="text-sm font-medium text-gray-500">Enable SAML/OAuth Integration</span>
                            </div>

                            {/* Right side toggle */}
                            <button
                                type="button"
                                onClick={() => setEnableSSO(!enableSSO)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${enableSSO ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableSSO ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    style={{ borderRadius: '999px' }}
                                />
                            </button>
                        </div>


                        {/* Session Timeout */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-600">Session Timeout (minutes)</label>
                            <input
                                type="number"
                                value={sessionTimeoutMinutes}
                                onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>

                        {/* Password Policy */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-600">Password Policy</label>
                            <div className="relative">
                                <select
                                    value={passwordPolicy}
                                    onChange={(e) => setPasswordPolicy(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <option>Strong (12+ chars, mixed case, numbers)</option>
                                    <option>Medium (8+ chars, mixed case)</option>
                                    <option>Basic (8+ chars)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6L8 10L12 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Security Controls Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">User Security Controls</p>
                    <p className="text-sm text-[#6B7280] mb-4">Control access to SSNs, payment details, and IRS forms. Configure 2FA, IP geo, and session policies.</p>

                    <div className="space-y-4">
                        {/* Who can view SSNs */}
                        <div>
                            <label className="text-xl font-medium text-gray-500 mb-2 block">Who can view SSNs?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['owner', 'admin', 'manager', 'preparer', 'staff', 'viewer'].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={ssnViewers[role]}
                                            onChange={() => handleCheckboxChange(setSsnViewers, role)}
                                            className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                        />
                                        <span className="text-sm text-[#4B5563] capitalize ml-2">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Who can view payment info */}
                        <div>
                            <label className="text-xl font-medium text-gray-500 mb-2 block">Who can view payment info?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['owner', 'admin', 'manager', 'preparer', 'staff', 'viewer'].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={paymentViewers[role]}
                                            onChange={() => handleCheckboxChange(setPaymentViewers, role)}
                                            className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                        />
                                        <span className="text-sm text-[#4B5563] capitalize">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Who can view IRS forms */}
                        <div>
                            <label className="text-xl font-medium text-gray-500 mb-2 block">Who can view IRS forms?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['owner', 'admin', 'manager', 'preparer', 'staff', 'viewer'].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={irsFormViewers[role]}
                                            onChange={() => handleCheckboxChange(setIrsFormViewers, role)}
                                            className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                        />
                                        <span className="text-sm text-[#4B5563] capitalize ml-2">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Enforce 2FA for roles */}
                        <div>
                            <label className="text-xl font-medium text-gray-500 mb-2 block">Enforce 2FA for roles</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['owner', 'admin', 'manager', 'preparer', 'staff', 'viewer'].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enforce2FARoles[role]}
                                            onChange={() => handleCheckboxChange(setEnforce2FARoles, role)}
                                            className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                        />
                                        <span className="text-sm text-[#4B5563] capitalize ml-2">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Protection Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">Data Protection</p>
                    <p className="text-sm text-[#6B7280] mb-4">Policy-only demonstration controls for encryption, redaction, and sharing.</p>

                    <div className="space-y-4">
                        {/* Encryption policies */}
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-500">At rest</label>
                                <div className="relative">
                                    <select
                                        value={encryptionAtRest}
                                        onChange={(e) => setEncryptionAtRest(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <option>Policy Control only</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6L8 10L12 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-500">In transit</label>
                                <div className="relative">
                                    <select
                                        value={encryptionInTransit}
                                        onChange={(e) => setEncryptionInTransit(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <option>Policy Control only</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6L8 10L12 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* PII Redaction */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                                <span className="text-sm font-medium text-gray-500">Enable Redaction When Sharing</span>
                                <button
                                    type="button"
                                    onClick={() => setEnableRedaction(!enableRedaction)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${enableRedaction ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        }`}
                                    style={{ borderRadius: '999px' }}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableRedaction ? 'translate-x-6' : 'translate-x-1'}`}
                                        style={{ borderRadius: '999px' }}
                                    />
                                </button>
                            </div>
                            <div className="flex gap-4">
                                {['ssn', 'itin', 'acct'].map((type) => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={redactionTypes[type]}
                                            onChange={() => handleRedactionChange(type)}
                                            className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                        />
                                        <span className="text-sm text-[#4B5563] uppercase">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* File Sharing Policy */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-500">Use Secure Client Portal Only (Disable Email Attachments)</span>
                            <button
                                type="button"
                                onClick={() => setSecurePortalOnly(!securePortalOnly)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${securePortalOnly ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${securePortalOnly ? 'translate-x-6' : 'translate-x-1'}`} style={{ borderRadius: '999px' }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
                {/* Compliance Settings Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">Compliance Settings</p>
                    <p className="text-sm text-[#6B7280] mb-4">Configure compliance and data protection</p>

                    <div className="space-y-4">
                        {/* SOC 2 Compliance */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Left side text */}
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold text-gray-600 mb-0">SOC 2 Compliance</p>
                                <span className="text-sm font-semibold text-gray-500">Enable SOC 2 Audit Controls</span>
                            </div>

                            {/* Right side toggle */}
                            <button
                                type="button"
                                onClick={() => setSoc2Enabled(!soc2Enabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${soc2Enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soc2Enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    style={{ borderRadius: '999px' }}
                                />
                            </button>
                        </div>


                        {/* HIPAA Compliance */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Left side text */}
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold text-gray-600 mb-0">HIPAA Compliance</p>
                                <span className="text-sm font-semibold text-gray-500">Enable HIPAA Data Protection</span>
                            </div>

                            {/* Right side toggle */}
                            <button
                                type="button"
                                onClick={() => setHipaaEnabled(!hipaaEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${hipaaEnabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hipaaEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    style={{ borderRadius: '999px' }}
                                />
                            </button>
                        </div>

                        {/* Data Retention */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-600">Data Retention (years)</label>
                            <input
                                type="number"
                                value={dataRetention}
                                onChange={(e) => setDataRetention(e.target.value)}
                                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>

                        {/* Encryption Level */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-600">Encryption Level</label>
                            <div className="relative">
                                <select
                                    value={encryptionLevel}
                                    onChange={(e) => setEncryptionLevel(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <option value="AES-256">AES-256</option>
                                    <option value="AES-128">AES-128</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6L8 10L12 6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regulatory Readiness Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">Regulatory Readiness</p>
                    <p className="text-sm text-[#6B7280] mb-4">Align with IRS Pub. 4567 and industry standards. Capture client consent.</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            <span className="text-sm font-medium text-gray-500">Include IRS Pub. 4557 Safeguards Checklist</span>
                            <button
                                type="button"
                                onClick={() => setIncludeIRSPub(!includeIRSPub)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${includeIRSPub ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeIRSPub ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            <span className="text-sm font-medium text-gray-500">Data Sharing Consent</span>
                            <button
                                type="button"
                                onClick={() => setDataSharingConsent(!dataSharingConsent)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${dataSharingConsent ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dataSharingConsent ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Group wrapper for all two toggles */}
                            <div className="grid grid-cols-2 gap-8 w-full"> {/* Changed to grid for equal column distribution */}
                                {/* Toggle 1 */}
                                <div className="flex items-center justify-between col-span-1"> {/* Use justify-between to push content to ends */}
                                    <span className="text-sm font-semibold text-gray-500">GLBA-Aligned</span>
                                    <button
                                        type="button"
                                        onClick={() => setGlbaAligned(!glbaAligned)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${glbaAligned ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${glbaAligned ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>

                                {/* Toggle 2 */}
                                <div className="flex items-center justify-between col-span-1"> {/* Use justify-between to push content to ends */}
                                    <span className="text-sm font-semibold text-gray-500">SOC 2-Aligned</span>
                                    <button
                                        type="button"
                                        onClick={() => setSoc2Aligned(!soc2Aligned)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${soc2Aligned ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soc2Aligned ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>



                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Group wrapper for all two toggles */}
                            {/* Changed outer flex to grid grid-cols-2 for equal width distribution */}
                            <div className="grid grid-cols-2 gap-8 w-full">
                                {/* Toggle 1 */}
                                {/* Changed inner div to use justify-between to push label and toggle to opposite ends */}
                                <div className="flex items-center justify-between col-span-1">
                                    <span className="text-sm font-semibold text-gray-500">HIPAA-Aligned</span>
                                    <button
                                        type="button"
                                        onClick={() => setHipaaAligned(!hipaaAligned)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${hipaaAligned ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hipaaAligned ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>

                                {/* Toggle 2 */}
                                {/* Changed inner div to use justify-between to push label and toggle to opposite ends */}
                                <div className="flex items-center justify-between col-span-1">
                                    <span className="text-sm font-semibold text-gray-500">Consent Logs</span>
                                    <button
                                        type="button"
                                        onClick={() => setConsentLogs(!consentLogs)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${consentLogs ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consentLogs ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            {/* Group wrapper for the two toggles */}
                            {/* Changed the inner flex wrapper to a grid with 2 columns for equal width distribution */}
                            <div className="grid grid-cols-2 gap-8 w-full">
                                {/* Toggle 1: E-sign consent */}
                                {/* Uses justify-between to push the label to the start and the toggle button to the end */}
                                <div className="flex items-center justify-between col-span-1">
                                    <span className="text-sm font-semibold text-gray-500">E-sign consent</span>
                                    <button
                                        type="button"
                                        onClick={() => setESignConsent(!eSignConsent)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${eSignConsent ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${eSignConsent ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>

                                {/* Toggle 2: Marketing consent */}
                                {/* Uses justify-between to push the label to the start and the toggle button to the end */}
                                <div className="flex items-center justify-between col-span-1">
                                    <span className="text-sm font-semibold text-gray-500">Marketing consent</span>
                                    <button
                                        type="button"
                                        onClick={() => setMarketingConsent(!marketingConsent)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${marketingConsent ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            }`}
                                        style={{ borderRadius: '999px' }}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${marketingConsent ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            style={{ borderRadius: '999px' }}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staff Oversight Card */}
                <div className="rounded-xl bg-white p-6">
                    <p className="text-base font-semibold text-gray-600 mb-1">Staff Oversight</p>
                    <p className="text-sm text-[#6B7280] mb-4">Monitor active sessions and enable force logout and compliance reporting.</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            <span className="text-sm font-semibold text-gray-500">Enable Active Sessions View</span>
                            <button
                                type="button"
                                onClick={() => setEnableActiveSessionsView(!enableActiveSessionsView)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${enableActiveSessionsView ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableActiveSessionsView ? 'translate-x-6' : 'translate-x-1'}`} style={{ borderRadius: '999px' }} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                            <span className="text-sm font-semibold text-gray-500">Allow Force Logout Of Sessions</span>
                            <button
                                type="button"
                                onClick={() => setAllowForceLogout(!allowForceLogout)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${allowForceLogout ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowForceLogout ? 'translate-x-6' : 'translate-x-1'}`} style={{ borderRadius: '999px' }} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-500">Enable Staff-Level Compliance Reports</span>
                            <button
                                type="button"
                                onClick={() => setEnableStaffReports(!enableStaffReports)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] focus:ring-offset-2 ${enableStaffReports ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                    }`}
                                style={{ borderRadius: '999px' }}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableStaffReports ? 'translate-x-6' : 'translate-x-1'}`} style={{ borderRadius: '999px' }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlaceholder = () => (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-[#6B7280]">
            Content for <span className="font-semibold">{activeTab}</span> is coming soon.
        </div>
    );

    // Blocked Accounts handlers
    const handleUnblockClick = (account) => {
        setAccountToUnblock(account);
        setShowUnblockConfirm(true);
    };

    const confirmUnblock = async () => {
        if (!accountToUnblock) return;

        try {
            setUnblocking(true);
            const response = await firmAdminBlockedAccountsAPI.unblockAccount(accountToUnblock.id);

            if (response.success) {
                toast.success(response.message || 'Account unblocked successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
                await fetchBlockedAccounts();
                setShowUnblockConfirm(false);
                setAccountToUnblock(null);
            } else {
                toast.error(response.message || 'Failed to unblock account', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        } catch (err) {
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setUnblocking(false);
        }
    };

    const handleBlockSearch = (e) => {
        e.preventDefault();
        setBlockedAccountsCurrentPage(1);
        fetchBlockedAccounts();
    };

    const formatTimeRemaining = (hours, minutes) => {
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        }
        return 'Expired';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadgeColor = (role) => {
        const roleColors = {
            client: 'bg-blue-100 text-blue-800',
            staff: 'bg-purple-100 text-purple-800',
            admin: 'bg-green-100 text-green-800',
            firm_admin: 'bg-indigo-100 text-indigo-800',
            tax_preparer: 'bg-yellow-100 text-yellow-800',
        };
        return roleColors[role] || 'bg-gray-100 text-gray-800';
    };

    const goToBlockedAccountsPage = (page) => {
        if (page >= 1 && page <= blockedAccountsPagination.total_pages) {
            setBlockedAccountsCurrentPage(page);
        }
    };

    const blockedAccountsStartItem = blockedAccountsPagination.total_count
        ? (blockedAccountsPagination.page - 1) * blockedAccountsPagination.page_size + 1
        : 0;
    const blockedAccountsEndItem = blockedAccountsPagination.total_count
        ? Math.min(blockedAccountsPagination.page * blockedAccountsPagination.page_size, blockedAccountsPagination.total_count)
        : 0;

    const renderBlockedAccounts = () => (
        <div className="rounded-xl bg-white p-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <FiShield className="text-[#3B4A66]" size={28} />
                    <h3 className="text-2xl font-semibold text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Blocked Accounts
                    </h3>
                </div>
                <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    View and manage blocked user accounts
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <form onSubmit={handleBlockSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]" size={20} />
                        <input
                            type="text"
                            value={blockedAccountsSearch}
                            onChange={(e) => setBlockedAccountsSearch(e.target.value)}
                            placeholder="Search by name, email, or username..."
                            className="w-full pl-10 pr-4 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-[#1F2A55]"
                            style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#3AD6F2] text-white rounded-lg hover:bg-[#2BC4E0] transition-colors font-medium"
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {blockedAccountsError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-red-600" size={20} />
                        <p className="text-red-700 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>{blockedAccountsError}</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {blockedAccountsLoading && blockedAccounts.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
                        <p className="mt-3 text-[#6B7280] text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Loading blocked accounts...
                        </p>
                    </div>
                </div>
            ) : blockedAccounts.length === 0 ? (
                /* Empty State */
                <div className="bg-white border border-[#E8F0FF] rounded-lg p-12 text-center">
                    <FiShield className="mx-auto text-[#9CA3AF]" size={48} />
                    <h3 className="mt-4 text-lg font-semibold text-[#3B4A66]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        No Blocked Accounts Found
                    </h3>
                    <p className="mt-2 text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                        {blockedAccountsSearch ? 'No accounts match your search criteria.' : 'There are currently no blocked accounts.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Accounts List */}
                    <div className="bg-white border border-[#E8F0FF] rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F6F7FF]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            Blocked Until
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            Time Remaining
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            Failed Attempts
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[#3B4A66] uppercase tracking-wider" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8F0FF]">
                                    {blockedAccounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#E8F0FF] flex items-center justify-center">
                                                        <FiUser className="text-[#3B4A66]" size={20} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                            {account.full_name || `${account.first_name} ${account.last_name}`.trim() || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                            {account.email}
                                                        </div>
                                                        {account.username && (
                                                            <div className="text-xs text-[#9CA3AF]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                                @{account.username}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(account.role)}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {account.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {formatDate(account.blocked_until)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <FiClock className="text-[#F59E0B]" size={16} />
                                                    <span className="text-sm font-medium text-[#F59E0B]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                        {formatTimeRemaining(account.time_remaining_hours || 0, account.time_remaining_minutes || 0)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {account.failed_login_attempts || 0}
                                                </div>
                                                {account.last_failed_login_at && (
                                                    <div className="text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                        {formatDate(account.last_failed_login_at)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleUnblockClick(account)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
                                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                                >
                                                    <FiUnlock size={16} />
                                                    Unblock
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {blockedAccountsPagination.total_pages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                Showing {blockedAccountsStartItem} to {blockedAccountsEndItem} of {blockedAccountsPagination.total_count} blocked accounts
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => goToBlockedAccountsPage(blockedAccountsCurrentPage - 1)}
                                    disabled={blockedAccountsCurrentPage === 1}
                                    className="px-4 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, blockedAccountsPagination.total_pages) }, (_, i) => {
                                        let pageNum;
                                        if (blockedAccountsPagination.total_pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (blockedAccountsCurrentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (blockedAccountsCurrentPage >= blockedAccountsPagination.total_pages - 2) {
                                            pageNum = blockedAccountsPagination.total_pages - 4 + i;
                                        } else {
                                            pageNum = blockedAccountsCurrentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToBlockedAccountsPage(pageNum)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${blockedAccountsCurrentPage === pageNum
                                                    ? 'bg-[#3AD6F2] text-white'
                                                    : 'border border-[#E8F0FF] text-[#3B4A66] hover:bg-gray-50'
                                                    }`}
                                                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => goToBlockedAccountsPage(blockedAccountsCurrentPage + 1)}
                                    disabled={blockedAccountsCurrentPage === blockedAccountsPagination.total_pages}
                                    className="px-4 py-2 border border-[#E8F0FF] rounded-lg text-sm font-medium text-[#3B4A66] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Unblock Confirmation Modal */}
            <ConfirmationModal
                isOpen={showUnblockConfirm}
                onClose={() => {
                    if (!unblocking) {
                        setShowUnblockConfirm(false);
                        setAccountToUnblock(null);
                    }
                }}
                onConfirm={confirmUnblock}
                title="Unblock Account"
                message={
                    accountToUnblock
                        ? `Are you sure you want to unblock the account for "${accountToUnblock.full_name || accountToUnblock.email}"? This will allow them to log in immediately.`
                        : "Are you sure you want to unblock this account?"
                }
                confirmText="Unblock"
                cancelText="Cancel"
                isLoading={unblocking}
                isDestructive={false}
            />
        </div>
    );

    // Fetch geo locations and restrictions
    const fetchGeoData = async () => {
        try {
            setGeoRestrictionsLoading(true);
            setGeoRestrictionsError(null);

            const [locationsResponse, restrictionsResponse] = await Promise.all([
                firmAdminGeoRestrictionsAPI.getGeoLocations(),
                firmAdminGeoRestrictionsAPI.getGeoRestrictions({ include_inactive: true })
            ]);

            if (locationsResponse.success && locationsResponse.data) {
                setGeoLocationsList(locationsResponse.data.regions || []);
            }

            if (restrictionsResponse.success && restrictionsResponse.data) {
                setGeoRestrictionsList(restrictionsResponse.data.geo_restrictions || restrictionsResponse.data.restrictions || []);
            }
        } catch (err) {
            console.error('Error fetching geo data:', err);
            setGeoRestrictionsError(handleAPIError(err));
        } finally {
            setGeoRestrictionsLoading(false);
        }
    };

    // Fetch geo data when tab is active
    useEffect(() => {
        if (activeTab === 'Geo Restrictions') {
            fetchGeoData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Handle opening geo restriction modal
    const handleOpenGeoRestrictionModal = (region = null) => {
        if (region) {
            // Edit existing restriction
            const existingRestriction = geoRestrictionsList.find(r => r.region_code === region.region_code);
            if (existingRestriction) {
                setGeoRestrictionForm({
                    region: existingRestriction.region_code,
                    session_timeout_minutes: existingRestriction.session_timeout_minutes || 30,
                    description: existingRestriction.description || '',
                    country_codes: existingRestriction.country_codes || [],
                    is_active: existingRestriction.is_active !== false
                });
                setSelectedGeoRegion(region);
                setCurrentRestrictionData(existingRestriction);
            } else {
                // New restriction for this region
                setGeoRestrictionForm({
                    region: region.region_code,
                    session_timeout_minutes: region.default_timeout_minutes || 30,
                    description: '',
                    country_codes: [],
                    is_active: true
                });
                setSelectedGeoRegion(region);
                setCurrentRestrictionData(null);
            }
        } else {
            // New restriction
            setGeoRestrictionForm({
                region: '',
                session_timeout_minutes: 30,
                description: '',
                country_codes: [],
                is_active: true
            });
            setSelectedGeoRegion(null);
            setCurrentRestrictionData(null);
        }
        setShowGeoRestrictionModal(true);
    };

    // Handle saving geo restriction
    const handleSaveGeoRestriction = async () => {
        if (!geoRestrictionForm.region) {
            toast.error('Please select a region', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        if (geoRestrictionForm.session_timeout_minutes < 1 || geoRestrictionForm.session_timeout_minutes > 1440) {
            toast.error('Session timeout must be between 1 and 1440 minutes', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            setSavingGeoRestriction(true);
            const response = await firmAdminGeoRestrictionsAPI.createOrUpdateGeoRestriction(geoRestrictionForm);

            if (response.success) {
                toast.success(response.message || 'Geo restriction saved successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
                // Update current restriction data if available
                if (response.data) {
                    setCurrentRestrictionData(response.data);
                }
                setShowGeoRestrictionModal(false);
                await fetchGeoData();
            } else {
                throw new Error(response.message || 'Failed to save geo restriction');
            }
        } catch (err) {
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setSavingGeoRestriction(false);
        }
    };

    // Handle deleting geo restriction
    const handleDeleteGeoRestriction = async (restrictionId) => {
        if (!window.confirm('Are you sure you want to delete this geo restriction?')) {
            return;
        }

        try {
            setDeletingGeoRestrictionId(restrictionId);
            const response = await firmAdminGeoRestrictionsAPI.deleteGeoRestriction(restrictionId);

            if (response.success) {
                toast.success(response.message || 'Geo restriction deleted successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
                await fetchGeoData();
            } else {
                throw new Error(response.message || 'Failed to delete geo restriction');
            }
        } catch (err) {
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setDeletingGeoRestrictionId(null);
        }
    };

    // Handle adding country code
    const handleAddCountryCode = () => {
        const code = countryCodeInput.trim().toUpperCase();
        if (code && code.length === 2 && !geoRestrictionForm.country_codes.includes(code)) {
            setGeoRestrictionForm(prev => ({
                ...prev,
                country_codes: [...prev.country_codes, code]
            }));
            setCountryCodeInput('');
        }
    };

    // Handle removing country code
    const handleRemoveCountryCode = (code) => {
        setGeoRestrictionForm(prev => ({
            ...prev,
            country_codes: prev.country_codes.filter(c => c !== code)
        }));
    };

    const renderGeoRestrictions = () => (
        <div className="rounded-xl bg-white p-4 sm:p-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <FiGlobe className="text-[#3B4A66] shrink-0" size={28} />
                        <h3 className="text-xl sm:text-2xl font-semibold text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Geo Restrictions
                        </h3>
                    </div>
                    <button
                        onClick={() => handleOpenGeoRestrictionModal()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3AD6F2] text-white text-sm font-medium rounded-lg hover:bg-[#2BC4E0] transition-colors"
                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                    >
                        <FiGlobe size={16} />
                        Add Restriction
                    </button>
                </div>
                <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Configure session timeouts and restrictions by geographic region
                </p>
            </div>

            {/* Error Message */}
            {geoRestrictionsError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-red-600 shrink-0" size={20} />
                        <p className="text-red-700 text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>{geoRestrictionsError}</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {geoRestrictionsLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AD6F2]"></div>
                        <p className="mt-3 text-[#6B7280] text-sm" style={{ fontFamily: 'BasisGrotesquePro' }}>
                            Loading geo restrictions...
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {/* Regions List */}
                    {geoLocationsList.map((region) => {
                        const restriction = geoRestrictionsList.find(r => r.region_code === region.region_code);
                        return (
                            <div
                                key={region.region_code}
                                className="border border-[#E8F0FF] rounded-lg p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                                style={{ borderRadius: '10px' }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h4 className="text-lg font-bold text-[#1F2A55] truncate" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                {region.region_name}
                                            </h4>
                                        </div>
                                        {restriction ? (
                                            <div className="space-y-2">
                                                <p className="text-sm text-[#4B5563]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    Session Timeout: <span className="font-bold text-[#3AD6F2]">{restriction.session_timeout_minutes}m ({restriction.session_timeout_hours}h)</span>
                                                </p>
                                                {restriction.description && (
                                                    <p className="text-sm text-[#6B7280] line-clamp-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                        {restriction.description}
                                                    </p>
                                                )}
                                                {restriction.country_codes && restriction.country_codes.length > 0 && (
                                                    <div className="flex items-start gap-2 mt-3">
                                                        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] mt-1 shrink-0">Countries:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {restriction.country_codes.map((code) => (
                                                                <span key={code} className="px-2 py-0.5 text-[10px] font-bold bg-[#F3F7FF] text-[#3AD6F2] border border-[#E8F0FF] rounded" style={{ borderRadius: '4px' }}>
                                                                    {code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[#6B7280] italic" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                Default Timeout: <span className="text-[#1F2A55] font-medium">{region.default_timeout_minutes} minutes</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-row sm:flex-row items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleOpenGeoRestrictionModal(region)}
                                            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-5 py-2.5 bg-[#F3F7FF] text-[#3AD6F2] text-sm font-bold rounded-lg hover:bg-[#E8F0FF] transition-all"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            {restriction ? 'Edit' : 'Configure'}
                                        </button>
                                        {restriction && (
                                            <button
                                                onClick={() => handleDeleteGeoRestriction(restriction.id)}
                                                disabled={deletingGeoRestrictionId === restriction.id}
                                                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 text-sm font-bold rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {deletingGeoRestrictionId === restriction.id ? '...' : 'Delete'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Geo Restriction Modal */}
            {showGeoRestrictionModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
                    onClick={() => !savingGeoRestriction && setShowGeoRestrictionModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-[#E8F0FF] z-10 rounded-t-xl relative">
                            <div className="pr-12 flex-1">
                                <h3 className="text-[18px] sm:text-[20px] font-bold text-[#3B4A66] font-[BasisGrotesquePro] leading-tight">
                                    {selectedGeoRegion ? `${selectedGeoRegion.region_name || selectedGeoRegion.region_code}` : 'Add Geo Restriction'}
                                </h3>
                                <p className="text-[11px] sm:text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                    Configure regional session security settings
                                </p>
                            </div>
                            <button
                                onClick={() => !savingGeoRestriction && setShowGeoRestrictionModal(false)}
                                className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 flex items-center justify-center rounded-full bg-[#F3F7FF] hover:bg-[#E8F0FF] text-[#3AD6F2] transition-colors shrink-0"
                                style={{ borderRadius: '50%' }}
                                disabled={savingGeoRestriction}
                                type="button"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Existing Restriction Info */}
                            {currentRestrictionData && (
                                <div className="bg-[#F9FAFB] border border-[#E8F0FF] rounded-lg p-4 mb-4" style={{ borderRadius: '8px' }}>
                                    <h4 className="text-sm font-semibold text-[#3B4A66] mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                        Restriction Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Status: </span>
                                            <span className={`font-medium ${currentRestrictionData.is_active ? 'text-green-600' : 'text-gray-600'}`} style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                {currentRestrictionData.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {currentRestrictionData.session_timeout_display && (
                                            <div>
                                                <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Current Timeout: </span>
                                                <span className="font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {currentRestrictionData.session_timeout_display}
                                                </span>
                                            </div>
                                        )}
                                        {currentRestrictionData.created_by && (
                                            <div>
                                                <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Created By: </span>
                                                <span className="font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {currentRestrictionData.created_by.name}
                                                </span>
                                            </div>
                                        )}
                                        {currentRestrictionData.created_at && (
                                            <div>
                                                <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Created: </span>
                                                <span className="font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {new Date(currentRestrictionData.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {currentRestrictionData.updated_at && (
                                            <div>
                                                <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Last Updated: </span>
                                                <span className="font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    {new Date(currentRestrictionData.updated_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {currentRestrictionData.id && (
                                            <div>
                                                <span className="text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>Restriction ID: </span>
                                                <span className="font-medium text-[#1F2A55]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                                    #{currentRestrictionData.id}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Region Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Region <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={geoRestrictionForm.region}
                                    onChange={(e) => setGeoRestrictionForm(prev => ({ ...prev, region: e.target.value }))}
                                    disabled={!!selectedGeoRegion || savingGeoRestriction}
                                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                >
                                    <option value="">Select a region</option>
                                    {geoLocationsList.map((region) => (
                                        <option key={region.region_code} value={region.region_code}>
                                            {region.region_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Session Timeout */}
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Session Timeout (minutes) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={geoRestrictionForm.session_timeout_minutes}
                                    onChange={(e) => setGeoRestrictionForm(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) || 30 }))}
                                    disabled={savingGeoRestriction}
                                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                    placeholder="Enter timeout in minutes (1-1440)"
                                />
                                <p className="mt-1 text-xs text-[#6B7280]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Must be between 1 and 1440 minutes (24 hours)
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={geoRestrictionForm.description}
                                    onChange={(e) => setGeoRestrictionForm(prev => ({ ...prev, description: e.target.value }))}
                                    disabled={savingGeoRestriction}
                                    rows={3}
                                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                    style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                    placeholder="Enter a description for this restriction"
                                />
                            </div>

                            {/* Country Codes */}
                            <div>
                                <label className="block text-sm font-medium text-[#3B4A66] mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Country Codes (Optional)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={countryCodeInput}
                                        onChange={(e) => setCountryCodeInput(e.target.value.toUpperCase().slice(0, 2))}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCountryCode())}
                                        disabled={savingGeoRestriction}
                                        placeholder="Enter 2-letter country code (e.g., US, IN)"
                                        className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/20 bg-white"
                                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCountryCode}
                                        disabled={savingGeoRestriction || !countryCodeInput.trim()}
                                        className="px-4 py-2 bg-[#3AD6F2] text-white text-sm font-medium rounded-lg hover:bg-[#2BC4E0] transition-colors disabled:opacity-50"
                                        style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                    >
                                        Add
                                    </button>
                                </div>
                                {geoRestrictionForm.country_codes.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {geoRestrictionForm.country_codes.map((code) => (
                                            <span
                                                key={code}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#E8F0FF] text-[#3B4A66] rounded text-sm"
                                                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                                            >
                                                {code}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCountryCode(code)}
                                                    disabled={savingGeoRestriction}
                                                    className="text-[#3B4A66] hover:text-red-500"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={geoRestrictionForm.is_active}
                                    onChange={(e) => setGeoRestrictionForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                    disabled={savingGeoRestriction}
                                    className="h-4 w-4 rounded border-[#E5E7EB] accent-[#3AD6F2] text-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-2"
                                    style={{ borderRadius: '4px' }}
                                />
                                <label className="text-sm font-medium text-[#3B4A66]" style={{ fontFamily: 'BasisGrotesquePro' }}>
                                    Active
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E7EB]">
                            <button
                                onClick={() => !savingGeoRestriction && setShowGeoRestrictionModal(false)}
                                disabled={savingGeoRestriction}
                                className="px-4 py-2 border border-[#E5E7EB] bg-white text-[#3B4A66] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveGeoRestriction}
                                disabled={savingGeoRestriction || !geoRestrictionForm.region}
                                className="px-4 py-2 bg-[#3AD6F2] text-white text-sm font-medium rounded-lg hover:bg-[#2BC4E0] transition-colors disabled:opacity-50"
                                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '8px' }}
                            >
                                {savingGeoRestriction ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const handleChecklistChange = (item) => {
        setChecklistItems(prev => ({
            ...prev,
            [item]: !prev[item]
        }));
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const handleFileDragOver = (e) => {
        e.preventDefault();
    };

    const renderReviewModal = () => {
        if (!isReviewModalOpen || !selectedCompliance) return null;

        return (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
                onClick={() => setIsReviewModalOpen(false)}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 custom-scrollbar"
                    style={{ borderRadius: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header - Sticky */}
                    <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-[#E8F0FF] z-10 rounded-t-2xl">
                        <div>
                            <h3 className="text-[22px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                                Review: {selectedCompliance.client}
                            </h3>
                            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                                Last updated: {selectedCompliance.lastUpdated}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsReviewModalOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F3F7FF] hover:bg-[#E8F0FF] text-[#3AD6F2] transition-colors"
                            type="button"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6">
                        {/* Checklist Section */}
                        <div className="bg-[#F8FAFF] rounded-xl p-4 border border-[#E8F0FF]">
                            <p className="text-sm font-bold text-[#3B4A66] mb-4 font-[BasisGrotesquePro]">Compliance Checklist</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: 'eic', label: 'EIC Eligibility' },
                                    { id: 'ctc', label: 'CTC Verification' },
                                    { id: 'hoh', label: 'HOH Status' }
                                ].map((item) => (
                                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={checklistItems[item.id]}
                                                onChange={() => handleChecklistChange(item.id)}
                                                className="peer h-5 w-5 rounded border-[#E8F0FF] accent-[#3AD6F2] focus:ring-[#3AD6F2] focus:ring-offset-0 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-[#4B5563] group-hover:text-[#3AD6F2] transition-colors">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                            <p className="text-sm font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Review Notes</p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add internal notes for this compliance review..."
                                rows={4}
                                className="w-full rounded-xl border border-[#E8F0FF] px-4 py-3 text-sm text-[#4B5563] placeholder:text-[#9CA3AF] focus:border-[#3AD6F2] focus:outline-none focus:ring-4 focus:ring-[#3AD6F2]/10 transition-all resize-none font-[BasisGrotesquePro]"
                            />
                        </div>

                        {/* Add Files Section */}
                        <div>
                            <p className="text-sm font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">Supporting Documents</p>
                            <div
                                onDrop={handleFileDrop}
                                onDragOver={handleFileDragOver}
                                className="border-2 border-dashed border-[#E8F0FF] rounded-xl p-8 text-center cursor-pointer hover:border-[#3AD6F2] hover:bg-[#F3F7FF] transition-all bg-[#F8FAFF] group"
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#9CA3AF] group-hover:text-[#3AD6F2] group-hover:scale-110 transition-all shadow-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#4B5563] font-bold">
                                            Drop files here or click to browse
                                        </p>
                                        <p className="text-xs text-[#9CA3AF] mt-1">
                                            {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) ready to upload` : 'PDF, JPG, PNG up to 10MB'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-[#E8F0FF] bg-white rounded-b-2xl sticky bottom-0">
                        <button
                            onClick={() => setIsReviewModalOpen(false)}
                            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-[#4B5563] bg-[#F3F7FF] hover:bg-[#E8F0FF] transition-all duration-200"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                // Logic for saving
                                setIsReviewModalOpen(false);
                            }}
                            className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#F56D2D] hover:bg-[#E55A1D] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            style={{ borderRadius: "10px" }}
                            type="button"
                        >
                            <span>Save Review</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[rgb(243,247,255)] px-4 pt-0 pb-6 md:px-6">
            <div className="mx-auto flex w-full flex-col gap-6">
                <div className="rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h4 className="text-2xl font-semibold text-[#1F2937]">Security &amp; Compliance</h4>
                            <p className="text-sm text-[#6B7280]">Monitor security, manage access, and ensure compliance</p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-nowrap gap-1.5 w-full bg-white rounded-lg p-1 border border-blue-50 overflow-x-auto md:overflow-hidden custom-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`flex-none md:flex-1 px-3 md:px-1 py-2 md:py-1.5 text-[11px] md:text-[7px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab ? 'bg-[#3AD6F2] text-white shadow-sm' : 'text-[#4B5563] hover:text-[#3AD6F2]'
                                    }`}
                                style={{ borderRadius: '6px' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'Security Overview' && renderSecurityOverview()}
                {activeTab === 'Compliance Readiness' && renderCompliance()}
                {activeTab === 'Active Sessions' && renderActiveSessions()}
                {activeTab === 'Audits Logs' && renderAuditLogs()}
                {activeTab === 'Blocked Accounts' && renderBlockedAccounts()}
                {activeTab === 'Geo Restrictions' && renderGeoRestrictions()}
                {!tabs.includes(activeTab) && renderPlaceholder()}
            </div>

            {renderReviewModal()}
        </div>
    );
}

