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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 1070 }}>
        {/* Modal Container */}
        <div
          className="bg-white !rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: '85vw', maxWidth: '1200px', height: '85vh', maxHeight: '900px' }}
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8F0FF] flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                Manage Taxpayers - {officeName}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                View and assign clients to this office
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 taxpayer-modal-body">
            {/* Search and Filter */}
            <div className="mb-6 flex items-center gap-4 sticky top-0 bg-white pb-4 z-10 border-b border-gray-50">
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
              <div className="flex items-center gap-2">
                <Form.Check
                  type="switch"
                  id="assigned-only"
                  checked={showAssignedOnly}
                  onChange={(e) => setShowAssignedOnly(e.target.checked)}
                  className="mt-0 custom-switch"
                />
                <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">Assigned Only</span>
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
              <div className="border border-[#E8F0FF] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm font-[BasisGrotesquePro]">
                  <thead className="bg-[#F8FAFF]">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-[#3B4A66] w-12 text-xs uppercase tracking-wider">Select</th>
                      <th className="px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center font-semibold text-[#3B4A66] text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0FF] bg-white">
                    {filteredTaxpayers.map((taxpayer) => (
                      <tr key={taxpayer.id} className="hover:bg-[#F9FBFF] transition-colors">
                        <td className="px-6 py-4">
                          {!isAssigned(taxpayer.id) && (
                            <input
                              type="checkbox"
                              checked={selectedTaxpayers.includes(taxpayer.id)}
                              onChange={() => handleSelectTaxpayer(taxpayer.id)}
                              className="w-4 h-4 rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {taxpayer.full_name || `${taxpayer.first_name} ${taxpayer.last_name}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{taxpayer.email}</td>
                        <td className="px-6 py-4 text-gray-600">{taxpayer.phone_number || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {isAssigned(taxpayer.id) ? (
                            <span className="px-3 py-1 text-[11px] font-bold bg-green-50 text-green-700 rounded-full border border-green-100 uppercase tracking-tight">
                              Assigned
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-[11px] font-bold bg-gray-50 text-gray-500 rounded-full border border-gray-100 uppercase tracking-tight">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isAssigned(taxpayer.id) && (
                            <button
                              onClick={() => handleRemoveTaxpayer(taxpayer.id)}
                              disabled={removing}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
              <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedTaxpayers.length}
                </div>
                <p className="text-sm font-medium text-blue-800 font-[BasisGrotesquePro]">
                  {selectedTaxpayers.length} taxpayer(s) selected to be assigned to {officeName}.
                </p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-[#E8F0FF] bg-[#F8FAFF] flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            >
              Close
            </button>
            {selectedTaxpayers.length > 0 && (
              <button
                onClick={handleAssignTaxpayers}
                disabled={assigning}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#00C0C6] !rounded-lg hover:bg-[#00A8AD] transition-all shadow-md disabled:opacity-50 font-[BasisGrotesquePro]"
              >
                {assigning ? 'Assigning...' : `Assign ${selectedTaxpayers.length} Taxpayer(s)`}
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
