import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signatureRequestsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import '../../styles/esignature-dashboard.css';

export default function ESignatureDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureRequests, setSignatureRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, declined, expired
  const [statistics, setStatistics] = useState({
    pending: 0,
    completed: 0,
    declined: 0,
    expired: 0,
    total: 0
  });

  // Fetch signature requests
  useEffect(() => {
    fetchSignatureRequests();
  }, []);

  // Filter requests when search term or status filter changes
  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, signatureRequests]);

  const fetchSignatureRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all signature requests
      const response = await signatureRequestsAPI.getSignatureRequests();
      
      if (response.success && response.data) {
        let requests = [];
        
        if (response.data.requests && Array.isArray(response.data.requests)) {
          requests = response.data.requests;
        } else if (Array.isArray(response.data)) {
          requests = response.data;
        }
        
        setSignatureRequests(requests);
        calculateStatistics(requests);
      } else {
        throw new Error(response.message || 'Failed to fetch signature requests');
      }
    } catch (err) {
      console.error('Error fetching signature requests:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg || 'Failed to load signature requests', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (requests) => {
    const stats = {
      pending: 0,
      completed: 0,
      declined: 0,
      expired: 0,
      total: requests.length
    };

    requests.forEach(request => {
      const status = request.status?.toLowerCase();
      
      if (status === 'pending' || status === 'sent' || status === 'viewed') {
        stats.pending++;
      } else if (status === 'completed' || status === 'signed') {
        stats.completed++;
      } else if (status === 'declined' || status === 'cancelled') {
        stats.declined++;
      } else if (status === 'expired' || isExpired(request)) {
        stats.expired++;
      }
    });

    setStatistics(stats);
  };

  const isExpired = (request) => {
    if (!request.expires_at) return false;
    const expiryDate = new Date(request.expires_at);
    const now = new Date();
    return expiryDate < now && request.status !== 'completed' && request.status !== 'signed';
  };

  const filterRequests = () => {
    let filtered = [...signatureRequests];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => {
        const status = request.status?.toLowerCase();
        
        switch (statusFilter) {
          case 'pending':
            return status === 'pending' || status === 'sent' || status === 'viewed';
          case 'completed':
            return status === 'completed' || status === 'signed';
          case 'declined':
            return status === 'declined' || status === 'cancelled';
          case 'expired':
            return status === 'expired' || isExpired(request);
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(request => {
        const clientName = request.client_name || request.client?.full_name || '';
        const documentName = request.document_name || request.document?.name || '';
        const title = request.title || '';
        const description = request.description || '';
        
        return (
          clientName.toLowerCase().includes(searchLower) ||
          documentName.toLowerCase().includes(searchLower) ||
          title.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (request) => {
    const status = request.status?.toLowerCase();
    const isExpiredRequest = isExpired(request);
    
    if (isExpiredRequest && status !== 'completed' && status !== 'signed') {
      return {
        text: 'Expired',
        className: 'status-badge-expired'
      };
    }
    
    switch (status) {
      case 'pending':
        return { text: 'Pending', className: 'status-badge-pending' };
      case 'sent':
        return { text: 'Sent', className: 'status-badge-sent' };
      case 'viewed':
        return { text: 'Viewed', className: 'status-badge-viewed' };
      case 'signed':
        return { text: 'Signed', className: 'status-badge-signed' };
      case 'completed':
        return { text: 'Completed', className: 'status-badge-completed' };
      case 'declined':
        return { text: 'Declined', className: 'status-badge-declined' };
      case 'cancelled':
        return { text: 'Cancelled', className: 'status-badge-declined' };
      case 'expired':
        return { text: 'Expired', className: 'status-badge-expired' };
      default:
        return { text: status || 'Unknown', className: 'status-badge-default' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = (request) => {
    // Navigate to client details with e-sign logs
    if (request.client_id || request.client?.id) {
      const clientId = request.client_id || request.client.id;
      navigate(`/taxdashboard/clients/${clientId}/esign-logs`);
    }
  };

  const handleRefresh = () => {
    fetchSignatureRequests();
  };

  if (loading) {
    return (
      <div className="esignature-dashboard-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: '#6B7280', fontFamily: 'BasisGrotesquePro' }}>
              Loading E-Signature Dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && signatureRequests.length === 0) {
    return (
      <div className="esignature-dashboard-container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <p className="text-danger mb-3" style={{ fontFamily: 'BasisGrotesquePro' }}>{error}</p>
            <button
              onClick={handleRefresh}
              className="btn"
              style={{
                backgroundColor: '#00C0C6',
                color: 'white',
                border: 'none',
                fontFamily: 'BasisGrotesquePro'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="esignature-dashboard-container" style={{ fontFamily: 'BasisGrotesquePro' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: '#3B4A66', fontWeight: '600', marginBottom: '8px' }}>
            E-Signature Dashboard
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Track and manage all e-signature requests across your clients
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn d-flex align-items-center gap-2"
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            color: '#3B4A66',
            fontFamily: 'BasisGrotesquePro'
          }}
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-pending">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Pending Signatures</p>
                <h3 className="stat-value">{statistics.pending}</h3>
              </div>
              <div className="stat-icon">
                <FiClock size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-completed">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Completed</p>
                <h3 className="stat-value">{statistics.completed}</h3>
              </div>
              <div className="stat-icon">
                <FiCheckCircle size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-declined">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Declined / Cancelled</p>
                <h3 className="stat-value">{statistics.declined}</h3>
              </div>
              <div className="stat-icon">
                <FiXCircle size={32} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card stat-card-expired">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="stat-label">Expired</p>
                <h3 className="stat-value">{statistics.expired}</h3>
              </div>
              <div className="stat-icon">
                <FiFileText size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <div className="flex-grow-1 position-relative">
          <FiSearch
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280'
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search by client name, document, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '40px',
              fontFamily: 'BasisGrotesquePro',
              borderColor: '#E5E7EB'
            }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <FiFilter size={18} style={{ color: '#6B7280' }} />
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              fontFamily: 'BasisGrotesquePro',
              borderColor: '#E5E7EB',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Signature Requests List */}
      <div className="signature-requests-list">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-5">
            <FiFileText size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
            <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
              No signature requests found
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Signature requests will appear here when created'}
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredRequests.map((request) => {
              const statusBadge = getStatusBadge(request);
              const clientName = request.client_name || request.client?.full_name || 'Unknown Client';
              const documentName = request.document_name || request.document?.name || 'No Document';
              
              return (
                <div
                  key={request.id}
                  className="signature-request-card"
                  onClick={() => handleViewDetails(request)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 style={{ color: '#3B4A66', fontWeight: '600', margin: 0 }}>
                          {request.title || documentName}
                        </h5>
                        <span className={`status-badge ${statusBadge.className}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="d-flex flex-column gap-1 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                            Client:
                          </span>
                          <span style={{ color: '#3B4A66', fontSize: '14px' }}>
                            {clientName}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                            Document:
                          </span>
                          <span style={{ color: '#3B4A66', fontSize: '14px' }}>
                            {documentName}
                          </span>
                        </div>
                      </div>
                      {request.description && (
                        <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '8px' }}>
                          {request.description}
                        </p>
                      )}
                      <div className="d-flex flex-wrap gap-3" style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        <span>
                          Created: {formatDate(request.created_at)}
                        </span>
                        {request.expires_at && (
                          <span>
                            Expires: {formatDate(request.expires_at)}
                          </span>
                        )}
                        {request.signed_at && (
                          <span>
                            Signed: {formatDate(request.signed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 text-center" style={{ color: '#6B7280', fontSize: '14px' }}>
          Showing {filteredRequests.length} of {signatureRequests.length} signature request{signatureRequests.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

