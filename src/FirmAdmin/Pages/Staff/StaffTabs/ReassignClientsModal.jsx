import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function ReassignClientsModal({ isOpen, onClose, onSuccess, currentStaffId, clients }) {
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [targetType, setTargetType] = useState('firm'); // 'firm' or 'staff'
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedClientIds([]);
            setTargetType('firm');
            setSelectedStaffId('');
            fetchStaff();
        }
    }, [isOpen]);

    const fetchStaff = async () => {
        try {
            setLoadingStaff(true);
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const response = await fetchWithCors(`${API_BASE_URL}/firm/tax-preparers/list/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    // Filter out current staff member
                    const filteredStaff = result.data.filter(s => s.id !== parseInt(currentStaffId));
                    setStaffList(filteredStaff);
                }
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleClientToggle = (clientId) => {
        setSelectedClientIds(prev => {
            if (prev.includes(clientId)) {
                return prev.filter(id => id !== clientId);
            } else {
                return [...prev, clientId];
            }
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedClientIds(clients.map(c => c.id));
        } else {
            setSelectedClientIds([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedClientIds.length === 0) {
            toast.error("Please select at least one client to reassign.");
            return;
        }

        if (targetType === 'staff' && !selectedStaffId) {
            toast.error("Please select a target staff member.");
            return;
        }

        setLoading(true);
        try {
            const API_BASE_URL = getApiBaseUrl();
            const token = getAccessToken();

            const payload = {
                taxpayer_ids: selectedClientIds,
                tax_preparer_id: targetType === 'staff' ? parseInt(selectedStaffId) : null
            };

            const response = await fetchWithCors(`${API_BASE_URL}/firm/taxpayers/bulk-reassign-tax-preparer/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(result.message);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(result.message || "Failed to reassign clients");
            }
        } catch (error) {
            console.error("Error reassigning clients:", error);
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
            <div className="bg-white rounded-xl border border-[#E8F0FF] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-[#E8F0FF] flex-shrink-0">
                    <div>
                        <h5 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Reassign Clients</h5>
                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Transfer clients to another team member or back to the firm queue</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto hide-scrollbar flex-1">
                    {/* Step 1: Select Clients */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">Select Clients to Reassign ({selectedClientIds.length})</label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedClientIds.length === clients.length && clients.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                                Select All
                            </label>
                        </div>
                        <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                            {clients.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">No clients available to assign.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {clients.map(client => (
                                        <label key={client.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 h-4 w-4"
                                                checked={selectedClientIds.includes(client.id)}
                                                onChange={() => handleClientToggle(client.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] truncate">{client.name}</div>
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] truncate">{client.company}</div>
                                            </div>
                                            <div className={`px-2 py-0.5 text-xs rounded-full ${client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {client.status}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Select Target */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">Reassign To</label>
                        <div className="space-y-3">
                            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${targetType === 'firm' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="targetType"
                                    value="firm"
                                    checked={targetType === 'firm'}
                                    onChange={() => setTargetType('firm')}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">Unassign / Return to Firm Queue</span>
                                    <span className="block text-xs text-gray-500 mt-0.5 font-[BasisGrotesquePro]">Clients will be unassigned from current staff and visible to all admins.</span>
                                </div>
                            </label>

                            <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${targetType === 'staff' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <div className="flex items-center h-5">
                                    <input
                                        type="radio"
                                        name="targetType"
                                        value="staff"
                                        checked={targetType === 'staff'}
                                        onChange={() => setTargetType('staff')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="ml-3 w-full">
                                    <span className="block text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">Assign to Another Staff Member</span>

                                    {targetType === 'staff' && (
                                        <div className="mt-3">
                                            <select
                                                value={selectedStaffId}
                                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-[BasisGrotesquePro]"
                                            >
                                                <option value="">-- Select Staff Member --</option>
                                                {loadingStaff ? (
                                                    <option disabled>Loading staff list...</option>
                                                ) : (
                                                    staffList.map(staff => (
                                                        <option key={staff.id} value={staff.id}>
                                                            {staff.first_name} {staff.last_name} ({staff.role})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8F0FF] bg-gray-50 rounded-b-xl flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 font-[BasisGrotesquePro]"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Confirm Reassignment
                    </button>
                </div>
            </div>
        </div>
    );
}
