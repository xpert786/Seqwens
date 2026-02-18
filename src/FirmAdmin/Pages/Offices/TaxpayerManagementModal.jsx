import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { firmOfficeAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaSearch, FaUserMinus } from 'react-icons/fa';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function TaxpayerManagementModal({ show, onClose, officeId, officeName, onUpdate }) {
  const [taxpayers, setTaxpayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaxpayers, setSelectedTaxpayers] = useState([]);
  const [assignedTaxpayers, setAssignedTaxpayers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [showRemoveTaxpayerConfirm, setShowRemoveTaxpayerConfirm] = useState(false);
  const [taxpayerToRemove, setTaxpayerToRemove] = useState(null);

  // Fetch taxpayers
  useEffect(() => {
    if (show && officeId) {
      fetchTaxpayers();
      fetchAssignedTaxpayers();
    }
  }, [show, officeId, searchTerm, showAssignedOnly]);

  const fetchTaxpayers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (showAssignedOnly) {
        params.assigned_only = true;
      }
      const response = await firmOfficeAPI.listTaxpayers(params);

      if (response.success && response.data) {
        setTaxpayers(response.data.taxpayers || []);
      } else {
        toast.error(response.message || 'Failed to load taxpayers', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedTaxpayers = async () => {
    try {
      const params = { office_id: officeId };
      const response = await firmOfficeAPI.listTaxpayers(params);

      if (response.success && response.data) {
        const assigned = response.data.taxpayers || [];
        setAssignedTaxpayers(assigned.map(t => t.id));
      }
    } catch (error) {
      console.error('Error fetching assigned taxpayers:', error);
    }
  };

  const handleSelectTaxpayer = (taxpayerId) => {
    setSelectedTaxpayers(prev =>
      prev.includes(taxpayerId)
        ? prev.filter(id => id !== taxpayerId)
        : [...prev, taxpayerId]
    );
  };

  const handleAssignTaxpayers = async () => {
    if (selectedTaxpayers.length === 0) {
      toast.warning('Please select at least one taxpayer to assign', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      setAssigning(true);
      const response = await firmOfficeAPI.assignTaxpayerToOffice(
        officeId,
        null,
        selectedTaxpayers
      );

      if (response.success) {
        toast.success(`Successfully assigned ${selectedTaxpayers.length} taxpayer(s) to ${officeName}`, {
          position: 'top-right',
          autoClose: 3000
        });
        setSelectedTaxpayers([]);
        fetchTaxpayers();
        fetchAssignedTaxpayers();
        onUpdate?.();
      } else {
        toast.error(response.message || 'Failed to assign taxpayers', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTaxpayer = async (taxpayerId) => {
    setTaxpayerToRemove(taxpayerId);
    setShowRemoveTaxpayerConfirm(true);
  };

  const confirmRemoveTaxpayer = async () => {
    if (!taxpayerToRemove) return;

    try {
      setRemoving(true);
      const response = await firmOfficeAPI.removeTaxpayerFromOffice(officeId, taxpayerToRemove);

      if (response.success) {
        toast.success('Taxpayer removed from office successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        fetchTaxpayers();
        fetchAssignedTaxpayers();
        onUpdate?.();
        setShowRemoveTaxpayerConfirm(false);
        setTaxpayerToRemove(null);
      } else {
        toast.error(response.message || 'Failed to remove taxpayer', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setRemoving(false);
    }
  };

  const isAssigned = (taxpayerId) => {
    return assignedTaxpayers.includes(taxpayerId);
  };

  const filteredTaxpayers = taxpayers.filter(t => {
    if (showAssignedOnly) {
      return isAssigned(t.id);
    }
    return true;
  });

  if (!show) return null;

  return (
    <>
      <style>{`
        .taxpayer-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .taxpayer-modal-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .taxpayer-modal-body::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-switch .form-check-input {
          width: 3.2rem !important;
          height: 1.6rem !important;
          cursor: pointer;
        }
        .custom-switch .form-check-input:checked {
          background-color: #3AD6F2 !important;
          border-color: #3AD6F2 !important;
        }
      `}</style>

      {/* Custom Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar" style={{ zIndex: 9999 }}>
        {/* Modal Container */}
        <div
          className="bg-white !rounded-xl shadow-2xl flex flex-col mx-auto my-24"
          style={{ width: '95%', maxWidth: '900px', minHeight: '400px', maxHeight: 'auto', borderRadius: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-white flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E8F0FF] rounded-t-xl">
            <div className="flex-1 pr-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] leading-tight">
                Manage Taxpayers - {officeName}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                View and assign clients to this office
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#F3F7FF] text-[#3AD6F2] transition-colors shrink-0"
              style={{ borderRadius: '50%' }}
              type="button"
            >
              <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6">
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-white pb-4 border-b border-gray-50">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro] sm:hidden">Assigned Only</span>
                <div className="flex items-center gap-2">
                  <Form.Check
                    type="switch"
                    id="assigned-only"
                    checked={showAssignedOnly}
                    onChange={(e) => setShowAssignedOnly(e.target.checked)}
                    className="mt-0 custom-switch"
                  />
                  <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro] hidden sm:inline">Assigned Only</span>
                </div>
              </div>
            </div>

            {/* Taxpayers List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3AD6F2]"></div>
                <p className="mt-4 text-sm text-gray-500 font-[BasisGrotesquePro]">Loading taxpayers...</p>
              </div>
            ) : filteredTaxpayers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 font-[BasisGrotesquePro]">No taxpayers found matching your search</p>
              </div>
            ) : (
              <div className="border border-[#E8F0FF] rounded-xl overflow-x-auto shadow-sm custom-scrollbar">
                <table className="w-full text-sm font-[BasisGrotesquePro] min-w-[700px]">
                  <thead className="bg-[#F8FAFF]">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left font-semibold text-[#3B4A66] w-12 text-xs uppercase tracking-wider">Select</th>
                      <th className="px-4 sm:px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Name</th>
                      <th className="px-4 sm:px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Email</th>
                      <th className="px-4 sm:px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Phone</th>
                      <th className="px-4 sm:px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-center font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0FF] bg-white">
                    {filteredTaxpayers.map((taxpayer) => (
                      <tr key={taxpayer.id} className="hover:bg-[#F9FBFF] transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          {!isAssigned(taxpayer.id) && (
                            <input
                              type="checkbox"
                              checked={selectedTaxpayers.includes(taxpayer.id)}
                              onChange={() => handleSelectTaxpayer(taxpayer.id)}
                              className="w-4 h-4 rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                            />
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                            {taxpayer.full_name || `${taxpayer.first_name} ${taxpayer.last_name}`}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 font-medium">{taxpayer.email}</td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap">{taxpayer.phone_number || 'N/A'}</td>
                        <td className="px-4 sm:px-6 py-4">
                          {isAssigned(taxpayer.id) ? (
                            <span className="inline-block px-2.5 py-1 text-[9px] font-bold bg-green-50 text-green-700 rounded-full border border-green-100 uppercase tracking-wider whitespace-nowrap">
                              Assigned
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-[9px] font-bold bg-gray-50 text-gray-500 rounded-full border border-gray-100 uppercase tracking-wider whitespace-nowrap">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          {isAssigned(taxpayer.id) && (
                            <button
                              onClick={() => handleRemoveTaxpayer(taxpayer.id)}
                              disabled={removing}
                              className="p-2 text-red-400 transition-colors disabled:opacity-50"
                              title="Remove from office"
                            >
                              <FaUserMinus size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected Count Indicator */}
            {selectedTaxpayers.length > 0 && (
              <div className="mt-6 flex items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                  {selectedTaxpayers.length}
                </div>
                <p className="text-[11px] sm:text-sm font-medium text-blue-800 font-[BasisGrotesquePro]">
                  {selectedTaxpayers.length} taxpayer(s) selected for {officeName}.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="mt-auto px-4 sm:px-6 py-4 border-t border-[#E8F0FF] bg-[#F8FAFF] flex justify-end items-center gap-3 flex-shrink-0 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            >
              Close
            </button>
            {selectedTaxpayers.length > 0 && (
              <button
                onClick={handleAssignTaxpayers}
                disabled={assigning}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#00C0C6] !rounded-lg hover:bg-[#00A8AD] transition-all shadow-md disabled:opacity-50 font-[BasisGrotesquePro]"
              >
                {assigning ? 'Assigning...' : `Assign ${selectedTaxpayers.length}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Remove Taxpayer Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveTaxpayerConfirm}
        onClose={() => {
          if (!removing) {
            setShowRemoveTaxpayerConfirm(false);
            setTaxpayerToRemove(null);
          }
        }}
        onConfirm={confirmRemoveTaxpayer}
        title="Remove Taxpayer"
        message="Are you sure you want to remove this taxpayer from the office?"
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={removing}
        isDestructive={true}
      />
    </>
  );
}
