import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';
import { superToastOptions } from '../utils/toastConfig';

const roleBadgeStyles = {
    support_admin: 'bg-[#E0F2FE] text-[#0369A1]',
    billing_admin: 'bg-[#FEE2E2] text-[#991B1B]',
    super_admin: 'bg-[#EDE9FE] text-[#5B21B6]',
};

const statusBadgeStyles = {
    active: 'bg-[#DCFCE7] text-[#15803D]',
    suspended: 'bg-[#FEE2E2] text-[#B91C1C]',
};

const formatPermission = (permission) =>
    permission
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const formatDateTime = (value) => {
    if (!value) {
        return null;
    }
    try {
        return new Date(value).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        return value;
    }
};

const normalizeUserDetails = (data) => {
    if (!data) {
        return null;
    }

    if (data.profile || data.account_information) {
        return data;
    }

    const status = data.is_suspended
        ? 'suspended'
        : data.is_active
            ? 'active'
            : 'inactive';

    const statusDisplay = data.is_suspended
        ? 'Suspended'
        : data.is_active
            ? 'Active'
            : 'Inactive';

    return {
        ...data,
        profile: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email || data.username || '',
            phone_number: data.phone_number,
            role: data.role,
            role_display_name: data.role_display_name,
            status,
            status_display: statusDisplay,
            firm_name: data.firm_name,
            avatar_initials:
                data.first_name && data.last_name
                    ? `${data.first_name[0]}${data.last_name[0]}`.toUpperCase()
                    : (data.username || '').slice(0, 2).toUpperCase(),
        },
        account_information: {
            phone_number: data.phone_number,
            email: data.email,
            join_date: data.date_joined,
            join_date_display: formatDateTime(data.date_joined),
            last_login: data.last_login,
            last_login_display: formatDateTime(data.last_login),
            created_by: data.created_by,
            created_by_name: data.created_by_name,
        },
        permissions: data.permissions || [],
        actions: {
            ...(data.actions || {}),
            can_suspend:
                data.actions?.can_suspend !== undefined
                    ? data.actions.can_suspend
                    : true,
        },
    };
};

