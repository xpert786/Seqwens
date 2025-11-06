import React, { useState, useEffect, useRef } from 'react';

export default function ESignatureManagement() {
  const [activeTab, setActiveTab] = useState('Templates');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Settings state
  const [defaultExpiry, setDefaultExpiry] = useState('7');
  const [reminderFrequency, setReminderFrequency] = useState('2');
  const [authenticationRequired, setAuthenticationRequired] = useState(true);
  const [smsVerificationRequired, setSmsVerificationRequired] = useState(false);
  const [certificateAuthority, setCertificateAuthority] = useState('DocuSign');
  const [auditTrailRetention, setAuditTrailRetention] = useState('7');
  const [esignActCompliant, setEsignActCompliant] = useState(true);
  const [uetaCompliant, setUetaCompliant] = useState(true);
  const [euEidasCompliant, setEuEidasCompliant] = useState(false);

  // Create Signature Request Modal state
  const [signatureType, setSignatureType] = useState('Signature Required');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState('@johndoe');
  const [spouseAlso, setSpouseAlso] = useState(true);
  const [documentCategory, setDocumentCategory] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Close mobile navbar after selecting a tab (only on mobile screens ≤767px)
    if (window.innerWidth <= 767) {
      setShowMobileNav(false);
    }
  };

  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCreateModal(false);
      }
    };

    if (showCreateModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateModal]);

  const templates = [
    {
      id: 1,
      title: 'Tax Return Signature',
      description: 'Standard tax return client signature template',
      fields: 3,
      usage: 45
    },
    {
      id: 2,
      title: 'Engagement Letter',
      description: 'Client engagement agreement template',
      fields: 5,
      usage: 35
    },
    {
      id: 3,
      title: 'Power Of Attorney',
      description: 'IRS power of attorney form template',
      fields: 4,
      usage: 28
    }
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-[rgb(243,247,255)] min-h-screen">
      {/* Header Section */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              E-Signature Management
            </h3>
            <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Manage document signatures and templates
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium w-full sm:w-auto" 
            style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">New Signature Request</span>
            <span className="sm:hidden">New Request</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 md:mb-6">
        {/* Desktop Navigation - Always visible on screens ≥ 768px */}
        <div className="hidden md:block">
          <div className="flex gap-1 bg-white rounded-lg p-1 w-fit border border-blue-50">
            <button
              onClick={() => handleTabChange('Signature Request')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === 'Signature Request'
                  ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
            >
              Signature Request
            </button>
            <button
              onClick={() => handleTabChange('Templates')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === 'Templates'
                  ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
            >
              Templates
            </button>
            <button
              onClick={() => handleTabChange('Settings')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === 'Settings'
                  ? 'text-white bg-[#3AD6F2] rounded-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Only visible on screens < 768px */}
        <div className="block md:hidden">
          {/* Logo Icon Toggle Button */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-blue-50 text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Toggle Navigation"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-300 ${showMobileNav ? 'rotate-180' : ''}`}
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  fill="#3AD6F2"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#3AD6F2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#3AD6F2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Current Active Tab Display */}
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'BasisGrotesquePro' }}>
                {activeTab === 'Signature Request' ? 'Signature Request' : 
                 activeTab === 'Templates' ? 'Templates' : 'Settings'}
              </span>
            </div>
          </div>

          {/* Collapsible Menu - Only visible when showMobileNav is true */}
          {showMobileNav && (
            <div className="bg-white rounded-lg border border-blue-50 shadow-lg overflow-hidden">
              <button
                onClick={() => handleTabChange('Signature Request')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'Signature Request'
                    ? 'text-white bg-[#3AD6F2]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <div className="flex items-center justify-between">
                  <span>Signature Request</span>
                  {activeTab === 'Signature Request' && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('Templates')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-t border-gray-100 ${
                  activeTab === 'Templates'
                    ? 'text-white bg-[#3AD6F2]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <div className="flex items-center justify-between">
                  <span>Templates</span>
                  {activeTab === 'Templates' && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('Settings')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-t border-gray-100 ${
                  activeTab === 'Settings'
                    ? 'text-white bg-[#3AD6F2]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'BasisGrotesquePro' }}
              >
                <div className="flex items-center justify-between">
                  <span>Settings</span>
                  {activeTab === 'Settings' && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Templates Tab Content */}
      {activeTab === 'Templates' && (
        <div className="bg-white rounded-lg p-4 sm:p-6">
          <div className="mb-4 md:mb-6">
            <h5 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Signature Templates
            </h5>
            <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
              Manage reusable signature templates
            </p>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Template Title */}
                <h5 className="text-base sm:text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  {template.title}
                </h5>

                {/* Template Description */}
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  {template.description}
                </p>

                {/* Template Details */}
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Fields:
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {template.fields}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Usage:
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-800" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      {template.usage} times
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                  <button className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                    Edit Template
                  </button>
                  <button className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                    Use template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Request Tab Content */}
      {activeTab === 'Signature Request' && (
        <div className="bg-white rounded-lg p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
            Signature Request content coming soon...
          </p>
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'Settings' && (
        <div className="bg-white rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Signature Settings */}
            <div>
              <h5 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Signature Settings
              </h5>
              <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Configure signature requirements and defaults
              </p>

              <div className="space-y-6">
                {/* Default Expiry */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Default Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={defaultExpiry}
                    onChange={(e) => setDefaultExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Reminder Frequency */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Reminder Frequency (days)
                  </label>
                  <input
                    type="number"
                    value={reminderFrequency}
                    onChange={(e) => setReminderFrequency(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Authentication Requirements */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Authentication Requirements
                  </h5>
                  <div className="space-y-3">
                    {/* Authentication Required Checkbox */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={authenticationRequired}
                          onChange={(e) => setAuthenticationRequired(e.target.checked)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{ 
                            accentColor: '#3AD6F2',
                            backgroundColor: authenticationRequired ? '#3AD6F2' : 'white',
                            border: '2px solid',
                            borderColor: authenticationRequired ? '#3AD6F2' : '#D1D5DB'
                          }}
                        />
                        {authenticationRequired && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <label 
                        className="text-sm text-gray-700 cursor-pointer" 
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                        onClick={() => setAuthenticationRequired(!authenticationRequired)}
                      >
                        Authentication Requirements
                      </label>
                    </div>

                    {/* SMS Verification Required Checkbox */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={smsVerificationRequired}
                          onChange={(e) => setSmsVerificationRequired(e.target.checked)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{ 
                            accentColor: '#3AD6F2',
                            backgroundColor: smsVerificationRequired ? '#3AD6F2' : 'white',
                            border: '2px solid',
                            borderColor: smsVerificationRequired ? '#3AD6F2' : '#D1D5DB'
                          }}
                        />
                        {smsVerificationRequired && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <label 
                        className="text-sm text-gray-700 cursor-pointer" 
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                        onClick={() => setSmsVerificationRequired(!smsVerificationRequired)}
                      >
                        SMS verification required
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Compliance & Security */}
            <div>
              <h5 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Compliance & Security
              </h5>
              <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'BasisGrotesquePro' }}>
                Legal and security configurations
              </p>

              <div className="space-y-6">
                {/* Certificate Authority */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Certificate Authority
                  </label>
                  <div className="relative">
                    <select
                      value={certificateAuthority}
                      onChange={(e) => setCertificateAuthority(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-white"
                      style={{ fontFamily: 'BasisGrotesquePro' }}
                    >
                      <option>DocuSign</option>
                      <option>Adobe Sign</option>
                      <option>HelloSign</option>
                      <option>PandaDoc</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Audit Trail Retention */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Audit Trail Retention (years)
                  </label>
                  <input
                    type="number"
                    value={auditTrailRetention}
                    onChange={(e) => setAuditTrailRetention(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  />
                </div>

                {/* Compliance Standards */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-4" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Compliance Standards
                  </h5>
                  <div className="space-y-3">
                    {/* ESIGN Act Compliant Checkbox */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={esignActCompliant}
                          onChange={(e) => setEsignActCompliant(e.target.checked)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{ 
                            accentColor: '#3AD6F2',
                            backgroundColor: esignActCompliant ? '#3AD6F2' : 'white',
                            border: '2px solid',
                            borderColor: esignActCompliant ? '#3AD6F2' : '#D1D5DB'
                          }}
                        />
                        {esignActCompliant && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <label 
                        className="text-sm text-gray-700 cursor-pointer" 
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                        onClick={() => setEsignActCompliant(!esignActCompliant)}
                      >
                        ESIGN Act compliant
                      </label>
                    </div>

                    {/* UETA Compliant Checkbox */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={uetaCompliant}
                          onChange={(e) => setUetaCompliant(e.target.checked)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{ 
                            accentColor: '#3AD6F2',
                            backgroundColor: uetaCompliant ? '#3AD6F2' : 'white',
                            border: '2px solid',
                            borderColor: uetaCompliant ? '#3AD6F2' : '#D1D5DB'
                          }}
                        />
                        {uetaCompliant && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <label 
                        className="text-sm text-gray-700 cursor-pointer" 
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                        onClick={() => setUetaCompliant(!uetaCompliant)}
                      >
                        UETA compliant
                      </label>
                    </div>

                    {/* EU eIDAS Compliant Checkbox */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={euEidasCompliant}
                          onChange={(e) => setEuEidasCompliant(e.target.checked)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{ 
                            accentColor: '#3AD6F2',
                            backgroundColor: euEidasCompliant ? '#3AD6F2' : 'white',
                            border: '2px solid',
                            borderColor: euEidasCompliant ? '#3AD6F2' : '#D1D5DB'
                          }}
                        />
                        {euEidasCompliant && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <label 
                        className="text-sm text-gray-700 cursor-pointer" 
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                        onClick={() => setEuEidasCompliant(!euEidasCompliant)}
                      >
                        EU eIDAS compliant
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Signature Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Create Signature Request
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Send a document for electronic signature
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Type
                </label>
                <div className="relative">
                  <select
                    value={signatureType}
                    onChange={(e) => setSignatureType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-white"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  >
                    <option>Signature Required</option>
                    <option>Initial Required</option>
                    <option>Date Required</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Sign Your Document"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  style={{ fontFamily: 'BasisGrotesquePro' }}
                />
              </div>

              {/* Client */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Client
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white min-h-[42px]">
                    {selectedClient && (
                      <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <span style={{ fontFamily: 'BasisGrotesquePro' }}>{selectedClient}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient('');
                          }}
                          className="text-blue-700 hover:text-blue-900 ml-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spouse Also */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Spouse Also
                </label>
                <button
                  onClick={() => setSpouseAlso(!spouseAlso)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${spouseAlso ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${spouseAlso ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Add Files */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Add Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                      <path d="M24 16V32M16 24H32" stroke="#3AD6F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 32H40" stroke="#3AD6F2" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <p className="text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'BasisGrotesquePro' }}>
                      Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (Max 10MB per file)
                    </p>
                  </div>
                </div>
              </div>

              {/* Document category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Document category
                </label>
                <div className="relative">
                  <select
                    value={documentCategory}
                    onChange={(e) => setDocumentCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm appearance-none bg-white"
                    style={{ fontFamily: 'BasisGrotesquePro' }}
                  >
                    <option value="">Select a Category</option>
                    <option>Tax Documents</option>
                    <option>Legal Documents</option>
                    <option>Financial Documents</option>
                    <option>Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ fontFamily: 'BasisGrotesquePro' }}>
                  Due Date
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'BasisGrotesquePro' }}>
                    Selected Folder:
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                        <path d="M3 4H13V12H3V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 2V6M10 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontFamily: 'BasisGrotesquePro' }}>
                        Tax Year 2023 &gt; Income Documents &gt; W-2 Forms
                      </span>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}>
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                style={{ fontFamily: 'BasisGrotesquePro', borderRadius: '10px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

