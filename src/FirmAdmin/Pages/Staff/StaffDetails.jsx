import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mails2Icon, CallIcon, TwouserIcon } from '../../Components/icons';

export default function StaffDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');

  // Mock data for the staff member - in real app, this would come from an API
  const staffMember = {
    id: 1,
    name: 'Michael Chen',
    title: 'Senior Tax Preparer',
    status: 'Active',
    email: 'michael.chen@firm.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, New York, NY 10002',
    department: 'Tax Preparation',
    hireDate: '15-03-2023',
    hoursWeek: '40',
    clients: 45,
    tasksDone: 128,
    revenue: '$125K',
    hours: 1840,
    efficiency: 92,
    specialties: ['Individual Tax Returns', 'Business Tax Returns', 'Tax Planning']
  };

  const tabs = [
    'Overview',
    'Assigned Clients',
    'Current Tasks',
    'Performance',
    'Schedule',
    'Onboarding',
    'Activity log'
  ];

  return (
    <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">Staff Details</h4>
        <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Detailed information about staff member</p>
      </div>

      {/* Staff Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">
              MC
            </div>
            
            {/* Name and Info */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.name}</h3>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                  {staffMember.status.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-[BasisGrotesquePro]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">{staffMember.title}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-[BasisGrotesquePro] flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Message
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm flex items-center gap-1">
              Staff Role
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-5 gap-6">
          {/* Clients */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TwouserIcon />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.clients}</div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">Clients</div>
          </div>

          {/* Tasks Done */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.tasksDone}</div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">Tasks Done</div>
          </div>

          {/* Revenue */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.revenue}</div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">Revenue</div>
          </div>

          {/* Hours */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.hours}</div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">Hours</div>
          </div>

          {/* Efficiency */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{staffMember.efficiency}%</div>
            <div className="text-sm text-gray-600 font-[BasisGrotesquePro]">Efficiency</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition font-[BasisGrotesquePro] ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contact and Employment Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Contact Information</h5>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Mails2Icon />
              </div>
              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{staffMember.email}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <CallIcon />
              </div>
              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{staffMember.phone}</span>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">{staffMember.address}</span>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Employment Details</h5>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Department</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.department}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Hire Date</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.hireDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mb-1">Hours/Week</div>
              <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staffMember.hoursWeek}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h5 className="text-lg font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Specialties</h5>
        <div className="flex flex-wrap gap-2">
          {staffMember.specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium font-[BasisGrotesquePro]"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

