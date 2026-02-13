import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../ClientOnboarding/utils/userUtils';
import { handleAPIError, firmAdminMessagingAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { formatDateInput, formatDateForAPI } from '../../../ClientOnboarding/utils/dateUtils';
import DateInput from '../../../components/DateInput';
import '../../../FirmAdmin/styles/CreateInvoiceModel.css';
const API_BASE_URL = getApiBaseUrl();

export default function TaxPreparerCreateInvoiceModal({ onClose, onInvoiceCreated, preSelectedClient }) {
  const [invoiceData, setInvoiceData] = useState({
    client_id: preSelectedClient ? preSelectedClient.id : '',
    issue_date: '',
    due_date: ''
  });

  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', value: '', service_id: null }
  ]);

  const [clients, setClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState(preSelectedClient ? `${preSelectedClient.first_name} ${preSelectedClient.last_name}` : '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(preSelectedClient || null);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Date picker refs
  const issueDatePickerRef = useRef(null);
  const dueDatePickerRef = useRef(null);

  const handleDatePickerChange = (field, e) => {
    const dateValue = e.target.value; // YYYY-MM-DD
    if (!dateValue) return;

    const [year, month, day] = dateValue.split('-');
    const formattedDate = `${month}/${day}/${year}`;

    // Update state
    setInvoiceData(prev => ({ ...prev, [field]: formattedDate }));

    // Clear error if any
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Fetch taxpayers when modal opens - use tax preparer endpoint
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setClientsError('');
        const token = getAccessToken();
        const response = await fetchWithCors(`${API_BASE_URL}/taxpayer/tax-preparer/taxpayers/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.taxpayers) {
            setClients(result.data.taxpayers);
            console.log('Taxpayers loaded:', result.data.taxpayers);
          } else {
            setClientsError('No taxpayers found');
            setClients([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching taxpayers:', err);
        setClientsError('Failed to load taxpayers. Please try again.');
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch active service pricing when modal opens
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await firmAdminMessagingAPI.getActiveServicePricing();

        if (response.success && response.data && response.data.services) {
          setServices(response.data.services || []);
          console.log('Services loaded:', response.data.services);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Debounced search for services
  useEffect(() => {
    let searchTimeout;

    if (serviceSearchQuery && serviceSearchQuery.trim()) {
      searchTimeout = setTimeout(async () => {
        try {
          const response = await firmAdminMessagingAPI.getActiveServicePricing({ search: serviceSearchQuery });
          if (response.success && response.data && response.data.services) {
            setServices(response.data.services || []);
          }
        } catch (err) {
          console.error('Error searching services:', err);
        }
      }, 300);
    } else {
      // If search is empty, fetch all services
      const fetchAllServices = async () => {
        try {
          const response = await firmAdminMessagingAPI.getActiveServicePricing();
          if (response.success && response.data && response.data.services) {
            setServices(response.data.services || []);
          }
        } catch (err) {
          console.error('Error fetching services:', err);
        }
      };
      fetchAllServices();
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [serviceSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showServiceDropdown && serviceDropdownRef.current) {
        if (!serviceDropdownRef.current.contains(event.target)) {
          setShowServiceDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServiceDropdown]);

  const handleInputChange = (field, value) => {
    // Special handling for date fields to auto-format with slashes
    if (field === 'due_date' || field === 'issue_date') {
      const formattedValue = formatDateInput(value);
      setInvoiceData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setInvoiceData(prev => ({ ...prev, [field]: value }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (field, e) => {
    const formattedValue = e.target.value;
    setInvoiceData(prev => ({ ...prev, [field]: formattedValue }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    setInvoiceItems(updatedItems);
  };

  const handleServiceSelect = (service) => {
    // Add a new invoice item with the selected service immediately
    const newItem = {
      description: service.name,
      value: service.base_price.toString(),
      service_id: service.id
    };
    setInvoiceItems([newItem, ...invoiceItems]);
    setShowServiceDropdown(false);
    setServiceSearchQuery('');
  };

  const handleServiceSearchChange = (value) => {
    setServiceSearchQuery(value);
    setShowServiceDropdown(true);
  };

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', value: '', service_id: null }]);
  };

  const handleRemoveItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const filteredServices = services.filter(service => {
    const searchQuery = (serviceSearchQuery || '').toLowerCase();
    if (!searchQuery) return true;
    return (
      service.name.toLowerCase().includes(searchQuery) ||
      (service.description || '').toLowerCase().includes(searchQuery)
    );
  });

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const value = parseFloat(item.value) || 0;
      return sum + value;
    }, 0);
  };

  // Using formatDateForAPI from dateUtils

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

    // Filter out empty items (items with no description and no value)
    const validItems = invoiceItems.filter(item =>
      item.description && item.description.trim() && item.value && item.value.toString().trim()
    );

    if (validItems.length === 0) {
      setError('Please add at least one invoice item');
      return;
    }

    // Validate that all non-empty items have valid data
    if (validItems.some(item => !item.description.trim() || !item.value || parseFloat(item.value) <= 0)) {
      setError('Please fill in all invoice item fields correctly');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setFieldErrors({});

      // Format dates for API
      const formattedIssueDate = formatDateForAPI(invoiceData.issue_date);
      const formattedDueDate = formatDateForAPI(invoiceData.due_date);

      // Convert invoice items to description/value format (only valid items)
      const invoice_items = validItems.map(item => ({
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

      const result = await response.json();

      if (!response.ok) {
        // Check if there are field-specific errors
        if (result.errors && typeof result.errors === 'object') {
          const errors = {};
          Object.keys(result.errors).forEach(field => {
            // Get the first error message for each field
            if (Array.isArray(result.errors[field]) && result.errors[field].length > 0) {
              errors[field] = result.errors[field][0];
            } else if (typeof result.errors[field] === 'string') {
              errors[field] = result.errors[field];
            }
          });
          setFieldErrors(errors);

          // Set general error message if available
          if (result.message) {
            setError(result.message);
          }
        } else {
          setError(result.message || result.detail || `HTTP error! status: ${response.status}`);
        }
        return;
      }

      console.log('Invoice created successfully:', result);

      setSuccess('Invoice created successfully!');

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        // Call the callback to refresh invoices if provided
        if (onInvoiceCreated) {
          onInvoiceCreated();
        } else if (window.location) {
          // Fallback to page reload if no callback provided
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4 invoice-modal-mobile"
      onClick={onClose}
      style={{
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto invoice-modal-box" onClick={(e) => e.stopPropagation()} style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h4 className="text-2xl font-bold font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Create Invoice</h4>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center bg-blue-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
            }}
          >
            <FiX size={20} />
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

          {/* Client Information Section */}
          <div>
            <h5 className="text-base font-semibold mb-3 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Client Information
            </h5>
            <div>
              <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                {preSelectedClient ? 'Client' : 'Select Client'} <span className="text-red-500">*</span>
              </label>
              {loadingClients ? (
                <div className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                  Loading clients...
                </div>
              ) : clientsError ? (
                <div className="w-full !border border-red-200 rounded-lg px-3 py-2 bg-red-50 text-red-600 text-sm">
                  {clientsError}
                </div>
              ) : preSelectedClient ? (
                <div className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed">
                  {preSelectedClient.first_name} {preSelectedClient.last_name} {preSelectedClient.email ? `(${preSelectedClient.email})` : ''}
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
          </div>

          {/* Invoice Details Section */}
          <div>
            <h5 className="text-base font-semibold mb-3 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Invoice Details
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={invoiceData.issue_date}
                    onChange={(e) => handleInputChange('issue_date', e.target.value)}
                    placeholder="mm/dd/yyyy"
                    className="w-full !border border-[#E8F0FF] rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() => issueDatePickerRef.current && issueDatePickerRef.current.showPicker()}
                  >
                    <FiCalendar className="text-gray-400" size={18} />
                  </div>
                  {/* Hidden date input for picker */}
                  <input
                    type="date"
                    ref={issueDatePickerRef}
                    className="absolute opacity-0 w-0 h-0"
                    style={{ bottom: 0, right: 0 }}
                    onChange={(e) => handleDatePickerChange('issue_date', e)}
                    tabIndex={-1}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 font-[BasisGrotesquePro]" style={{ color: '#374151' }}>
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DateInput
                    value={invoiceData.due_date}
                    onChange={(e) => handleDateChange('due_date', e)}
                    placeholder="mm/dd/yyyy"
                    className={`w-full !border rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 ${fieldErrors.due_date
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-[#E8F0FF] focus:ring-blue-500'
                      }`}
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() => dueDatePickerRef.current && dueDatePickerRef.current.showPicker()}
                  >
                    <FiCalendar className="text-gray-400" size={18} />
                  </div>
                  {/* Hidden date input for picker */}
                  <input
                    type="date"
                    ref={dueDatePickerRef}
                    className="absolute opacity-0 w-0 h-0"
                    style={{ bottom: 0, right: 0 }}
                    onChange={(e) => handleDatePickerChange('due_date', e)}
                    tabIndex={-1}
                  />
                </div>
                {fieldErrors.due_date && (
                  <p className="text-red-600 text-xs mt-1 font-[BasisGrotesquePro]">
                    {fieldErrors.due_date}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-base font-semibold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Invoice Items
              </h5>
            </div>

            {/* Single Service Selection Dropdown */}
            <div className="relative mb-4" ref={serviceDropdownRef}>
              <label className="block text-xs font-medium mb-1 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                Select Service to Add
              </label>
              <input
                type="text"
                value={serviceSearchQuery}
                onChange={(e) => handleServiceSearchChange(e.target.value)}
                onFocus={() => {
                  setShowServiceDropdown(true);
                  setServiceSearchQuery('');
                }}
                placeholder="Search services..."
                className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {loadingServices && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {/* Service Dropdown */}
              {showServiceDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#E8F0FF] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 font-[BasisGrotesquePro]">
                      {loadingServices ? 'Loading...' : 'No services found'}
                    </div>
                  ) : (
                    filteredServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] truncate m-0">
                                {service.name}
                              </p>
                            </div>
                            {service.description && (
                              <p className="text-xs text-gray-600 font-[BasisGrotesquePro] truncate mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro]">
                              {service.formatted_price}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs font-medium mb-1 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Enter item description"
                      className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-medium mb-1 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                      Amount ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.value}
                      onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                      placeholder="0.00"
                      className="w-full !border border-[#E8F0FF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="w-full px-3 py-2 text-red-600 !rounded-lg text-sm font-medium !border border-red-200 hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddItem}
                className="w-full md:w-auto px-4 py-2 text-sm font-medium text-[#3B4A66] !rounded-lg !border border-[#E8F0FF] hover:bg-gray-50 transition"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>Total Amount:</span>
              <span className="text-xl font-bold font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t invoice-modal-footer" style={{ borderColor: '#E5E7EB' }}>
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
