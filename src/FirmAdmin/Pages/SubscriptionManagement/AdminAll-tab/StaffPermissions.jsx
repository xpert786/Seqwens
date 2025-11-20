import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

const StaffPermissions = () => {
    // State management
    const [staffPermissions, setStaffPermissions] = useState([]);
    const [summary, setSummary] = useState({
        total_staff: 0,
        staff_with_permissions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [configData, setConfigData] = useState({
        can_purchase_addons: false,
        monthly_spend_limit: 0
    });
    const [saving, setSaving] = useState(false);

    // Fetch staff purchase permissions
    const fetchStaffPermissions = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/staff/purchase-permissions/`;

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
                setStaffPermissions(result.data.staff_permissions || []);
                setSummary({
                    total_staff: result.data.total_staff || 0,
                    staff_with_permissions: result.data.staff_with_permissions || 0
                });
            } else {
                setStaffPermissions([]);
                setSummary({ total_staff: 0, staff_with_permissions: 0 });
            }
        } catch (err) {
            console.error('Error fetching staff permissions:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load staff permissions. Please try again.');
            setStaffPermissions([]);
            setSummary({ total_staff: 0, staff_with_permissions: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchStaffPermissions();
    }, [fetchStaffPermissions]);

    // Handle toggle purchase permission
    const handleTogglePurchasePermission = async (staff) => {
        const newValue = !staff.can_purchase_addons;
        
        try {
            setSaving(true);
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/staff/purchase-permissions/`;

            const response = await fetchWithCors(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    staff_id: staff.staff_id,
                    can_purchase_addons: newValue
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Permission updated successfully!');
                await fetchStaffPermissions();
            } else {
                throw new Error(result.message || 'Failed to update permission');
            }
        } catch (err) {
            console.error('Error updating permission:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to update permission. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Open configure modal
    const openConfigModal = (staff) => {
        setSelectedStaff(staff);
        setConfigData({
            can_purchase_addons: staff.can_purchase_addons || false,
            monthly_spend_limit: staff.monthly_spend_limit || 0
        });
        setShowConfigModal(true);
    };

    // Handle save configuration
    const handleSaveConfiguration = async () => {
        if (!selectedStaff) return;

        try {
            setSaving(true);
            const token = getAccessToken();
            const url = `${API_BASE_URL}/user/firm-admin/staff/purchase-permissions/`;

            const response = await fetchWithCors(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    staff_id: selectedStaff.staff_id,
                    can_purchase_addons: configData.can_purchase_addons,
                    monthly_spend_limit: parseFloat(configData.monthly_spend_limit) || 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Configuration updated successfully!');
                setShowConfigModal(false);
                setSelectedStaff(null);
                await fetchStaffPermissions();
            } else {
                throw new Error(result.message || 'Failed to update configuration');
            }
        } catch (err) {
            console.error('Error updating configuration:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to update configuration. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Format monthly limit display
    const formatMonthlyLimit = (limit) => {
        if (!limit || limit === 0) return 'Unlimited';
        return `$${parseFloat(limit).toFixed(2)}`;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Total Staff</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.total_staff || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Staff members in firm</p>
                </div>

                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-2">Staff with Permissions</p>
                    <p className="text-xl sm:text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.staff_with_permissions || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-[BasisGrotesquePro]">Can purchase add-ons</p>
                </div>
            </div>

            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Staff Purchase Permissions</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Control who can purchase add-ons and set spending limits</p>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading staff permissions...</p>
                </div>
            ) : staffPermissions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-sm text-gray-600">No staff members found</p>
                </div>
            ) : (
                <>
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                        <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro]">Staff Member</div>
                        <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center">Can Purchase Add-ons</div>
                        <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center">Monthly Spend Limit</div>
                        <div className="font-regular text-gray-900 text-xs sm:text-sm font-[BasisGrotesquePro] text-center">Actions</div>
                    </div>

                    {/* Staff Rows */}
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                        {staffPermissions.map((staff) => (
                            <div key={staff.staff_id} className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 items-center p-2 sm:p-3 lg:p-4 !border border-[#E8F0FF] rounded-lg hover:bg-gray-50 transition-colors">
                                {/* Staff Member Column */}
                                <div>
                                    <p className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] mb-0.5">{staff.staff_name}</p>
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{staff.staff_email}</p>
                                    {staff.role && (
                                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">{staff.role}</p>
                                    )}
                                </div>

                                {/* Can Purchase Add-ons Column */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => handleTogglePurchasePermission(staff)}
                                        disabled={saving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            staff.can_purchase_addons ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                staff.can_purchase_addons ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Monthly Spend Limit Column */}
                                <div className="flex justify-center">
                                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                                        {staff.monthly_spend_limit_display || formatMonthlyLimit(staff.monthly_spend_limit)}
                                    </span>
                                </div>

                                {/* Actions Column */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => openConfigModal(staff)}
                                        className="px-4 py-2 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                                    >
                                        Configure
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Configure Modal */}
            {showConfigModal && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setShowConfigModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
                            <div>
                                <h4 className="text-2xl font-bold mb-1 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Configure Permissions
                                </h4>
                                <p className="text-sm font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                                    {selectedStaff.staff_name} ({selectedStaff.staff_email})
                                </p>
                            </div>
                            <button
                                onClick={() => !saving && setShowConfigModal(false)}
                                disabled={saving}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 transition-colors disabled:opacity-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Can Purchase Add-ons Toggle */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-3 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Can Purchase Add-ons
                                </label>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                        Allow this staff member to purchase add-ons
                                    </p>
                                    <button
                                        onClick={() => setConfigData({ ...configData, can_purchase_addons: !configData.can_purchase_addons })}
                                        disabled={saving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            configData.can_purchase_addons ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                configData.can_purchase_addons ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Spend Limit */}
                            <div>
                                <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                                    Monthly Spend Limit
                                </label>
                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] mb-3">
                                    Set to $0.00 for unlimited spending (only applies if purchase permission is enabled)
                                </p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-[BasisGrotesquePro]">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={configData.monthly_spend_limit}
                                        onChange={(e) => setConfigData({ ...configData, monthly_spend_limit: e.target.value })}
                                        disabled={saving || !configData.can_purchase_addons}
                                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-[BasisGrotesquePro] ${
                                            saving || !configData.can_purchase_addons ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {!configData.can_purchase_addons && (
                                    <p className="mt-2 text-xs text-gray-500 font-[BasisGrotesquePro]">
                                        Enable purchase permission to set a spending limit
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <button
                                onClick={() => !saving && setShowConfigModal(false)}
                                disabled={saving}
                                className="px-6 py-2 bg-white border !rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 font-[BasisGrotesquePro]"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfiguration}
                                disabled={saving}
                                className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                            >
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPermissions;
