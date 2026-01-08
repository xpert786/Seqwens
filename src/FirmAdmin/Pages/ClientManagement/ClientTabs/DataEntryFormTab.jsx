import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

const API_BASE_URL = getApiBaseUrl();

export default function DataEntryFormTab({ client }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mask SSN for display
  const maskSSN = (ssn) => {
    if (!ssn) return 'N/A';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return ssn;
  };

  // Mask account number for display
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    const cleaned = String(accountNumber).replace(/\D/g, '');
    if (cleaned.length > 4) {
      return `****${cleaned.slice(-4)}`;
    }
    return '****';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Fetch data entry form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (!client?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        const url = `${API_BASE_URL}/firm/clients/${client.id}/data-entry-form/`;

        const response = await fetchWithCors(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setFormData(result.data);
        } else {
          throw new Error(result.message || 'Failed to load form data');
        }
      } catch (err) {
        console.error('Error fetching data entry form:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load data entry form. Please try again.');
        // Don't show toast for 404 - form might not exist yet
        if (err.message && !err.message.includes('404')) {
          toast.error(errorMsg || 'Failed to load data entry form');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [client?.id]);

  // Render form field value
  const renderFieldValue = (key, value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    // Handle dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('dob') || key.toLowerCase().includes('hire')) {
      return formatDate(value);
    }

    // Handle SSN
    if (key.toLowerCase() === 'ssn') {
      return <span className="font-mono">{maskSSN(value)}</span>;
    }

    // Handle account numbers
    if (key.toLowerCase().includes('account_number')) {
      return <span className="font-mono">{maskAccountNumber(value)}</span>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">None</span>;
      }
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="text-sm">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </div>
          ))}
        </div>
      );
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  // Render field label
  const formatFieldLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading data entry form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-[BasisGrotesquePro]">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Unable to load data entry form</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2">The taxpayer may not have completed the form yet, or the form data is not available.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 font-[BasisGrotesquePro]">No Data Entry Form Available</h3>
        <p className="mt-2 text-sm text-gray-600 font-[BasisGrotesquePro]">
          The taxpayer has not completed the data entry form yet, or the form data is not available.
        </p>
      </div>
    );
  }

  const { personal_info, bank_info, income_information, tax_documents_count, taxpayer_id } = formData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Taxpayer Summary */}
      <div className="bg-white rounded-xl p-4 sm:p-6 !border border-[#E8F0FF]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Taxpayer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Taxpayer ID
            </label>
            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
              {renderFieldValue('taxpayer_id', taxpayer_id)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Name
            </label>
            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
              {renderFieldValue('taxpayer_name', formData.taxpayer_name)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Email
            </label>
            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
              {renderFieldValue('taxpayer_email', formData.taxpayer_email)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Phone
            </label>
            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
              {renderFieldValue('taxpayer_phone', formData.taxpayer_phone)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Tax Documents Count
            </label>
            <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
              {renderFieldValue('tax_documents_count', tax_documents_count)}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl p-4 sm:p-6 !border border-[#E8F0FF]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Personal Information
        </h3>
        {personal_info ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Personal Info ID
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('id', personal_info.id)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                First Name
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('first_name', personal_info.first_name)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Middle Name
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('middle_name', personal_info.middle_name)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Last Name
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('last_name', personal_info.last_name)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Date of Birth
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('dateOfBirth', personal_info.dateOfBirth)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Social Security Number
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('ssn', personal_info.ssn)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Gender
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('gender', personal_info.gender_display || personal_info.gender)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Address
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('address', personal_info.address)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                City
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('city', personal_info.city)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                State
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('state', personal_info.state)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                ZIP Code
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('zip', personal_info.zip)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Filing Status
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('filling_status', personal_info.filling_status_display || personal_info.filling_status)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Business Type
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('business_type', personal_info.business_type_display || personal_info.business_type)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Number of Dependents
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('no_of_dependents', personal_info.no_of_dependents)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Other Deductions
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('other_deductions', personal_info.other_deductions)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Owns a Home
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('does_own_a_home', personal_info.does_own_a_home)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                In School
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('in_school', personal_info.in_school)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Hire Date
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('hire_date', personal_info.hire_date)}
              </div>
            </div>
          </div>

          {/* Spouse Information */}
          <div className="mt-6 pt-6 border-t border-[#E8F0FF]">
            <h4 className="text-md font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Spouse Information
            </h4>
            {personal_info.spouse_info ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    First Name
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('first_name', personal_info.spouse_info.first_name)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Middle Name
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('middle_name', personal_info.spouse_info.middle_name)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Last Name
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('last_name', personal_info.spouse_info.last_name)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Date of Birth
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('dateOfBirth', personal_info.spouse_info.dateOfBirth)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Social Security Number
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('ssn', personal_info.spouse_info.ssn)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Email
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('email', personal_info.spouse_info.email)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Phone Number
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('phone_number', personal_info.spouse_info.phone_number)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                    Gender
                  </label>
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {renderFieldValue('gender', personal_info.spouse_info.gender_display || personal_info.spouse_info.gender)}
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="text-sm text-gray-400 italic font-[BasisGrotesquePro]">
                No spouse information available
              </div>
            )}
          </div>

          {/* Dependents */}
          <div className="mt-6 pt-6 border-t border-[#E8F0FF]">
            <h4 className="text-md font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
              Dependents ({personal_info.dependents?.length || 0})
            </h4>
            {personal_info.dependents && personal_info.dependents.length > 0 ? (
              <div className="space-y-4">
                {personal_info.dependents.map((dependent, index) => (
                  <div key={dependent.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">
                          First Name
                        </label>
                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {renderFieldValue('first_name', dependent.first_name)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">
                          Middle Name
                        </label>
                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {renderFieldValue('middle_name', dependent.middle_name)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">
                          Last Name
                        </label>
                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {renderFieldValue('last_name', dependent.last_name)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">
                          Date of Birth
                        </label>
                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {renderFieldValue('dateOfBirth', dependent.dateOfBirth)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">
                          Social Security Number
                        </label>
                        <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                          {renderFieldValue('ssn', dependent.ssn)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic font-[BasisGrotesquePro]">
                No dependents listed
              </div>
            )}
          </div>
          </>
        ) : (
          <div className="text-sm text-gray-400 italic font-[BasisGrotesquePro]">
            No personal information available
          </div>
        )}
      </div>

      {/* Bank Information */}
      <div className="bg-white rounded-xl p-4 sm:p-6 !border border-[#E8F0FF]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Bank Information
        </h3>
        {bank_info ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Bank Name
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('bank_name', bank_info.bank_name)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Routing Number
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] font-mono">
                {renderFieldValue('routing_number', bank_info.routing_number)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                Account Number
              </label>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] font-mono">
                {renderFieldValue('account_number', bank_info.account_number)}
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className="text-sm text-gray-400 italic font-[BasisGrotesquePro]">
            No bank information available
          </div>
        )}
      </div>

      {/* Income Information */}
      <div className="bg-white rounded-xl p-4 sm:p-6 !border border-[#E8F0FF]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
          Income Information
        </h3>
        {income_information ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                {renderFieldValue('income_information', income_information.income_information_display || income_information.income_information)}
              </div>
            </div>
            {income_information.income_information_types && income_information.income_information_types.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Income Information Types
                </label>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                  {renderFieldValue('income_information_types', income_information.income_information_types)}
                </div>
              </div>
            )}
            {income_information.income_information_types_display && income_information.income_information_types_display.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 font-[BasisGrotesquePro]" style={{ color: '#3B4A66' }}>
                  Income Information Types (Display)
                </label>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                  {renderFieldValue('income_information_types_display', income_information.income_information_types_display)}
                </div>
              </div>
            )}
          </div>
          </>
        ) : (
          <div className="text-sm text-gray-400 italic font-[BasisGrotesquePro]">
            No income information available
          </div>
        )}
      </div>
    </div>
  );
}

