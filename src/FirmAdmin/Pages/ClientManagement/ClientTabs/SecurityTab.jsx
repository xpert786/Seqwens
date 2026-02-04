import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { firmAdminClientsAPI, handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

const SecurityTab = ({ client }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (!client?.id) {
      toast.error('Client ID is missing');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    try {
      setResettingPassword(true);

      const response = await firmAdminClientsAPI.resetTaxpayerPassword(client.id, {
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
      toast.error(handleAPIError(err) || 'Failed to reset password. Please try again.', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setResettingPassword(false);
    }
  };

  // Cancel confirmation
  const cancelPasswordReset = () => {
    setShowConfirmDialog(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Password Reset Section */}
      <div className="bg-white rounded-xl p-6 border border-[#E8F0FF]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <div className="flex-1">
            <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Reset Password
            </h4>

            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">
              Force a password reset for this client. They will be logged out and need to use the new credentials.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  {client?.email || 'No email available'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!client?.email}
              className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '8px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Reset Password
            </button>

            {!client?.email && (
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
              Account Security Info
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Account Status</div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${client?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] capitalize">
                    {client?.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Last Secure Action</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                  {client?.lastActivity || 'No recent activity'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">
                  Set New Password
                </h4>
              </div>

              <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">
                Enter a new secure password for <strong>{client?.name}</strong>.
                They will be required to use this password for their next login.
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={resettingPassword}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-[BasisGrotesquePro] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={resettingPassword}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelPasswordReset}
                  disabled={resettingPassword}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium font-[BasisGrotesquePro] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword}
                  className="flex-1 px-4 py-2.5 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-medium font-[BasisGrotesquePro] text-sm flex items-center justify-center gap-2"
                >
                  {resettingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Password'
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

export default SecurityTab;
