// Example usage of BusinessInfoForm component

import React, { useState } from 'react';
import BusinessInfoForm from './components/BusinessInfoForm';

function ClientDashboard({ clientId }) {
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  const handleBusinessInfoUpdate = () => {
    // Refresh client data or update UI
    console.log('Business information has been updated');
    // You might want to refresh client data here
  };

  return (
    <div className="client-dashboard">
      {/* Existing dashboard content */}

      <div className="business-info-section">
        <h4>Business Information</h4>
        <p>Manage your business details, income, and rental properties</p>

        <button
          onClick={() => setShowBusinessForm(true)}
          className="btn btn-primary"
          style={{
            backgroundColor: '#F56D2D',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          Manage Business Information
        </button>
      </div>

      {/* Business Info Form Modal */}
      {showBusinessForm && (
        <BusinessInfoForm
          clientId={clientId}
          onClose={() => setShowBusinessForm(false)}
          onSave={handleBusinessInfoUpdate}
        />
      )}
    </div>
  );
}

export default ClientDashboard;

// Alternative: Integration into existing DataIntake form
/*
In your DataIntake.jsx, add this near the business section:

import BusinessInfoForm from "../components/BusinessInfoForm";

// Add state
const [showBusinessInfoForm, setShowBusinessInfoForm] = useState(false);

// Add button in business section
<div className="business-section-header">
  <h4>Business Information</h4>
  <button
    onClick={() => setShowBusinessInfoForm(true)}
    className="btn btn-outline-primary btn-sm"
  >
    Open Comprehensive Business Form
  </button>
</div>

// Add modal at end of component
{showBusinessInfoForm && (
  <BusinessInfoForm
    clientId={currentClientId} // Get from your existing client logic
    onClose={() => setShowBusinessInfoForm(false)}
    onSave={() => {
      setShowBusinessInfoForm(false);
      // Optionally refresh existing form data
      loadClientData();
    }}
  />
)}
*/

// API endpoints needed:
/*
// POST /api/clients/{clientId}/business-info/
// GET /api/clients/{clientId}/business-info/
*/
