import React, { useState } from 'react';
import { DolersIcon, DoublesIcon, FilessIcon, WatchesIcon, ChecksIcon, Checks2Icon, DownsIcon,SceheIcon,CrossesIcon,AletIcon,Alet2Icon } from "../../Components/icons";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 8000, target: 10000 },
  { month: 'Feb', revenue: 9500, target: 10000 },
  { month: 'Mar', revenue: 11000, target: 10000 },
  { month: 'Apr', revenue: 12000, target: 10000 },
  { month: 'May', revenue: 10100, target: 10000 },
  { month: 'Jun', revenue: 13000, target: 10000 }
];

const clientEngagementData = [
  { stage: 'Leads', percentage: 100, value: 150 },
  { stage: 'Consultations', percentage: 80, value: 120 },
  { stage: 'Proposals', percentage: 63, value: 95 },
  { stage: 'Signed', percentage: 52, value: 78 },
  { stage: 'Completed', percentage: 48, value: 72 }
];

const complianceData = [
  { status: 'Due Diligence', score: '85/100', percentage: 85, badge: 'Low' },
  { status: 'E-Signature', score: '92/100', percentage: 92, badge: 'Low' },
  { status: 'Document Review', score: '78/100', percentage: 78, badge: 'Medium' },
  { status: 'Quality Control', score: '88/100', percentage: 88, badge: 'Low' },
  { status: 'Audit Prep', score: '65/100', percentage: 65, badge: 'High' }
];

// Breakdown data for bar chart
const breakdownData = [
  { category: 'Prep Fees', amount: 52000 },
  { category: 'Add-ons', amount: 16000 },
  { category: 'Refund Transfers', amount: 21800 },
  { category: 'Training Courses', amount: 8000 },
  { category: 'Consulting', amount: 10000 }
];

