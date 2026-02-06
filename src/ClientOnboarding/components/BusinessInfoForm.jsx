import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { handleAPIError } from '../utils/apiUtils';
import DateInput from '../../components/DateInput';
import { formatDateForDisplay, formatDateForAPI } from '../utils/dateUtils';

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
      const response = await fetch(`/api/clients/${clientId}/business-info/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Format dates for display
        const formattedBusinessInfos = (data.business_infos || []).map(biz => ({
          ...biz,
          start_date: biz.start_date ? formatDateForDisplay(biz.start_date) : '',
          end_date: biz.end_date ? formatDateForDisplay(biz.end_date) : ''
        }));

        const formattedRentalProperties = (data.rental_properties || []).map(prop => ({
          ...prop,
          purchase_date: prop.purchase_date ? formatDateForDisplay(prop.purchase_date) : ''
        }));

        setBusinessInfos(formattedBusinessInfos);
        setBusinessIncomes(data.business_incomes || []);
        setRentalProperties(formattedRentalProperties);
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
      setEditingBusinessIndex(index);
      setBusinessFormData(businessInfos[index]);
    } else {
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
  };

  const saveBusinessInfo = () => {
    if (editingBusinessIndex !== null) {
      const updatedBusinesses = [...businessInfos];
      updatedBusinesses[editingBusinessIndex] = businessFormData;
      setBusinessInfos(updatedBusinesses);
    } else {
      setBusinessInfos([...businessInfos, businessFormData]);
    }
    closeBusinessModal();
    toast.success(editingBusinessIndex !== null ? 'Business updated successfully!' : 'Business added successfully!');
  };

  const removeBusinessInfo = (index) => {
    setBusinessInfos(businessInfos.filter((_, i) => i !== index));
    toast.success('Business removed successfully!');
  };

  const addBusinessIncome = () => {
    setBusinessIncomes([...businessIncomes, {
      business_id: '',
      tax_year: new Date().getFullYear(),
      gross_receipts: '',
      cost_of_goods_sold: '',
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const apiBusinessInfos = businessInfos.map(biz => ({
        ...biz,
        start_date: biz.start_date ? formatDateForAPI(biz.start_date) : '',
        end_date: biz.end_date ? formatDateForAPI(biz.end_date) : ''
      }));

      const apiRentalProperties = rentalProperties.map(prop => ({
        ...prop,
        purchase_date: prop.purchase_date ? formatDateForAPI(prop.purchase_date) : ''
      }));

      const payload = {
        business_infos: apiBusinessInfos,
        business_incomes: businessIncomes,
        rental_properties: apiRentalProperties
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8F0FF]">
          <h3 className="text-xl font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
            Business Information Form
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
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
              className={`px-6 py-3 font-medium text-sm font-[BasisGrotesquePro] border-b-2 transition ${activeTab === tab.key
                ? 'border-[#F56D2D] text-[#F56D2D]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
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
                  <FiPlus size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">No Business Information Added</h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro]">Click "Add Business" to add your first business entry</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businessInfos.map((business, index) => (
                    <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] truncate">
                          {business.business_name || `Business ${index + 1}`}
                        </h4>
                        <div className="flex gap-2">
                          <button onClick={() => openBusinessModal(index)} className="text-blue-500 hover:text-blue-700 transition"><FiSave size={16} /></button>
                          <button onClick={() => removeBusinessInfo(index)} className="text-red-500 hover:text-red-700 transition"><FiTrash2 size={16} /></button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        {business.business_type && <p><span className="font-medium">Type:</span> {business.business_type}</p>}
                        {business.business_address && <p className="truncate"><span className="font-medium">Address:</span> {business.business_address}</p>}
                        {business.ein && <p><span className="font-medium">EIN:</span> {business.ein}</p>}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`inline-block w-2 h-2 rounded-full ${business.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-xs">{business.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Business Income & Expenses</h3>
                <button
                  onClick={addBusinessIncome}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  <FiPlus size={16} /> Add Income Record
                </button>
              </div>

              {businessIncomes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiPlus size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">No Income Records Added</h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro]">Click "Add Income Record" to track business income and expenses</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {businessIncomes.map((income, index) => (
                    <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Income Record #{index + 1}</h4>
                        <button onClick={() => removeBusinessIncome(index)} className="text-red-500 hover:text-red-700 transition"><FiTrash2 size={18} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
                          <input type="number" value={income.tax_year} onChange={(e) => updateBusinessIncome(index, 'tax_year', parseInt(e.target.value) || new Date().getFullYear())} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gross Receipts ($)</label>
                          <input type="number" value={income.gross_receipts} onChange={(e) => updateBusinessIncome(index, 'gross_receipts', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cost of Goods Sold ($)</label>
                          <input type="number" value={income.cost_of_goods_sold} onChange={(e) => updateBusinessIncome(index, 'cost_of_goods_sold', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Advertising ($)</label>
                          <input type="number" value={income.advertising} onChange={(e) => updateBusinessIncome(index, 'advertising', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rent ($)</label>
                          <input type="number" value={income.rent} onChange={(e) => updateBusinessIncome(index, 'rent', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Other Expenses ($)</label>
                          <input type="number" value={income.other_expenses} onChange={(e) => updateBusinessIncome(index, 'other_expenses', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rental' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Rental Properties</h3>
                <button
                  onClick={addRentalProperty}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition font-[BasisGrotesquePro]"
                >
                  <FiPlus size={16} /> Add Property
                </button>
              </div>

              {rentalProperties.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiPlus size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 font-[BasisGrotesquePro] mb-2">No Rental Properties Added</h4>
                  <p className="text-gray-500 font-[BasisGrotesquePro]">Click "Add Property" to add rental property information</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rentalProperties.map((property, index) => (
                    <div key={index} className="border border-[#E8F0FF] rounded-xl p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Property #{index + 1}</h4>
                        <button onClick={() => removeRentalProperty(index)} className="text-red-500 hover:text-red-700 transition"><FiTrash2 size={18} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Property Address *</label>
                          <input type="text" value={property.property_address} onChange={(e) => updateRentalProperty(index, 'property_address', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="Street address" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                          <DateInput value={property.purchase_date} onChange={(e) => updateRentalProperty(index, 'purchase_date', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                          <input type="number" value={property.monthly_rent} onChange={(e) => updateRentalProperty(index, 'monthly_rent', e.target.value)} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="0.00" step="0.01" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Business Modal Section */}
          {showBusinessModal && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-[#E8F0FF]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
                  {editingBusinessIndex !== null ? 'Edit Business' : 'Add New Business'}
                </h4>
                <button onClick={closeBusinessModal} className="text-gray-400 hover:text-gray-600 transition"><FiX size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input type="text" value={businessFormData.business_name} onChange={(e) => setBusinessFormData({ ...businessFormData, business_name: e.target.value })} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" placeholder="Enter business name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <DateInput value={businessFormData.start_date} onChange={(e) => setBusinessFormData({ ...businessFormData, start_date: e.target.value })} className="w-full px-3 py-2 border border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-[#F56D2D] outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Status</label>
                  <button
                    type="button"
                    onClick={() => setBusinessFormData({ ...businessFormData, is_active: !businessFormData.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-[#F56D2D] ${businessFormData.is_active ? 'bg-[#F56D2D]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${businessFormData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="ml-3 text-sm font-medium text-gray-700">{businessFormData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeBusinessModal} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button onClick={saveBusinessInfo} className="flex items-center gap-2 px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition">
                  <FiSave size={16} /> {editingBusinessIndex !== null ? 'Update Business' : 'Add Business'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8F0FF]">
          <button onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition" disabled={saving}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Saving...</>
            ) : (
              <><FiSave size={16} /> Save Business Information</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;