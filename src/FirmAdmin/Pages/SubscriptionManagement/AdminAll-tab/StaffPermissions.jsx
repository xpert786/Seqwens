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
        <div className="space-y-6 sm:space-y-8">
            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-[#3B4A66] font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">Total Staff</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.total_staff || 0}
                    </p>
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Active team members across firm</p>
                </div>

                <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-5 sm:p-6 shadow-sm">
                    <p className="text-xs sm:text-sm text-[#3B4A66] font-bold uppercase tracking-wider mb-2 font-[BasisGrotesquePro]">Staff with Permissions</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
                        {loading ? '...' : summary.staff_with_permissions || 0}
                    </p>
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Authorized for add-on purchases</p>
                </div>
            </div>

            <div className="bg-white !rounded-xl !border border-[#E8F0FF] p-4 sm:p-6 shadow-sm">
                <div className="mb-6">
                    <h6 className="text-lg sm:text-xl font-bold text-[#1F2A55] mb-1 font-[BasisGrotesquePro]">Staff Purchase Permissions</h6>
                    <p className="text-xs sm:text-sm text-gray-500 font-[BasisGrotesquePro]">Control who can purchase add-ons and set spending limits</p>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#F56D2D]/30 border-t-[#F56D2D]"></div>
                        <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Loading permissions...</p>
                    </div>
                ) : staffPermissions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No staff members found in this firm</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                        <div className="min-w-[800px] px-4 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 font-[BasisGrotesquePro]">
                                        <th className="text-left py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Staff Member</th>
                                        <th className="text-center py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Purchase Access</th>
                                        <th className="text-center py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Monthly Limit</th>
                                        <th className="text-right py-4 px-4 text-xs font-bold text-[#3B4A66] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {staffPermissions.map((staff) => (
                                        <tr key={staff.staff_id} className="hover:bg-[#F8FAFF] transition-colors group">
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#1F2A55] font-[BasisGrotesquePro]">{staff.staff_name}</span>
                                                    <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">{staff.staff_email}</span>
                                                    {staff.role && (
                                                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#3AD6F2]/80 font-[BasisGrotesquePro]">{staff.role}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleTogglePurchasePermission(staff)}
                                                        disabled={saving}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F56D2D]/20 ${staff.can_purchase_addons ? 'bg-[#F56D2D]' : 'bg-gray-200'
                                                            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${staff.can_purchase_addons ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`text-sm font-medium font-[BasisGrotesquePro] ${staff.monthly_spend_limit > 0 ? 'text-[#1F2A55]' : 'text-gray-400 italic'}`}>
                                                    {staff.monthly_spend_limit_display || formatMonthlyLimit(staff.monthly_spend_limit)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => openConfigModal(staff)}
                                                    className="px-4 py-2 bg-[#F3F7FF] text-[#3AD6F2] !rounded-lg hover:bg-[#E8F0FF] transition-all font-[BasisGrotesquePro] text-xs font-bold border border-[#E8F0FF]"
                                                >
                                                    Configure
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Configure Modal */}
            {showConfigModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4" onClick={() => !saving && setShowConfigModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <div>
                                <h4 className="text-xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">
                                    Staff Permissions
                                </h4>
                                <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mt-1">
                                    {selectedStaff.staff_name}
                                </p>
                            </div>
                            <button
                                onClick={() => !saving && setShowConfigModal(false)}
                                disabled={saving}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F7FF] text-[#3AD6F2] hover:bg-[#E8F0FF] transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Can Purchase Add-ons Toggle */}
                            <div className="bg-[#FBFCFF] border border-[#E8F0FF] rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">Purchase Access</p>
                                        <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-0.5">Enable add-on purchases</p>
                                    </div>
                                    <button
                                        onClick={() => setConfigData({ ...configData, can_purchase_addons: !configData.can_purchase_addons })}
                                        disabled={saving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${configData.can_purchase_addons ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${configData.can_purchase_addons ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Spend Limit */}
                            <div>
                                <label className="block text-sm font-bold text-[#3B4A66] mb-2 font-[BasisGrotesquePro]">
                                    Monthly Spending Limit
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3AD6F2] font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={configData.monthly_spend_limit}
                                        onChange={(e) => setConfigData({ ...configData, monthly_spend_limit: e.target.value })}
                                        disabled={saving || !configData.can_purchase_addons}
                                        className={`w-full pl-8 pr-4 py-3 border !rounded-xl transition-all font-bold text-[#1F2A55] font-[BasisGrotesquePro] focus:ring-2 focus:ring-[#3AD6F2]/20 focus:outline-none ${saving || !configData.can_purchase_addons ? 'bg-[#F9FAFB] border-gray-100 text-gray-300' : 'bg-white border-[#E8F0FF] hover:border-[#3AD6F2]/50'
                                            }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="mt-3 text-[10px] text-gray-400 font-[BasisGrotesquePro] bg-gray-50 p-2 rounded-lg border border-dashed">
                                    TIP: Leave at $0.00 for unlimited spending (only active when purchase access is ON)
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => !saving && setShowConfigModal(false)}
                                disabled={saving}
                                className="flex-1 px-6 py-3 border border-[#E8F0FF] !rounded-xl text-sm font-bold text-[#3B4A66] hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfiguration}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-[#F56D2D] text-white !rounded-xl text-sm font-bold shadow-md hover:bg-[#E55A1D] hover:shadow-lg transition-all disabled:opacity-50 font-[BasisGrotesquePro]"
                            >
                                {saving ? 'Applying...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPermissions;
