import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { handleAPIError } from '../utils/apiUtils';

const BusinessInfoForm = ({ clientId, onClose, onSave }) => {
  const [businessInfos, setBusinessInfos] = useState([]);

  const [businessIncomes, setBusinessIncomes] = useState([]);

  const [rentalProperties, setRentalProperties] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  // Modal states
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [editingBusinessIndex, setEditingBusinessIndex] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_address: '',
    business_city: '',
    business_state: '',
    business_zip: '',
    business_phone: '',
    business_email: '',
    business_type: '',
    ein: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  // Fetch existing data on mount
  useEffect(() => {
    if (clientId) {
      fetchExistingData();
    }
  }, [clientId]);

  const fetchExistingData = async () => {
    try {
      setLoading(true);

      // Fetch business info data
      const response = await fetch(`/api/clients/${clientId}/business-info/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Always set the data, even if empty arrays
        setBusinessInfos(data.business_infos || []);
        setBusinessIncomes(data.business_incomes || []);
        setRentalProperties(data.rental_properties || []);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast.error('Failed to load existing business data');
    } finally {
      setLoading(false);
    }
  };

  // Business Info Handlers
  const openBusinessModal = (index = null) => {
    if (index !== null) {
      // Editing existing business
      setEditingBusinessIndex(index);
      setBusinessFormData(businessInfos[index]);
    } else {
      // Adding new business
      setEditingBusinessIndex(null);
      setBusinessFormData({
        business_name: '',
        business_address: '',
        business_city: '',
        business_state: '',
        business_zip: '',
        business_phone: '',
        business_email: '',
        business_type: '',
        ein: '',
        start_date: '',
        end_date: '',
        is_active: true
      });
    }
    setShowBusinessModal(true);
  };

  const closeBusinessModal = () => {
    setShowBusinessModal(false);
    setEditingBusinessIndex(null);
    setBusinessFormData({
      business_name: '',
      business_address: '',
      business_city: '',
      business_state: '',
      business_zip: '',
      business_phone: '',
      business_email: '',
      business_type: '',
      ein: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const saveBusinessInfo = () => {
    if (editingBusinessIndex !== null) {
      // Update existing business
      const updatedBusinesses = [...businessInfos];
      updatedBusinesses[editingBusinessIndex] = businessFormData;
      setBusinessInfos(updatedBusinesses);
    } else {
      // Add new business
      setBusinessInfos([...businessInfos, businessFormData]);
    }
    closeBusinessModal();
    toast.success(editingBusinessIndex !== null ? 'Business updated successfully!' : 'Business added successfully!');
  };

  const removeBusinessInfo = (index) => {
    setBusinessInfos(businessInfos.filter((_, i) => i !== index));
    toast.success('Business removed successfully!');
  };

  const updateBusinessInfo = (index, field, value) => {
    const updated = [...businessInfos];
    updated[index][field] = value;
    setBusinessInfos(updated);
  };

  // Business Income Handlers
  const addBusinessIncome = () => {
    setBusinessIncomes([...businessIncomes, {
      business_id: '',
      tax_year: new Date().getFullYear(),
      gross_receipts: '',
      cost_of_goods_sold: '',
      gross_profit: '',
      other_income: '',
      total_income: '',
      advertising: '',
      office_supplies: '',
      repairs_maintenance: '',
      insurance: '',
      legal_professional: '',
      utilities: '',
      rent: '',
      other_expenses: ''
    }]);
  };

  const removeBusinessIncome = (index) => {
    setBusinessIncomes(businessIncomes.filter((_, i) => i !== index));
  };

  const updateBusinessIncome = (index, field, value) => {
    const updated = [...businessIncomes];
    updated[index][field] = value;
    setBusinessIncomes(updated);
  };

  // Rental Property Handlers
  const addRentalProperty = () => {
    setRentalProperties([...rentalProperties, {
      property_address: '',
      property_city: '',
      property_state: '',
      property_zip: '',
      property_type: '',
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      mortgage_balance: '',
      monthly_rent: '',
      annual_rent_income: '',
      property_taxes: '',
      insurance: '',
      maintenance_repairs: '',
      management_fees: '',
      is_active: true
    }]);
  };

  const removeRentalProperty = (index) => {
    setRentalProperties(rentalProperties.filter((_, i) => i !== index));
  };

  const updateRentalProperty = (index, field, value) => {
    const updated = [...rentalProperties];
    updated[index][field] = value;
    setRentalProperties(updated);
  };

  // Save all data
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        business_infos: businessInfos,
        business_incomes: businessIncomes,
        rental_properties: rentalProperties
      };

      const response = await fetch(`/api/clients/${clientId}/business-info/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Business information saved successfully');
        onSave?.();
        onClose?.();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save business information');
      }
    } catch (error) {
      console.error('Error saving business data:', error);
      toast.error(handleAPIError(error));
    } finally {
      setSaving(false);
    }
  };

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'Corporation',
    'S-Corp',
    'Other'
  ];

  const propertyTypes = [
    'Single Family Home',
    'Multi-Family Home',
    'Condo/Apartment',
    'Commercial Property',
    'Vacation Rental',
    'Other'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading business information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8F0FF]">
          <h2 className="text-xl font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
            Business Information Form
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8F0FF]">
          {[
            { key: 'business', label: 'Business Info', count: businessInfos.length },
            { key: 'income', label: 'Business Income', count: businessIncomes.length },
            { key: 'rental', label: 'Rental Properties', count: rentalProperties.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-medium text-sm font-[BasisGrotesquePro] border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-[#F56D2D] text-[#F56D2D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                  Business Information
                </h3>
                <button
                  onClick={() => openBusinessModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  <FiPlus size={16} />
                  Add Business
                </button>
              </div>

              {businessInfos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-4">
                    <FiPlus size={48} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">
                    No Business Information Added
                  </h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro] mb-4">
                    Click "Add Business" to add your first business entry
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businessInfos.map((business, index) => (
                    <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                          {business.business_name || `Business ${index + 1}`}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openBusinessModal(index)}
                            className="text-blue-500 hover:text-blue-700 transition"
                            title="Edit"
                          >
                            <FiSave size={16} />
                          </button>
                          <button
                            onClick={() => removeBusinessInfo(index)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {business.business_type && (
                          <p><span className="font-medium">Type:</span> {business.business_type}</p>
                        )}
                        {business.business_address && (
                          <p><span className="font-medium">Address:</span> {business.business_address}</p>
                        )}
                        {business.business_city && business.business_state && (
                          <p><span className="font-medium">Location:</span> {business.business_city}, {business.business_state}</p>
                        )}
                        {business.business_phone && (
                          <p><span className="font-medium">Phone:</span> {business.business_phone}</p>
                        )}
                        {business.ein && (
                          <p><span className="font-medium">EIN:</span> {business.ein}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`inline-block w-2 h-2 rounded-full ${business.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-xs text-gray-600">{business.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Business Income Tab */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                  Business Income & Expenses
                </h3>
                <button
                  onClick={addBusinessIncome}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  <FiPlus size={16} />
                  Add Income Record
                </button>
              </div>


              {businessIncomes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-4">
                    <FiPlus size={48} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">
                    No Income Records Added
                  </h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro] mb-4">
                    Click "Add Income Record" to track business income and expenses
                  </p>
                </div>
              ) : (
                businessIncomes.map((income, index) =>
                <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                      Income Record #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeBusinessIncome(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Tax Year
                      </label>
                      <input
                        type="number"
                        value={income.tax_year}
                        onChange={(e) => updateBusinessIncome(index, 'tax_year', parseInt(e.target.value) || new Date().getFullYear())}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        min="2000"
                        max="2030"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Gross Receipts ($)
                      </label>
                      <input
                        type="number"
                        value={income.gross_receipts}
                        onChange={(e) => updateBusinessIncome(index, 'gross_receipts', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Cost of Goods Sold ($)
                      </label>
                      <input
                        type="number"
                        value={income.cost_of_goods_sold}
                        onChange={(e) => updateBusinessIncome(index, 'cost_of_goods_sold', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Advertising ($)
                      </label>
                      <input
                        type="number"
                        value={income.advertising}
                        onChange={(e) => updateBusinessIncome(index, 'advertising', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Office Supplies ($)
                      </label>
                      <input
                        type="number"
                        value={income.office_supplies}
                        onChange={(e) => updateBusinessIncome(index, 'office_supplies', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Repairs & Maintenance ($)
                      </label>
                      <input
                        type="number"
                        value={income.repairs_maintenance}
                        onChange={(e) => updateBusinessIncome(index, 'repairs_maintenance', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Insurance ($)
                      </label>
                      <input
                        type="number"
                        value={income.insurance}
                        onChange={(e) => updateBusinessIncome(index, 'insurance', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Legal & Professional ($)
                      </label>
                      <input
                        type="number"
                        value={income.legal_professional}
                        onChange={(e) => updateBusinessIncome(index, 'legal_professional', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Utilities ($)
                      </label>
                      <input
                        type="number"
                        value={income.utilities}
                        onChange={(e) => updateBusinessIncome(index, 'utilities', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Rent ($)
                      </label>
                      <input
                        type="number"
                        value={income.rent}
                        onChange={(e) => updateBusinessIncome(index, 'rent', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Other Expenses ($)
                      </label>
                      <input
                        type="number"
                        value={income.other_expenses}
                        onChange={(e) => updateBusinessIncome(index, 'other_expenses', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rental Properties Tab */}
          {activeTab === 'rental' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                  Rental Properties
                </h3>
                <button
                  onClick={addRentalProperty}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  <FiPlus size={16} />
                  Add Property
                </button>
              </div>

              {rentalProperties.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-4">
                    <FiPlus size={48} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">
                    No Rental Properties Added
                  </h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro] mb-4">
                    Click "Add Property" to add rental property information
                  </p>
                </div>
              ) : (
                rentalProperties.map((property, index) => (
                <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                      Property #{index + 1}
                    </h4>
                    <button
                      onClick={() => removeRentalProperty(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Property Address *
                      </label>
                      <input
                        type="text"
                        value={property.property_address}
                        onChange={(e) => updateRentalProperty(index, 'property_address', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="Street address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={property.property_city}
                        onChange={(e) => updateRentalProperty(index, 'property_city', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={property.property_state}
                        onChange={(e) => updateRentalProperty(index, 'property_state', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={property.property_zip}
                        onChange={(e) => updateRentalProperty(index, 'property_zip', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="ZIP code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Property Type
                      </label>
                      <select
                        value={property.property_type}
                        onChange={(e) => updateRentalProperty(index, 'property_type', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                      >
                        <option value="">Select property type</option>
                        {propertyTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={property.purchase_date}
                        onChange={(e) => updateRentalProperty(index, 'purchase_date', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Purchase Price ($)
                      </label>
                      <input
                        type="number"
                        value={property.purchase_price}
                        onChange={(e) => updateRentalProperty(index, 'purchase_price', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Current Value ($)
                      </label>
                      <input
                        type="number"
                        value={property.current_value}
                        onChange={(e) => updateRentalProperty(index, 'current_value', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Mortgage Balance ($)
                      </label>
                      <input
                        type="number"
                        value={property.mortgage_balance}
                        onChange={(e) => updateRentalProperty(index, 'mortgage_balance', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Monthly Rent ($)
                      </label>
                      <input
                        type="number"
                        value={property.monthly_rent}
                        onChange={(e) => updateRentalProperty(index, 'monthly_rent', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Annual Rent Income ($)
                      </label>
                      <input
                        type="number"
                        value={property.annual_rent_income}
                        onChange={(e) => updateRentalProperty(index, 'annual_rent_income', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Property Taxes ($)
                      </label>
                      <input
                        type="number"
                        value={property.property_taxes}
                        onChange={(e) => updateRentalProperty(index, 'property_taxes', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Insurance ($)
                      </label>
                      <input
                        type="number"
                        value={property.insurance}
                        onChange={(e) => updateRentalProperty(index, 'insurance', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Maintenance & Repairs ($)
                      </label>
                      <input
                        type="number"
                        value={property.maintenance_repairs}
                        onChange={(e) => updateRentalProperty(index, 'maintenance_repairs', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                        Management Fees ($)
                      </label>
                      <input
                        type="number"
                        value={property.management_fees}
                        onChange={(e) => updateRentalProperty(index, 'management_fees', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rental-active-${index}`}
                        checked={property.is_active}
                        onChange={(e) => updateRentalProperty(index, 'is_active', e.target.checked)}
                        className="w-4 h-4 text-[#F56D2D] focus:ring-[#F56D2D] border-gray-300 rounded"
                      />
                      <label htmlFor={`rental-active-${index}`} className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                        Property is currently active
                      </label>
                    </div>
                  </div>
                </div>
                ))
              )}

              {/* Business Form Section */}
              {showBusinessModal && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-[#E8F0FF]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                {editingBusinessIndex !== null ? 'Edit Business' : 'Add New Business'}
              </h4>
              <button
                onClick={closeBusinessModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessFormData.business_name}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_name: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Business Type
                </label>
                <select
                  value={businessFormData.business_type}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_type: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                >
                  <option value="">Select business type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLC">LLC</option>
                  <option value="Corporation">Corporation</option>
                  <option value="S-Corporation">S-Corporation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={businessFormData.business_address}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_address: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={businessFormData.business_city}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_city: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={businessFormData.business_state}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_state: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={businessFormData.business_zip}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_zip: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="ZIP code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={businessFormData.business_phone}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={businessFormData.business_email}
                  onChange={(e) => setBusinessFormData({...businessFormData, business_email: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  EIN
                </label>
                <input
                  type="text"
                  value={businessFormData.ein}
                  onChange={(e) => setBusinessFormData({...businessFormData, ein: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={businessFormData.start_date}
                  onChange={(e) => setBusinessFormData({...businessFormData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F56D2D] font-[BasisGrotesquePro]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro] mb-2">
                  Business Status
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setBusinessFormData({...businessFormData, is_active: !businessFormData.is_active})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F56D2D] focus:ring-offset-2 ${
                      businessFormData.is_active ? 'bg-[#F56D2D]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        businessFormData.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700 font-[BasisGrotesquePro]">
                    {businessFormData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeBusinessModal}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-[BasisGrotesquePro]"
              >
                Cancel
              </button>
              <button
                onClick={saveBusinessInfo}
                className="flex items-center gap-2 px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
              >
                <FiSave size={16} />
                {editingBusinessIndex !== null ? 'Update Business' : 'Add Business'}
              </button>
            </div>
          </div>
        )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8F0FF]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-[BasisGrotesquePro]"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Save Business Information
              </>
            )}
          </button>
        </div>
      </div>


  );
};

export default BusinessInfoForm;