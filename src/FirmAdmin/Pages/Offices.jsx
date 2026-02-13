import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaBuilding, FaUsers, FaPhone, FaMapMarkerAlt, FaEllipsisV, FaChevronUp, FaChevronDown, FaMinus, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { handleAPIError, firmOfficeAPI } from '../../ClientOnboarding/utils/apiUtils';
import AddOfficeModal from './Offices/AddOfficeModal';
import TaxpayerManagementModal from './Offices/TaxpayerManagementModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { toast } from 'react-toastify';

export default function Offices() {
    const navigate = useNavigate();
    const [offices, setOffices] = useState([]);
    const [summary, setSummary] = useState({
        total_offices: 0,
        active_offices: 0,
        total_staff: 0,
        total_clients: 0,
        monthly_revenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDropdown, setShowDropdown] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddOfficeModal, setShowAddOfficeModal] = useState(false);
    const [showTaxpayerModal, setShowTaxpayerModal] = useState(false);
    const [selectedOfficeForTaxpayers, setSelectedOfficeForTaxpayers] = useState(null);
    const [officeToDelete, setOfficeToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const dropdownRefs = useRef({});

    // Fetch offices from API
    const fetchOffices = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params = {};
            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }
            if (statusFilter && statusFilter !== 'All Status') {
                const normalizedStatus = statusFilter.toLowerCase().replace(/\s+/g, '_');
                params.status = normalizedStatus;
            }

            const result = await firmOfficeAPI.listOffices(params);

            const defaultSummary = {
                total_offices: 0,
                active_offices: 0,
                total_staff: 0,
                total_clients: 0,
                monthly_revenue: 0
            };

            if (result?.success && result.data) {
                setOffices(result.data.offices || []);
                setSummary(result.data.summary || defaultSummary);
            } else if (result?.offices) {
                setOffices(result.offices || []);
                setSummary(result.summary || defaultSummary);
            } else if (Array.isArray(result)) {
                setOffices(result);
                setSummary(defaultSummary);
            } else {
                setOffices([]);
                setSummary(defaultSummary);
            }
        } catch (err) {
            console.error('Error fetching offices:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load offices. Please try again.');
            setOffices([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter]);

    // Fetch offices on mount and when filters change
    useEffect(() => {
        fetchOffices();
    }, [fetchOffices]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown !== null) {
                const dropdownElement = dropdownRefs.current[showDropdown];
                if (dropdownElement && !dropdownElement.contains(event.target)) {
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

    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return '$0';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format office data for display
    const formatOfficeData = (office) => {
        const performanceData = office.performance || {};
        const performancePercentage = typeof performanceData === 'object'
            ? (performanceData.percentage ?? performanceData.value ?? 0)
            : (performanceData ?? 0);
        const performanceTrend = performanceData.trend
            || (performancePercentage > 0 ? 'up' : performancePercentage < 0 ? 'down' : 'neutral');
        const performanceDisplay = performanceData.display
            || `${performancePercentage > 0 ? '+' : ''}${performancePercentage}%`;

        return {
            id: office.id,
            name: office.name || 'Unnamed Office',
            phone: office.phone_number || office.phone_number_formatted || office.phone || 'N/A',
            address: office.full_address || office.street_address || office.address || '',
            city: office.city ? `${office.city}${office.state ? `, ${office.state}` : ''}${office.zip_code ? ` ${office.zip_code}` : ''}` : '',
            manager: office.manager_name || (office.manager ? `${office.manager.first_name || ''} ${office.manager.last_name || ''}`.trim() : '') || 'N/A',
            managerEmail: office.manager_email || (office.manager?.email || '') || 'N/A',
            status: office.status || 'active',
            statusDisplay: office.status_display || (office.status ? office.status.replace('_', ' ') : 'Active'),
            staff: office.staff_count || office.staff || 0,
            clients: office.clients_count || office.clients || 0,
            monthlyRevenue: office.monthly_revenue ?? office.monthlyRevenue ?? 0,
            performancePercentage,
            performanceTrend,
            performanceDisplay,
        };
    };

    const handleDropdownToggle = (officeId) => {
        setShowDropdown(showDropdown === officeId ? null : officeId);
    };

    const handleDeleteClick = (office) => {
        setOfficeToDelete(office);
        setShowDeleteConfirm(true);
        setShowDropdown(null);
    };

    const handleConfirmDelete = async () => {
        if (!officeToDelete) return;

        try {
            setIsDeleting(true);
            await firmOfficeAPI.deleteOffice(officeToDelete.id);
            toast.success('Office deleted successfully');
            fetchOffices(); // Refresh list
            setShowDeleteConfirm(false);
            setOfficeToDelete(null);
        } catch (error) {
            console.error('Error deleting office:', error);
            const errorMsg = handleAPIError(error);
            toast.error(errorMsg || 'Failed to delete office');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusUpdate = async (office, newStatus) => {
        try {
            await firmOfficeAPI.updateOffice(office.id, { status: newStatus });
            toast.success(`Office marked as ${newStatus}`);
            fetchOffices(); // Refresh list
            setShowDropdown(null);
        } catch (error) {
            console.error('Error updating office status:', error);
            const errorMsg = handleAPIError(error);
            toast.error(errorMsg || 'Failed to update office status');
        }
    };

    return (
        <div className="p-6 bg-[rgb(243,247,255)] min-h-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Office Locations</h3>
                    <p className="text-sm text-gray-600">Manage multiple office locations and their performance</p>
                </div>
                <button
                    onClick={() => setShowAddOfficeModal(true)}
                    className="mt-4 sm:mt-0 px-4 py-2.5 text-white !rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2 font-semibold"
                    style={{ backgroundColor: 'var(--firm-primary-color)' }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Add Office
                </button>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {/* Total Offices */}
                <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className='flex items-center justify-between gap-3'>
                        <div className="w-12 h-12 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 22V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2H16C16.5304 2 17.0391 2.21071 17.4142 2.58579C17.7893 2.96086 18 3.46957 18 4V22H6Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M6 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H6" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M18 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H18" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 6H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 10H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 14H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 18H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none mb-0">{summary.total_offices || offices.length}</p>
                        </div>
                    </div>
                    <div className="flex flex-col mt-3">
                        <p className="text-sm font-medium text-gray-500">Total Offices</p>
                    </div>
                </div>

                {/* Active Offices */}
                <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className='flex items-center justify-between gap-3'>
                        <div className="w-12 h-12 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 22V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2H16C16.5304 2 17.0391 2.21071 17.4142 2.58579C17.7893 2.96086 18 3.46957 18 4V22H6Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M6 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H6" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M18 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H18" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 6H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 10H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 14H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M10 18H14" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none mb-0">{summary.active_offices || offices.filter(o => (o.status || '').toLowerCase() === 'active').length}</p>
                        </div>
                    </div>
                    <div className="flex flex-col mt-3">
                        <p className="text-sm font-medium text-gray-500">Active Offices</p>
                    </div>
                </div>

                {/* Total Staff */}
                <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className='flex items-center justify-between gap-3'>
                        <div className="w-12 h-12 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none mb-0">{summary.total_staff || offices.reduce((sum, o) => sum + (o.staff_count || o.staff || 0), 0)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col mt-3">
                        <p className="text-sm font-medium text-gray-500">Total Staff</p>
                    </div>
                </div>

                {/* Total Clients */}
                <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className='flex items-center justify-between gap-3'>
                        <div className="w-12 h-12 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none mb-0">{summary.total_clients || offices.reduce((sum, o) => sum + (o.clients_count || o.clients || 0), 0)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col mt-3">
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                    </div>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white !rounded-xl p-4 border border-[#E8F0FF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className='flex items-center justify-between gap-3'>
                        <div className="w-12 h-12 rounded-lg bg-[#F0FDFF] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none mb-0">{formatCurrency(summary.monthly_revenue || offices.reduce((sum, o) => sum + (o.monthly_revenue || o.monthlyRevenue || 0), 0))}</p>
                        </div>
                    </div>
                    <div className="flex flex-col mt-3">
                        <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row mb-6 gap-4">
                <div className="flex relative">
                    <input
                        type="text"
                        placeholder="Search office by name, city, or manager..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-[400px] px-6 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm bg-gray-50"
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none min-w-[160px] px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] text-sm bg-white cursor-pointer"
                    >
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Office Locations ({offices.length})</h4>
                    <p className="text-sm text-gray-600 mt-1">Manage all office locations and their performance metrics</p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-sm text-gray-600">Loading offices...</p>
                    </div>
                ) : offices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-600">No offices found</p>
                    </div>
                ) : (
                    /* Table */
                    <div className="overflow-x-auto pb-24">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Office</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Location</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Manager</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Staff</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Clients</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Monthly Revenue</th>
                                    <th className="px-4 py-3 text-left text-base font-medium text-gray-500 tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {offices.map((office) => {
                                    const formattedOffice = formatOfficeData(office);
                                    return (
                                        <tr key={formattedOffice.id} className="hover:bg-gray-50">
                                            {/* Office Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {office.logo ? (
                                                        <img
                                                            src={office.logo}
                                                            alt={`${formattedOffice.name} logo`}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                            onError={(e) => {
                                                                // Fallback to building icon if image fails to load
                                                                e.target.style.display = 'none';
                                                                e.target.nextElementSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        style={{ display: office.logo ? 'none' : 'block' }}
                                                    >
                                                        <path d="M6 22V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2H16C16.5304 2 17.0391 2.21071 17.4142 2.58579C17.7893 2.96086 18 3.46957 18 4V22H6Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M6 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H6" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M18 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H18" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M10 6H14" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M10 10H14" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M10 14H14" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M10 18H14" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>

                                                    <div>
                                                        <div
                                                            className="font-semibold text-gray-500 cursor-pointer hover:text-[#3AD6F2] transition-colors"
                                                            onClick={() => navigate(`/firmadmin/offices/${formattedOffice.id}`)}
                                                        >
                                                            {formattedOffice.name}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M10.4441 7.96005V9.46005C10.4446 9.5993 10.4161 9.73713 10.3603 9.86472C10.3045 9.99231 10.2227 10.1068 10.1201 10.201C10.0175 10.2951 9.89635 10.3668 9.76443 10.4114C9.63252 10.456 9.49274 10.4726 9.35406 10.46C7.81548 10.2929 6.33756 9.76712 5.03906 8.92505C3.83097 8.15738 2.80673 7.13313 2.03906 5.92505C1.19405 4.62065 0.66818 3.13555 0.504058 1.59005C0.491564 1.45178 0.507996 1.31243 0.552309 1.18086C0.596621 1.04929 0.667844 0.928393 0.761441 0.825859C0.855039 0.723325 0.968961 0.641403 1.09595 0.585309C1.22295 0.529216 1.36023 0.500179 1.49906 0.500048H2.99906C3.24171 0.49766 3.47695 0.583588 3.66094 0.741815C3.84492 0.900042 3.9651 1.11977 3.99906 1.36005C4.06237 1.84008 4.17978 2.31141 4.34906 2.76505C4.41633 2.94401 4.43089 3.13851 4.39101 3.32549C4.35113 3.51247 4.25849 3.6841 4.12406 3.82005L3.48906 4.45505C4.20084 5.70682 5.23729 6.74327 6.48906 7.45505L7.12406 6.82005C7.26 6.68562 7.43164 6.59297 7.61862 6.5531C7.8056 6.51322 8.0001 6.52778 8.17906 6.59505C8.63269 6.76432 9.10403 6.88174 9.58406 6.94505C9.82694 6.97931 10.0488 7.10165 10.2073 7.2888C10.3659 7.47594 10.4501 7.71484 10.4441 7.96005Z" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>

                                                            {formattedOffice.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Location Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10 5C10 8 6 11 6 11C6 11 2 8 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>

                                                    <div>
                                                        <div className="font-semibold text-gray-500">{formattedOffice.address}</div>
                                                        <div className="text-sm text-gray-500">{formattedOffice.city}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Manager Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-semibold text-gray-500">{formattedOffice.manager}</div>
                                                    <div className="text-sm text-gray-500">{formattedOffice.managerEmail}</div>
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${(formattedOffice.status || '').toLowerCase() === 'active'
                                                        ? 'bg-[#22C55E] text-white'
                                                        : (formattedOffice.status || '').toLowerCase().includes('opening')
                                                            ? 'bg-[#1E40AF] text-white'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {(formattedOffice.statusDisplay || formattedOffice.status || 'Active')
                                                        .replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Staff Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10.6666 14V12.6667C10.6666 11.9594 10.3856 11.2811 9.88554 10.781C9.38544 10.281 8.70716 10 7.99992 10H3.99992C3.29267 10 2.6144 10.281 2.1143 10.781C1.6142 11.2811 1.33325 11.9594 1.33325 12.6667V14M14.6666 14V12.6667C14.6661 12.0758 14.4695 11.5018 14.1075 11.0349C13.7455 10.5679 13.2387 10.2344 12.6666 10.0867M10.6666 2.08667C11.2402 2.23353 11.7486 2.56713 12.1117 3.03487C12.4747 3.50261 12.6718 4.07789 12.6718 4.67C12.6718 5.26211 12.4747 5.83739 12.1117 6.30513C11.7486 6.77287 11.2402 7.10647 10.6666 7.25333M8.66659 4.66667C8.66659 6.13943 7.47268 7.33333 5.99992 7.33333C4.52716 7.33333 3.33325 6.13943 3.33325 4.66667C3.33325 3.19391 4.52716 2 5.99992 2C7.47268 2 8.66659 3.19391 8.66659 4.66667Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>

                                                    <span className="font-semibold text-gray-500">{formattedOffice.staff}</span>
                                                </div>
                                            </td>

                                            {/* Clients Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10.6666 14V12.6667C10.6666 11.9594 10.3856 11.2811 9.88554 10.781C9.38544 10.281 8.70716 10 7.99992 10H3.99992C3.29267 10 2.6144 10.281 2.1143 10.781C1.6142 11.2811 1.33325 11.9594 1.33325 12.6667V14M14.6666 14V12.6667C14.6661 12.0758 14.4695 11.5018 14.1075 11.0349C13.7455 10.5679 13.2387 10.2344 12.6666 10.0867M10.6666 2.08667C11.2402 2.23353 11.7486 2.56713 12.1117 3.03487C12.4747 3.50261 12.6718 4.07789 12.6718 4.67C12.6718 5.26211 12.4747 5.83739 12.1117 6.30513C11.7486 6.77287 11.2402 7.10647 10.6666 7.25333M8.66659 4.66667C8.66659 6.13943 7.47268 7.33333 5.99992 7.33333C4.52716 7.33333 3.33325 6.13943 3.33325 4.66667C3.33325 3.19391 4.52716 2 5.99992 2C7.47268 2 8.66659 3.19391 8.66659 4.66667Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>

                                                    <span className="font-semibold text-gray-500">{formattedOffice.clients}</span>
                                                </div>
                                            </td>

                                            {/* Monthly Revenue Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-500">{formatCurrency(formattedOffice.monthlyRevenue)}</span>
                                            </td>


                                            {/* Actions Column */}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div
                                                    className="relative"
                                                    ref={(el) => { dropdownRefs.current[formattedOffice.id] = el; }}
                                                >
                                                    <button
                                                        onClick={() => handleDropdownToggle(formattedOffice.id)}
                                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M3.3252 6.30078C3.55726 6.30078 3.77982 6.39297 3.94391 6.55706C4.10801 6.72116 4.2002 6.94372 4.2002 7.17578C4.2002 7.40785 4.10801 7.63041 3.94391 7.7945C3.77982 7.95859 3.55726 8.05078 3.3252 8.05078C3.09313 8.05078 2.87057 7.95859 2.70648 7.7945C2.54238 7.63041 2.4502 7.40785 2.4502 7.17578C2.4502 6.94372 2.54238 6.72116 2.70648 6.55706C2.87057 6.39297 3.09313 6.30078 3.3252 6.30078ZM6.8252 6.30078C7.05726 6.30078 7.27982 6.39297 7.44391 6.55706C7.60801 6.72116 7.7002 6.94372 7.7002 7.17578C7.7002 7.40785 7.60801 7.63041 7.44391 7.7945C7.27982 7.95859 7.05726 8.05078 6.8252 8.05078C6.59313 8.05078 6.37057 7.95859 6.20648 7.7945C6.04238 7.63041 5.9502 7.40785 5.9502 7.17578C5.9502 6.94372 6.04238 6.72116 6.20648 6.55706C6.37057 6.39297 6.59313 6.30078 6.8252 6.30078ZM10.3252 6.30078C10.5573 6.30078 10.7798 6.39297 10.9439 6.55706C11.108 6.72116 11.2002 6.94372 11.2002 7.17578C11.2002 7.40785 11.108 7.63041 10.9439 7.7945C10.7798 7.95859 10.5573 8.05078 10.3252 8.05078C10.0931 8.05078 9.87057 7.95859 9.70648 7.7945C9.54238 7.63041 9.4502 7.40785 9.4502 7.17578C9.4502 6.94372 9.54238 6.72116 9.70648 6.55706C9.87057 6.39297 10.0931 6.30078 10.3252 6.30078Z" fill="#131323" />
                                                        </svg>

                                                    </button>
                                                    {showDropdown === formattedOffice.id && (
                                                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        navigate(`/firmadmin/offices/${formattedOffice.id}`);
                                                                        setShowDropdown(null);
                                                                    }}
                                                                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    View Details
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOfficeForTaxpayers({ id: formattedOffice.id, name: formattedOffice.name });
                                                                        setShowTaxpayerModal(true);
                                                                        setShowDropdown(null);
                                                                    }}
                                                                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    Manage Taxpayers
                                                                </button>

                                                                <button
                                                                    onClick={() => handleStatusUpdate(formattedOffice, (formattedOffice.status || '').toLowerCase() === 'active' ? 'inactive' : 'active')}
                                                                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    {(formattedOffice.status || '').toLowerCase() === 'active' ? 'Set as Inactive' : 'Set as Active'}
                                                                </button>

                                                                <button
                                                                    className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-100 uppercase font-bold"
                                                                    onClick={() => handleDeleteClick(formattedOffice)}
                                                                >
                                                                    Delete Office
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Office Modal */}
            <AddOfficeModal
                isOpen={showAddOfficeModal}
                onClose={() => setShowAddOfficeModal(false)}
                onOfficeCreated={fetchOffices}
            />

            {/* Taxpayer Management Modal */}
            {selectedOfficeForTaxpayers && (
                <TaxpayerManagementModal
                    show={showTaxpayerModal}
                    onClose={() => {
                        setShowTaxpayerModal(false);
                        setSelectedOfficeForTaxpayers(null);
                    }}
                    officeId={selectedOfficeForTaxpayers.id}
                    officeName={selectedOfficeForTaxpayers.name}
                    onUpdate={fetchOffices}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    if (!isDeleting) {
                        setShowDeleteConfirm(false);
                        setOfficeToDelete(null);
                    }
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Office"
                message={officeToDelete ? `Are you sure you want to delete the office "${officeToDelete.name}"? This action cannot be undone and may affect assigned staff and clients.` : "Are you sure you want to delete this office?"}
                confirmText="Delete Office"
                cancelText="Cancel"
                isLoading={isDeleting}
                isDestructive={true}
            />
        </div>
    );
}

