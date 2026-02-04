import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { taxPreparerClientAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';

const ClientSecurity = () => {
    const navigate = useNavigate();
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState({});
    const [resettingPassword, setResettingPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch client details from API
    const fetchClientDetails = useCallback(async () => {
        if (!clientId) {
            setError('Client ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const token = getAccessToken();
            const url = `${getApiBaseUrl()}/user/firm-admin/clients/${clientId}/`;

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
                setClient(result.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching client details:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load client details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    // Validate password inputs
    const validatePasswords = () => {
        const errors = {};

        if (!newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters long';
        }

        if (!confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm the new password';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle password reset
    const handlePasswordReset = async () => {
        if (!clientData?.id) {
            toast.error('Client ID is missing');
            return;
        }

        if (!validatePasswords()) {
            return;
        }

        try {
            setResettingPassword(true);

            const response = await taxPreparerClientAPI.resetTaxpayerPassword(clientData.id, {
                new_password: newPassword,
                confirm_password: confirmPassword
            });

            if (response.success) {
                toast.success(response.message || 'Password reset successfully.', {
                    position: "top-right",
                    autoClose: 5000,
                });
                // Close modal and reset form
                setShowConfirmDialog(false);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordErrors({});
            } else {
                throw new Error(response.message || 'Failed to reset password');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
            toast.error(err.message || 'Failed to reset password. Please try again.', {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setResettingPassword(false);
        }
    };

    // Show confirmation dialog
    const confirmPasswordReset = () => {
        setShowConfirmDialog(true);
    };

    // Cancel confirmation
    const cancelPasswordReset = () => {
        setShowConfirmDialog(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
    };

    // Fetch client details on mount
    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    // Map API data to component format
    const clientData = client ? {
        id: client.profile?.id || client.id,
        initials: client.profile?.initials || '',
        name: client.profile?.name || client.personal_information?.name || (client.profile?.first_name && client.profile?.last_name ? `${client.profile.first_name} ${client.profile.last_name}` : '') || 'Unknown Client',
        firstName: client.profile?.first_name || client.personal_information?.first_name || '',
        lastName: client.profile?.last_name || client.personal_information?.last_name || '',
        profilePicture: client.profile?.profile_picture_url || null,
        email: client.profile?.email || client.contact_details?.email || '',
        phone: client.profile?.phone_formatted || client.contact_details?.phone_formatted || client.profile?.phone || client.contact_details?.phone || '',
        phoneRaw: client.profile?.phone || client.contact_details?.phone || '',
        ssn: client.personal_information?.ssn || '',
        ssnValue: client.personal_information?.ssn_value || '',
        status: client.account_details?.status || client.profile?.account_status?.toLowerCase() || 'active',
        filingStatus: client.personal_information?.filing_status || '',
        filingStatusValue: client.personal_information?.filing_status_value || '',
        gender: client.personal_information?.gender || client.personal_information?.gender_value || null,
        dob: client.personal_information?.date_of_birth || '',
        dobValue: client.personal_information?.date_of_birth_value || '',
        address: {
            line: client.address_information?.address_line || '',
            city: client.address_information?.city || '',
            state: client.address_information?.state || '',
            zip: client.address_information?.zip_code || ''
        },
        spouse: {
            name: client.spouse_information?.name || '',
            firstName: client.spouse_information?.first_name || '',
            middleName: client.spouse_information?.middle_name || '',
            lastName: client.spouse_information?.last_name || '',
            dob: client.spouse_information?.date_of_birth || '',
            dobValue: client.spouse_information?.date_of_birth_value || '',
            ssn: client.spouse_information?.ssn || '',
            ssnValue: client.spouse_information?.ssn_value || '',
            filingStatus: client.spouse_information?.filing_status || '',
            filingStatusValue: client.spouse_information?.filing_status_value || ''
        },
        spouseContact: {
            phone: client.spouse_contact_details?.phone || '',
            email: client.spouse_contact_details?.email || ''
        },
        assignedStaff: {
            id: client.account_details?.assigned_staff?.id || null,
            name: client.account_details?.assigned_staff_name || client.account_details?.assigned_staff?.name || '',
            email: client.account_details?.assigned_staff?.email || ''
        },
        joinDate: client.account_details?.join_date || '',
        joinDateValue: client.account_details?.join_date_value || '',
        lastLogin: client.account_details?.last_login || '',
        lastLoginValue: client.account_details?.last_login_value || '',
        accountStatus: client.account_details?.status || client.profile?.account_status?.toLowerCase() || 'active',
        accountStatusDisplay: client.account_details?.status_display || client.profile?.account_status || 'Active',
        totalBilled: client.summary_cards?.total_billed || client.engagement_metrics?.outstanding_balance || '$0.00',
        totalBilledRaw: 0,
        documents: client.summary_cards?.documents_uploaded || client.engagement_metrics?.documents_uploaded || 0,
        appointments: client.engagement_metrics?.total_appointments || client.summary_cards?.appointments_scheduled || 0,
        lastActivity: client.summary_cards?.last_activity || client.summary_cards?.last_activity_relative || '',
        lastActivityDetails: {
            lastActive: client.summary_cards?.last_activity_value || '',
            lastActiveDisplay: client.summary_cards?.last_activity || '',
            lastActiveRelative: client.summary_cards?.last_activity_relative || ''
        },
        billingHistory: client.billing_history || [],
        dateJoined: client.account_details?.join_date_value || ''
    } : null;

    // Loading state
    if (loading) {
        return (
            <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading client security details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !clientData) {
        return (
            <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>
                        <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Client Security</h4>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error || 'Client not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                </div>
            </div>

            {/* Security Tab Content */}
            <div className="space-y-6">
                {/* Password Reset Section */}
                <div className="bg-white rounded-xl p-6 border border-[#E8F0FF]">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Reset Password
                            </h4>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                    <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                                        {clientData?.email || 'No email available'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h5 className="text-sm font-medium text-blue-900 font-[BasisGrotesquePro] mb-1">
                                            Password Requirements
                                        </h5>
                                        <ul className="text-xs text-blue-800 font-[BasisGrotesquePro] space-y-1">
                                            <li>• Minimum 8 characters long</li>
                                            <li>• Passwords must match</li>
                                            <li>• New password will be set immediately</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={confirmPasswordReset}
                                disabled={resettingPassword || !clientData?.email}
                                className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resettingPassword ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Reset Password
                                    </>
                                )}
                            </button>

                            {!clientData?.email && (
                                <p className="text-xs text-red-600 font-[BasisGrotesquePro] mt-2">
                                    Cannot reset password: No email address available for this client
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Status Section */}
                <div className="bg-white rounded-xl p-6 border border-[#E8F0FF]">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
                                Account Status
                            </h4>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
                                Current account status and security information.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Status</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-block w-2 h-2 rounded-full ${clientData?.status === 'active' ? 'bg-green-500' :
                                            clientData?.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></span>
                                        <span className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] capitalize">
                                            {clientData?.status || 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Last Login</div>
                                    <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                                        {clientData?.lastLogin || clientData?.last_login || clientData?.account_details?.last_login || 'Never'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Reset Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                                    Set New Password
                                </h4>
                            </div>

                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
                                Enter a new password for <strong>{clientData?.name}</strong>.
                                The new password will be set immediately.
                            </p>

                            <div className="space-y-4 mb-6">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                                        New Password *
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={resettingPassword}
                                            className={`w-full px-3 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                                } ${resettingPassword ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Enter new password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            disabled={resettingPassword}
                                            className="absolute inset-y-0 right-2 flex items-center justify-center w-8 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            {showNewPassword ? (
                                                /* Eye Off */
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                /* Eye */
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {passwordErrors.newPassword && (
                                        <p className="text-xs text-red-600 mt-1">{passwordErrors.newPassword}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                                        Confirm Password *
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={resettingPassword}
                                            className={`w-full px-3 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro] ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                } ${resettingPassword ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Confirm new password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            disabled={resettingPassword}
                                            className="absolute inset-y-0 right-2 flex items-center justify-center w-8 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        >
                                            {showConfirmPassword ? (
                                                /* Eye Off */
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                /* Eye */
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {passwordErrors.confirmPassword && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {passwordErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>


                            <div className="flex items-center gap-3">
                                <button
                                    onClick={cancelPasswordReset}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-[BasisGrotesquePro] text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={resettingPassword}
                                    className="flex-1 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resettingPassword ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Setting...
                                        </>
                                    ) : (
                                        'Set Password'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSecurity;
