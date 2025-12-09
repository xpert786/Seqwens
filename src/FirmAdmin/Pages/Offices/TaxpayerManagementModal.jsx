import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { firmOfficeAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FaSearch, FaUserPlus, FaUserMinus, FaCheck, FaTimes } from 'react-icons/fa';
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
    // Show all taxpayers or only assigned ones based on filter
    if (showAssignedOnly) {
      return isAssigned(t.id);
    }
    return true;
  });

  return (
    <>
      <style>{`
        .taxpayer-management-modal .modal-dialog {
          max-width: 1200px !important;
          width: 1200px !important;
        }
        .taxpayer-management-modal .modal-content {
          resize: none !important;
        }
      `}</style>
      <Modal 
        show={show} 
        onHide={onClose} 
        centered
        dialogClassName="taxpayer-management-modal"
        style={{ fontFamily: 'BasisGrotesquePro' }}
      >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #E8F0FF' }}>
        <Modal.Title style={{ color: '#3B4A66', fontFamily: 'BasisGrotesquePro', fontWeight: '600', fontSize: '20px' }}>
          Manage Taxpayers - {officeName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'BasisGrotesquePro', minHeight: '500px' }}>
        {/* Search and Filter */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]"
            />
          </div>
          <Form.Check
            type="switch"
            id="assigned-only"
            label="Assigned Only"
            checked={showAssignedOnly}
            onChange={(e) => setShowAssignedOnly(e.target.checked)}
            style={{ fontFamily: 'BasisGrotesquePro' }}
          />
          <p> Assigned Clients</p>
        </div>

        {/* Taxpayers List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">Loading taxpayers...</p>
          </div>
        ) : filteredTaxpayers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">No taxpayers found</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700" style={{ width: '50px' }}>Select</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Phone</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTaxpayers.map((taxpayer) => (
                  <tr key={taxpayer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {!isAssigned(taxpayer.id) && (
                        <input
                          type="checkbox"
                          checked={selectedTaxpayers.includes(taxpayer.id)}
                          onChange={() => handleSelectTaxpayer(taxpayer.id)}
                          className="rounded border-gray-300 text-[#3AD6F2] focus:ring-[#3AD6F2]"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {taxpayer.full_name || `${taxpayer.first_name} ${taxpayer.last_name}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{taxpayer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{taxpayer.phone_number || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {isAssigned(taxpayer.id) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isAssigned(taxpayer.id) && (
                        <button
                          onClick={() => handleRemoveTaxpayer(taxpayer.id)}
                          disabled={removing}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Remove from office"
                        >
                          <FaUserMinus />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Count */}
        {selectedTaxpayers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedTaxpayers.length} taxpayer(s) selected
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #E8F0FF' }}>
        <Button
          variant="secondary"
          onClick={onClose}
          style={{ fontFamily: 'BasisGrotesquePro', border: 'none' }}
        >
          Close
        </Button>
        {selectedTaxpayers.length > 0 && (
          <Button
            onClick={handleAssignTaxpayers}
            disabled={assigning}
            style={{
              backgroundColor: '#00C0C6',
              border: 'none',
              fontFamily: 'BasisGrotesquePro',
              fontWeight: '500'
            }}
          >
            {assigning ? 'Assigning...' : `Assign ${selectedTaxpayers.length} Taxpayer(s)`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>

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

