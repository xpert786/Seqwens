import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';

const API_BASE_URL = getApiBaseUrl();

export default function CreateInvoiceModal({ onClose }) {
  const [invoiceData, setInvoiceData] = useState({
    client_id: '',
    invoice_number: '',
    issue_date: '',
    due_date: ''
  });

  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', value: '' }
  ]);

  const [clients, setClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch clients when modal opens
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setClientsError('');
        const token = getAccessToken();
        const response = await fetchWithCors(`${API_BASE_URL}/firm/clients/list/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.clients) {
            setClients(result.data.clients);
            console.log('Clients loaded:', result.data.clients);
          } else {
            setClientsError('No clients found');
            setClients([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClientsError('Failed to load clients. Please try again.');
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleInputChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    setInvoiceItems(updatedItems);
  };

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', value: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const value = parseFloat(item.value) || 0;
      return sum + value;
    }, 0);
  };

  // Format date from MM/DD/YYYY to YYYY-MM-DD
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Try parsing MM/DD/YYYY or MM-DD-YYYY
    const parts = dateString.split(/[-\/]/);
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // Try parsing as Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return dateString;
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setInvoiceData(prev => ({ ...prev, client_id: client.id }));
    setClientSearchTerm(`${client.first_name} ${client.last_name}`);
    setShowClientDropdown(false);
  };

  // Update client_id when selected client changes
  useEffect(() => {
    if (selectedClient) {
      setInvoiceData(prev => ({ ...prev, client_id: selectedClient.id }));
    }
  }, [selectedClient]);

  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    const search = clientSearchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleSaveInvoice = async () => {
    // Validation
    if (!invoiceData.client_id) {
      setError('Please select a client');
      return;
    }

    if (!invoiceData.issue_date) {
      setError('Please enter an issue date');
      return;
    }

    if (!invoiceData.due_date) {
      setError('Please enter a due date');
      return;
    }

    if (invoiceItems.some(item => !item.description || !item.value || parseFloat(item.value) <= 0)) {
      setError('Please fill in all invoice item fields correctly');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Format dates for API
      const formattedIssueDate = formatDateForAPI(invoiceData.issue_date);
      const formattedDueDate = formatDateForAPI(invoiceData.due_date);

      // Convert invoice items to description/value format
      const invoice_items = invoiceItems.map(item => ({
        description: item.description.trim(),
        value: parseFloat(item.value).toFixed(2) // Keep as string to match API format
      }));

      // Prepare payload according to API structure
      const payload = {
        client_id: parseInt(invoiceData.client_id),
        issue_date: formattedIssueDate,
        due_date: formattedDueDate,
        invoice_items: invoice_items
      };

      // Add optional invoice_number if provided
      if (invoiceData.invoice_number.trim()) {
        payload.invoice_number = invoiceData.invoice_number.trim();
      }

      console.log('Creating invoice with payload:', payload);

      const token = getAccessToken();
      const response = await fetchWithCors(`${API_BASE_URL}/firm/invoices/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Invoice created successfully:', result);

      setSuccess('Invoice created successfully!');

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        if (window.location) {
          window.location.reload();
        }
      }, 1500);

    } catch (err) {
      console.error('Error creating invoice:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ml-20 mt-10" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h4 className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Create Invoice</h4>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-gray-600 text-xl leading-none transition-colors shadow-sm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="12" fill="#E8F0FF" />
              <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Client ID <span className="text-red-500">*</span>
              </label>
              {loadingClients ? (
                <div className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  Loading clients...
                </div>
              ) : clientsError ? (
                <div className="w-full !border border-red-200 rounded-lg px-3 py-2 bg-red-50 text-red-600 text-sm">
                  {clientsError}
                </div>
              ) : (
                <select
                  value={invoiceData.client_id}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    handleInputChange('client_id', clientId);
                    // Find and set selected client
                    const selected = clients.find(c => c.id === parseInt(clientId));
                    if (selected) {
                      setSelectedClient(selected);
                      setClientSearchTerm(`${selected.first_name} ${selected.last_name}`);
                    } else {
                      setSelectedClient(null);
                      setClientSearchTerm('');
                    }
                  }}
                  className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.id} - {client.first_name} {client.last_name} {client.email ? `(${client.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {!loadingClients && !clientsError && clients.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No clients available</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Invoice Number (Optional)
              </label>
              <input
                type="text"
                value={invoiceData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                placeholder="123afasd"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceData.issue_date}
                onChange={(e) => handleInputChange('issue_date', e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                placeholder="mm-dd-yyyyy"
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <h6 className="text-lg mb-4 text-[#3B4A66] font-[BasisGrotesquePro]" >Invoice Items</h6>
            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end">
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.value}
                      onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {invoiceItems.length > 1 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="px-3 py-2 text-red-600 !rounded-lg text-sm font-medium !border border-red-200 hover:bg-red-50 transition w-full"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddItem}
                className="px-4 py-2 text-black !rounded-lg text-sm font-medium !border border-[#E8F0FF]"
              >
                + Add item
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <span className="text-lg font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Total:</span>
            <span className="text-lg font-medium font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              ${calculateTotal().toLocaleString()}
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-white border !rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              style={{ borderColor: '#D1D5DB', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveInvoice}
              disabled={loading}
              className="px-6 py-2 text-white !rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#F97316' }}
            >
              {loading ? 'Creating...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
