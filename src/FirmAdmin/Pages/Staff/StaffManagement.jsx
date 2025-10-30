import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TwouserIcon, Mails2Icon, CallIcon,PowersIcon,DownsIcon,UpperDownsIcon} from "../../Components/icons";


export default function StaffManagement() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All Staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const staffData = [
    {
      id: 1,
      name: 'Michael Chen',
      title: 'Tax Performer',
      subtitle: 'Mentor',
      email: 'michael.chen@firm.com',
      phone: '(555) 111-2222',
      role: 'Tax Preparer',
      roleLevel: 'Advanced',
      status: 'Active',
      clients: 15,
      efficiency: 94,
      tasksCompleted: 28,
      compliance: 94,
      onboarding: 94,
      hireDate: 'Jan 15, 2022',
      revenue: '$125K',
      avatar: 'MC'
    },
    {
      id: 2,
      name: 'Sarah Martinez',
      title: 'Manager',
      subtitle: 'Leadership',
      email: 'sarah.martinez@firm.com',
      phone: '(555) 222-3333',
      role: 'Tax Manager',
      roleLevel: 'Manager',
      status: 'Active',
      clients: 12,
      efficiency: 91,
      tasksCompleted: 22,
      compliance: 85,
      onboarding: 85,
      hireDate: 'Mar 10, 2021',
      revenue: '$98K',
      avatar: 'SM'
    },
    {
      id: 3,
      name: 'David Rodriguez',
      title: 'New Hire',
      subtitle: 'Training',
      email: 'david.rodriguez@firm.com',
      phone: '(555) 333-4444',
      role: 'Tax Preparer',
      roleLevel: 'Beginner',
      status: 'Active',
      clients: 18,
      efficiency: 88,
      tasksCompleted: 31,
      compliance: 92,
      onboarding: 92,
      hireDate: 'Sep 5, 2022',
      revenue: '$85K',
      avatar: 'DR'
    },
    {
      id: 4,
      name: 'Lisa Thompson',
      title: 'Admin Support',
      subtitle: 'On Leave',
      email: 'lisa.thompson@firm.com',
      phone: '(555) 444-5555',
      role: 'Tax Preparer',
      roleLevel: 'Beginner',
      status: 'Active',
      clients: 10,
      efficiency: 92,
      tasksCompleted: 18,
      compliance: 80,
      onboarding: 80,
      hireDate: 'Nov 20, 2023',
      revenue: '$60K',
      avatar: 'LT'
    },
    {
      id: 5,
      name: 'James Wilson',
      title: 'Inactive',
      subtitle: 'CPA',
      email: 'james.wilson@firm.com',
      phone: '(555) 555-6666',
      role: 'Tax Preparer',
      roleLevel: 'Advanced',
      status: 'Inactive',
      clients: 0,
      efficiency: 0,
      tasksCompleted: 0,
      compliance: 65,
      onboarding: 65,
      hireDate: 'Jun 1, 2025',
      revenue: '$55K',
      avatar: 'JW'
    }
  ];

  const filters = ['All Staff', 'Active', 'Inactive', 'Pending Invites'];

  const handleDropdownToggle = (id) => {
    setShowDropdown(showDropdown === id ? null : id);
  };

  // Bulk Import Modal Component
  const BulkImportModal = () => {
    if (!isBulkImportModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Bulk Import Staff</h3>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Upload multiple staff members at once using a CSV file</p>
              </div>
              <button 
                onClick={() => setIsBulkImportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6 space-x-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Upload File'}
                    {step === 2 && 'Map Fields'}
                    {step === 3 && 'Validate Data'}
                    {step === 4 && 'Import'}
                  </span>
                  {step < 4 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Upload Staff Data</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 font-[BasisGrotesquePro]">Drop your file here or click to browse</p>
                    <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">Supported formats: CSV, XLS, XLSX (upto 10MB)</p>
                    <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro]">
                      Browse Files
                    </button>
                  </div>
                </div>

                {/* Download Template Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Download Template</h4>
                  <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">Use our template to ensure your data is formatted correctly.</p>
                  <ul className="text-sm text-gray-600 font-[BasisGrotesquePro] space-y-2 mb-6">
                    <li>• All required and optional fields</li>
                    <li>• Sample data for reference</li>
                    <li>• Proper formatting examples</li>
                    <li>• Field validation rules</li>
                  </ul>
                  <button 
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-[BasisGrotesquePro] flex items-center justify-center gap-2"
                  >
                    <DownsIcon />
                    Download CSV Template
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-2">Map CSV Columns to System Fields</h4>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Match your CSV columns to the appropriate client fields. Required fields must be mapped.</p>
                
                <div className="space-y-4">
                  {[
                    { csv: 'first_name', sample: 'John', system: 'First Name', required: true },
                    { csv: 'email', sample: 'john.doe@example.com', system: 'Email', required: true },
                    { csv: 'phone', sample: '+91-9876543210', system: 'Phone Number', required: true },
                    { csv: 'role', sample: 'Tax Preparer', system: 'Role', required: true },
                    { csv: 'department', sample: 'Audit', system: 'Department', required: true },
                    { csv: 'employee_id', sample: '03-567890', system: 'Employee ID', required: false },
                    { csv: 'job_title', sample: 'Senior Tax Preparer', system: 'Job Title', required: false },
                    { csv: 'status', sample: 'Active', system: 'Status', required: false },
                    { csv: 'joining_date', sample: '01-01-2005', system: 'Joining Date', required: false },
                    { csv: 'location', sample: 'New York', system: 'Location', required: false },
                    { csv: 'manager', sample: 'Jane Smith', system: 'Manager', required: false },
                    { csv: 'tags', sample: 'CPA Certified', system: 'Tags', required: false }
                  ].map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">{field.csv}</div>
                        <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">Sample: {field.sample}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 font-[BasisGrotesquePro]">{field.system}</span>
                          {field.required && (
                            <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 font-[BasisGrotesquePro] mb-2">Mapped Required Fields</h5>
                  <div className="flex flex-wrap gap-2">
                    {['First Name', 'Email', 'Phone Number', 'Role', 'Department'].map((field) => (
                      <span key={field} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setIsBulkImportModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
            >
              Cancel
            </button>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro]"
              >
                Continue to Validation →
              </button>
            ) : (
              <button
                onClick={() => setIsBulkImportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro]"
              >
                Import Staff
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Download Template Modal Component
  const DownloadModal = () => {
    if (!isDownloadModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro] mb-4">Download CSV Template</h3>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Your CSV template is ready for download. This template includes all required and optional fields with sample data.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 font-[BasisGrotesquePro]">staff_template.csv</div>
                  <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">2.5 KB • CSV File</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro]"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <BulkImportModal />
      <DownloadModal />
      <div className="w-full px-4 py-4 bg-[#F6F7FF] min-h-screen">
      {/* Header and Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-6 gap-4">
        {/* Header */}
        <div className="flex-1">
          <h4 className="text-[16px] font-bold text-gray-900 font-[BasisGrotesquePro]">Staff Management</h4>
          <p className="text-gray-600 font-[BasisGrotesquePro] text-sm">Manage team members and their assignments</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Top Row - 3 buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap">
              <PowersIcon />
              Performance Report
            </button>
            <button 
              onClick={() => setIsBulkImportModalOpen(true)}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <UpperDownsIcon />
              Bulk Import
            </button>
            <button className="px-3 py-2 text-white bg-orange-500 border border-orange-500 !rounded-[7px] hover:bg-orange-600 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Staff Member
            </button>
          </div>
          
          {/* Bottom Row - 1 button */}
          <div className="flex items-center">
            <button className="px-3 py-2 text-gray-700 bg-white border border-gray-300 !rounded-[7px] hover:bg-gray-50 font-[BasisGrotesquePro] flex items-center gap-2 text-sm whitespace-nowrap">
              <DownsIcon />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-left">
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Active Staff</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">4</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-left">
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Pending Invites</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">2</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-left">
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Avg Performance</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">3.8</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-left">
          <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Training Pending</div>
          <div className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">2</div>
        </div>
      </div>

      {/* Staff Status Filters */}
      <div className="bg-white rounded-lg p-3 mb-6 w-fit">
        <div className="flex items-center gap-1">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-2 !rounded-[8px] text-sm font-medium font-[BasisGrotesquePro] transition-colors transition-transform focus:outline-none active:scale-[0.98] ${
                activeFilter === filter
                  ? 'bg-[#3AD6F2] text-white ring-2 ring-[#3AD6F2]/40 shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Team Members (5)</h2>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Complete list of staff members with performance metrics</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Roles</option>
                <option>Tax Preparer</option>
                <option>Tax Manager</option>
                <option>Admin</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Departments</option>
                <option>Tax Preparation</option>
                <option>Management</option>
                <option>Support</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-[BasisGrotesquePro] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All Performance</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[200px]">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[180px]">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[120px]">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[80px]">Clients</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[150px]">Performance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">Compliance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">Onboarding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">Hire Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[100px]">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro] w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffData.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  {/* Staff Member */}
                  <td className="px-4 py-4 w-[200px]">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {staff.avatar}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro]">{staff.name}</div>
                        <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{staff.title}</div>
                        <div className="text-xs text-gray-400 font-[BasisGrotesquePro]">{staff.subtitle}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-4 w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Mails2Icon />
                      <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staff.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CallIcon />
                      <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{staff.phone}</div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4 w-[120px]">
                    <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staff.role}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-[BasisGrotesquePro] ${
                      staff.roleLevel === 'Advanced'
                        ? 'bg-gray-100 text-gray-700'
                        : staff.roleLevel === 'Manager'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {staff.roleLevel}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 w-[100px]">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staff.status === 'Active' 
                        ? 'bg-[#22C55E] text-white' 
                        : 'bg-[#EF4444] text-white'
                    }`}>
                      {staff.status}
                    </span>
                  </td>

                  {/* Clients */}
                  <td className="px-4 py-4 w-[80px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <TwouserIcon />
                      </div>
                      <span className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staff.clients}</span>
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-4 py-4 w-[150px]">
                    <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">Efficiency {staff.efficiency}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-[#3AD6F2] h-2 rounded-full" 
                        style={{width: `${staff.efficiency}%`}}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">{staff.tasksCompleted} Tasks Completed</div>
                  </td>

                  {/* Compliance */}
                  <td className="px-4 py-4 w-[100px]">
                    <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staff.compliance}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-[#3AD6F2] h-2 rounded-full" 
                        style={{width: `${staff.compliance}%`}}
                      ></div>
                    </div>
                  </td>

                  {/* Onboarding */}
                  <td className="px-4 py-4 w-[100px]">
                    <div className="text-sm text-gray-900 font-[BasisGrotesquePro]">{staff.onboarding}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-[#3AD6F2] h-2 rounded-full" 
                        style={{width: `${staff.onboarding}%`}}
                      ></div>
                    </div>
                  </td>

                  {/* Hire Date */}
                  <td className="px-4 py-4 w-[100px] text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {staff.hireDate}
                  </td>

                  {/* Revenue */}
                  <td className="px-4 py-4 w-[100px] text-sm text-gray-900 font-[BasisGrotesquePro]">
                    {staff.revenue}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 w-[80px] text-sm font-medium relative">
                    <button
                      onClick={() => handleDropdownToggle(staff.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {showDropdown === staff.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]">
                            View Details
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]">
                            Edit Task
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]">
                            Send Message
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-[BasisGrotesquePro]">
                            Reassign Clients
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-[BasisGrotesquePro]">
                            Remove Staff
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}