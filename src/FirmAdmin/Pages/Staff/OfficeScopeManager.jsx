import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { firmAdminStaffAPI, firmOfficeAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import '../styles/OfficeScopeManager.css';

export default function OfficeScopeManager({ userId, userName, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offices, setOffices] = useState([]);
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [currentScope, setCurrentScope] = useState(null);
  const [hasAllOffices, setHasAllOffices] = useState(true);

  // Fetch offices and current scope
  useEffect(() => {
    if (showModal && userId) {
      fetchData();
    }
  }, [showModal, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all offices
      const officesResponse = await firmOfficeAPI.listOffices();
      if (officesResponse.success && officesResponse.data) {
        const officesList = Array.isArray(officesResponse.data) 
          ? officesResponse.data 
          : (officesResponse.data.offices || []);
        setOffices(officesList);
      }

      // Fetch current office scope
      const scopeResponse = await firmAdminStaffAPI.getOfficeScope(userId);
      if (scopeResponse.success && scopeResponse.data) {
        const scope = scopeResponse.data;
        setCurrentScope(scope);
        
        // Check if user has access to all offices
        if (scope.has_all_offices) {
          setHasAllOffices(true);
          setSelectedOffices(offices.map(o => o.id));
        } else {
          setHasAllOffices(false);
          const officeIds = scope.offices?.map(o => o.id || o) || scope.office_ids || [];
          setSelectedOffices(officeIds);
        }
      }
    } catch (error) {
      console.error('Error fetching office scope data:', error);
      toast.error(handleAPIError(error) || 'Failed to load office scope');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficeToggle = (officeId) => {
    setSelectedOffices(prev => {
      if (prev.includes(officeId)) {
        return prev.filter(id => id !== officeId);
      } else {
        return [...prev, officeId];
      }
    });
    setHasAllOffices(false);
  };

  const handleSelectAll = () => {
    const allOfficeIds = offices.map(o => o.id);
    setSelectedOffices(allOfficeIds);
    setHasAllOffices(true);
  };

  const handleClearAll = () => {
    setSelectedOffices([]);
    setHasAllOffices(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // If all offices selected, send empty array or special flag
      const officeIds = hasAllOffices ? [] : selectedOffices;
      
      const response = await firmAdminStaffAPI.setOfficeScope(userId, officeIds);
      
      if (response.success) {
        toast.success('Office access updated successfully');
        setShowModal(false);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(response.message || 'Failed to update office scope');
      }
    } catch (error) {
      console.error('Error updating office scope:', error);
      toast.error(handleAPIError(error) || 'Failed to update office access');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayText = () => {
    if (!currentScope) return 'Loading...';
    
    if (currentScope.has_all_offices) {
      return 'All Offices';
    }
    
    const officeNames = currentScope.offices?.map(o => o.name || o) || [];
    if (officeNames.length === 0) {
      return 'No Offices';
    }
    
    return officeNames.join(', ');
  };

  return (
    <>
      <div className="office-scope-display">
        <div className="office-scope-label">Office Access</div>
        <div className="office-scope-value">{getDisplayText()}</div>
        <button
          className="office-scope-edit-btn"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          Edit
        </button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Edit Office Access</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="office-scope-modal-description">
            Select offices that <strong>{userName}</strong> can access:
          </p>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="office-scope-actions">
                <button
                  type="button"
                  className="btn-link office-scope-action-btn"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <span className="office-scope-separator">|</span>
                <button
                  type="button"
                  className="btn-link office-scope-action-btn"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>

              <div className="office-scope-list">
                {offices.map((office) => {
                  const isSelected = selectedOffices.includes(office.id) || hasAllOffices;
                  return (
                    <div
                      key={office.id}
                      className={`office-scope-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOfficeToggle(office.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleOfficeToggle(office.id)}
                        className="office-scope-checkbox"
                      />
                      <div className="office-scope-item-content">
                        <div className="office-scope-item-name">{office.name || office.office_name}</div>
                        {office.address && (
                          <div className="office-scope-item-address">{office.address}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {offices.length === 0 && (
                <p className="text-muted text-center py-3">No offices available</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

