import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError, clearUserData } from '../../../ClientOnboarding/utils/apiUtils';
import { getLoginUrl } from '../../../ClientOnboarding/utils/urlUtils';
import EmailTemplatesTab from './EmailTemplatesTab';
import { toast } from 'react-toastify';

export default function AdvancedTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const general = await firmAdminSettingsAPI.getGeneralInfo();
        if (general && general.success && general.data) {
          setFirmName(general.data.firm_name || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const handleSave = async () => {
    // If there are saved advanced settings in future, this will update them.
    try {
      setSaving(true);
      // currently nothing to persist from this simplified Advanced tab
      toast.success('Advanced settings saved');
    } catch (err) {
      const msg = handleAPIError(err);
      setError(msg || 'Failed to save settings');
      toast.error(msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    if (deleteConfirmation && deleteConfirmation !== 'DELETE' && deleteConfirmation !== firmName) {
      toast.error('Confirmation must be "DELETE" or your firm name');
      return;
    }

    try {
      setDeleting(true);
      const resp = await firmAdminSettingsAPI.deleteAccount(deletePassword, deleteConfirmation || null);
      if (resp && resp.success) {
        toast.success(resp.message || 'Firm account deleted');
        clearUserData();
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => { window.location.href = getLoginUrl(); }, 1200);
      } else {
        throw new Error(resp?.message || 'Delete failed');
      }
    } catch (err) {
      const msg = handleAPIError(err);
      setError(msg || 'Failed to delete account');
      toast.error(msg || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading advanced settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Email Templates */}
      <EmailTemplatesTab />

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#EF4444] mb-1">Danger Zone</h5>
          <p className="text-[15px] text-[#4B5563]">Irreversible and destructive actions</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-[#EF444417] rounded-lg border border-[#EF4444]">
            <div className="flex-1">
              <h6 className="text-sm font-medium text-[#1F2A55] mb-1">Delete Firm Account</h6>
              <p className="text-xs text-[#4B5563]">Permanently delete your firm account and all data</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-red-700" style={{ borderRadius: '8px' }}>Delete Account</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {saving ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-[#E8F0FF]" style={{ borderRadius: '12px' }}>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#EF4444] mb-2">Delete Firm Account</h3>
              <p className="text-sm text-[#4B5563]">This action cannot be undone. This will permanently delete your firm account and all associated data. All users will lose access immediately.</p>
            </div>

            {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>)}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Enter Your Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type={showDeletePassword ? "text" : "password"} 
                    value={deletePassword} 
                    onChange={(e) => setDeletePassword(e.target.value)} 
                    placeholder="Enter your password to confirm" 
                    className="w-full px-3 py-2 pr-10 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]" 
                    disabled={deleting} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#3B4A66] focus:outline-none"
                    disabled={deleting}
                  >
                    <i className={`bi ${showDeletePassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "18px" }}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4A66] mb-2">Type "DELETE" or Firm Name (Optional)</label>
                <input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder={firmName ? `Type \"DELETE\" or \"${firmName}\"` : 'Type \"DELETE\"'} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EF4444]" disabled={deleting} />
                <p className="text-xs text-[#6B7280] mt-1">For additional security, type "DELETE" or your firm name</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmation(''); setError(''); }} disabled={deleting} className="px-4 py-2 text-sm font-medium text-[#3B4A66] bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderRadius: '8px' }}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleting || !deletePassword} className="px-4 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" style={{ borderRadius: '8px' }}>{deleting ? (<><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Deleting...</span></>) : (<span>Delete Account</span>)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

