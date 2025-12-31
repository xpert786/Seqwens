import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { MailIcon, CallIcon } from '../../../Components/icons';

export default function OverviewTab({ client, isEditMode, editFormData, onEditFormChange, phoneCountry, onPhoneCountryChange }) {
  console.log(client, 'editFormData');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Personal Information Card */}
        <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF]">
          <div className="mb-4">
            <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Personal Information</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Your basic personal and contact information</p>
          </div>
          <div className="space-y-4">
            {/* First Row: Name, Gender, Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Name</div>
                {isEditMode && editFormData ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={client.first_name}
                      onChange={(e) => onEditFormChange('first_name', e.target.value)}
                      placeholder="First Name"
                      className="flex-1 px-2 py-1 text-[13px] font-bold text-[#3B4A66] border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    />
                    <input
                      type="text"
                      value={client.last_name}
                      onChange={(e) => onEditFormChange('last_name', e.target.value)}
                      placeholder="Last Name"
                      className="flex-1 px-2 py-1 text-[13px] font-bold text-[#3B4A66] border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    />
                  </div>
                ) : (
                  <div className="text-[13px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{client.name}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Gender</div>
                <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro]">{client.gender || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Date of Birth</div>
                <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro]">{client.dob || 'N/A'}</div>
              </div>
            </div>
            {/* Second Row: Social Security Number (SSN), Filing Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Social Security Number (SSN)</div>
                <div className="text-[13px] text-[#3B4A66] font-bold font-[BasisGrotesquePro]">{client.ssn || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Filing Status</div>
                <div className="text-[13px] text-[#3B4A66] font-bold  font-[BasisGrotesquePro]">{client.filingStatus || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-lg p-6 !border border-[#E8F0FF]">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Address</h5>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Address Line</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.address?.line || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">City</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.address?.city || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">State</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.address?.state || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">ZIP Code</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.address?.zip || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Account Details Card */}
        <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
          <div>
            <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Account Details</h5>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">Your basic personal and contact information</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Assigned Staff:</div>
              <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                {typeof client.assignedStaff === 'object' && client.assignedStaff !== null
                  ? client.assignedStaff.name || 'Not Assigned'
                  : client.assignedStaff || 'Not Assigned'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Join Date:</div>
              <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.joinDate}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">Status:</div>
              <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                {client.accountStatusDisplay || client.accountStatus || client.status || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details Card */}
        <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF] mt-13 ">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Contact Details</h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CallIcon />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
                {isEditMode && editFormData ? (
                  <PhoneInput
                    country={phoneCountry}
                    value={editFormData.phone_number || ''}
                    onChange={(phone) => onEditFormChange('phone_number', phone)}
                    onCountryChange={(countryCode) => onPhoneCountryChange(countryCode.toLowerCase())}
                    inputClass="px-2 py-1 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    containerClass="phone-input-container"
                    enableSearch={true}
                    countryCodeEditable={false}
                  />
                ) : (
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.phone}</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MailIcon />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Email</div>
                {isEditMode && editFormData ? (
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => onEditFormChange('email', e.target.value)}
                    className="w-full px-2 py-1 text-sm text-gray-900 border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  />
                ) : (
                  <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{client.email}</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Spouse Information Card - Full Width */}
      {/* Commented out - Spouse information section
      <div className="col-span-1 lg:col-span-2">
        <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">Spouse Information</h5>
              <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Your spouse's information for joint filing</p>
            </div>
            <button className="px-3 py-1.5 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#F56D2D] transition font-[BasisGrotesquePro] text-sm font-medium flex items-center gap-2 whitespace-nowrap">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V9" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M13.7813 1.9699C14.0797 1.67153 14.4844 1.50391 14.9063 1.50391C15.3283 1.50391 15.733 1.67153 16.0313 1.9699C16.3297 2.26826 16.4973 2.67294 16.4973 3.0949C16.4973 3.51685 16.3297 3.92153 16.0313 4.2199L9.27157 10.9804C9.09348 11.1583 8.87347 11.2886 8.63182 11.3591L6.47707 11.9891C6.41253 12.008 6.34412 12.0091 6.279 11.9924C6.21388 11.9757 6.15444 11.9418 6.10691 11.8943C6.05937 11.8468 6.02549 11.7873 6.0088 11.7222C5.99212 11.6571 5.99325 11.5887 6.01207 11.5241L6.64207 9.3694C6.71297 9.12793 6.84347 8.90819 7.02157 8.7304L13.7813 1.9699Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Name</div>
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.spouse.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Gender</div>
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.spouse.gender}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Date of Birth</div>
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.spouse.dob}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Social Security Number (SSN)</div>
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.spouse.ssn}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Filing Status</div>
                <div className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">{client.spouse.filingStatus}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF] mt-6">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Contact Details</h5>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CallIcon />
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Phone</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                  {client.spouseContact?.phone || 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MailIcon />
              <div>
                <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Email</div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">
                  {client.spouseContact?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}

