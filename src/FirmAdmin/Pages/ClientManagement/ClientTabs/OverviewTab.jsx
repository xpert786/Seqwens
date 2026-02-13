import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { MailIcon, CallIcon } from '../../../Components/icons';

export default function OverviewTab({ client, isEditMode, editFormData, onEditFormChange, phoneCountry, onPhoneCountryChange }) {
  // Helper to format filing status (e.g., married_joint -> Married Joint)
  const formatFilingStatus = (status) => {
    if (!status) return 'N/A';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* 1. Personal Information Card */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF] h-full flex flex-col">
        <div className="mb-4">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Personal Information</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Your basic personal and contact information</p>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Name</div>
              {isEditMode && editFormData ? (
                <div className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => onEditFormChange('first_name', e.target.value)}
                    placeholder="First Name"
                    className="flex-1 min-w-0 px-2 py-1 text-[13px] font-bold text-[#3B4A66] border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  />
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => onEditFormChange('last_name', e.target.value)}
                    placeholder="Last Name"
                    className="flex-1 min-w-0 px-2 py-1 text-[13px] font-bold text-[#3B4A66] border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  />
                </div>
              ) : (
                <div className="text-[13px] font-bold text-[#3B4A66] font-[BasisGrotesquePro] break-words">{client.name}</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Gender</div>
              <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro] break-words">{client.gender || 'N/A'}</div>
            </div>

            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Date of Birth</div>
              <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro] break-words">{client.dob || 'N/A'}</div>
            </div>

            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">SSN / ITIN (Tax ID)</div>
              <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro] break-words">{client.ssn || 'N/A'}</div>
            </div>

            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Filing Status</div>
              <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro] break-words">
                {formatFilingStatus(client.filingStatus)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Account Details Card */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF] h-full flex flex-col">
        <div className="mb-4">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Account Details</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Professional account and firm membership details</p>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Assigned Staff</div>
            <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
              {typeof client.assignedStaff === 'object' && client.assignedStaff !== null
                ? client.assignedStaff.name || 'Not Assigned'
                : client.assignedStaff || 'Not Assigned'}
            </div>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Join Date</div>
            <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.joinDate || 'N/A'}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Account Status</div>
            <div className={`text-sm font-bold font-[BasisGrotesquePro] ${client.accountStatus === 'active' ? 'text-green-600' : 'text-gray-900'}`}>
              {client.accountStatusDisplay || client.accountStatus || client.status || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Address Card */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF] h-full flex flex-col">
        <div className="mb-4">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Address</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Client's primary residential or business address</p>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Address Line</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] break-words">{client.address?.line || 'N/A'}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">City</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] break-words">{client.address?.city || 'N/A'}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">State</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] break-words">{client.address?.state || 'N/A'}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">ZIP Code</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] break-words">{client.address?.zip || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Contact Details Card */}
      <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF] h-full flex flex-col">
        <div className="mb-4">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Contact Details</h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Primary methods for firm communication</p>
        </div>
        <div className="flex-1 space-y-6">
          <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
            <CallIcon className="flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
              {isEditMode && editFormData ? (
                <PhoneInput
                  country={phoneCountry}
                  value={editFormData.phone_number || ''}
                  onChange={(phone) => onEditFormChange('phone_number', phone)}
                  onCountryChange={(countryCode) => onPhoneCountryChange(countryCode.toLowerCase())}
                  inputClass="px-2 py-1 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] w-full"
                  containerClass="phone-input-container w-full"
                  inputStyle={{ width: '100%' }}
                  enableSearch={true}
                  countryCodeEditable={false}
                />
              ) : (
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] break-words">{client.phone}</div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
            <MailIcon className="flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Email</div>
              <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro] break-words">{client.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