export default function FirmAdminDashboard() {
  const [activeTab, setActiveTab] = useState('trend');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshEnabled, setRefreshEnabled] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [refreshInterval, setRefreshInterval] = useState('30 seconds');
  const [imageAsEmail, setImageAsEmail] = useState('PDF');
  const [widgetVisibility, setWidgetVisibility] = useState({
    Alerts: true,
    Kpi: true,
    Revenue: true,
    Engagement: true,
    Staff: true,
    Compliance: true,
    'Ai Insights': true,
    Performance: true,
    Calendar: true
  });
  const [scheduleFrequency, setScheduleFrequency] = useState('Weekly');
  const [recipients, setRecipients] = useState('admins@firm.com');

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const revenueValue = payload[0]?.value || 0;
      const targetValue = payload[1]?.value || 0;
      
      return (
        <div className="bg-white rounded-lg  p-3 border border-blue-200" style={{minWidth: '140px'}}>
          <div className="text-sm font-semibold mb-2" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm mb-1" style={{color: '#3B82F6'}}>
            Target : {targetValue.toLocaleString()}
          </div>
          <div className="text-sm" style={{color: '#EF4444'}}>
            Revenue : {revenueValue.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for breakdown chart
  const BreakdownTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const amount = payload[0]?.value || 0;
      
      return (
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200" style={{minWidth: '120px'}}>
          <div className="text-sm font-semibold mb-1" style={{color: '#374151'}}>{label}</div>
          <div className="text-sm" style={{color: '#3AD6F2'}}>
            Amount: ${amount.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  // CustomizeModal Component
  const CustomizeModal = () => {
    if (!isCustomizeModalOpen) return null;

    const handleWidgetToggle = (widget) => {
      setWidgetVisibility(prev => ({
        ...prev,
        [widget]: !prev[widget]
      }));
    };

    return (
      <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-start justify-center z-50 p-4 pt-32">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] overflow-y-auto mt-[180px]">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h4 className="text-[18px] font-semibold text-gray-800 font-[BasisGrotesquePro]">Customize</h4>
            <button 
              onClick={() => setIsCustomizeModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            >
             <CrossesIcon />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Auto Refresh Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Auto Refresh</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform !rounded-full bg-white shadow-lg transition-transform ${
                      autoRefresh ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">Enabled</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-[BasisGrotesquePro]">Refresh interval</label>
                <div className="relative">
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                  >
                    <option value="15 seconds">15 seconds</option>
                    <option value="30 seconds">30 seconds</option>
                    <option value="1 minute">1 minute</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Assign to Staff Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Assign to Staff</label>
              <div className="relative">
                <select
                  value="All Staff"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                >
                  <option value="All Staff">All Staff</option>
                  <option value="Specific Staff">Specific Staff</option>
                  <option value="Admin Only">Admin Only</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Time Range Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Time Range</label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full text-sm !border border-gray-300 !rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                >
                  <option value="Last 7 Days">Last 7 days</option>
                  <option value="Last 30 Days">Last 30 days</option>
                  <option value="Last 90 Days">Last 90 days</option>
                  <option value="Last 6 Months">Last 6 months</option>
                  <option value="Last Year">Last year</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Widget Visibility & Order Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Widget Visibility & Order</h3>
                <p className="text-xs text-gray-500 font-[BasisGrotesquePro] mt-1">
                  Drag widgets to reorder them on your dashboard
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-0">
                {[
                  'Alerts',
                  'Kpi', 
                  'Revenue',
                  'Engagement',
                  'Staff',
                  'Compliance',
                  'Ai Insights',
                  'Performance',
                  'Calendar'
                ].map((widget, index) => (
                  <div key={widget}>
                    <div className="flex items-center py-3">
                      {/* Drag Handle - 2 dots only */}
                      <div className="w-4 h-4 flex flex-col gap-1 cursor-move mr-3">
                        <div className="w-1 h-1 bg-gray-600 !rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-600 !rounded-full"></div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleWidgetToggle(widget)}
                        className={`relative inline-flex h-9 w-16 items-center !rounded-full transition-colors mr-6 ${
                          widgetVisibility[widget] !== false ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-7 w-7 transform !rounded-full bg-white shadow-lg transition-transform ${
                            widgetVisibility[widget] !== false ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      
                      {/* Widget Name */}
                      <span className="text-sm text-gray-800 font-[BasisGrotesquePro]">{widget}</span>
                    </div>
                    {index < 8 && <div className="!border-b border-gray-200"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

         
        </div>
      </div>
    );
  };

  // ScheduleModal Component
  const ScheduleModal = () => {
    if (!isScheduleModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mt-[180px]">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-[BasisGrotesquePro]">Schedule Dashboard Report</h3>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Email a recurring dashboard summary to admins.</p>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full  flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <CrossesIcon />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Frequency Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Frequency</label>
              <div className="relative">
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Recipients Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Recipients</label>
              <input
                type="email"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter email addresses"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro]"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro]"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomizeModal />
      <ScheduleModal />
      <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
      {/* Header */}
      <div className="flex flex-col 2xl:flex-row 2xl:justify-between 2xl:items-start gap-2 2xl:gap-0 mb-6">
        <div className="flex-1 min-w-0 pr-4 xl:pr-2">
          <h4 className="text-[16px] font-bold text-[#3B4A66] font-[BasisGrotesquePro] whitespace-nowrap">Firm Admin Dashboard</h4>
          <p className="text-[#6B7280] mt-1 font-[BasisGrotesquePro] text-[10px] xl:text-base xl:whitespace-nowrap leading-tight">
            <span className="block xl:inline">Welcome Back, Firm Administrator -</span>
            <span className="block xl:inline">Tax Practice Management</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 2xl:gap-3 mt-2 2xl:mt-1 w-full 2xl:w-auto 2xl:justify-end">
          <button className="px-3 xl:px-4 py-1 xl:py-2 text-[#3B4A66] bg-white border border-[#E5E7EB] !rounded-[7px] !text-[15px] xl:text-sm font-medium font-[BasisGrotesquePro] hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
            Admin View
            <svg className="w-2 h-2 xl:w-3 xl:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button 
            onClick={() => setIsCustomizeModalOpen(true)}
            className="px-3 xl:px-4 py-1 xl:py-2 text-white bg-orange-500 border border-orange-500 !rounded-[7px] !text-[15px] xl:text-sm font-medium font-[BasisGrotesquePro] hover:bg-orange-600 whitespace-nowrap"
          >
            Customize
          </button>
          <button className="px-3 xl:px-4 py-1 xl:py-2 text-[#3B4A66] bg-white border border-[#E5E7EB] !rounded-[7px] !text-[15px] xl:text-sm font-medium font-[BasisGrotesquePro] hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
            <DownsIcon />
            Export Report
          </button>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3 xl:px-4 py-1 xl:py-2 text-[#3B4A66] bg-white border border-[#E5E7EB] !rounded-[7px] !text-[15px] xl:text-sm font-medium font-[BasisGrotesquePro] hover:bg-gray-50 whitespace-nowrap flex items-center gap-1"
          >
            <SceheIcon />
            Schedule Reports
          </button>
        </div>
      </div>

      {/* System Alerts Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">System Alerts</h4>
          <div className="px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
            <span className="text-xs font-medium text-orange-600 font-[BasisGrotesquePro]">3 Active</span>
          </div>
        </div>
        
        <div className="space-y-0">
          {/* EFIN Expiring Soon */}
          <div className="flex items-center justify-between py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
               <AletIcon/>
              </div>
              <div>
                <h6 className="font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-[10px]">EFIN Expiring Soon</h6>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Quarterly Tax Filing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-blue-500 font-[BasisGrotesquePro]">2 hours ago</span>
              </div>
              <button className="px-3 py-1 border border-[#D1D5DB] text-[#3B4A66] text-xs rounded font-[BasisGrotesquePro] hover:bg-gray-50">
                Renew Now
              </button>
            </div>
          </div>

          {/* Missing Compliance Docs */}
          <div className="flex items-center justify-between py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
              <Alet2Icon />
              </div>
              <div>
                <h6 className="font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-[10px]">Missing Compliance Docs</h6>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">5 Client Missing required Documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-blue-500 font-[BasisGrotesquePro]">4 hours ago</span>
              </div>
              <button className="px-3 py-1 border border-[#D1D5DB] text-[#3B4A66] text-xs rounded font-[BasisGrotesquePro] hover:bg-gray-50">
                Review
              </button>
            </div>
          </div>

          {/* Failed E Signatures */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h6 className="font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-[10px]">Failed E Signatures</h6>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">3 Signature Request Need Attention</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-blue-500 font-[BasisGrotesquePro]">6 hours ago</span>
              </div>
              <button className="px-3 py-1 border border-[#D1D5DB] text-[#3B4A66] text-xs rounded font-[BasisGrotesquePro] hover:bg-gray-50">
                Resend
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* My Revenue */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 relative">
          <div className="absolute top-3 right-3">
            <DolersIcon />
          </div>
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{fontSize: '15px'}}>My Revenue</h3>
            <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">$42,200</p>
            <div className="flex items-center gap-1 mt-1">
              <ChecksIcon />
              <p className="text-xs text-black font-[BasisGrotesquePro]">+12.5% vs last month</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Target $400,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#3AD6F2] h-2 rounded-full" style={{width: '10.5%'}}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">$280,000</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Prep Fees</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">$50,000</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Add Ons</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">$30,000</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Training</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Clients */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 relative">
          <div className="absolute top-3 right-3">
            <DoublesIcon />
          </div>
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{fontSize: '15px'}}>My Clients</h3>
            <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">24</p>
            <div className="flex items-center gap-1 mt-1">
              <ChecksIcon />
              <p className="text-xs text-black font-[BasisGrotesquePro]">+12 this month</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Target 30</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#3AD6F2] h-2 rounded-full" style={{width: '80%'}}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">18</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Individual</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">5</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Business</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">2</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Estate</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 relative">
          <div className="absolute top-3 right-3">
            <FilessIcon />
          </div>
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{fontSize: '15px'}}>My Tasks</h3>
            <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">12</p>
            <div className="flex items-center gap-1 mt-1">
              <Checks2Icon />
              <p className="text-xs text-black font-[BasisGrotesquePro]">5 vs Last Month</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Target 8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#3AD6F2] h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">8</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Tax Prep</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">2</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Review</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">2</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Followups</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Response Time */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 relative">
          <div className="absolute top-3 right-3">
            <WatchesIcon />
          </div>
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{fontSize: '15px'}}>My Response Time</h3>
            <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">24</p>
            <div className="flex items-center gap-1 mt-1">
              <ChecksIcon />
              <p className="text-xs text-black font-[BasisGrotesquePro]">+18 vs Last Week</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#6B7280]">
              <span>Target 2</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#3AD6F2] h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">1.8</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Email</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">0.5</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Phone</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">1.5</div>
                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Portal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Revenue Analytics</h4>
              <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Your revenue contribution and trends</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation and Monthly Dropdown */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white rounded-lg p-1 border border-gray-200">
            <div className="flex gap-0">
              <button 
                onClick={() => setActiveTab('trend')}
                className={`px-4 py-2 text-sm !rounded-lg font-[BasisGrotesquePro] font-medium transition-colors ${
                  activeTab === 'trend' 
                    ? 'bg-[#3AD6F2] text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trend
              </button>
              <button 
                onClick={() => setActiveTab('breakdown')}
                className={`px-4 py-2 text-sm !rounded-lg font-[BasisGrotesquePro] font-medium transition-colors ${
                  activeTab === 'breakdown' 
                    ? 'bg-[#3AD6F2] text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Breakdown
              </button>
              <button 
                onClick={() => setActiveTab('arap')}
                className={`px-4 py-2 text-sm !rounded-lg font-[BasisGrotesquePro] font-medium transition-colors ${
                  activeTab === 'arap' 
                    ? 'bg-[#3AD6F2] text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                AR/AP
              </button>
            </div>
          </div>
          <select className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2">
            <option>Monthly</option>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </select>
        </div>
        
        <div className="h-80">
          {activeTab === 'trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3AD6F299"/>
                    <stop offset="95%" stopColor="#3AD6F299"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, 14000]}
                  ticks={[0, 3500, 7000, 10500, 14000]}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3AD6F2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={{ fill: 'white', stroke: '#3AD6F2', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3AD6F2', strokeWidth: 2, fill: 'white' }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: 'white', stroke: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#EF4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'breakdown' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={breakdownData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  domain={[0, 60000]}
                  ticks={[0, 15000, 30000, 45000, 60000]}
                />
                <Tooltip content={<BreakdownTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#3B82F6"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'arap' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Receivable Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">Account Receivable</h3>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mb-4">Outstanding invoices</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Open invoices</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Outstanding Balance</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">$68,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Avg Days Outstanding</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">18.2</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{width: '62%', backgroundColor: '#3AD6F2'}}></div>
                  </div>
                  <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-2">62% collected for current period</p>
                </div>
              </div>

              {/* Account Payable Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">Account Payable</h3>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mb-4">Outstanding Payable</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Opens Bill</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">27</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Outstanding Payable</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">$24,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Average Days to Pay</span>
                    <span className="text-sm font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">12.7</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{width: '54%', backgroundColor: '#3AD6F2'}}></div>
                  </div>
                  <p className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mt-2">54% Paid For Current Period</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Engagement Funnel Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Client Engagement Funnel</h4>
            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Lead conversion and client journey</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {clientEngagementData.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.stage}</div>
                <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{item.value} {item.percentage}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                <div 
                  className="h-3 rounded-full"
                  style={{width: `${item.percentage}%`, backgroundColor: '#3AD6F2'}}
                >
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-orange-50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Conversion Rate</div>
              <div className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">48%</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Avg. Response Time</div>
              <div className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">2.4h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance Leaderboard Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro] text-[18px]">Staff Performance Leaderboard</h4>
            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Top performer this month</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { rank: 1, name: 'Sarah J', tasks: 45, avgDays: 1.5, revenue: 12000, percentage: 94 },
            { rank: 2, name: 'Mike R', tasks: 35, avgDays: 1.6, revenue: 11000, percentage: 91 },
            { rank: 3, name: 'John J', tasks: 42, avgDays: 1.5, revenue: 10000, percentage: 87 },
            { rank: 4, name: 'Raul J', tasks: 46, avgDays: 2.5, revenue: 9000, percentage: 83 }
          ].map((staff, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FEF3C7] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#FBBF24]">{staff.rank}</span>
                </div>
                <div>
                  <div className="font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{staff.name}</div>
                  <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">{staff.tasks} Task. {staff.avgDays} days Avg</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#3B4A66] font-[BasisGrotesquePro]">${staff.revenue.toLocaleString()}</div>
                <div className="text-sm text-green-600 font-[BasisGrotesquePro]">{staff.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Preparers Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="mb-4">
          <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Top Prepares (This Month)</h4>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Alex R', returns: 58, revenue: 21000 },
            { name: 'Priya S', returns: 52, revenue: 19800 },
            { name: 'Alex R', returns: 47, revenue: 18200 }
          ].map((preparer, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <div className="font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{preparer.name}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">{preparer.returns} Returns</div>
                  <div className="font-bold text-[#3B4A66] font-[BasisGrotesquePro]">${preparer.revenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance & Risk Status Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Compliance & Risk Status</h4>
            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Current compliance metrics & alerts summary</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {complianceData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.status}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.score}</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.badge === 'Low' ? 'bg-blue-100 text-blue-800' :
                    item.badge === 'Medium' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.badge}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="h-4 rounded-full"
                  style={{width: `${item.percentage}%`, backgroundColor: '#3AD6F2'}}
                >
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">KPA Completion Rate</div>
                  <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">76%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{width: '76%', backgroundColor: '#3AD6F2'}}></div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Flagged Returns (Active)</div>
                  <div className="text-2xl font-bold text-red-600 font-[BasisGrotesquePro]">9</div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Overall compliance Score</div>
                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">82%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full" style={{width: '82%', backgroundColor: '#3AD6F2'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status Section */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <div className="mb-6">
          <h4 className="text-[18px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">Subscription Status</h4>
          <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Your current plan and usage details</p>
        </div>
        
        <div className="bg-[#F3F7FF] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Current Plan</div>
                <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">Professional</div>
              </div>
              <div>
                <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Current Plan</div>
                <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">$299</div>
              </div>
              <div>
                <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Next Billing</div>
                <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">Mar 15, 2024</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border border-[#dee2e6] text-[#343a40] rounded text-sm font-[BasisGrotesquePro] hover:bg-gray-50">
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
