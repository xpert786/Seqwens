import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import Pagination from '../../../../ClientOnboarding/components/Pagination';

const API_BASE_URL = getApiBaseUrl();

const LicenseManagement = () => {
    // State management
    const [summary, setSummary] = useState({
        total_staff: 0,
        licensed_features: 0,
        restricted_staff: 0,
        restricted_staff_date: null
    });
    const [staffLicenseAssignments, setStaffLicenseAssignments] = useState([]);
    const [availableFeatures, setAvailableFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 3;

    // Modal states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
    const [assigning, setAssigning] = useState(false);
    const [showRemoveLicenseConfirm, setShowRemoveLicenseConfirm] = useState(false);
    const [licenseToRemove, setLicenseToRemove] = useState(null);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedStaffIds, setSelectedStaffIds] = useState([]);

    // Fetch license management data
    const fetchLicenseData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            // Using superadmin endpoint as provided, but with firm admin auth
            // If there's a firm-admin specific endpoint, it can be changed here
            const url = `${API_BASE_URL}/user/firm-admin/subscriptions/licenses/?page=${page}&limit=${itemsPerPage}`;

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
                setSummary(result.data.summary || {});
                setStaffLicenseAssignments(result.data.staff_license_assignments || []);
                setAvailableFeatures(result.data.available_features || []);

                // Set pagination data
                setTotalItems(result.data.total_staff || result.data.staff_license_assignments?.length || 0);
                setTotalPages(Math.ceil((result.data.total_staff || result.data.staff_license_assignments?.length || 0) / itemsPerPage));
                setCurrentPage(page);
            } else {
                setSummary({});
                setStaffLicenseAssignments([]);
                setAvailableFeatures([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching license data:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load license management data. Please try again.');
            setSummary({});
            setStaffLicenseAssignments([]);
            setAvailableFeatures([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    // Fetch data on mount
    useEffect(() => {
        fetchLicenseData();
    }, [fetchLicenseData]);

    // Handle assign licenses
    const handleAssignLicenses = async () => {
        if (selectedFeatureIds.length === 0) {
            toast.error('Please select at least one license feature');
            return;
        }

        try {
            setAssigning(true);
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/subscriptions/licenses/`;

            const payload = isBulkMode
                ? {
                    staff_ids: selectedStaffIds,
                    license_feature_ids: selectedFeatureIds
                }
                : {
                    staff_id: selectedStaff?.staff_id,
                    license_feature_ids: selectedFeatureIds
                };

            const response = await fetchWithCors(url, {
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
                toast.success(result.message || 'Licenses assigned successfully!');
                setShowAssignModal(false);
                setSelectedStaff(null);
                setSelectedFeatureIds([]);
                setSelectedStaffIds([]);
                setIsBulkMode(false);
                await fetchLicenseData(currentPage);
            } else {
                throw new Error(result.message || 'Failed to assign licenses');
            }
        } catch (err) {
            console.error('Error assigning licenses:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to assign licenses. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    // Handle update licenses
    const handleUpdateLicenses = async (staffId, featureIds) => {
        try {
            setAssigning(true);
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/subscriptions/licenses/`;

            const response = await fetchWithCors(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    staff_id: staffId,
                    license_feature_ids: featureIds
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Licenses updated successfully!');
                setShowAssignModal(false);
                setSelectedStaff(null);
                setSelectedFeatureIds([]);
                await fetchLicenseData(currentPage);
            } else {
                throw new Error(result.message || 'Failed to update licenses');
            }
        } catch (err) {
            console.error('Error updating licenses:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to update licenses. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    // Handle remove licenses
    const handleRemoveLicenses = async (staffId, featureId = null) => {
        setLicenseToRemove({ staffId, featureId });
        setShowRemoveLicenseConfirm(true);
    };

    const confirmRemoveLicenses = async () => {
        if (!licenseToRemove) return;

        try {
            setAssigning(true);
            const token = getAccessToken();
            let url = `${API_BASE_URL}/user/firm-admin/subscriptions/licenses/`;

            const payload = {
                staff_id: licenseToRemove.staffId
            };

            if (licenseToRemove.featureId) {
                payload.license_feature_id = licenseToRemove.featureId;
            }

            const response = await fetchWithCors(url, {
                method: 'DELETE',
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
                toast.success(result.message || 'License(s) removed successfully!');
                await fetchLicenseData(currentPage);
                setShowRemoveLicenseConfirm(false);
                setLicenseToRemove(null);
            } else {
                throw new Error(result.message || 'Failed to remove licenses');
            }
        } catch (err) {
            console.error('Error removing licenses:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to remove licenses. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    // Open assign modal
    const openAssignModal = (staff = null, isBulk = false) => {
        setSelectedStaff(staff);
        setIsBulkMode(isBulk);
        if (staff) {
            // Pre-select current licenses for update
            const currentFeatureIds = availableFeatures
                .filter(feature => staff.status && staff.status.includes(feature.name))
                .map(feature => feature.id);
            setSelectedFeatureIds(currentFeatureIds);
        } else {
            setSelectedFeatureIds([]);
        }
        setSelectedStaffIds([]);
        setShowAssignModal(true);
    };

    // Toggle feature selection
    const toggleFeatureSelection = (featureId) => {
        setSelectedFeatureIds(prev => {
            if (prev.includes(featureId)) {
                return prev.filter(id => id !== featureId);
            } else {
                return [...prev, featureId];
            }
        });
    };

    // Get current licenses for a staff member
    const getCurrentLicenseIds = (staff) => {
        if (!staff.status || staff.status.length === 0) return [];
        return availableFeatures
            .filter(feature => staff.status.includes(feature.name))
            .map(feature => feature.id);
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Staff Card */}
                <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-[#3B4A66] font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">Total Staff</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.total_staff || 0}
                    </p>
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Active team members</p>
                </div>

                {/* Licensed Features Card */}
                <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-[#3B4A66] font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">Licensed Features</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.licensed_features || 0}
                    </p>
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Total active licenses</p>
                </div>

                {/* Restricted Staff Card */}
                <div className="bg-red-50/30 !rounded-xl !border border-red-100 p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-red-700 font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">Restricted Staff</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.restricted_staff || 0}
                    </p>
                    <p className="text-xs text-red-600 font-[BasisGrotesquePro] leading-tight">
                        {summary.restricted_staff_date ? `Cannot purchase add-ons until ${summary.restricted_staff_date}` : 'Currently restricted from purchases'}
                    </p>
                </div>
            </div>

            {/* License Assignments Table Section */}
            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h6 className="text-lg sm:text-xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">License Assignments</h6>
                        <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Manage individual feature accessibility for your staff</p>
                    </div>
                    <button
                        onClick={() => openAssignModal(null, true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#3AD6F2] hover:bg-[#32c0da] text-white !rounded-xl font-bold text-sm transition-all shadow-md shadow-[#3AD6F2]/20 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Bulk Assign Licenses
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#3AD6F2]/30 border-t-[#3AD6F2]"></div>
                    </div>
                )}

                {!loading && staffLicenseAssignments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No license assignments found</p>
                        <button
                            onClick={() => openAssignModal(null, false)}
                            className="mt-4 text-[#3AD6F2] font-bold text-sm hover:underline"
                        >
                            Assign your first license →
                        </button>
                    </div>
                ) : !loading && (
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                        <div className="min-w-[900px] px-4 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 font-[BasisGrotesquePro]">
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Staff Member</th>
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Assigned Licenses</th>
                                        <th className="text-right py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {staffLicenseAssignments.map((staff) => (
                                        <tr key={staff.staff_id} className="group hover:bg-[#F8FAFF] transition-colors">
                                            <td className="py-5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#1F2A55] font-[BasisGrotesquePro]">{staff.staff_name}</span>
                                                    <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">{staff.staff_email}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-sm font-[BasisGrotesquePro]">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {!staff.status || staff.status.length === 0 ? (
                                                        <span className="text-gray-400 italic text-xs">No licenses assigned</span>
                                                    ) : (
                                                        staff.status.map((license, idx) => (
                                                            <span key={idx} className="px-2.5 py-1 bg-[#F3F7FF] text-[#3AD6F2] !rounded-md text-[10px] font-bold border border-[#E8F0FF] uppercase tracking-tight">
                                                                {license}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openAssignModal(staff, false)}
                                                        className="p-2 text-gray-400 hover:text-[#3AD6F2] hover:bg-white !rounded-lg transition-all border border-transparent hover:border-[#E8F0FF] shadow-none hover:shadow-sm"
                                                        title="Edit Licenses"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveLicenses(staff.staff_id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white !rounded-lg transition-all border border-transparent hover:border-red-50 shadow-none hover:shadow-sm"
                                                        title="Remove All Licenses"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalItems > itemsPerPage && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => fetchLicenseData(page)}
                        />
                    </div>
                )}
            </div>
            {/* Assign/Update License Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4" onClick={() => !assigning && setShowAssignModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                            <div>
                                <h4 className="text-2xl font-bold mb-1 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    {selectedStaff ? 'Update Licenses' : isBulkMode ? 'Bulk Assign Licenses' : 'Assign Licenses'}
                                </h4>
                                <p className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                                    {selectedStaff
                                        ? `Manage licenses for ${selectedStaff.staff_name}`
                                        : isBulkMode
                                            ? 'Select staff members and assign licenses'
                                            : 'Select license features to assign'}
                                </p>
                            </div>
                            <button
                                onClick={() => !assigning && setShowAssignModal(false)}
                                disabled={assigning}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors disabled:opacity-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Staff Selection for Bulk Mode */}
                            {isBulkMode && !selectedStaff && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                        Select Staff Members
                                    </label>
                                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                                        {staffLicenseAssignments.map((staff) => (
                                            <label key={staff.staff_id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStaffIds.includes(staff.staff_id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStaffIds([...selectedStaffIds, staff.staff_id]);
                                                        } else {
                                                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.staff_id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-[BasisGrotesquePro]">{staff.staff_name} ({staff.staff_email})</span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedStaffIds.length === 0 && (
                                        <p className="mt-2 text-sm text-red-600">Please select at least one staff member</p>
                                    )}
                                </div>
                            )}

                            {/* License Features Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Available License Features
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2">
                                    {availableFeatures.length === 0 ? (
                                        <p className="text-sm text-gray-600 p-2">No license features available</p>
                                    ) : (
                                        availableFeatures.map((feature) => (
                                            <label key={feature.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeatureIds.includes(feature.id)}
                                                    onChange={() => toggleFeatureSelection(feature.id)}
                                                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">{feature.name}</p>
                                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mt-1">{feature.description}</p>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-[BasisGrotesquePro]">
                                                        {feature.feature_type}
                                                    </span>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {selectedFeatureIds.length === 0 && (
                                    <p className="mt-2 text-sm text-red-600">Please select at least one license feature</p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <button
                                onClick={() => !assigning && setShowAssignModal(false)}
                                disabled={assigning}
                                className="px-6 py-2 bg-white border !rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedStaff) {
                                        handleUpdateLicenses(selectedStaff.staff_id, selectedFeatureIds);
                                    } else {
                                        handleAssignLicenses();
                                    }
                                }}
                                disabled={assigning || selectedFeatureIds.length === 0 || (isBulkMode && selectedStaffIds.length === 0)}
                                className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                            >
                                {assigning
                                    ? 'Processing...'
                                    : selectedStaff
                                        ? 'Update Licenses'
                                        : 'Assign Licenses'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove License Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRemoveLicenseConfirm}
                onClose={() => {
                    if (!assigning) {
                        setShowRemoveLicenseConfirm(false);
                        setLicenseToRemove(null);
                    }
                }}
                onConfirm={confirmRemoveLicenses}
                title="Remove License"
                message={licenseToRemove?.featureId
                    ? "Are you sure you want to remove this license?"
                    : "Are you sure you want to remove all licenses from this staff member?"}
                confirmText="Remove"
                cancelText="Cancel"
                isLoading={assigning}
                isDestructive={true}
            />
        </div>
    );
};

export default LicenseManagement;
