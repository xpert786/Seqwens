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
        <div>
            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Total Staff Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Staff</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.total_staff || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Active team members</p>
                </div>

                {/* Licensed Features Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Licensed Features</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.licensed_features || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Total active licenses</p>
                </div>

                {/* Restricted Staff Card */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Restricted Staff</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.restricted_staff || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">
                        {summary.restricted_staff_date ? `Cannot purchase add-ons until ${summary.restricted_staff_date}` : 'Cannot purchase add-ons'}
                    </p>
                </div>
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
