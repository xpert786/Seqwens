import React, { useState, useEffect } from "react";
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';

export default function FirmManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [planFilter, setPlanFilter] = useState("All Plans");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showAddFirmModal, setShowAddFirmModal] = useState(false);
    const [newFirm, setNewFirm] = useState({
        firmName: "",
        ownerName: "",
        email: "",
        phone: "",
        plan: ""
    });
                                                                    
    // API state management
    const [firms, setFirms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 1
    });
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

    // Fetch firms data from API
    const fetchFirms = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await superAdminAPI.getFirms(
                1, // page
                20, // limit
                searchTerm, // search
                statusFilter === "All Status" ? '' : statusFilter.toLowerCase(), // status
                planFilter === "All Plans" ? '' : planFilter.toLowerCase() // plan
            );
            
            if (response.success && response.data) {
                setFirms(response.data.firms || []);
                setPagination(response.data.pagination || {
                    page: 1,
                    page_size: 20,
                    total_count: 0,
                    total_pages: 1
                });
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
    }, [searchTerm, statusFilter, planFilter]);

    // Helper function to get plan color
    const getPlanColor = (plan) => {
        const colors = {
            'solo': 'bg-[#FBBF24]',
            'team': 'bg-[#22C55E]',
            'professional': 'bg-[#1E40AF]',
            'enterprise': 'bg-[#3AD6F2]'
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
    const formatPlan = (plan) => {
        return plan?.charAt(0).toUpperCase() + plan?.slice(1) || 'Unknown';
    };

    const toggleDropdown = (firmId) => {
        setActiveDropdown(activeDropdown === firmId ? null : firmId);
    };

    // Fetch firm details
    const fetchFirmDetails = async (firmId) => {
        try {
            setLoadingFirmDetails(true);
            setFirmDetailsError(null);
            
            const response = await superAdminAPI.getFirmById(firmId);
            
            if (response.success && response.data) {
                setSelectedFirm(response.data);
                setShowFirmDetailsModal(true);
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

    const handleAction = (action, firmId) => {
        console.log(`${action} for firm ${firmId}`);
        setActiveDropdown(null);
        
        if (action === 'View Details') {
            fetchFirmDetails(firmId);
        } else if (action === 'Edit User') {
            // TODO: Implement edit functionality
            console.log('Edit firm:', firmId);
        } else if (action === 'Send Message') {
            // TODO: Implement message functionality
            console.log('Send message to firm:', firmId);
        } else if (action === 'Manage Billing') {
            // TODO: Implement billing management
            console.log('Manage billing for firm:', firmId);
        } else if (action === 'Suspend User') {
            const firm = firms.find(f => f.id === firmId);
            setFirmToSuspend(firm);
            setShowSuspendModal(true);
        } else if (action === 'Delete') {
            // TODO: Implement delete functionality
            console.log('Delete firm:', firmId);
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
            phone: "",
            plan: ""
        });
    };

    const handleInputChange = (field, value) => {
        setNewFirm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCreateFirm = async () => {
        if (!newFirm.firmName.trim() || !newFirm.ownerName.trim() || !newFirm.email.trim() || !newFirm.plan) {
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
                phone_number: newFirm.phone,
                subscription_plan: newFirm.plan.toLowerCase()
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

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section with Action Buttons */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">
                            Firm Management
                        </h3>
                        <p className="text-gray-500 text-md ">
                            Manage all firms on the platform
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 gap-2">
                    <button className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center" style={{borderRadius: '7px'}}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12.75 6.5L9 2.75M9 2.75L5.25 6.5M9 2.75V11.75" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round"/> 
                    </svg>

                        Import Report
                    </button>
                    <button className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center" style={{borderRadius: '7px'}}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>

                        Export Report
                    </button>
                    <button 
                        onClick={handleAddFirm}
                        className="px-2 py-1 text-xs bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center" 
                        style={{borderRadius: '7px'}}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                         Add Firm
                    </button>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className=" rounded-lg mb-6  ">
                    <div className="flex flex-col lg:flex-row gap-2">
                        {/* Search Bar */}
                        <div className=" relative  w-[300px]">
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
                                className=" bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-fit">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Trial">Trial</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>

                        {/* Plan Filter */}
                        <div className="w-fit">
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="All Plans">All Plans</option>
                                <option value="Solo">Solo</option>
                                <option value="Team">Team</option>
                                <option value="Professional">Professional</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
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
                <div className="bg-white rounded-lg border-1  border-[#E8F0FF]">
                    {/* List Header */}
                    <div className="p-6 ">
                        <h4 className="text-md font-bold text-gray-800 mb-2">
                            Firms ({pagination.total_count})
                        </h4>
                        <p className="text-gray-500 text-xs">
                            Comprehensive list of all firms registered on the platform
                        </p>
                    </div>

                    {/* Table Headers */}
                    <div className="px-3 py-3  ">
                <div className="grid grid-cols-12 gap-1 text-sm font-medium text-[#4B5563] justify-items-start">
                    <div className="col-span-3">Firm</div>
                    <div className="col-span-2">Plan</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Users</div>
                    <div className="col-span-2">Revenue</div>
                    <div className="col-span-1">Last Active</div>
                    <div className="col-span-1">Actions</div>
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
                    <div className="divide-y divide-gray-200">
                            {firms.length > 0 ? firms.map((firm) => (
                            <div key={firm.id} className="pr-1 pl-3 py-3 transition-colors border-1 border-[#E8F0FF] m-2" style={{borderRadius: '7px'}}>
                                <div className="grid grid-cols-12 gap-1 items-center">
                                    {/* Firm Column */}
                                    <div className="col-span-3">
                                        <div className="text-[#4B5563] text-xs truncate">
                                            <span className="font-medium">{firm.name}</span>
                                        </div>
                                        <div className="text-gray-500 text-xs truncate">
                                            {firm.admin_user_name}
                                        </div>
                                        <div className="text-gray-500 text-xs truncate">
                                            {firm.admin_user_email}
                                        </div>
                                    </div>

                                    {/* Plan Column */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white ${getPlanColor(firm.subscription_plan)}`}>
                                            {formatPlan(firm.subscription_plan)}
                                        </span>
                                    </div>

                                    {/* Status Column */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(firm.status)}`}>
                                            {formatStatus(firm.status)}
                                        </span>
                                    </div>

                                    {/* Users Column */}
                                    <div className="col-span-1 flex items-center text-xs text-gray-700">
                                        <svg className="w-3 h-3 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        {firm.staff_count + firm.client_count}
                                    </div>

                                    {/* Revenue Column */}
                                    <div className="col-span-2 text-xs text-gray-700">
                                        ${firm.monthly_fee}/month
                                    </div>

                                    {/* Last Active Column */}
                                    <div className="col-span-1 text-xs text-gray-700">
                                        {firm.trial_days_remaining ? `${firm.trial_days_remaining}d left` : 'Active'}
                                    </div>

                                    {/* Actions Column */}
                                    <div className="col-span-1 flex justify-center relative dropdown-container">
                                        <button 
                                            onClick={() => toggleDropdown(firm.id)}
                                            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                                        >
                                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.25" y="0.25" width="21.5" height="21.5" rx="3.75" fill="#F3F7FF"/>
                                                <rect x="0.25" y="0.25" width="21.5" height="21.5" rx="3.75" stroke="#E8F0FF" strokeWidth="0.5"/>
                                                <path d="M6.27344 10.1016C6.57181 10.1016 6.85795 10.2201 7.06893 10.4311C7.27991 10.642 7.39844 10.9282 7.39844 11.2266C7.39844 11.5249 7.27991 11.8111 7.06893 12.0221C6.85795 12.233 6.57181 12.3516 6.27344 12.3516C5.97507 12.3516 5.68892 12.233 5.47794 12.0221C5.26696 11.8111 5.14844 11.5249 5.14844 11.2266C5.14844 10.9282 5.26696 10.642 5.47794 10.4311C5.68892 10.2201 5.97507 10.1016 6.27344 10.1016ZM10.7734 10.1016C11.0718 10.1016 11.358 10.2201 11.5689 10.4311C11.7799 10.642 11.8984 10.9282 11.8984 11.2266C11.8984 11.5249 11.7799 11.8111 11.5689 12.0221C11.358 12.233 11.0718 12.3516 10.7734 12.3516C10.4751 12.3516 10.1889 12.233 9.97794 12.0221C9.76696 11.8111 9.64844 11.5249 9.64844 11.2266C9.64844 10.9282 9.76696 10.642 9.97794 10.4311C10.1889 10.2201 10.4751 10.1016 10.7734 10.1016ZM15.2734 10.1016C15.5718 10.1016 15.858 10.2201 16.0689 10.4311C16.2799 10.642 16.3984 10.9282 16.3984 11.2266C16.3984 11.5249 16.2799 11.8111 16.0689 12.0221C15.858 12.233 15.5718 12.3516 15.2734 12.3516C14.9751 12.3516 14.6889 12.233 14.4779 12.0221C14.267 11.8111 14.1484 11.5249 14.1484 11.2266C14.1484 10.9282 14.267 10.642 14.4779 10.4311C14.6889 10.2201 14.9751 10.1016 15.2734 10.1016Z" fill="#131323"/>
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeDropdown === firm.id && (
                                            <div className="absolute right-0 top-8 z-50 bg-white rounded-lg  border-1 border-[#E8F0FF] py-2 min-w-[160px]">
                                                <button
                                                    onClick={() => handleAction('View Details', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleAction('Edit User', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    Edit User
                                                </button>
                                                <button
                                                    onClick={() => handleAction('Send Message', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    Send Message
                                                </button>
                                                <button
                                                    onClick={() => handleAction('Manage Billing', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    Manage Billing
                                                </button>
                                                <button
                                                    onClick={() => handleAction('Suspend User', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    Suspend User
                                                </button>
                                                <button
                                                    onClick={() => handleAction('Delete', firm.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    Delete
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
                </div>
            </div>

            {/* Add New Firm Modal */}
            {showAddFirmModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center py-8">
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 my-50 " style={{borderRadius: '12px'}}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Add New Firm</h3>
                                <p className="text-xs text-gray-500">Create a new firm account on the platform</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF"/>
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66"/>
                                    </svg>

                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-3 space-y-1">
                            {/* Error Message */}
                            {createError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                    <div className="text-sm text-red-700">{createError}</div>
                                </div>
                            )}

                            {/* Success Message */}
                            {createSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                    <div className="text-sm text-green-700">Firm created successfully!</div>
                                </div>
                            )}
                            {/* Firm Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Firm Name</label>
                                <input
                                    type="text"
                                    value={newFirm.firmName}
                                    onChange={(e) => handleInputChange('firmName', e.target.value)}
                                    placeholder="Enter Firm name"
                                    className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Owner Name</label>
                                <input
                                    type="text"
                                    value={newFirm.ownerName}
                                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                    placeholder="Enter Owner Name"
                                    className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Email Address</label>
                                <input
                                    type="email"
                                    value={newFirm.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="Enter Email Address"
                                    className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newFirm.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="Enter Phone Number"
                                    className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Subscription Plan */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Subscription Plan</label>
                                <select
                                    value={newFirm.plan}
                                    onChange={(e) => handleInputChange('plan', e.target.value)}
                                    className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Plan</option>
                                    <option value="Solo">Solo</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Team">Team</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end space-x-2 p-2 gap-2">
                            <button
                                onClick={handleCloseModal}
                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFirm}
                                disabled={creatingFirm}
                                className="px-3 py-1 text-xs font-medium text-white bg-[#F56D2D] rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{borderRadius: '7px'}}
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
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4" style={{borderRadius: '12px'}}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Suspend Firm</h3>
                                <p className="text-sm text-gray-500">Suspend {firmToSuspend.name} and associated users</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false);
                                    setSuspendReason('');
                                    setFirmToSuspend(null);
                                    setSuspendError(null);
                                    setSuspendSuccess(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="24" height="24" rx="12" fill="#E8F0FF"/>
                                    <path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66"/>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Error Message */}
                            {suspendError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="text-sm text-red-700">{suspendError}</div>
                                </div>
                            )}

                            {/* Success Message */}
                            {suspendSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="text-sm text-green-700">Firm suspended successfully!</div>
                                </div>
                            )}

                            {/* Firm Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-900 mb-1">Firm Details</div>
                                <div className="text-sm text-gray-600">
                                    <div><strong>Name:</strong> {firmToSuspend.name}</div>
                                    <div><strong>Admin:</strong> {firmToSuspend.admin_user_name}</div>
                                    <div><strong>Email:</strong> {firmToSuspend.admin_user_email}</div>
                                    <div><strong>Current Status:</strong> 
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(firmToSuspend.status)}`}>
                                            {formatStatus(firmToSuspend.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Suspension <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Enter reason for suspending this firm..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Warning Message */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>This action will suspend the firm and all associated users. They will not be able to access the platform until reactivated.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false);
                                    setSuspendReason('');
                                    setFirmToSuspend(null);
                                    setSuspendError(null);
                                    setSuspendSuccess(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={suspendingFirm}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={suspendFirm}
                                disabled={suspendingFirm || !suspendReason.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {suspendingFirm ? 'Suspending...' : 'Suspend Firm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
