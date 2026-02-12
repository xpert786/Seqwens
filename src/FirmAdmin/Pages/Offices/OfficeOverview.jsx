import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCog, FaEdit, FaArrowLeft, FaStar, FaUsers } from 'react-icons/fa';
import { firmOfficeAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import TaxpayerManagementModal from './TaxpayerManagementModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import EditOfficeModal from './EditOfficeModal';
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
import sampleOffices from './sampleOffices';
import { Link } from 'react-router-dom';
import { getTimezoneLabel } from './constants';


// Helper function to get initials from name
const getInitials = (name) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export default function OfficeOverview() {
    const { officeId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [taxPrepUrl, setTaxPrepUrl] = useState('https://www.grammarly.com/');
    const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
    const [branding, setBranding] = useState({
        loginUrl: 'https://www.logo.com/',
        faviconUrl: 'https://www.favicon.com/',
        primaryColor: '#3AD6F2',
        secondaryColor: '#F56D2D',
        customDomain: 'sub.myfirm.com'
    });

    // Office data state
    const [office, setOffice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Staff count for summary (from officeData, no tab needed)

    // Clients state
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientsError, setClientsError] = useState('');
    const [clientsCount, setClientsCount] = useState(0);

    // Performance state
    const [performanceData, setPerformanceData] = useState(null);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [performanceError, setPerformanceError] = useState('');

    // Taxpayer management state
    const [showTaxpayerModal, setShowTaxpayerModal] = useState(false);
    const [isPrimaryOffice, setIsPrimaryOffice] = useState(false);
    const [settingPrimary, setSettingPrimary] = useState(false);

    // Edit office modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [removingManager, setRemovingManager] = useState(false);
    const [showRemoveManagerConfirm, setShowRemoveManagerConfirm] = useState(false);

    // Branding file upload state
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);

    // Fetch office details from API
    useEffect(() => {
        const fetchOfficeDetails = async () => {
            if (!officeId) {
                setError('Office ID is required');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const response = await firmOfficeAPI.getOffice(officeId);

                if (response.success && response.data) {
                    setOffice(response.data);
                    setIsPrimaryOffice(response.data.is_primary || false);
                } else {
                    throw new Error(response.message || 'Failed to load office details');
                }
            } catch (err) {
                console.error('Error fetching office details:', err);
                const errorMsg = handleAPIError(err);
                setError(errorMsg || 'Failed to load office details. Please try again.');
                toast.error(errorMsg || 'Failed to load office details', {
                    position: 'top-right',
                    autoClose: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOfficeDetails();
    }, [officeId]);


    // Fetch clients when Clients tab is active
    useEffect(() => {
        const fetchClients = async () => {
            if (activeTab !== 'Clients' || !officeId) {
                return;
            }

            try {
                setClientsLoading(true);
                setClientsError('');

                const response = await firmOfficeAPI.getOfficeClients(officeId);

                console.log('Office Clients API Response:', response);

                if (response.success && response.data) {
                    const clientsData = response.data.clients || response.data || [];
                    const count = response.data.clients_count || response.data.count || clientsData.length || 0;

                    console.log('Clients data:', clientsData);
                    console.log('Clients count:', count);

                    setClients(clientsData);
                    setClientsCount(count);
                } else {
                    throw new Error(response.message || 'Failed to load clients');
                }
            } catch (err) {
                console.error('Error fetching clients:', err);
                const errorMsg = handleAPIError(err);
                setClientsError(errorMsg || 'Failed to load clients');
                setClients([]);
            } finally {
                setClientsLoading(false);
            }
        };

        fetchClients();
    }, [activeTab, officeId]);

    // Fetch performance data when Performance tab is active
    useEffect(() => {
        const fetchPerformance = async () => {
            if (activeTab !== 'Performance' || !officeId) {
                return;
            }

            try {
                setPerformanceLoading(true);
                setPerformanceError('');

                const response = await firmOfficeAPI.getOfficePerformance(officeId);

                if (response.success && response.data) {
                    setPerformanceData(response.data);
                } else {
                    throw new Error(response.message || 'Failed to load performance data');
                }
            } catch (err) {
                console.error('Error fetching performance data:', err);
                const errorMsg = handleAPIError(err);
                setPerformanceError(errorMsg || 'Failed to load performance data');
                setPerformanceData(null);
            } finally {
                setPerformanceLoading(false);
            }
        };

        fetchPerformance();
    }, [activeTab, officeId]);

    // Fallback to sample data if API fails (for development)
    const officeData = office || sampleOffices[officeId] || sampleOffices['1'] || {};

    const formatCurrency = (amount) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount}`;
    };

    const tabs = [
        { id: 'Overview', label: 'Overview' },
        { id: 'Clients', label: `Clients (${clientsCount || officeData?.clients_count || officeData?.officeClients?.length || 0})` },
        { id: 'Performance', label: 'Performance' },
        { id: 'Settings', label: 'Settings' }
    ];

    const efinStatusData = useMemo(() => {
        const status = officeData?.efinStatus || { active: 0, pending: 0, revoked: 0 };
        const definitions = [
            { key: 'active', label: 'Active', color: '#10B981' },
            { key: 'pending', label: 'Pending', color: '#FACC15' },
            { key: 'revoked', label: 'Revoked', color: '#EF4444' }
        ];

        return definitions.map((definition) => ({
            ...definition,
            value: status[definition.key] ?? 0
        }));
    }, [officeData]);

    const totalEfin = useMemo(
        () => efinStatusData.reduce((total, status) => total + status.value, 0),
        [efinStatusData]
    );

    const bankPartners = useMemo(() => {
        return officeData?.bankPartners || officeData?.bank_partners || [
            { id: 'default-1', name: 'Chase Bank', status: 'Active' },
            { id: 'default-2', name: 'Wells Fargo', status: 'Pending' },
            { id: 'default-3', name: 'Bank of America', status: 'Rejected' }
        ];
    }, [officeData]);

    const auditTrail = useMemo(() => {
        return officeData?.auditTrail || officeData?.audit_trail || [
            { id: 'default-log-1', user: 'John D.', office: 'NYC', action: 'Filed Return', ip: '192.168.1.12', timestamp: '2025-07-21 14:32' },
            { id: 'default-log-2', user: 'Maria P.', office: 'LA', action: 'Bank Enrollment', ip: '192.168.2.45', timestamp: '2025-07-21 13:10' },
            { id: 'default-log-3', user: 'Alex K.', office: 'Chicago', action: 'Filed Return', ip: '10.0.0.22', timestamp: '2025-07-20 18:55' }
        ];
    }, [officeData]);

    const partnerStatusStyles = {
        Active: 'bg-[#22C55E] text-[#FFFFFF]',
        Pending: 'bg-[#FBBF24] text-[#FFFFFF]',
        Rejected: 'bg-[#EF4444] text-[#FFFFFF]'
    };

    const timezone = officeData?.timezone || 'America/New_York';
    const officeManager = officeData?.manager_name || 'N/A';
    const managerEmail = officeData?.manager_email || 'N/A';

    const defaultBranding = useMemo(
        () => ({
            loginUrl: officeData?.branding?.loginUrl || 'https://www.logo.com/',
            faviconUrl: officeData?.branding?.faviconUrl || 'https://www.favicon.com/',
            primaryColor: officeData?.stored_primary_color || officeData?.primary_color || '#3AD6F2',
            secondaryColor: officeData?.stored_secondary_color || officeData?.secondary_color || '#F56D2D',
            customDomain: officeData?.custom_domain || 'sub.myfirm.com'
        }),
        [officeData]
    );

    useEffect(() => {
        setBranding(defaultBranding);
        setWhiteLabelEnabled(Boolean(officeData?.enable_office_branding));
        setTaxPrepUrl(officeData?.taxPrepUrl || 'https://www.grammarly.com/');

        // Set existing logo and favicon previews
        if (officeData?.logo) {
            setLogoPreview(officeData.logo);
        }
        if (officeData?.favicon) {
            setFaviconPreview(officeData.favicon);
        }
    }, [defaultBranding, officeData]);


    const handleBrandingChange = (field) => (event) => {
        const value = event.target.value;
        setBranding((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleLogoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaviconChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFaviconFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleToggleWhiteLabel = () => {
        setWhiteLabelEnabled((previous) => !previous);
    };

    const handleResetBranding = () => {
        setBranding(defaultBranding);
        setWhiteLabelEnabled(Boolean(officeData?.enable_office_branding));
        setLogoFile(null);
        setFaviconFile(null);
        setLogoPreview(officeData?.logo || null);
        setFaviconPreview(officeData?.favicon || null);
    };

    const handleSaveBranding = async () => {
        try {
            setSavingBranding(true);

            const brandingData = {
                primary_color: branding.primaryColor.startsWith('#') ? branding.primaryColor : `#${branding.primaryColor}`,
                secondary_color: branding.secondaryColor.startsWith('#') ? branding.secondaryColor : `#${branding.secondaryColor}`,
                custom_domain: branding.customDomain,
                enable_office_branding: whiteLabelEnabled
            };

            const files = {};
            if (logoFile) {
                files.logo = logoFile;
            }
            if (faviconFile) {
                files.favicon = faviconFile;
            }

            const response = await firmOfficeAPI.updateOfficeBranding(officeId, brandingData, files);

            if (response.success) {
                toast.success('Office branding updated successfully', {
                    position: 'top-right',
                    autoClose: 3000
                });

                // Refresh office data
                const officeResponse = await firmOfficeAPI.getOffice(officeId);
                if (officeResponse.success && officeResponse.data) {
                    setOffice(officeResponse.data);
                }

                // Clear file states
                setLogoFile(null);
                setFaviconFile(null);
            } else {
                throw new Error(response.message || 'Failed to update branding');
            }
        } catch (error) {
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage || 'Failed to update branding', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setSavingBranding(false);
        }
    };

    const handleSaveTaxPrep = () => {
        console.log('Tax prep URL saved', taxPrepUrl);
    };

    const handleTestTaxPrep = () => {
        if (taxPrepUrl) {
            window.open(taxPrepUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const [showSetPrimaryConfirm, setShowSetPrimaryConfirm] = useState(false);

    const handleSetPrimaryOffice = async () => {
        setShowSetPrimaryConfirm(true);
    };

    const confirmSetPrimaryOffice = async () => {
        try {
            setSettingPrimary(true);
            const response = await firmOfficeAPI.setPrimaryOffice(officeId);

            if (response.success) {
                toast.success('Office set as primary successfully', {
                    position: 'top-right',
                    autoClose: 3000
                });
                setIsPrimaryOffice(true);
                // Refresh office data
                const officeResponse = await firmOfficeAPI.getOffice(officeId);
                if (officeResponse.success && officeResponse.data) {
                    setOffice(officeResponse.data);
                }
            } else {
                toast.error(response.message || 'Failed to set primary office', {
                    position: 'top-right',
                    autoClose: 3000
                });
            }
        } catch (error) {
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setSettingPrimary(false);
            setShowSetPrimaryConfirm(false);
        }
    };

    const handleTaxpayerUpdate = () => {
        // Refresh clients count when taxpayers are updated
        if (activeTab === 'Clients') {
            const fetchClients = async () => {
                try {
                    setClientsLoading(true);
                    const response = await firmOfficeAPI.getOfficeClients(officeId);
                    if (response.success && response.data) {
                        setClients(response.data.clients || []);
                        setClientsCount(response.data.clients_count || response.data.clients?.length || 0);
                    }
                } catch (err) {
                    console.error('Error fetching clients:', err);
                } finally {
                    setClientsLoading(false);
                }
            };
            fetchClients();
        }
    };

    const handleRemoveManager = () => {
        setShowRemoveManagerConfirm(true);
    };

    const confirmRemoveManager = async () => {
        try {
            setRemovingManager(true);
            const response = await firmOfficeAPI.removeManager(officeId);

            if (response.success) {
                toast.success(response.message || 'Manager removed successfully', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                // Refresh office data
                const officeResponse = await firmOfficeAPI.getOffice(officeId);
                if (officeResponse.success && officeResponse.data) {
                    setOffice(officeResponse.data);
                }
            } else {
                throw new Error(response.message || 'Failed to remove manager');
            }
        } catch (error) {
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage || 'Failed to remove manager', {
                position: 'top-right',
                autoClose: 3000,
            });
        } finally {
            setRemovingManager(false);
            setShowRemoveManagerConfirm(false);
        }
    };

    const handleOfficeUpdated = async () => {
        // Refresh office data after update
        try {
            const response = await firmOfficeAPI.getOffice(officeId);
            if (response.success && response.data) {
                setOffice(response.data);
                setIsPrimaryOffice(response.data.is_primary || false);
            }
        } catch (err) {
            console.error('Error refreshing office data:', err);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm text-gray-600">Loading office details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !officeData) {
        return (
            <div className="p-6 bg-[rgb(243,247,255)] min-h-screen">
                <button
                    onClick={() => navigate('/firmadmin/offices')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Offices</span>
                </button>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 bg-[rgb(243,247,255)]">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/firmadmin/offices')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Offices</span>
                </button>

                {/* Top Header Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E8F0FF] flex items-center justify-center flex-shrink-0">
                            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 27.5V5C7.5 4.33696 7.76339 3.70107 8.23223 3.23223C8.70107 2.76339 9.33696 2.5 10 2.5H20C20.663 2.5 21.2989 2.76339 21.7678 3.23223C22.2366 3.70107 22.5 4.33696 22.5 5V27.5H7.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M7.5 15H5C4.33696 15 3.70107 15.2634 3.23223 15.7322C2.76339 16.2011 2.5 16.837 2.5 17.5V25C2.5 25.663 2.76339 26.2989 3.23223 26.7678C3.70107 27.2366 4.33696 27.5 5 27.5H7.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M22.5 11.25H25C25.663 11.25 26.2989 11.5134 26.7678 11.9822C27.2366 12.4511 27.5 13.087 27.5 13.75V25C27.5 25.663 27.2366 26.2989 26.7678 26.7678C26.2989 27.2366 25.663 27.5 25 27.5H22.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 7.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 12.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 17.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M12.5 22.5H17.5" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                        </div>
                        <div>
                            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{officeData.name || 'Office Details'}</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600 mb-0">{officeData.full_address || officeData.location || 'N/A'}</p>
                                <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${(officeData.status || '').toLowerCase() === 'active' ? 'bg-green-500' :
                                    (officeData.status || '').toLowerCase().includes('opening') ? 'bg-blue-500' :
                                        'bg-gray-500'
                                    }`}>
                                    {officeData.status_display || officeData.status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {!isPrimaryOffice && (
                            <button
                                onClick={handleSetPrimaryOffice}
                                disabled={settingPrimary}
                                className="px-3 py-2 text-xs font-semibold text-white bg-[#00C0C6] !rounded-[10px] hover:shadow-md transition-all duration-200 flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                            >
                                <FaStar className="w-3.5 h-3.5" />
                                {settingPrimary ? 'Setting...' : 'Set as Primary Office'}
                            </button>
                        )}
                        {isPrimaryOffice && (
                            <span className="px-3 py-2 text-xs font-semibold text-white bg-yellow-500 !rounded-[10px] flex items-center gap-2 shadow-sm whitespace-nowrap">
                                <FaStar className="w-3.5 h-3.5" />
                                Primary Office
                            </span>
                        )}
                        <button
                            onClick={() => setShowTaxpayerModal(true)}
                            className="px-3 py-2 text-xs font-semibold text-white bg-[#3AD6F2] !rounded-[10px] hover:shadow-md transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FaUsers className="w-3.5 h-3.5" />
                            Manage Taxpayers
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-3 py-2 text-xs font-semibold text-white bg-[#3AD6F2] !rounded-[10px] hover:shadow-md transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FaEdit className="w-3.5 h-3.5" />
                            Edit Office
                        </button>
                    </div>
                </div>

                {/* Summary Metrics Section */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {/* Staff Members */}
                    <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px] flex-1 max-w-[220px]">
                        <div className='flex items-center justify-between gap-2'>
                            <div className="w-10 h-10 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z" stroke="#3AD6F2" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{officeData.staff_count || officeData.staff || 0}</p>
                            </div>
                        </div>
                        <div className="flex flex-col mt-2">
                            <p className="text-xs font-medium text-gray-500 whitespace-nowrap">Staff Members</p>
                        </div>
                    </div>

                    {/* Active Clients */}
                    <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px] flex-1 max-w-[220px]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.6673 14V12.6667C10.6673 11.9594 10.3864 11.2811 9.88627 10.781C9.38617 10.281 8.70789 10 8.00065 10H4.00065C3.29341 10 2.61513 10.281 2.11503 10.781C1.61494 11.2811 1.33398 11.9594 1.33398 12.6667V14M14.6673 14V12.6667C14.6669 12.0758 14.4702 11.5018 14.1082 11.0349C13.7462 10.5679 13.2394 10.2344 12.6673 10.0867M10.6673 2.08667C11.2409 2.23353 11.7493 2.56713 12.1124 3.03487C12.4755 3.50261 12.6725 4.07789 12.6725 4.67C12.6725 5.26211 12.4755 5.83739 12.1124 6.30513C11.7493 6.77287 11.2409 7.10647 10.6673 7.25333M8.66732 4.66667C8.66732 6.13943 7.47341 7.33333 6.00065 7.33333C4.52789 7.33333 3.33398 6.13943 3.33398 4.66667C3.33398 3.19391 4.52789 2 6.00065 2C7.47341 2 8.66732 3.19391 8.66732 4.66667Z" stroke="#3AD6F2" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0">{officeData.clients_count || officeData.clients || 0}</p>
                            </div>
                        </div>
                        <div className="flex flex-col mt-2">
                            <p className="text-xs font-medium text-gray-500 whitespace-nowrap">Active Clients</p>
                        </div>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px] flex-1 max-w-[220px]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 2V18M14 6H9.5C8.57174 6 7.6815 6.36875 7.02513 7.02513C6.36875 7.6815 6 8.57174 6 9.5C6 10.4283 6.36875 11.3185 7.02513 11.9749C7.6815 12.6313 8.57174 13 9.5 13H14.5C15.4283 13 16.3185 13.3687 16.9749 14.0251C17.6313 14.6815 18 15.5717 18 16.5C18 17.4283 17.6313 18.3185 16.9749 18.9749C16.3185 19.6313 15.4283 20 14.5 20H5" stroke="#3AD6F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0 font-[BasisGrotesquePro]">
                                    {officeData.monthly_revenue?.formatted || formatCurrency(officeData.monthly_revenue?.value || officeData.monthlyRevenue || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col mt-2">
                            <p className="text-xs font-medium text-gray-500 whitespace-nowrap">Monthly Revenue</p>
                        </div>
                    </div>

                    {/* Growth Rate */}
                    <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px] flex-1 max-w-[220px]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#FFF5F0] flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="10" viewBox="0 0 21 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.5 0.5L12 9L7 4L0.5 10.5" stroke="#F56D2D" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 leading-none mb-0 font-[BasisGrotesquePro]">
                                    {officeData.growth_rate?.display || (officeData.growth_rate?.percentage ? `+${officeData.growth_rate.percentage}%` : officeData.growthRate ? `+${officeData.growthRate}%` : 'N/A')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col mt-2">
                            <p className="text-xs font-medium text-gray-500 whitespace-nowrap">Growth Rate</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg p-2 mb-6 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-semibold !rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-[#3AD6F2] text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area - Conditional Rendering Based on Active Tab */}
                {activeTab === 'Overview' && (
                    <>
                        <div className="flex flex-col lg:flex-row gap-6 mb-6">
                            {/* Office Information */}
                            <div className="flex-1 bg-white !rounded-xl p-6 border border-[#E8F0FF] shadow-sm">
                                <h6 className="text-lg font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Office Information</h6>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 5C10 8 6 11 6 11C6 11 2 8 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>

                                        <div>
                                            <p className="font-medium text-sm text-gray-700 mb-0">{officeData?.street_address || officeData?.address || 'N/A'}</p>
                                            <p className="text-sm text-gray-700 mb-0">{officeData?.city || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.0007 8.46005V9.96005C11.0013 10.0993 10.9727 10.2371 10.917 10.3647C10.8612 10.4923 10.7793 10.6068 10.6767 10.701C10.5741 10.7951 10.453 10.8668 10.3211 10.9114C10.1892 10.956 10.0494 10.9726 9.9107 10.96C8.37212 10.7929 6.8942 10.2671 5.5957 9.42505C4.38761 8.65738 3.36337 7.63313 2.5957 6.42505C1.75069 5.12065 1.22482 3.63555 1.0607 2.09005C1.0482 1.95178 1.06464 1.81243 1.10895 1.68086C1.15326 1.54929 1.22448 1.42839 1.31808 1.32586C1.41168 1.22332 1.5256 1.1414 1.65259 1.08531C1.77959 1.02922 1.91687 1.00018 2.0557 1.00005H3.5557C3.79835 0.99766 4.03359 1.08359 4.21758 1.24181C4.40156 1.40004 4.52174 1.61977 4.5557 1.86005C4.61901 2.34008 4.73642 2.81141 4.9057 3.26505C4.97297 3.44401 4.98753 3.63851 4.94765 3.82549C4.90777 4.01247 4.81513 4.1841 4.6807 4.32005L4.0457 4.95505C4.75748 6.20682 5.79393 7.24327 7.0457 7.95505L7.6807 7.32005C7.81664 7.18562 7.98828 7.09297 8.17526 7.0531C8.36224 7.01322 8.55674 7.02778 8.7357 7.09505C9.18934 7.26432 9.66067 7.38174 10.1407 7.44505C10.3836 7.47931 10.6054 7.60165 10.764 7.7888C10.9225 7.97594 11.0068 8.21484 11.0007 8.46005Z" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                        <p className="text-sm text-gray-700 mb-0">{officeData?.phone_number || officeData?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 2H2C1.44772 2 1 2.44772 1 3V9C1 9.55228 1.44772 10 2 10H10C10.5523 10 11 9.55228 11 9V3C11 2.44772 10.5523 2 10 2Z" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M11 3.5L6.515 6.35C6.36064 6.44671 6.18216 6.49801 6 6.49801C5.81784 6.49801 5.63936 6.44671 5.485 6.35L1 3.5" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>


                                        <p className="text-sm text-gray-700 mb-0">{officeData?.email || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333ZM8 13.3333C5.05933 13.3333 2.66667 10.9407 2.66667 8C2.66667 5.05933 5.05933 2.66667 8 2.66667C10.9407 2.66667 13.3333 5.05933 13.3333 8C13.3333 10.9407 10.9407 13.3333 8 13.3333Z" fill="#6B7280" />
                                            <path d="M8.66667 4.66667V8.66667L11.3333 10.1333" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="text-sm text-gray-700 mb-0">{officeData?.operation_hours_display || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.6667 2.66667H3.33333C2.59667 2.66667 2 3.26333 2 4V13.3333C2 14.07 2.59667 14.6667 3.33333 14.6667H12.6667C13.4033 14.6667 14 14.07 14 13.3333V4C14 3.26333 13.4033 2.66667 12.6667 2.66667Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10.6667 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M5.33333 1.33333V4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M2 6.66667H14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="text-sm text-gray-700 mb-0">Established: {officeData?.established_date || officeData?.established || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Office Performance - Map */}
                            <div className="flex-1 bg-white !rounded-xl p-6 border border-[#E8F0FF] shadow-sm">
                                <h6 className="text-lg font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Office Performance Map</h6>
                                <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                                    {(() => {
                                        const address = officeData?.full_address ||
                                            (officeData?.street_address || officeData?.city || officeData?.state || officeData?.zip_code
                                                ? `${officeData.street_address || ''}, ${officeData.city || ''}, ${officeData.state || ''} ${officeData.zip_code || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                                                : null);

                                        if (address) {
                                            // Construct Google Maps embed URL
                                            // Note: For production, add VITE_GOOGLE_MAPS_API_KEY to your .env file
                                            const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
                                            const mapsUrl = googleMapsApiKey
                                                ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address)}`
                                                : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

                                            return (
                                                <>
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        allowFullScreen
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        src={mapsUrl}
                                                        title="Office Location Map"
                                                    />
                                                    <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-[#3AD6F2]"></div>
                                                        <span className="text-xs text-gray-700 font-medium">
                                                            {officeData.name || 'Office Location'}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md text-xs text-[#3AD6F2] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#3AD6F2" />
                                                        </svg>
                                                        Open in Maps
                                                    </a>
                                                </>
                                            );
                                        }

                                        return (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 text-gray-400">
                                                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#9CA3AF" />
                                                    </svg>
                                                    <p className="text-sm text-gray-500">Map View</p>
                                                    <p className="text-xs text-gray-400 mt-1">Address not available</p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </>
                )}


                {/* Clients Tab Content */}
                {activeTab === 'Clients' && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-6">
                            <p className="text-lg font-medium text-gray-600 mb-2">Office Clients</p>
                            <p className="text-sm text-gray-600">Clients served by this office location</p>
                        </div>

                        {/* Loading State */}
                        {clientsLoading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="text-gray-500">Loading clients...</div>
                            </div>
                        )}

                        {/* Error State */}
                        {clientsError && !clientsLoading && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-600">{clientsError}</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!clientsLoading && !clientsError && clients.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-gray-500 text-sm mb-2">No clients found</p>
                                <p className="text-gray-400 text-xs">This office location has no active clients assigned.</p>
                            </div>
                        )}

                        {/* Clients List */}
                        {!clientsLoading && clients.length > 0 && (
                            <>
                                {/* Table Header - Desktop */}
                                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 mb-4">
                                    <div className="col-span-3">
                                        <span className="text-sm font-semibold text-gray-500">Client</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm font-semibold text-gray-500">Type</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm font-semibold text-gray-500">Assigned To</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm font-semibold text-gray-500">Last Service</span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-semibold text-gray-500">Revenue</span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="text-sm font-semibold text-gray-500">Status</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {clients.map((client) => (
                                        <div key={client.id} className="bg-white border border-[#E8F0FF] !rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                                            {/* Mobile Layout */}
                                            <div className="md:hidden space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-gray-700 mb-1">{client.client_name}</div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                                {client.client_type}
                                                            </span>
                                                            <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                                                                }`}>
                                                                {client.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-medium">Assigned To:</span> {client.assigned_to || 'Unassigned'}
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-medium">Last Service:</span> {client.last_service || 'N/A'}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700">
                                                        <span className="font-medium">Revenue:</span> {client.revenue?.formatted || `$${client.revenue?.value?.toLocaleString() || '0'}`}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop Layout */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                                {/* Client */}
                                                <div className="col-span-3">
                                                    <span className="text-sm font-medium text-gray-700">{client.client_name}</span>
                                                </div>

                                                {/* Type */}
                                                <div className="col-span-2">
                                                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                        {client.client_type}
                                                    </span>
                                                </div>

                                                {/* Assigned To */}
                                                <div className="col-span-2">
                                                    <span className="text-sm font-medium text-gray-700">{client.assigned_to || 'Unassigned'}</span>
                                                </div>

                                                {/* Last Service */}
                                                <div className="col-span-2">
                                                    <span className="text-sm text-gray-700">{client.last_service || 'N/A'}</span>
                                                </div>

                                                {/* Revenue */}
                                                <div className="col-span-1 text-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {client.revenue?.formatted || `$${client.revenue?.value?.toLocaleString() || '0'}`}
                                                    </span>
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-2 flex justify-center">
                                                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'
                                                        }`}>
                                                        {client.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Performance Tab Content */}
                {activeTab === 'Performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Performance Chart */}
                        <div className="bg-white !rounded-xl p-6 border border-[#E8F0FF] shadow-sm">
                            <h6 className="text-lg font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Monthly Performance</h6>
                            {/* Loading State */}
                            {performanceLoading && (
                                <div className="flex justify-center items-center" style={{ height: '300px' }}>
                                    <div className="text-gray-500">Loading performance data...</div>
                                </div>
                            )}
                            {/* Error State */}
                            {performanceError && !performanceLoading && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-600">{performanceError}</p>
                                </div>
                            )}

                            {/* Chart */}
                            {!performanceLoading && !performanceError && (
                                <div className="relative" style={{ height: '300px', width: '100%' }}>
                                    {performanceData?.monthly_performance && performanceData.monthly_performance.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={performanceData.monthly_performance}
                                                    margin={{ top: 20, right: 80, left: 0, bottom: 20 }}
                                                >
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        stroke="#E5E7EB"
                                                        vertical={false}
                                                        horizontal={true}
                                                    />
                                                    <XAxis
                                                        dataKey="month"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 400 }}
                                                        interval={0}
                                                        padding={{ left: 0, right: 0 }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 'dataMax + 2']}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 400 }}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                                                        <p className="text-sm font-semibold text-gray-700">
                                                                            {data.month_full} {data.year}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600">
                                                                            Revenue: ${data.revenue?.toLocaleString() || '0'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3B82F6"
                                                        strokeWidth={2.5}
                                                        dot={{
                                                            fill: '#ffffff',
                                                            r: 5,
                                                            strokeWidth: 2,
                                                            stroke: '#3B82F6',
                                                            cursor: 'pointer'
                                                        }}
                                                        activeDot={{ r: 6, strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                            {/* Growth Label for last month - positioned near the last data point */}
                                            {performanceData.monthly_performance.length > 0 && (
                                                <div className="absolute top-16 right-8">
                                                    <div className="bg-white border border-[#3AD6F2] rounded px-3 py-2 shadow-sm">
                                                        <div className="text-xs font-medium text-gray-700">
                                                            {performanceData.monthly_performance[performanceData.monthly_performance.length - 1].month}
                                                        </div>
                                                        <div className="text-xs font-semibold text-[#3AD6F2]">
                                                            Growth: {performanceData.monthly_performance[performanceData.monthly_performance.length - 1].value}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex justify-center items-center h-full">
                                            <p className="text-gray-500 text-sm">No performance data available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Key Metrics */}
                        <div className="bg-white !rounded-xl p-6 border border-[#E8F0FF] shadow-sm">
                            <h6 className="text-lg font-bold text-gray-900 mb-6 font-[BasisGrotesquePro]">Key Metrics</h6>

                            {/* Loading State */}
                            {performanceLoading && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="text-gray-500">Loading metrics...</div>
                                </div>
                            )}

                            {/* Error State */}
                            {performanceError && !performanceLoading && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-600">{performanceError}</p>
                                </div>
                            )}

                            {/* Metrics */}
                            {!performanceLoading && !performanceError && (
                                <div className="space-y-6">
                                    {/* Average Revenue per Client */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Average Revenue per Client:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.average_revenue_per_client?.formatted ||
                                                (performanceData?.key_metrics?.average_revenue_per_client?.value ?
                                                    `$${performanceData.key_metrics.average_revenue_per_client.value.toFixed(0)}` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Task Completion Rate */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Task Completion Rate:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.task_completion_rate?.formatted ||
                                                (performanceData?.key_metrics?.task_completion_rate?.value !== undefined ?
                                                    `${performanceData.key_metrics.task_completion_rate.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Staff Utilization */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Staff Utilization:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.staff_utilization?.formatted ||
                                                (performanceData?.key_metrics?.staff_utilization?.value !== undefined ?
                                                    `${performanceData.key_metrics.staff_utilization.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>

                                    {/* Client Retention */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Client Retention:</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {performanceData?.key_metrics?.client_retention?.formatted ||
                                                (performanceData?.key_metrics?.client_retention?.value !== undefined ?
                                                    `${performanceData.key_metrics.client_retention.value.toFixed(0)}%` :
                                                    'N/A')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
            {activeTab === 'Settings' && (
                <div className="space-y-6 p-6">


                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-6 !rounded-xl bg-white p-6 border border-[#E8F0FF] shadow-sm">
                            <div>
                                <h5 className="text-lg font-semibold text-gray-500">Office Settings</h5>
                                <p className="text-sm text-[#64748B]">
                                    Configure office-specific settings and preferences.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-base font-medium tracking-wide text-gray-500">
                                        Operating Hours
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        {office.hours || 'Mon–Fri 9:00 AM – 6:00 PM'}
                                    </p>
                                </div>
                                <div className='text-end'>
                                    <p className="text-base font-medium tracking-wide text-gray-700">
                                        Timezone
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">{getTimezoneLabel(timezone)}</p>
                                </div>
                                <div>
                                    <p className="text-base font-medium tracking-wide text-gray-500">
                                        Office Manager
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-600">{officeManager}</p>
                                    {managerEmail !== 'N/A' && (
                                        <p className="mt-1 text-xs text-gray-500">{managerEmail}</p>
                                    )}
                                    {officeManager !== 'N/A' && officeData?.manager && (
                                        <button
                                            onClick={handleRemoveManager}
                                            disabled={removingManager}
                                            className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                        >
                                            {removingManager ? 'Removing...' : 'Remove Manager'}
                                        </button>
                                    )}
                                </div>
                                <div className='text-end'>
                                    <p className="text-base font-medium tracking-wide text-gray-700">
                                        Status
                                    </p>
                                    <span className="mt-1 inline-flex items-center rounded-full bg-[#22C55E] px-3 py-1 text-xs font-semibold text-[#ffffff]">
                                        {office.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* <div className="space-y-6 rounded-xl bg-white p-6 border border-[#E4ECFF]">
                            <div>
                                <h5 className="text-lg font-medium text-gray-500">Tax Prep Software</h5>
                                <p className="text-sm text-[#64748B]">
                                    Configure a one-click login link for this office.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-base font-medium tracking-wide text-gray-500">
                                    Login URL
                                </label>
                                <input
                                    type="url"
                                    value={taxPrepUrl}
                                    onChange={(event) => setTaxPrepUrl(event.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full rounded-lg border border-[#E4ECFF] px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                />
                                <p className="text-xs text-dark-600">
                                    This link will be available to Firm Admins and Tax Preparers assigned to this office.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between " style={{
                                justifyContent:
                                    'end'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleTestTaxPrep}
                                    className="inline-flex items-center justify-center rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm gap-2 font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.25 2.25H15.75V6.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M7.5 10.5L15.75 2.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M13.5 9.75V14.25C13.5 14.6478 13.342 15.0294 13.0607 15.3107C12.7794 15.592 12.3978 15.75 12 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V6C2.25 5.60218 2.40804 5.22064 2.68934 4.93934C2.97064 4.65804 3.35218 4.5 3.75 4.5H8.25" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>

                                    Test Open
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveTaxPrep}
                                    className="inline-flex items-center justify-center rounded-lg bg-[#F56D2D] px-5 py-2 text-sm gap-2 font-semibold text-white transition-colors hover:bg-orange-600"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                        />
                                    </svg>
                                    Save
                                </button>
                            </div>
                        </div> */}
                    </div>

                    <div className="space-y-6 rounded-xl bg-white p-6 ">
                        <div>
                            <h5 className="text-lg font-semibold text-gray-600">Office Branding</h5>
                            <p className="text-sm text-[#64748B]">
                                Override firm branding for this office.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Office Logo
                                </label>
                                <div className="space-y-2">
                                    {logoPreview && (
                                        <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3AD6F2] file:text-white hover:file:bg-[#2bc5db] cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500">Upload office logo (PNG, JPG, or SVG)</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Favicon
                                </label>
                                <div className="space-y-2">
                                    {faviconPreview && (
                                        <div className="relative w-16 h-16 border-2 border-gray-200 rounded-lg overflow-hidden">
                                            <img
                                                src={faviconPreview}
                                                alt="Favicon preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFaviconChange}
                                        className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3AD6F2] file:text-white hover:file:bg-[#2bc5db] cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500">Upload favicon (16x16 or 32x32 px recommended)</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Primary Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={branding.primaryColor}
                                        onChange={handleBrandingChange('primaryColor')}
                                        className="h-10 w-25 cursor-pointer bg-white p-1"
                                    />
                                    <input
                                        type="text"
                                        value={branding.primaryColor}
                                        onChange={handleBrandingChange('primaryColor')}
                                        className="w-full px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium tracking-wide text-gray-700">
                                    Secondary Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={branding.secondaryColor}
                                        onChange={handleBrandingChange('secondaryColor')}
                                        className="h-10 w-25 cursor-pointer bg-white p-1"
                                    />
                                    <input
                                        type="text"
                                        value={branding.secondaryColor}
                                        onChange={handleBrandingChange('secondaryColor')}
                                        className="w-full px-4 py-2 text-sm text-[#1F2937] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                                    />
                                </div>
                            </div>

                        </div>



                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleResetBranding}
                                className="inline-flex items-center justify-center rounded-lg border border-[#E4ECFF] bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-[#F8FAFC]"
                                style={{ borderRadius: '8px' }}
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBranding}
                                disabled={savingBranding}
                                className="inline-flex items-center justify-center rounded-lg bg-[#F56D2D] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderRadius: '8px' }}
                            >
                                {savingBranding ? 'Saving...' : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Taxpayer Management Modal */}
            <TaxpayerManagementModal
                show={showTaxpayerModal}
                onClose={() => setShowTaxpayerModal(false)}
                officeId={officeId}
                officeName={officeData?.name || 'Office'}
                onUpdate={handleTaxpayerUpdate}
            />

            {/* Set Primary Office Confirmation Modal */}
            <ConfirmationModal
                isOpen={showSetPrimaryConfirm}
                onClose={() => {
                    if (!settingPrimary) {
                        setShowSetPrimaryConfirm(false);
                    }
                }}
                onConfirm={confirmSetPrimaryOffice}
                title="Set as Primary Office"
                message="Are you sure you want to set this office as the primary office? This will replace the current primary office."
                confirmText="Set as Primary"
                cancelText="Cancel"
                isLoading={settingPrimary}
            />

            {/* Edit Office Modal */}
            <EditOfficeModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                officeId={officeId}
                officeData={officeData}
                onOfficeUpdated={handleOfficeUpdated}
            />

            {/* Remove Manager Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRemoveManagerConfirm}
                onClose={() => {
                    if (!removingManager) {
                        setShowRemoveManagerConfirm(false);
                    }
                }}
                onConfirm={confirmRemoveManager}
                title="Remove Manager"
                message="Are you sure you want to remove the manager from this office?"
                confirmText="Remove"
                cancelText="Cancel"
                isLoading={removingManager}
                isDestructive={true}
            />
        </>
    );
}

