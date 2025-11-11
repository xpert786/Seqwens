import React from 'react';
import { Mail2Icon, Phone2Icon } from '../../../Components/icons';

export default function OverviewTab({ staffMember }) {
  return (
    <>
      {/* Contact and Employment Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Contact Information</h5>
          <div className="space-y-5">
            {/* Email and Phone - Same Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-gray-500">
                    <Mail2Icon />
                  </div>
                  <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">Email</span>
                </div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro] ml-6">{staffMember.email}</div>
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-gray-500">
                    <Phone2Icon />
                  </div>
                  <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">Phone</span>
                </div>
                <div className="text-sm text-gray-900 font-[BasisGrotesquePro] ml-6">{staffMember.phone}</div>
              </div>
            </div>

            {/* Address - Below Email and Phone */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">Address</span>
              </div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro] ml-6">{staffMember.address}</div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Employment Details</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">Department:</span>
              <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">Hire Date:</span>
              <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.hireDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">Hours/Week:</span>
              <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.hoursWeek}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Specialties</h5>
        <div className="flex flex-wrap gap-2">
          {staffMember.specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-[#E8F0FF] text-[#3B4A66] rounded-full text-sm font-medium font-[BasisGrotesquePro] !border border-[#E8F0FF]"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

