import React, { useState, useEffect, useRef } from "react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../style/FirmManagement.css';
import { useTheme } from '../Context/ThemeContext';

export default function FirmManagement() {
    const PAGE_SIZE = 10;
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [planFilter, setPlanFilter] = useState("All Plans");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showAddFirmModal, setShowAddFirmModal] = useState(false);
    const [newFirm, setNewFirm] = useState({
        firmName: "",
        ownerName: "",
        email: "",
        phone: ""
    });
    const [phoneCountry, setPhoneCountry] = useState('us');

    // API state management
    const [firms, setFirms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: PAGE_SIZE,
        total_count: 0,
        total_pages: 1
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [creatingFirm, setCreatingFirm] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [createSuccess, setCreateSuccess] = useState(false);

    // Firm details modal state
    const [showFirmDetailsModal, setShowFirmDetailsModal] = useState(false);
    const [selectedFirm, setSelectedFirm] = useState(null);
    const [loadingFirmDetails, setLoadingFirmDetails] = useState(false);
    const [firmDetailsError, setFirmDetailsError] = useState(null);

    // Suspend modal state
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [firmToSuspend, setFirmToSuspend] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendingFirm, setSuspendingFirm] = useState(false);
    const [suspendError, setSuspendError] = useState(null);
    const [suspendSuccess, setSuspendSuccess] = useState(false);

    // Unsuspend modal state
    const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
    const [firmToUnsuspend, setFirmToUnsuspend] = useState(null);
    const [unsuspendReason, setUnsuspendReason] = useState('');
    const [unsuspendingFirm, setUnsuspendingFirm] = useState(false);
    const [unsuspendError, setUnsuspendError] = useState(null);
    const [unsuspendSuccess, setUnsuspendSuccess] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [firmToDelete, setFirmToDelete] = useState(null);
    const [deletingFirm, setDeletingFirm] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Client-side pagination for displaying firm cards
    const [firmCardsCurrentPage, setFirmCardsCurrentPage] = useState(1);
    const [showAllFirmCards, setShowAllFirmCards] = useState(false);
    const FIRM_CARDS_PER_PAGE = 3;

    // Assign clients modal state
    const [showAssignClientsModal, setShowAssignClientsModal] = useState(false);
    const [assignClientsFirm, setAssignClientsFirm] = useState(null);
    const [assignClientOptions, setAssignClientOptions] = useState([]);
    const [assignClientsSummary, setAssignClientsSummary] = useState(null);
    const [loadingAssignClients, setLoadingAssignClients] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [assigningClient, setAssigningClient] = useState(false);
    const [assignClientError, setAssignClientError] = useState(null);
    const [assignClientSuccess, setAssignClientSuccess] = useState(false);
    const pdfRef = useRef(null);

    // Fetch firms data from API
    const fetchFirms = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await superAdminAPI.getFirms(
                currentPage, // page
                PAGE_SIZE, // limit
                searchTerm, // search
                statusFilter === "All Status" ? '' : statusFilter.toLowerCase(), // status
                planFilter === "All Plans" ? '' : planFilter.toLowerCase() // plan
            );

            if (response.success && response.data) {
                setFirms(response.data.firms || []);
                const paginationData = response.data.pagination || {};
                const totalCount = paginationData.total_count ?? 0;
                const totalPages = paginationData.total_pages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
                setPagination({
                    page: paginationData.page ?? currentPage,
                    page_size: paginationData.page_size ?? PAGE_SIZE,
                    total_count: totalCount,
                    total_pages: totalPages
                });
                // Reset client-side pagination when data changes
                setFirmCardsCurrentPage(1);
                setShowAllFirmCards(false);
            } else {
                throw new Error(response.message || 'Failed to fetch firms');
            }
        } catch (err) {
            console.error('Error fetching firms:', err);
            setError(handleAPIError(err));
            setFirms([]);
        } finally {
            setLoading(false);
        }
    };

    // Load firms on component mount and when filters change
    useEffect(() => {
        fetchFirms();
    }, [searchTerm, statusFilter, planFilter, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, planFilter]);

    // Helper function to get plan color
    const getPlanColor = (plan, firm = null) => {
        if (firm && firm.is_billing_bypass) {
            return 'bg-purple-600';
        }
        const colors = {
            'starter': 'bg-[#FBBF24]',
            'team': 'bg-[#22C55E]',
            'growth': 'bg-[#22C55E]',
            'pro': 'bg-[#1E40AF]',
            'elite': 'bg-[#3AD6F2]',
            'developer plan': 'bg-purple-600'
        };
        return colors[plan?.toLowerCase()] || 'bg-gray-500';
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-500',
            'trial': 'bg-blue-600',
            'suspended': 'bg-red-500',
            'inactive': 'bg-gray-500'
        };
        return colors[status?.toLowerCase()] || 'bg-gray-500';
    };

    // Helper function to format status display
    const formatStatus = (status) => {
        return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    };

    // Helper function to format plan display
    const formatPlan = (firm) => {
        if (!firm) return 'None';

        // Check for Developer Plan/Bypass mode
        if (typeof firm === 'object' && (firm.is_billing_bypass || firm.subscription_plan_name === 'Developer Plan')) {
            return 'Developer Plan';
        }

        // If it's a firm object with subscription_plan_name
        if (typeof firm === 'object' && firm.subscription_plan_name) {
            return firm.subscription_plan_name;
        }

        // Fallback for when only the plan type string is passed
        const plan = typeof firm === 'string' ? firm : firm.subscription_plan;

        if (!plan) {
            return 'None';
        }

        if (plan.toLowerCase() === 'developer') return 'Developer Plan';

        return plan.charAt(0).toUpperCase() + plan.slice(1);
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return '$0.00';
        }
        return Number(value).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Helper function to format revenue (shows "None" when 0 or null)
    const formatRevenue = (value) => {
        if (value === null || value === undefined || value === 0 || Number(value) === 0) {
            return 'None';
        }
        return formatCurrency(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Client-side pagination logic for firm cards
    const totalFirmCards = firms.length;
    const totalFirmCardsPages = Math.ceil(totalFirmCards / FIRM_CARDS_PER_PAGE);
    const shouldShowFirmCardsPagination = totalFirmCards > FIRM_CARDS_PER_PAGE && !showAllFirmCards;
    const displayedFirmCards = showAllFirmCards
        ? firms
        : firms.slice((firmCardsCurrentPage - 1) * FIRM_CARDS_PER_PAGE, firmCardsCurrentPage * FIRM_CARDS_PER_PAGE);

    const handleViewAllFirmCards = (e) => {
        e.preventDefault();
        setShowAllFirmCards(!showAllFirmCards);
        if (showAllFirmCards) {
            setFirmCardsCurrentPage(1);
        }
    };

    const handleFirmCardsPageChange = (newPage) => {
        setFirmCardsCurrentPage(newPage);
    };

    const handleExportReport = async () => {
        if (!pdfRef.current) {
            toast.warning('No data available to export.', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        if (firms.length === 0) {
            toast.warning('No firms available to export.', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            const canvas = await html2canvas(pdfRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

            // Generate PDF blob
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Open PDF in new window first
            window.open(pdfUrl, '_blank');

            // Then trigger download
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `firms-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the blob URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 100);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const toggleDropdown = (firmId) => {
        setActiveDropdown(activeDropdown === firmId ? null : firmId);
    };

    // Fetch firm details
    const fetchFirmDetails = async (firmId) => {
        try {
            setLoadingFirmDetails(true);
            setFirmDetailsError(null);

            const response = await superAdminAPI.getFirmOverview(firmId);

            if (response.success && response.data) {
                setSelectedFirm(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch firm details');
            }
        } catch (err) {
            console.error('Error fetching firm details:', err);
            setFirmDetailsError(handleAPIError(err));
        } finally {
            setLoadingFirmDetails(false);
        }
    };

    // Suspend firm function
    const suspendFirm = async () => {
        if (!suspendReason.trim()) {
            setSuspendError('Please provide a reason for suspension');
            return;
        }

        try {
            setSuspendingFirm(true);
            setSuspendError(null);

            const response = await superAdminAPI.suspendFirm(firmToSuspend.id, suspendReason);

            if (response.success) {
                setSuspendSuccess(true);
                // Refresh firms list
                await fetchFirms();
                // Close modal after a short delay
                setTimeout(() => {
                    setShowSuspendModal(false);
                    setSuspendSuccess(false);
                    setSuspendReason('');
                    setFirmToSuspend(null);
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to suspend firm');
            }
        } catch (err) {
            console.error('Error suspending firm:', err);
            setSuspendError(handleAPIError(err));
        } finally {
            setSuspendingFirm(false);
        }
    };

    const deleteFirm = async () => {
        if (!firmToDelete) return;

        try {
            setDeletingFirm(true);
            setDeleteError(null);

            const response = await superAdminAPI.deleteFirm(firmToDelete.id);

            if (response.success) {
                toast.success(response.message || 'Firm deleted successfully', {
                    position: "top-right",
                    autoClose: 3000,
                });

                // Close modal
                setShowDeleteModal(false);
                setFirmToDelete(null);

                // Refresh firms list
                await fetchFirms();
            } else {
                throw new Error(response.message || 'Failed to delete firm');
            }
        } catch (err) {
            console.error('Error deleting firm:', err);
            setDeleteError(handleAPIError(err));
            toast.error(handleAPIError(err), {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setDeletingFirm(false);
        }
    };

    const unsuspendFirm = async () => {
        try {
            setUnsuspendingFirm(true);
            setUnsuspendError(null);

            const response = await superAdminAPI.reactivateFirm(firmToUnsuspend.id, unsuspendReason);

            if (response.success) {
                setUnsuspendSuccess(true);
                await fetchFirms();
                setTimeout(() => {
                    setShowUnsuspendModal(false);
                    setUnsuspendSuccess(false);
                    setUnsuspendReason('');
                    setFirmToUnsuspend(null);
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to unsuspend firm');
            }
        } catch (err) {
            console.error('Error unsuspending firm:', err);
            setUnsuspendError(handleAPIError(err));
        } finally {
            setUnsuspendingFirm(false);
        }
    };

    const loadUnassignedTaxpayers = async (page = 1) => {
        try {
            setLoadingAssignClients(true);
            setAssignClientError(null);

            const response = await superAdminAPI.getUnassignedTaxpayers(page, 20, '');

            if (response.success && response.data) {
                const taxpayers = response.data.taxpayers || [];
                const formattedOptions = taxpayers.map((taxpayer) => ({
                    id: taxpayer.id,
                    label: taxpayer.full_name || `${taxpayer.first_name || ''} ${taxpayer.last_name || ''}`.trim() || taxpayer.email || `Taxpayer ${taxpayer.id}`,
                    email: taxpayer.email,
                }));

                setAssignClientOptions(formattedOptions);
                setSelectedClientId((prev) => {
                    if (prev && formattedOptions.some((option) => option.id?.toString() === prev.toString())) {
                        return prev.toString();
                    }
                    return formattedOptions[0]?.id?.toString() || '';
                });
                setAssignClientsSummary(response.data.summary || null);
            } else {
                throw new Error(response.message || 'Failed to load unassigned taxpayers');
            }
        } catch (error) {
            console.error('Error fetching unassigned taxpayers:', error);
            setAssignClientError(handleAPIError(error));
            setAssignClientOptions([]);
            setSelectedClientId('');
        } finally {
            setLoadingAssignClients(false);
        }
    };

    const openAssignClientsModal = (firm) => {
        setAssignClientsFirm(firm);
        setAssignClientError(null);
        setAssignClientSuccess(false);
        setShowAssignClientsModal(true);
        loadUnassignedTaxpayers();
    };

    const closeAssignClientsModal = () => {
        setShowAssignClientsModal(false);
        setAssignClientsFirm(null);
        setAssignClientOptions([]);
        setSelectedClientId('');
        setAssignClientsSummary(null);
        setAssignClientError(null);
        setAssignClientSuccess(false);
        setAssigningClient(false);
        setLoadingAssignClients(false);
    };

    const handleAssignClient = async () => {
        if (!selectedClientId) {
            setAssignClientError('Please select a taxpayer to assign.');
            return;
        }

        try {
            setAssigningClient(true);
            setAssignClientError(null);

            const firmId = assignClientsFirm?.id || assignClientsFirm?.firm_id;
            if (!firmId) {
                throw new Error('Firm information missing. Please reopen the modal.');
            }

            const response = await superAdminAPI.assignTaxpayerToFirm({
                taxpayerId: Number(selectedClientId),
                firmId: Number(firmId),
            });

            if (response.success) {
                setAssignClientSuccess(true);
                await fetchFirms();
                await loadUnassignedTaxpayers();
                setTimeout(() => {
                    closeAssignClientsModal();
                }, 1200);
            } else {
                throw new Error(response.message || 'Failed to assign client. Please try again.');
            }
        } catch (error) {
            console.error('Error assigning client:', error);
            setAssignClientError(handleAPIError(error));
        } finally {
            setAssigningClient(false);
        }
    };

    const handleAction = (action, firmId) => {
        console.log(`${action} for firm ${firmId}`);
        setActiveDropdown(null);

        if (action === 'View Details') {
            navigate(`/superadmin/firms/${firmId}`);
        } else if (action === 'Login as Firm') {
            // Navigate to firm details page and trigger login
            navigate(`/superadmin/firms/${firmId}?action=login`);
        } else if (action === 'Edit User') {
            navigate(`/superadmin/firms/${firmId}?tab=Settings`);
        } else if (action === 'Send Message') {
            // TODO: Implement message functionality
            console.log('Send message to firm:', firmId);

        } else if (action === 'Suspend Firm') {
            const firm = firms.find(f => f.id === firmId);
            setFirmToSuspend(firm);
            setShowSuspendModal(true);
        } else if (action === 'Unsuspend Firm' || action === 'Reactivate Firm') {
            const firm = firms.find(f => f.id === firmId);
            setFirmToUnsuspend(firm);
            setShowUnsuspendModal(true);
        } else if (action === 'Assign Clients') {
            const firm = firms.find(f => f.id === firmId);
            openAssignClientsModal(firm);
        } else if (action === 'Delete') {
            const firm = firms.find(f => f.id === firmId);
            setFirmToDelete(firm);
            setShowDeleteModal(true);
        }
    };

    const handleAddFirm = () => {
        setShowAddFirmModal(true);
    };

    const handleCloseModal = () => {
        setShowAddFirmModal(false);
        setNewFirm({
            firmName: "",
            ownerName: "",
            email: "",
            phone: ""
        });
    };

    const handleInputChange = (field, value) => {
        setNewFirm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCreateFirm = async () => {
        if (!newFirm.firmName.trim() || !newFirm.ownerName.trim() || !newFirm.email.trim()) {
            setCreateError('Please fill in all required fields');
            return;
        }

        try {
            setCreatingFirm(true);
            setCreateError(null);

            const firmData = {
                firm_name: newFirm.firmName,
                owner_name: newFirm.ownerName,
                email: newFirm.email,
                phone_number: newFirm.phone
            };

            const response = await superAdminAPI.createFirm(firmData);

            if (response.success) {
                setCreateSuccess(true);
                // Refresh firms list
                await fetchFirms();
                // Close modal after a short delay
                setTimeout(() => {
                    handleCloseModal();
                    setCreateSuccess(false);
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to create firm');
            }
        } catch (err) {
            console.error('Error creating firm:', err);
            setCreateError(handleAPIError(err));
        } finally {
            setCreatingFirm(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    const closeFirmDetailsModal = () => {
        setShowFirmDetailsModal(false);
        setSelectedFirm(null);
        setFirmDetailsError(null);
    };

    return (
        <div className="min-h-screen bg-[rgb(243,247,255)] dark:bg-gray-900 lg:px-4 md:px-2 sm-px-1 lg:py-6 sm:py-2 md:px-6 transition-colors duration-200">
            {/* Hidden PDF Content */}
            <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', padding: '20mm', backgroundColor: 'white' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B4A66', marginBottom: '10px' }}>
                        Firms Report
                    </h1>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>
                        Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                        Total Firms: {firms.length}
                    </p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Firm</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Plan</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Status</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Staff</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Revenue</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#3B4A66', border: '1px solid #E5E7EB' }}>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {firms.map((firm, index) => (
                            <tr key={`${firm.id}-${index}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    <div style={{ fontWeight: '600' }}>{firm.name || firm.firm_name || firm.admin_user_name || 'Unnamed Firm'}</div>
                                    <div style={{ fontSize: '10px', color: '#6B7280' }}>{firm.admin_user_email || firm.owner_email || 'No contact email'}</div>
                                </td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    {formatPlan(firm)}
                                </td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    {formatStatus(firm.status)}
                                </td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    {firm.staff_count ?? 0}
                                </td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    {formatRevenue(firm.total_revenue)}
                                </td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#3B4A66', border: '1px solid #E5E7EB' }}>
                                    {formatDate(firm.created_at) || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mx-auto flex w-full flex-col gap-6 firmmgmt-page">
                {/* Header Section with Action Buttons */}
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl px-6 py-5 sm:flex-row sm:items-center firmmgmt-header bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 shadow-sm transition-all">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Firm Management</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all firms registered on the platform</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 firmmgmt-actions">
                        <button
                            onClick={handleExportReport}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Export Report
                        </button>
                        <button
                            onClick={handleAddFirm}
                            className="flex items-center gap-2 rounded-lg bg-[#F56D2D] px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                            style={{ borderRadius: '8px' }}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Firm
                        </button>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className=" rounded-lg mb-6  ">
                    <div className="flex flex-col lg:flex-row gap-2 firmmgmt-search-row">
                        {/* Search Bar */}
                        <div className=" relative  w-[300px] firmmgmt-search">
                            <div className="absolute inset-y-0 left-0 pl-3 pb-2     flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search Firm Management"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-gray-700 w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-fit firmmgmt-filter">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Trial">Trial</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>

                        {/* Plan Filter */}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error loading firms</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={fetchFirms}
                                        className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Firms List Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border-1 border-[#E8F0FF] dark:border-gray-700 firmmgmt-table-card transition-all">
                    {/* List Header */}
                    <div className="p-6 ">
                        <div className="flex justify-between items-start mb-2 firmmgmt-table-card-header">
                            <div>
                                <h4 className="text-md font-bold text-gray-800 dark:text-white mb-2">
                                    Firms
                                </h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Comprehensive list of all firms registered on the platform
                                </p>
                            </div>
                            {totalFirmCards > FIRM_CARDS_PER_PAGE && (
                                <button
                                    onClick={handleViewAllFirmCards}
                                    className="text-black dark:text-white text-sm font-medium hover:underline cursor-pointer px-3 py-2 transition-colors firmmgmt-view-toggle border border-[#E8F0FF] dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {showAllFirmCards ? 'Show Less' : 'View All'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table Headers */}
                    <div className="px-3 py-3 firmmgmt-table-header border-b border-[#E8F0FF] dark:border-gray-700">
                        <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-gray-600 dark:text-gray-400 firmmgmt-table-header-grid">
                            <div className="col-span-3">Firm</div>
                            <div className="col-span-2">Plan</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1">Staff</div>
                            <div className="col-span-2">Revenue</div>
                            <div className="col-span-1">Created At</div>
                            <div className="col-span-1 text-center">Actions</div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                <span className="text-gray-600">Loading firms...</span>
                            </div>
                        </div>
                    )}

                    {/* Firm Entries */}
                    {!loading && (
                        <div className="divide-y divide-gray-200 firmmgmt-table-list">
                            {displayedFirmCards.length > 0 ? displayedFirmCards.map((firm) => (
                                <div key={firm.id} className="pr-1 pl-3 py-3 transition-colors border border-[#E8F0FF] dark:border-gray-700 m-2 firmmgmt-table-row bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50" style={{ borderRadius: '7px' }}>
                                    <div className="grid grid-cols-12 gap-4 items-center firmmgmt-table-row-grid">
                                        {/* Firm Column */}
                                        <div className="col-span-3">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/superadmin/firms/${firm.id}`)}
                                                className="text-left text-sm font-semibold text-gray-900 dark:text-white truncate hover:underline"
                                            >
                                                {firm.name || firm.firm_name || firm.admin_user_name || 'Unnamed Firm'}
                                            </button>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                                {firm.admin_user_email || firm.owner_email || 'No contact email'}
                                            </div>
                                        </div>

                                        {/* Plan Column */}
                                        <div className="col-span-2">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-sm font-medium text-white ${getPlanColor(firm.subscription_plan, firm)}`}>
                                                {formatPlan(firm)}
                                            </span>
                                        </div>

                                        {/* Status Column */}
                                        <div className="col-span-2">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-sm font-medium text-white ${getStatusColor(firm.status)}`}>
                                                {formatStatus(firm.status)}
                                            </span>
                                        </div>

                                        {/* Users Column */}
                                        <div className="col-span-1 flex items-center text-sm text-gray-700 dark:text-gray-300">
                                            <svg className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                            </svg>
                                            {firm.staff_count ?? 0}
                                        </div>

                                        {/* Revenue Column */}
                                        <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                                            {formatRevenue(firm.total_revenue)}
                                        </div>

                                        {/* Last Active Column */}
                                        <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">
                                            {formatDate(firm.created_at) || (firm.trial_days_remaining ? `${firm.trial_days_remaining}d left` : '—')}
                                        </div>

                                        {/* Actions Column */}
                                        <div className="col-span-1 flex justify-center relative dropdown-container">
                                            <button
                                                onClick={() => toggleDropdown(firm.id)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="0.25" y="0.25" width="21.5" height="21.5" rx="3.75" fill={isDarkMode ? '#374151' : '#F3F7FF'} />
                                                    <rect x="0.25" y="0.25" width="21.5" height="21.5" rx="3.75" stroke={isDarkMode ? '#4B5563' : '#E8F0FF'} strokeWidth="0.5" />
                                                    <path d="M6.27344 10.1016C6.57181 10.1016 6.85795 10.2201 7.06893 10.4311C7.27991 10.642 7.39844 10.9282 7.39844 11.2266C7.39844 11.5249 7.27991 11.8111 7.06893 12.0221C6.85795 12.233 6.57181 12.3516 6.27344 12.3516C5.97507 12.3516 5.68892 12.233 5.47794 12.0221C5.26696 11.8111 5.14844 11.5249 5.14844 11.2266C5.14844 10.9282 5.26696 10.642 5.47794 10.4311C5.68892 10.2201 5.97507 10.1016 6.27344 10.1016ZM10.7734 10.1016C11.0718 10.1016 11.358 10.2201 11.5689 10.4311C11.7799 10.642 11.8984 10.9282 11.8984 11.2266C11.8984 11.5249 11.7799 11.8111 11.5689 12.0221C11.358 12.233 11.0718 12.3516 10.7734 12.3516C10.4751 12.3516 10.1889 12.233 9.97794 12.0221C9.76696 11.8111 9.64844 11.5249 9.64844 11.2266C9.64844 10.9282 9.76696 10.642 9.97794 10.4311C10.1889 10.2201 10.4751 10.1016 10.7734 10.1016ZM15.2734 10.1016C15.5718 10.1016 15.858 10.2201 16.0689 10.4311C16.2799 10.642 16.3984 10.9282 16.3984 11.2266C16.3984 11.5249 16.2799 11.8111 16.0689 12.0221C15.858 12.233 15.5718 12.3516 15.2734 12.3516C14.9751 12.3516 14.6889 12.233 14.4779 12.0221C14.267 11.8111 14.1484 11.5249 14.1484 11.2266C14.1484 10.9282 14.267 10.642 14.4779 10.4311C14.6889 10.2201 14.9751 10.1016 15.2734 10.1016Z" fill={isDarkMode ? '#9CA3AF' : '#131323'} />
                                                </svg>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === firm.id && (
                                                <div className="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg border border-[#E8F0FF] dark:border-gray-700 py-2 min-w-[180px] shadow-lg">
                                                    <button
                                                        onClick={() => handleAction('View Details', firm.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M2.04883 10C3.11049 6.61917 6.26716 4.16667 10.0005 4.16667C13.7338 4.16667 16.8905 6.61917 17.9522 10C16.8905 13.3808 13.7338 15.8333 10.0005 15.8333C6.26716 15.8333 3.11049 13.3808 2.04883 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        View Details
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction('Login as Firm', firm.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15.8333 9.16667V5.83333C15.8333 5.39131 15.6577 4.96738 15.345 4.65482C15.0325 4.34226 14.6085 4.16667 14.1667 4.16667H5.83333C5.39131 4.16667 4.96738 4.34226 4.65482 4.65482C4.34226 4.96738 4.16667 5.39131 4.16667 5.83333V14.1667C4.16667 14.6087 4.34226 15.0326 4.65482 15.3452C4.96738 15.6577 5.39131 15.8333 5.83333 15.8333H14.1667C14.6085 15.8333 15.0325 15.6577 15.345 15.3452C15.6577 15.0326 15.8333 14.6087 15.8333 14.1667V10.8333M12.5 10H18.3333M18.3333 10L16.25 7.91667M18.3333 10L16.25 12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Login as Firm
                                                    </button>

                                                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                                                    <button
                                                        onClick={() => handleAction('Edit User', firm.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M14.1667 2.5C14.3856 2.28113 14.6454 2.10752 14.9314 1.98906C15.2173 1.87061 15.5238 1.80969 15.8334 1.80969C16.1429 1.80969 16.4494 1.87061 16.7353 1.98906C17.0213 2.10752 17.2811 2.28113 17.5 2.5C17.7189 2.71887 17.8925 2.97871 18.011 3.26466C18.1294 3.55061 18.1903 3.85706 18.1903 4.16667C18.1903 4.47627 18.1294 4.78272 18.011 5.06867C17.8925 5.35462 17.7189 5.61446 17.5 5.83333L6.25004 17.0833L1.66671 18.3333L2.91671 13.75L14.1667 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Edit Firm
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction('Assign Clients', firm.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M14.1667 17.5V15.8333C14.1667 14.9493 13.8155 14.1014 13.1904 13.4763C12.5653 12.8512 11.7174 12.5 10.8334 12.5H4.16671C3.28265 12.5 2.43481 12.8512 1.80968 13.4763C1.18456 14.1014 0.833374 14.9493 0.833374 15.8333V17.5M19.1667 17.5V15.8333C19.1662 15.0948 18.9204 14.3773 18.4679 13.7936C18.0154 13.2099 17.3819 12.793 16.6667 12.6083M13.3334 2.60833C14.0503 2.79192 14.6858 3.20892 15.1396 3.79359C15.5935 4.37827 15.8399 5.09736 15.8399 5.8375C15.8399 6.57764 15.5935 7.29673 15.1396 7.88141C14.6858 8.46608 14.0503 8.88308 13.3334 9.06667M11.6667 5.83333C11.6667 7.67428 10.1743 9.16667 8.33337 9.16667C6.49242 9.16667 5.00004 7.67428 5.00004 5.83333C5.00004 3.99238 6.49242 2.5 8.33337 2.5C10.1743 2.5 11.6667 3.99238 11.6667 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Assign Clients
                                                    </button>

                                                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                                                    <button
                                                        onClick={() => {
                                                            const status = firm.status?.toLowerCase();
                                                            let action = 'Suspend Firm';
                                                            if (status === 'suspended') action = 'Unsuspend Firm';
                                                            else if (status === 'inactive') action = 'Reactivate Firm';
                                                            handleAction(action, firm.id);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M10 1.66667V5M10 15V18.3333M3.57501 3.575L5.83334 5.83333M14.1667 14.1667L16.425 16.425M1.66667 10H5M15 10H18.3333M3.57501 16.425L5.83334 14.1667M14.1667 5.83333L16.425 3.575" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        {(() => {
                                                            const status = firm.status?.toLowerCase();
                                                            if (status === 'suspended') return 'Unsuspend Firm';
                                                            if (status === 'inactive') return 'Reactivate Firm';
                                                            return 'Suspend Firm';
                                                        })()}
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction('Delete', firm.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M2.5 5H4.16667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M6.66663 5.00001V3.33334C6.66663 2.89131 6.84222 2.46739 7.15478 2.15483C7.46734 1.84227 7.89127 1.66667 8.33329 1.66667H11.6666C12.1087 1.66667 12.5326 1.84227 12.8451 2.15483C13.1577 2.46739 13.3333 2.89131 13.3333 3.33334V5.00001M15.8333 5.00001V16.6667C15.8333 17.1087 15.6577 17.5326 15.3451 17.8452C15.0326 18.1577 14.6087 18.3333 14.1666 18.3333H5.83329C5.39127 18.3333 4.96734 18.1577 4.65478 17.8452C4.34222 17.5326 4.16663 17.1087 4.16663 16.6667V5.00001H15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        Delete Firm
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-500 mb-2">No firms found</div>
                                    <div className="text-sm text-gray-400">
                                        {searchTerm || statusFilter !== "All Status" || planFilter !== "All Plans"
                                            ? "Try adjusting your search or filters"
                                            : "No firms have been registered yet"}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Client-side Pagination Controls */}
                    {shouldShowFirmCardsPagination && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8F0FF] dark:border-gray-700 firmmgmt-pagination bg-white dark:bg-gray-800 rounded-b-lg">
                            <button
                                onClick={() => handleFirmCardsPageChange(firmCardsCurrentPage - 1)}
                                disabled={firmCardsCurrentPage === 1}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors firmmgmt-pagination-btn rounded-lg"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-2 firmmgmt-pagination-info">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Page {firmCardsCurrentPage} of {totalFirmCardsPages}
                                </span>
                            </div>
                            <button
                                onClick={() => handleFirmCardsPageChange(firmCardsCurrentPage + 1)}
                                disabled={firmCardsCurrentPage === totalFirmCardsPages}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors firmmgmt-pagination-btn rounded-lg"
                            >
                                Next
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {showFirmDetailsModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black bg-opacity-40" onClick={closeFirmDetailsModal}></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-hidden transition-all" style={{ borderRadius: '14px' }}>
                        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700 bg-[#F9FBFF] dark:bg-gray-900">
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                    {selectedFirm?.firm?.name || 'Firm Overview'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Detailed insight into firm performance, contact information, and system health
                                </p>
                            </div>
                            <button
                                onClick={closeFirmDetailsModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M15.7793 8.21899C16.0723 8.51196 16.0723 8.98682 15.7793 9.27979L12.9976 12.0615L15.777 14.8408C16.07 15.1338 16.07 15.6086 15.777 15.9016C15.484 16.1946 15.0092 16.1946 14.7162 15.9016L11.9369 13.1223L9.15759 15.9016C8.86462 16.1946 8.38976 16.1946 8.0968 15.9016C7.80383 15.6086 7.80383 15.1338 8.0968 14.8408L10.8761 12.0615L8.09444 9.27979C7.80147 8.98682 7.80147 8.51196 8.09444 8.21899C8.3874 7.92603 8.86227 7.92603 9.15523 8.21899L11.9369 10.9993L14.7186 8.21899C15.0115 7.92603 15.4864 7.92603 15.7793 8.21899Z" fill={isDarkMode ? '#9CA3AF' : '#3B4A66'} />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {loadingFirmDetails && (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                                    Loading firm overview...
                                </div>
                            )}

                            {!loadingFirmDetails && firmDetailsError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                                    <div className="text-sm text-red-700 dark:text-red-400">{firmDetailsError}</div>
                                </div>
                            )}

                            {!loadingFirmDetails && !firmDetailsError && selectedFirm && (
                                <>
                                    {/* Subscription & Status Summary */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subscription Plan</p>
                                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                {selectedFirm.firm?.is_billing_bypass ? 'Developer Plan' : (selectedFirm.firm?.subscription_plan?.label || 'N/A')}
                                            </h4>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                Monthly Fee:&nbsp;
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(selectedFirm.firm?.subscription_plan?.monthly_fee)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Firm Status</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold text-white ${getStatusColor(selectedFirm.firm?.status)}`}>
                                                    {formatStatus(selectedFirm.firm?.status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Joined on {formatDate(selectedFirm.firm?.join_date)}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Active</p>
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatDateTime(selectedFirm.system_health?.last_active)}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Overall Health:&nbsp;
                                                <span className="font-semibold">
                                                    {selectedFirm.system_health?.overall_health?.status || 'N/A'} ({selectedFirm.system_health?.overall_health?.score ?? '—'}%)
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact & Address */}
                                    <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-5">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Firm Email</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{selectedFirm.firm?.firm_email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Phone</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{selectedFirm.firm?.phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Owner</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{selectedFirm.firm?.owner || 'N/A'}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFirm.firm?.owner_email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Tax ID</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{selectedFirm.firm?.tax_id || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {[
                                                    selectedFirm.firm?.address?.street,
                                                    selectedFirm.firm?.address?.city,
                                                    selectedFirm.firm?.address?.state,
                                                    selectedFirm.firm?.address?.zip_code,
                                                    selectedFirm.firm?.address?.country
                                                ].filter(Boolean).join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFirm.metrics?.users?.label || 'Users'}</p>
                                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                                                {selectedFirm.metrics?.users?.count ?? '—'}
                                            </h3>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFirm.metrics?.clients?.label || 'Clients'}</p>
                                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                                                {selectedFirm.metrics?.clients?.count ?? '—'}
                                            </h3>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Subscription</p>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                                {formatCurrency(selectedFirm.metrics?.revenue?.monthly_subscription)}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Paid Invoice Revenue:&nbsp;
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(selectedFirm.metrics?.revenue?.paid_invoice_revenue)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* System Metrics */}
                                    <div className="bg-white dark:bg-gray-800 border border-[#E8F0FF] dark:border-gray-700 rounded-xl p-5">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Metrics</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Active Users</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                                    {selectedFirm.system_health?.overall_health?.score ?? '—'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1 italic">
                                                    Includes staff and clients
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Storage Usage</p>
                                                <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                                    {selectedFirm.system_health?.storage?.used_gb ?? '—'} GB / {selectedFirm.system_health?.storage?.limit_gb ?? '—'} GB
                                                </p>
                                                <div className="mt-2">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-orange-500 h-2 rounded-full"
                                                            style={{ width: `${Math.min(selectedFirm.system_health?.storage?.percent_used ?? 0, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {selectedFirm.system_health?.storage?.percent_used ?? '—'}% used
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Firm Modal */}
            {showAddFirmModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8">
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: 'var(--Color-overlay, #00000099)' }}
                        onClick={handleCloseModal}
                    ></div>
                    <div
                        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 my-12 transition-all"
                        style={{ borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-[BasisGrotesquePro]">Add New Firm</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-[BasisGrotesquePro]">Create a new firm account on the platform</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Error Message */}
                            {createError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="text-sm text-red-700 font-[BasisGrotesquePro]">{createError}</div>
                                </div>
                            )}

                            {/* Success Message */}
                            {createSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="text-sm text-green-700 font-[BasisGrotesquePro]">Firm created successfully!</div>
                                </div>
                            )}
                            {/* Firm Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-[BasisGrotesquePro]">Firm Name</label>
                                <input
                                    type="text"
                                    value={newFirm.firmName}
                                    onChange={(e) => handleInputChange('firmName', e.target.value)}
                                    placeholder="Enter Firm name"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-[BasisGrotesquePro] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-[BasisGrotesquePro]">Owner Name</label>
                                <input
                                    type="text"
                                    value={newFirm.ownerName}
                                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                    placeholder="Enter Owner Name"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-[BasisGrotesquePro] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-[BasisGrotesquePro]">Email Address</label>
                                <input
                                    type="email"
                                    value={newFirm.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="Enter Email Address"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-[BasisGrotesquePro] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-[BasisGrotesquePro]">
                                    Phone Number
                                </label>

                                <PhoneInput
                                    country={phoneCountry}
                                    value={newFirm.phone || ''}
                                    onChange={(phone) => handleInputChange('phone', phone)}
                                    onCountryChange={(countryCode) =>
                                        setPhoneCountry(countryCode.toLowerCase())
                                    }
                                    enableSearch
                                    countryCodeEditable={false}
                                    specialLabel=""

                                    /* IMPORTANT FIXES */
                                    containerClass="!w-full"
                                    inputClass="!w-full !h-[40px] !pl-14 !pr-3 !text-sm !border !border-gray-300 !rounded-md focus:!ring-2 focus:!ring-blue-500 focus:!border-transparent dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 dark:!placeholder-gray-400"
                                    buttonClass="!border !border-gray-300 !rounded-l-md !h-[40px] dark:!bg-gray-700 dark:!border-gray-600"
                                    dropdownClass="!z-[9999] dark:!bg-gray-800 dark:!text-gray-300"
                                    searchClass="dark:!bg-gray-700 dark:!text-white dark:!border-gray-600"
                                />
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-[BasisGrotesquePro]"
                                style={{ borderRadius: '7px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFirm}
                                disabled={creatingFirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[BasisGrotesquePro]"
                                style={{ borderRadius: '7px' }}
                            >
                                {creatingFirm ? 'Creating...' : 'Create Firm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Firm Modal */}
            {showSuspendModal && firmToSuspend && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8">
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 transition-all" style={{ borderRadius: '12px' }}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-[BasisGrotesquePro]">Suspend Firm</h3>
                                <p className="text-sm text-gray-500">Suspend {firmToSuspend.name} and associated users</p>
                            </div>
                            <div
                                onClick={() => {
                                    setShowSuspendModal(false);
                                    setSuspendReason('');
                                    setFirmToSuspend(null);
                                    setSuspendError(null);
                                    setSuspendSuccess(false);
                                }}

                                className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66" />
                                </svg>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Error Message */}
                            {suspendError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                                    <div className="text-sm text-red-700 dark:text-red-400">{suspendError}</div>
                                </div>
                            )}

                            {/* Success Message */}
                            {suspendSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
                                    <div className="text-sm text-green-700 dark:text-green-400">Firm suspended successfully!</div>
                                </div>
                            )}

                            {/* Firm Info */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Firm Details</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <div><strong>Name:</strong> {firmToSuspend.name}</div>
                                    <div><strong>Admin:</strong> {firmToSuspend.admin_user_name}</div>
                                    <div><strong>Email:</strong> {firmToSuspend.admin_user_email}</div>
                                    <div><strong>Current Status:</strong>
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-sm font-medium text-white ${getStatusColor(firmToSuspend.status)}`}>
                                            {formatStatus(firmToSuspend.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for Suspension <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Enter reason for suspending this firm..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    rows={3}
                                />
                            </div>

                            {/* Warning Message */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-600">Warning</h3>
                                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-600">
                                            <p>This action will suspend the firm and all associated users. They will not be able to access the platform until reactivated.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false);
                                    setSuspendReason('');
                                    setFirmToSuspend(null);
                                    setSuspendError(null);
                                    setSuspendSuccess(false);
                                }}
                                style={{ borderRadius: '7px' }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={suspendingFirm}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={suspendFirm}
                                disabled={suspendingFirm || !suspendReason.trim()}
                                style={{ borderRadius: '7px' }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {suspendingFirm ? 'Suspending...' : 'Suspend Firm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsuspend Firm Modal */}
            {showUnsuspendModal && firmToUnsuspend && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8">
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 transition-all" style={{ borderRadius: '12px' }}>
                        <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {firmToUnsuspend.status?.toLowerCase() === 'inactive' ? 'Reactivate Firm' : 'Unsuspend Firm'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {firmToUnsuspend.status?.toLowerCase() === 'inactive' ? 'Reactivate' : 'Restore access for'} {firmToUnsuspend.name}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowUnsuspendModal(false);
                                    setUnsuspendReason('');
                                    setFirmToUnsuspend(null);
                                    setUnsuspendError(null);
                                    setUnsuspendSuccess(false);
                                }}
                                style={{ borderRadius: '8px' }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill={isDarkMode ? '#9CA3AF' : '#3B4A66'} />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {unsuspendError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                                    <div className="text-sm text-red-700 dark:text-red-400">{unsuspendError}</div>
                                </div>
                            )}

                            {unsuspendSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
                                    <div className="text-sm text-green-700 dark:text-green-400">
                                        Firm {firmToUnsuspend.status?.toLowerCase() === 'inactive' ? 'reactivated' : 'unsuspended'} successfully!
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Firm Details</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <div><strong>Name:</strong> {firmToUnsuspend.name}</div>
                                    <div><strong>Admin:</strong> {firmToUnsuspend.admin_user_name}</div>
                                    <div><strong>Email:</strong> {firmToUnsuspend.admin_user_email}</div>
                                    <div><strong>Current Status:</strong>
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-sm font-medium text-white ${getStatusColor(firmToUnsuspend.status)}`}>
                                            {formatStatus(firmToUnsuspend.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason / Notes (optional)
                                </label>
                                <textarea
                                    value={unsuspendReason}
                                    onChange={(e) => setUnsuspendReason(e.target.value)}
                                    placeholder="Add any notes about reactivating this firm..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    This note is stored with the audit log for future reference.
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-400">
                                The firm and all associated users will regain full access immediately after reactivation.
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowUnsuspendModal(false);
                                    setUnsuspendReason('');
                                    setFirmToUnsuspend(null);
                                    setUnsuspendError(null);
                                    setUnsuspendSuccess(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={unsuspendingFirm}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={unsuspendFirm}
                                disabled={unsuspendingFirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {unsuspendingFirm
                                    ? (firmToUnsuspend.status?.toLowerCase() === 'inactive' ? 'Reactivating...' : 'Unsuspending...')
                                    : (firmToUnsuspend.status?.toLowerCase() === 'inactive' ? 'Reactivate Firm' : 'Unsuspend Firm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Firm Confirmation Modal */}
            {showDeleteModal && firmToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8">
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 transition-all" style={{ borderRadius: '12px' }}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-semibold text-red-600 dark:text-red-500">Delete Firm</h3>
                                <p className="text-sm text-gray-500">Permanently delete {firmToDelete.name || firmToDelete.firm_name || 'this firm'}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setFirmToDelete(null);
                                    setDeleteError(null);
                                }}
                                style={{ borderRadius: '7px' }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-[BasisGrotesquePro]"
                                disabled={deletingFirm}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Error Message */}
                            {deleteError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
                                    <div className="text-sm text-red-700 dark:text-red-400">{deleteError}</div>
                                </div>
                            )}

                            {/* Warning Message */}
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">This action cannot be undone</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            Deleting this firm will permanently remove all associated data including:
                                        </p>
                                        <ul className="text-sm text-red-700 dark:text-red-400 mt-2 list-disc list-inside space-y-1">
                                            <li>Firm account and settings</li>
                                            <li>All users and their access</li>
                                            <li>Client data and documents</li>
                                            <li>Billing and subscription information</li>
                                            <li>All historical records</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Firm Details */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Firm Details</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <div><strong>Name:</strong> {firmToDelete.name || firmToDelete.firm_name || 'N/A'}</div>
                                    <div><strong>Admin:</strong> {firmToDelete.admin_user_name || 'N/A'}</div>
                                    <div><strong>Email:</strong> {firmToDelete.admin_user_email || firmToDelete.owner_email || 'N/A'}</div>
                                    <div><strong>Plan:</strong> {formatPlan(firmToDelete) || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setFirmToDelete(null);
                                    setDeleteError(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={deletingFirm}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteFirm}
                                disabled={deletingFirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingFirm ? 'Deleting...' : 'Delete Firm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Clients Modal */}
            {showAssignClientsModal && assignClientsFirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8 px-4">
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: "color-mix(in oklab, var(--color-black) 50%, transparent)" }}
                        onClick={closeAssignClientsModal}
                    ></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-auto transition-all" style={{ borderRadius: '12px' }}>
                        <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assign Clients</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Assign a client to {assignClientsFirm.name || assignClientsFirm.firm_name || 'this firm'}
                                </p>
                            </div>
                            <button
                                onClick={closeAssignClientsModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill={isDarkMode ? '#374151' : '#E8F0FF'} />
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill={isDarkMode ? '#9CA3AF' : '#3B4A66'} />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {assignClientError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                                    {assignClientError}
                                </div>
                            )}

                            {assignClientSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-3 text-sm text-green-700 dark:text-green-400">
                                    Taxpayer assigned successfully!
                                </div>
                            )}

                            {assignClientsSummary?.total_unassigned !== undefined && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                                    {assignClientOptions.length} of {assignClientsSummary.total_unassigned} unassigned taxpayers shown
                                </p>
                            )}

                            {loadingAssignClients && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="h-4 w-4 border-b-2 border-orange-500 rounded-full animate-spin"></span>
                                    Loading unassigned taxpayers...
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Taxpayer
                                </label>
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    disabled={loadingAssignClients || assignClientOptions.length === 0}
                                >
                                    {assignClientOptions.length > 0 ? (
                                        <>
                                            <option value="" disabled>
                                                Choose a taxpayer
                                            </option>
                                            {assignClientOptions.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.label}
                                                </option>
                                            ))}
                                        </>
                                    ) : (
                                        <option value="">
                                            No taxpayers available for assignment
                                        </option>
                                    )}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Only taxpayers not yet assigned to any firm are listed.
                                </p>
                            </div>

                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={closeAssignClientsModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors "
                                style={{ borderRadius: '10px' }}
                                disabled={assigningClient}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignClient}
                                disabled={assigningClient || loadingAssignClients || !selectedClientId || assignClientOptions.length === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderRadius: '10px' }}
                            >
                                {assigningClient ? 'Assigning...' : 'Assign Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 1