const UsersDetails = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('Policy violation under review');
    const [reasonError, setReasonError] = useState('');
    const [showAdminTypeModal, setShowAdminTypeModal] = useState(false);
    const [selectedAdminType, setSelectedAdminType] = useState('');

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await superAdminAPI.getAdminUserById(userId);
                if (response.success && response.data) {
                    setUserDetails(normalizeUserDetails(response.data));
                } else {
                    throw new Error(response.message || 'Failed to load user details');
                }
            } catch (err) {
                const message = handleAPIError(err);
                setError(message);
                toast.error(message, superToastOptions);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserDetails();
        }
    }, [userId]);

    const profile = userDetails?.profile || {};
    const accountInfo = userDetails?.account_information || {};
    const permissions = userDetails?.permissions || [];
    const actions = userDetails?.actions || {};

    const fullName = useMemo(() => {
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        return name || 'User';
    }, [profile.first_name, profile.last_name]);

    const roleBadge =
        roleBadgeStyles[profile.role] || 'bg-gray-200 text-gray-700';
    const statusBadge =
        statusBadgeStyles[profile.status] || 'bg-gray-200 text-gray-700';
    const isSuspended = profile.status === 'suspended';
    const actionButtonLabel = isSuspended ? 'Unsuspend Account' : 'Suspend Account';
    const actionButtonClasses = isSuspended
        ? 'px-4 py-2 text-sm font-medium text-white bg-[#22C55E] rounded-md hover:bg-[#16A34A] transition-colors'
        : 'px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-md hover:bg-[#E4561F] transition-colors';

    const updateUserStateAfterAction = (currentlySuspended) => {
        setUserDetails((previous) => {
            if (!previous) {
                return previous;
            }
            const nextStatus = currentlySuspended ? 'active' : 'suspended';
            const nextStatusDisplay = currentlySuspended ? 'Active' : 'Suspended';

            return {
                ...previous,
                is_suspended: !currentlySuspended,
                is_active: currentlySuspended ? true : false,
                profile: {
                    ...previous.profile,
                    status: nextStatus,
                    status_display: nextStatusDisplay,
                },
                actions: {
                    ...previous.actions,
                    can_suspend: true,
                },
            };
        });
    };

    const handleUnsuspend = async () => {
        if (!userDetails || actionLoading) {
            return;
        }

        try {
            setActionLoading(true);
            await superAdminAPI.updateAdminUserSuspension(userId, { action: 'unsuspend' });
            toast.success('User unsuspended successfully.', superToastOptions);
            updateUserStateAfterAction(true);
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspendClick = () => {
        setSuspensionReason('Policy violation under review');
        setReasonError('');
        setShowSuspendModal(true);
    };

    const handleConfirmSuspend = async () => {
        if (!userDetails || actionLoading) {
            return;
        }

        const trimmedReason = suspensionReason.trim();
        if (!trimmedReason) {
            setReasonError('Suspension reason is required.');
            return;
        }

        try {
            setActionLoading(true);
            setReasonError('');
            await superAdminAPI.updateAdminUserSuspension(userId, {
                action: 'suspend',
                reason: trimmedReason,
            });
            toast.success('User suspended successfully.', superToastOptions);
            updateUserStateAfterAction(false);
            setShowSuspendModal(false);
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelSuspend = () => {
        if (actionLoading) {
            return;
        }
        setShowSuspendModal(false);
        setReasonError('');
    };

    const handleChangeAdminTypeClick = () => {
        setSelectedAdminType(profile.role || '');
        setShowAdminTypeModal(true);
    };

    const handleConfirmAdminTypeChange = async () => {
        if (!userDetails || actionLoading || !selectedAdminType) {
            return;
        }

        if (selectedAdminType === profile.role) {
            toast.info('No changes made - same admin type selected.', superToastOptions);
            setShowAdminTypeModal(false);
            return;
        }

        try {
            setActionLoading(true);
            await superAdminAPI.updateUser(userId, { role: selectedAdminType });
            toast.success('Admin type updated successfully.', superToastOptions);

            // Update local state
            setUserDetails(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    role: selectedAdminType,
                    role_display_name: selectedAdminType.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                }
            }));

            setShowAdminTypeModal(false);
        } catch (err) {
            const message = handleAPIError(err);
            toast.error(message, superToastOptions);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelAdminTypeChange = () => {
        if (actionLoading) {
            return;
        }
        setShowAdminTypeModal(false);
        setSelectedAdminType('');
    };

    const avatarInitials =
        profile.avatar_initials ||
        (profile.first_name && profile.last_name
            ? `${profile.first_name[0]}${profile.last_name[0]}`
            : fullName.slice(0, 2).toUpperCase());

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F7FF] p-6">
                <div className="bg-white border border-[#E8F0FF] rounded-xl p-6">
                    <p className="text-sm text-[#3B4A66]">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F6F7FF] p-6">
                <div className="bg-white border border-[#FCA5A5] rounded-xl p-6">
                    <p className="text-sm text-[#B91C1C] font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (!userDetails) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#F6F7FF] p-6">
            <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">
                    User Details – {fullName}
                </h3>
                <p className="text-sm text-gray-600">Comprehensive user information and account management</p>
                <button
                    type="button"
                    onClick={() => navigate('/superadmin/users')}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-[#3B4A66] hover:underline focus:outline-none"
                >
                    ← Back to User Management
                </button>
            </div>
            <div className="mb-6 space-y-1">
                <div className="bg-white mb-[30px] border border-[#E8F0FF] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#E8F0FF] flex items-center justify-center text-xl font-semibold text-[#3B4A66]">
                            {avatarInitials}
                        </div>
                        <div className="space-y-2">
                            <div>
                                <h2 className="text-2xl font-semibold text-[#3B4A66]">{fullName}</h2>
                                <p className="text-sm text-gray-500">
                                    {profile.firm_name || 'Comprehensive user information and account management'}
                                </p>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleBadge}`}>
                                    {profile.role_display_name || profile.role || 'Role'}
                                </span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge}`}>
                                    {profile.status_display || profile.status || 'Status'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                className={actionButtonClasses}
                                style={{ borderRadius: '7px' }}
                                disabled={!actions.can_suspend || actionLoading}
                                onClick={isSuspended ? handleUnsuspend : handleSuspendClick}
                                title={!actions.can_suspend ? 'Suspension not permitted for this user' : undefined}
                            >
                                {actionLoading ? 'Processing...' : actionButtonLabel}
                            </button>
                            {profile.role && ['super_admin', 'support_admin', 'billing_admin'].includes(profile.role) && (
                                <button
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] border border-transparent rounded-lg hover:bg-[#E55A1F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F56D2D] disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={actionLoading}
                                    onClick={handleChangeAdminTypeClick}
                                    title="Change admin type"
                                    style={{ borderRadius: '8px' }}
                                >
                                    Change Admin Type
                                </button>

                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#E8F0FF] rounded-xl p-6">
                        <h3 className="text-base font-semibold text-[#3B4A66] mb-4">Account Information</h3>
                        <div className="space-y-4 text-sm text-[#3B4A66]">
                            <div className="flex justify-between">
                                <span className="font-medium">Phone:</span>
                                <span>{accountInfo.phone_number || profile.phone_number || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Email:</span>
                                <span>{profile.email || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Join Date:</span>
                                <span>{accountInfo.join_date_display || accountInfo.join_date || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Last Login:</span>
                                <span>{accountInfo.last_login_display || accountInfo.last_login || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E8F0FF] rounded-xl p-6">
                        <h3 className="text-base font-semibold text-[#3B4A66] mb-4">Permissions</h3>
                        <ul className="space-y-2 text-sm text-[#3B4A66]">
                            {permissions.map((permission) => (
                                <li key={permission} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                                    {formatPermission(permission)}
                                </li>
                            ))}
                            {permissions.length === 0 && (
                                <li className="text-sm text-gray-500">No permissions assigned.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            {showSuspendModal && (
                <div
                    className="fixed inset-0 z-[1070] flex items-center justify-center px-4"
                    style={{ background: 'var(--Color-overlay, #00000099)' }}
                >
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-[#3B4A66]">Suspend User</h3>
                            <p className="text-sm text-gray-600">
                                Provide a reason for suspending this user. This will be recorded for audit purposes.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3B4A66]" htmlFor="suspension-reason">
                                Suspension Reason
                            </label>
                            <textarea
                                id="suspension-reason"
                                className="w-full min-h-[120px] border border-[#E8F0FF] rounded-lg px-3 py-2 text-sm text-[#3B4A66] focus:outline-none focus:ring-2 focus:ring-[#5B21B6] resize-none"
                                value={suspensionReason}
                                onChange={(event) => {
                                    setSuspensionReason(event.target.value);
                                    if (reasonError) {
                                        setReasonError('');
                                    }
                                }}
                                placeholder="Enter suspension reason..."
                                disabled={actionLoading}
                            />
                            {reasonError && <p className="text-xs text-[#B91C1C]">{reasonError}</p>}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-md hover:bg-[#F8FAFC] transition-colors"
                                onClick={handleCancelSuspend}
                                disabled={actionLoading}
                                style={{ borderRadius: '7px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-md hover:bg-[#E4561F] transition-colors disabled:opacity-60"
                                onClick={handleConfirmSuspend}
                                disabled={actionLoading}
                                style={{ borderRadius: '7px' }}
                            >
                                {actionLoading ? 'Processing...' : 'Confirm Suspension'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Type Change Modal */}
            {showAdminTypeModal && (
                <div
                    className="fixed inset-0 z-[1070] flex items-center justify-center px-4"
                    style={{ background: 'var(--Color-overlay, #00000099)' }}
                >
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-[#3B4A66]">Change Admin Type</h3>
                            <p className="text-sm text-gray-600">
                                Select a new admin type for this user. This will change their permissions and access level.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#3B4A66]" htmlFor="admin-type">
                                Admin Type
                            </label>
                            <select
                                id="admin-type"
                                className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B21B6] bg-white"
                                value={selectedAdminType}
                                onChange={(e) => setSelectedAdminType(e.target.value)}
                                disabled={actionLoading}
                            >
                                <option value="super_admin">Super Admin</option>
                                <option value="support_admin">Support Admin</option>
                                <option value="billing_admin">Billing Admin</option>
                            </select>
                            <p className="text-xs text-gray-500">
                                Current: {profile.role_display_name || profile.role}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-md hover:bg-[#F8FAFC] transition-colors"
                                onClick={handleCancelAdminTypeChange}
                                disabled={actionLoading}
                                style={{ borderRadius: '7px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-md hover:bg-[#E4561F] transition-colors disabled:opacity-60"
                                onClick={handleConfirmAdminTypeChange}
                                disabled={actionLoading || !selectedAdminType}
                                style={{ borderRadius: '7px' }}
                            >
                                {actionLoading ? 'Updating...' : 'Update Admin Type'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersDetails;
