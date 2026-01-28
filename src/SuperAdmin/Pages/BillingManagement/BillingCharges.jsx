import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { superAdminBillingAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';

const API_BASE_URL = getApiBaseUrl();

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'billed', label: 'Billed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function BillingCharges() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firms, setFirms] = useState([]);
  const [firmFilter, setFirmFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvingChargeId, setApprovingChargeId] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [chargeToApprove, setChargeToApprove] = useState(null);

  // Fetch firms list
  const fetchFirms = useCallback(async () => {
    try {
      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFirms(Array.isArray(result.data) ? result.data : result.data.results || []);
        }
      }
    } catch (err) {
      console.error('Error fetching firms:', err);
    }
  }, []);

  // Fetch billing charges
  const fetchBillingCharges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (firmFilter) {
        params.firm_id = firmFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await superAdminBillingAPI.listBillingCharges(params);

      if (response.success) {
        setCharges(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response.message || 'Failed to load billing charges');
      }
    } catch (err) {
      console.error('Error fetching billing charges:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load billing charges');
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [firmFilter, statusFilter]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  useEffect(() => {
    fetchBillingCharges();
  }, [fetchBillingCharges]);

  const handleApproveClick = (charge) => {
    setChargeToApprove(charge);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!chargeToApprove) return;

    try {
      setApprovingChargeId(chargeToApprove.id);
      const response = await superAdminBillingAPI.approveBillingCharge(chargeToApprove.id);

      if (response.success) {
        toast.success(response.message || 'Billing charge approved successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        setShowApproveModal(false);
        setChargeToApprove(null);
        fetchBillingCharges();
      } else {
        throw new Error(response.message || 'Failed to approve billing charge');
      }
    } catch (err) {
      console.error('Error approving charge:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to approve billing charge', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setApprovingChargeId(null);
    }
  };

  const getFirmName = (firmId) => {
    const firm = firms.find(f => f.id === firmId || f.firm_id === firmId);
    return firm?.name || firm?.firm_name || `Firm #${firmId}`;
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'billed':
        return 'bg-purple-100 text-purple-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading && charges.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading billing charges...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-[#E8F0FF] p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
            Billing Charges
          </h3>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
            View and approve billing charges for additional offices and users
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Filter by Firm
            </label>
            <select
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
            >
              <option value="">All Firms</option>
              {firms.map((firm) => (
                <option key={firm.id || firm.firm_id} value={firm.id || firm.firm_id}>
                  {firm.name || firm.firm_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8F0FF]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Firm
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Charge Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Quantity
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Unit Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Total Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Billing Period
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 font-[BasisGrotesquePro]">
                    No billing charges found
                  </td>
                </tr>
              ) : (
                charges.map((charge) => (
                  <tr key={charge.id} className="border-b border-[#E8F0FF] hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      {charge.firm_name || getFirmName(charge.firm)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      {charge.charge_type_display || charge.charge_type || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      {charge.quantity || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-[BasisGrotesquePro]">
                      ${parseFloat(charge.unit_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      ${parseFloat(charge.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(charge.status)} font-[BasisGrotesquePro]`}>
                        {charge.status_display || charge.status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-[BasisGrotesquePro]">
                      {charge.billing_period_start && charge.billing_period_end
                        ? `${formatDate(charge.billing_period_start)} - ${formatDate(charge.billing_period_end)}`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {charge.status === 'pending' && charge.requires_approval && (
                        <button
                          onClick={() => handleApproveClick(charge)}
                          disabled={approvingChargeId === charge.id}
                          className="text-[#3AD6F2] hover:text-[#2BC5E0] font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
                        >
                          {approvingChargeId === charge.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                      {charge.status === 'approved' && (
                        <span className="text-sm text-green-600 font-[BasisGrotesquePro]">
                          Approved
                        </span>
                      )}
                      {charge.status !== 'pending' && charge.status !== 'approved' && (
                        <span className="text-sm text-gray-400 font-[BasisGrotesquePro]">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && chargeToApprove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1070] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">
                  Approve Billing Charge
                </h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                  Confirm approval of this billing charge
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setChargeToApprove(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                disabled={approvingChargeId === chargeToApprove.id}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-[BasisGrotesquePro]">Firm:</span>
                    <span className="ml-2 font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      {chargeToApprove.firm_name || getFirmName(chargeToApprove.firm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-[BasisGrotesquePro]">Type:</span>
                    <span className="ml-2 font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      {chargeToApprove.charge_type_display || chargeToApprove.charge_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-[BasisGrotesquePro]">Quantity:</span>
                    <span className="ml-2 font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      {chargeToApprove.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-[BasisGrotesquePro]">Total:</span>
                    <span className="ml-2 font-semibold text-gray-900 font-[BasisGrotesquePro]">
                      ${parseFloat(chargeToApprove.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              {chargeToApprove.notes && (
                <div>
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">
                    <span className="font-semibold">Notes:</span> {chargeToApprove.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setChargeToApprove(null);
                }}
                disabled={approvingChargeId === chargeToApprove.id}
                className="px-4 py-2 border border-[#E8F0FF] bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={approvingChargeId === chargeToApprove.id}
                className="px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-orange-600 transition-colors font-[BasisGrotesquePro] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approvingChargeId === chargeToApprove.id ? 'Approving...' : 'Approve Charge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

