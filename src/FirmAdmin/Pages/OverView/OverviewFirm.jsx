import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DolersIcon, DoublesIcon, FilessIcon, WatchesIcon, ChecksIcon, Checks2Icon, DownsIcon, SceheIcon, CrossesIcon } from "../../Components/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { firmAdminDashboardAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { getApiBaseUrl, fetchWithCors } from '../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken, getStorage } from '../../../ClientOnboarding/utils/userUtils';
import { toast } from 'react-toastify';
import { useFirmSettings } from '../../Context/FirmSettingsContext';
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

// Helper function to get revenue data from API
const getRevenueData = (dashboardData) => {
  if (!dashboardData?.revenue_analytics?.trend?.data) {
    return [];
  }
  return dashboardData.revenue_analytics.trend.data;
};

// Helper function to get client engagement data from API
const getClientEngagementData = (dashboardData) => {
  if (!dashboardData?.client_engagement?.funnel) {
    return [];
  }
  return dashboardData.client_engagement.funnel;
};

// Helper function to get compliance data from API
const getComplianceData = (dashboardData) => {
  if (!dashboardData?.compliance_risk?.statuses) {
    return [];
  }
  return dashboardData.compliance_risk.statuses.map(item => ({
    status: item.status,
    score: item.score_display,
    percentage: item.percentage,
    badge: item.risk_level === 'low' ? 'Low' : item.risk_level === 'medium' ? 'Medium' : 'High'
  }));
};

// Helper function to get breakdown data from API
const getBreakdownData = (dashboardData) => {
  if (!dashboardData?.revenue_analytics?.breakdown?.data) {
    return [];
  }
  return dashboardData.revenue_analytics.breakdown.data;
};

export default function FirmAdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { advancedReportingEnabled } = useFirmSettings();
  const [activeTab, setActiveTab] = useState('trend');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshEnabled, setRefreshEnabled] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [selectedDateRange, setSelectedDateRange] = useState('Last 30 days');
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
  const [recipients, setRecipients] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for chart sections to capture as images
  const revenueChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const complianceChartRef = useRef(null);

  // Handle date range apply
  const handleApplyDateRange = () => {
    setDateRange(selectedDateRange);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Map date range to API format
        const dateRangeMap = {
          'Last 7 days': '7d',
          'Last 30 days': '30d',
          'Last 90 days': '90d',
          'Last 6 months': '6m',
          'Last year': '1y'
        };

        const apiDateRange = dateRangeMap[dateRange] || '30d';
        const response = await firmAdminDashboardAPI.getDashboard({
          date_range: apiDateRange,
          period: 'monthly',
          recent_clients_limit: 10
        });
        // Extract data from response if it's wrapped in a 'data' property
        setDashboardData(response?.data || response);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(handleAPIError(err));
        toast.error(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  // Handle subscription success redirect
  useEffect(() => {
    const subscriptionSuccess = searchParams.get('subscription_success');
    const subscriptionCancelled = searchParams.get('subscription_cancelled');

    if (subscriptionSuccess === 'true') {
      // Remove the query parameter first to prevent infinite loop
      setSearchParams({});
      
      // Show success message
      toast.success('Subscription activated successfully! Welcome to your dashboard.', {
        position: 'top-right',
        autoClose: 5000,
      });

      // Refresh user data to get updated subscription info
      const storage = getStorage();
      const userDataStr = storage?.getItem("userData");
      if (userDataStr) {
        try {
          // Fetch updated user data from API
          const token = getAccessToken();
          if (token) {
            fetchWithCors(`${getApiBaseUrl()}/user/me/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            })
              .then(response => response.json())
              .then(result => {
                if (result.success && result.data) {
                  const userData = result.data;
                  storage.setItem("userData", JSON.stringify(userData));
                  sessionStorage.setItem("userData", JSON.stringify(userData));
                  // Refetch dashboard data instead of full page reload
                  // Trigger a refetch by updating dateRange (which will trigger the fetchDashboardData useEffect)
                  // Or just reload the page after removing the query parameter
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                }
              })
              .catch(err => {
                console.error('Error fetching user data:', err);
              });
          }
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      }
    } else if (subscriptionCancelled === 'true') {
      // Show cancellation message
      toast.info('Subscription setup was cancelled. Please complete your subscription to access all features.', {
        position: 'top-right',
        autoClose: 5000,
      });
      // Remove parameter and redirect to finalize subscription
      setSearchParams({});
      navigate('/firmadmin/finalize-subscription', { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  // Export Dashboard Report to PDF
  const exportDashboardToPDF = async () => {
    try {
      if (!dashboardData) {
        toast.error('No dashboard data available to export');
        return;
      }

      toast.info('Generating PDF with charts...', { autoClose: 2000 });

      // Get data from dashboard using helper functions
      const revenueData = getRevenueData(dashboardData);
      const breakdownData = getBreakdownData(dashboardData);
      const clientEngagementData = getClientEngagementData(dashboardData);
      const complianceData = getComplianceData(dashboardData);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to capture chart as image
      const captureChartAsImage = async (ref) => {
        if (!ref?.current) return null;
        try {
          const canvas = await html2canvas(ref.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
          });
          return canvas.toDataURL('image/png');
        } catch (error) {
          console.error('Error capturing chart:', error);
          return null;
        }
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Firm Admin Dashboard Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Report Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;
      doc.text(`Date Range: ${dateRange}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Key Metrics Summary
      if (dashboardData?.key_metrics) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Key Metrics", 14, yPosition);
        yPosition += 8;

        const keyMetrics = [
          ['Total Revenue', `$${dashboardData.key_metrics.revenue?.current?.toLocaleString() || 0}`],
          ['Active Clients', dashboardData.key_metrics.clients?.current || 0],
          ['Tasks Completed', dashboardData.key_metrics.tasks?.current || 0],
          ['Documents', dashboardData.key_metrics.documents?.current || 0]
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Metric", "Value"]],
          body: keyMetrics,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Revenue Analytics Section with Chart
      if (widgetVisibility.Revenue && revenueData && revenueData.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Revenue Analytics", 14, yPosition);
        yPosition += 8;

        // Add Revenue Chart Image
        const revenueChartImage = await captureChartAsImage(revenueChartRef);
        if (revenueChartImage) {
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
          }
          const imgWidth = pageWidth - 28;
          const imgHeight = (imgWidth * 0.4); // Maintain aspect ratio
          doc.addImage(revenueChartImage, 'PNG', 14, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }

        // Revenue Summary Table
        const revenueSummary = revenueData.map(item => [
          item.month || 'N/A',
          `$${(item.revenue || 0).toLocaleString()}`,
          `$${(item.target || 0).toLocaleString()}`
        ]);

        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [["Month", "Revenue", "Target"]],
          body: revenueSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Revenue Breakdown
      if (breakdownData && breakdownData.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Revenue Breakdown by Category", 14, yPosition);
        yPosition += 8;

        const breakdownSummary = breakdownData.map(item => [
          item.category || 'N/A',
          `$${(item.amount || 0).toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Category", "Amount"]],
          body: breakdownSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Client Engagement Funnel Section with Chart
      if (widgetVisibility.Engagement && clientEngagementData && clientEngagementData.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Client Engagement Funnel", 14, yPosition);
        yPosition += 8;

        // Add Client Engagement Chart Image
        const engagementChartImage = await captureChartAsImage(engagementChartRef);
        if (engagementChartImage) {
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
          }
          const imgWidth = pageWidth - 28;
          const imgHeight = (imgWidth * 0.5); // Maintain aspect ratio
          doc.addImage(engagementChartImage, 'PNG', 14, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }

        // Engagement Summary Table
        const engagementSummary = clientEngagementData.map(item => [
          item.stage || 'N/A',
          `${item.percentage || 0}%`,
          (item.value || 0).toString()
        ]);

        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [["Stage", "Percentage", "Value"]],
          body: engagementSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Staff Performance
      if (dashboardData?.staff_performance?.leaderboard && dashboardData.staff_performance.leaderboard.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Staff Performance Leaderboard", 14, yPosition);
        yPosition += 8;

        const staffSummary = dashboardData.staff_performance.leaderboard.map(staff => [
          staff.name || 'N/A',
          `$${(staff.revenue || 0).toLocaleString()}`,
          `${staff.performance_percentage || 0}%`,
          `${staff.tasks_completed || 0} tasks`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Staff", "Revenue", "Performance", "Tasks"]],
          body: staffSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Top Preparers
      if (dashboardData?.top_preparers?.data && dashboardData.top_preparers.data.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Top Preparers (This Month)", 14, yPosition);
        yPosition += 8;

        const preparersSummary = dashboardData.top_preparers.data.map(preparer => [
          preparer.name || 'N/A',
          `${preparer.returns || 0} Returns`,
          `$${(preparer.revenue || 0).toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Preparer", "Returns", "Revenue"]],
          body: preparersSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Compliance & Risk Status Section with Chart
      if (widgetVisibility.Compliance && complianceData && complianceData.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Compliance & Risk Status", 14, yPosition);
        yPosition += 8;

        // Add Compliance Chart Image
        const complianceChartImage = await captureChartAsImage(complianceChartRef);
        if (complianceChartImage) {
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
          }
          const imgWidth = pageWidth - 28;
          const imgHeight = (imgWidth * 0.5); // Maintain aspect ratio
          doc.addImage(complianceChartImage, 'PNG', 14, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }

        // Compliance Summary Table
        const complianceSummary = complianceData.map(item => [
          item.status || 'N/A',
          item.score || 'N/A',
          item.badge || 'N/A'
        ]);

        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [["Status", "Score", "Risk Level"]],
          body: complianceSummary,
          theme: "grid",
          headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 2 },
          margin: { left: 14, right: 14 }
        });
      }

      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open PDF in new window first
      const newWindow = window.open(pdfUrl, '_blank');

      // Wait a moment for the window to open, then trigger download
      setTimeout(() => {
        const fileName = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 100);

        toast.success('Report generated and downloaded successfully!');
      }, 500);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Error generating PDF: ${error.message}`);
    }
  };

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const revenueValue = payload[0]?.value || 0;

      return (
        <div className="bg-white rounded-lg  p-3 border border-blue-200" style={{ minWidth: '140px' }}>
          <div className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>{label}</div>
          <div className="text-sm" style={{ color: '#3AD6F2' }}>
            Revenue : ${revenueValue.toLocaleString()}
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
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200" style={{ minWidth: '120px' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>{label}</div>
          <div className="text-sm" style={{ color: '#3AD6F2' }}>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-32">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[70vh] overflow-y-auto mt-[100px]">

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Auto Refresh Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Auto Refresh</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${autoRefresh ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform !rounded-full bg-white shadow-lg transition-transform ${autoRefresh ? 'translate-x-8' : 'translate-x-1'
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
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full text-sm !border border-gray-300 !rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                >
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 90 days">Last 90 days</option>
                  <option value="Last 6 months">Last 6 months</option>
                  <option value="Last year">Last year</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => {
                  handleApplyDateRange();
                  setIsCustomizeModalOpen(false);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro] transition-colors"
              >
                Apply Date Range
              </button>
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
                        className={`relative inline-flex h-9 w-16 items-center !rounded-full transition-colors mr-6 ${widgetVisibility[widget] !== false ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`inline-block h-7 w-7 transform !rounded-full bg-white shadow-lg transition-transform ${widgetVisibility[widget] !== false ? 'translate-x-8' : 'translate-x-1'
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

  // Handle schedule report submission
  const handleScheduleReport = async () => {
    // Validate inputs
    if (!recipients || !recipients.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Parse email addresses (comma-separated or single)
    const emailList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emailList.length === 0) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate email format - simple validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format. Please check and try again.`);
      return;
    }

    // Map frequency to API format (lowercase)
    const frequencyMap = {
      'Daily': 'daily',
      'Weekly': 'weekly',
      'Monthly': 'monthly',
      'Quarterly': 'quarterly'
    };

    const apiFrequency = frequencyMap[scheduleFrequency] || 'weekly';

    try {
      setScheduleLoading(true);

      const token = getAccessToken();
      const API_BASE_URL = getApiBaseUrl();
      const url = `${API_BASE_URL}/firm/reports/generate/`;

      const payload = {
        frequency: apiFrequency,
        recipient_emails: emailList
      };

      const response = await fetchWithCors(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Report generation task has been queued successfully');
        setIsScheduleModalOpen(false);
        // Reset form
        setRecipients('');
        setScheduleFrequency('Weekly');
      } else {
        throw new Error(result.message || 'Failed to schedule report');
      }
    } catch (err) {
      console.error('Error scheduling report:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to schedule report. Please try again.');
    } finally {
      setScheduleLoading(false);
    }
  };

  // ScheduleModal Component
  const ScheduleModal = () => {
    if (!isScheduleModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-[BasisGrotesquePro]">Schedule Dashboard Report</h3>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Email a recurring dashboard summary to admins.</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={scheduleLoading}
                className="w-8 h-8 rounded-full  flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50"
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
                  disabled={scheduleLoading}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="text-sm font-medium text-gray-800 font-[BasisGrotesquePro]">Email</label>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                disabled={scheduleLoading}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-[BasisGrotesquePro] focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
                autoComplete="email"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">Enter email address (or multiple addresses separated by commas)</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={scheduleLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleReport}
              disabled={scheduleLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {scheduleLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // RevenueModal Component - Fullscreen chart view
  const RevenueModal = () => {
    if (!isRevenueModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 font-[BasisGrotesquePro]">Revenue Analytics</h3>
                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Your revenue contribution and trends</p>
              </div>
              <button
                onClick={() => setIsRevenueModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <CrossesIcon />
              </button>
            </div>
          </div>

          {/* Modal Content - Large Chart */}
          <div className="p-6 flex-1 overflow-auto">
            <div className="h-[calc(90vh-180px)] min-h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading revenue data...</div>
                </div>
              ) : getRevenueData(dashboardData)?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getRevenueData(dashboardData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 14, fill: '#6B7280', fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 14, fill: '#6B7280', fontWeight: 500 }}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3AD6F2"
                      strokeWidth={4}
                      dot={{ fill: '#3AD6F2', stroke: '#3AD6F2', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 9, stroke: '#3AD6F2', strokeWidth: 2, fill: '#3AD6F2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">No revenue data available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CustomizeModal />
      <ScheduleModal />
      <RevenueModal />
      <div className="w-full px-2 py-6 bg-[#F6F7FF] min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 max-md:flex-col max-md:gap-3">
  
  {/* Left Section */}
  <div className="flex-1 min-w-0 pr-4 xl:pr-2 max-md:pr-0">
    <h4 className="text-[16px] font-bold text-[#3B4A66] font-[BasisGrotesquePro] whitespace-nowrap">
      Firm Dashboard
    </h4>
    <p className="text-[#6B7280] mt-1 font-[BasisGrotesquePro] text-[10px] xl:text-base leading-tight">
      Welcome Back
    </p>
  </div>

  {/* Right Section */}
  <div className="flex items-center gap-1 xl:gap-3 flex-shrink-0 mt-1 
                  max-md:w-full max-md:flex-wrap max-md:gap-2">

    {/* Date Range */}
    <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] 
                    !rounded-[7px] px-2 xl:px-3 py-1 xl:py-2
                    max-md:w-full max-md:justify-between">
      
      <label className="text-[10px] xl:text-xs text-[#6B7280] font-[BasisGrotesquePro] whitespace-nowrap">
        Date Range:
      </label>

      <div className="relative flex-1 max-md:max-w-[140px]">
        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="text-[10px] xl:text-sm text-[#3B4A66] font-[BasisGrotesquePro]
                     bg-transparent border-none focus:outline-none cursor-pointer
                     appearance-none pr-6 w-full"
        >
          <option value="Last 7 days">Last 7 days</option>
          <option value="Last 30 days">Last 30 days</option>
          <option value="Last 90 days">Last 90 days</option>
          <option value="Last 6 months">Last 6 months</option>
          <option value="Last year">Last year</option>
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-1">
          <svg className="w-3 h-3 xl:w-4 xl:h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <button
        onClick={handleApplyDateRange}
        disabled={selectedDateRange === dateRange}
        className="px-2 xl:px-3 py-1 text-[10px] xl:text-sm font-medium
                   font-[BasisGrotesquePro] bg-[#3B4A66] text-white
                   !rounded-[5px] hover:bg-[#2d3a52]
                   disabled:opacity-50 whitespace-nowrap"
      >
        Apply
      </button>
    </div>

    {!advancedReportingEnabled && (
      <button
        onClick={exportDashboardToPDF}
        className="px-2 xl:px-4 py-1 xl:py-2 text-[#3B4A66] bg-white
                   border border-[#E5E7EB] !rounded-[7px]
                   text-[10px] xl:text-sm font-medium font-[BasisGrotesquePro]
                   hover:bg-gray-50 whitespace-nowrap flex items-center gap-1
                   max-md:flex-1 max-md:justify-center"
      >
        <DownsIcon />
        Export
      </button>
    )}

    <button
      onClick={() => setIsScheduleModalOpen(true)}
      className="px-2 xl:px-4 py-1 xl:py-2 text-[#3B4A66] bg-white
                 border border-[#E5E7EB] !rounded-[7px]
                 text-[10px] xl:text-sm font-medium font-[BasisGrotesquePro]
                 hover:bg-gray-50 whitespace-nowrap flex items-center gap-1
                 max-md:flex-1 max-md:justify-center"
    >
      <SceheIcon />
      Schedule
    </button>
  </div>
</div>


      

        {/* Key Metrics Section */}
        {widgetVisibility.Kpi && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 mb-6 w-full">
            {/* My Revenue */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 relative min-w-0">
              <div className="absolute top-3 right-3">
                <DolersIcon />
              </div>
              <div className="mb-3">
                <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{ fontSize: '15px' }}>My Revenue</h3>
                <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                  {loading ? '...' : (dashboardData?.key_metrics?.revenue?.formatted || '$0')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {dashboardData?.key_metrics?.revenue?.change_type === 'increase' ? <ChecksIcon /> : <Checks2Icon />}
                  <p className="text-xs text-black font-[BasisGrotesquePro]">
                    {loading ? '...' : dashboardData?.key_metrics?.revenue?.percentage_change
                      ? `${dashboardData.key_metrics.revenue.percentage_change > 0 ? '+' : ''}${dashboardData.key_metrics.revenue.percentage_change}% vs last month`
                      : 'No change'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#6B7280]">
                  <span>Target {dashboardData?.key_metrics?.revenue?.target ? `$${dashboardData.key_metrics.revenue.target.toLocaleString()}` : '$0'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#3AD6F2] h-2 rounded-full"
                    style={{
                      width: dashboardData?.key_metrics?.revenue?.target
                        ? `${Math.min((dashboardData.key_metrics.revenue.current / dashboardData.key_metrics.revenue.target) * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      ${dashboardData?.key_metrics?.revenue?.breakdown?.prep_fees?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Prep Fees</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      ${dashboardData?.key_metrics?.revenue?.breakdown?.add_ons?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Add Ons</div>
                  </div> */}
                  {/* <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      ${dashboardData?.key_metrics?.revenue?.breakdown?.training?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Training</div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* My Clients */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 relative min-w-0">
              <div className="absolute top-3 right-3">
                <DoublesIcon />
              </div>
              <div className="mb-3">
                <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{ fontSize: '15px' }}>My Clients</h3>
                <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                  {loading ? '...' : (dashboardData?.key_metrics?.clients?.current || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {dashboardData?.key_metrics?.clients?.change_type === 'increase' ? <ChecksIcon /> : <Checks2Icon />}
                  <p className="text-xs text-black font-[BasisGrotesquePro]">
                    {loading ? '...' : dashboardData?.key_metrics?.clients?.percentage_change
                      ? `${dashboardData.key_metrics.clients.percentage_change > 0 ? '+' : ''}${dashboardData.key_metrics.clients.percentage_change} this month`
                      : 'No change'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#6B7280]">
                  <span>Target {dashboardData?.key_metrics?.clients?.target || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#3AD6F2] h-2 rounded-full"
                    style={{
                      width: dashboardData?.key_metrics?.clients?.target
                        ? `${Math.min((dashboardData.key_metrics.clients.current / dashboardData.key_metrics.clients.target) * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
               
              </div>
            </div>

            {/* My Tasks */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 relative min-w-0">
              <div className="absolute top-3 right-3">
                <FilessIcon />
              </div>
              <div className="mb-3">
                <h3 className="text-xs font-medium text-[#6B7280] font-[BasisGrotesquePro]" style={{ fontSize: '15px' }}>My Tasks</h3>
                <p className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                  {loading ? '...' : (dashboardData?.key_metrics?.tasks?.current || 0)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {dashboardData?.key_metrics?.tasks?.change_type === 'increase' || (dashboardData?.key_metrics?.tasks?.percentage_change && dashboardData.key_metrics.tasks.percentage_change > 0) ? <ChecksIcon /> : <Checks2Icon />}
                  <p className="text-xs text-black font-[BasisGrotesquePro]">
                    {loading ? '...' : dashboardData?.key_metrics?.tasks?.percentage_change
                      ? `${dashboardData.key_metrics.tasks.percentage_change > 0 ? '+' : ''}${dashboardData.key_metrics.tasks.percentage_change} vs Last Month`
                      : 'No change'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#6B7280]">
                  <span>Target {dashboardData?.key_metrics?.tasks?.target || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#3AD6F2] h-2 rounded-full"
                    style={{
                      width: dashboardData?.key_metrics?.tasks?.target
                        ? `${Math.min((dashboardData.key_metrics.tasks.current / dashboardData.key_metrics.tasks.target) * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      {dashboardData?.key_metrics?.tasks?.breakdown?.tax_prep || 0}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Tax Prep</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      {dashboardData?.key_metrics?.tasks?.breakdown?.review || 0}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Review</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                      {dashboardData?.key_metrics?.tasks?.breakdown?.followups || 0}
                    </div>
                    <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Followups</div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Analytics Section */}
        {widgetVisibility.Revenue && (
          <div ref={revenueChartRef} className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Revenue Analytics</h2>
                  <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Your revenue contribution and trends</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2">
                    <option>Monthly</option>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </select>

                  <button 
                    onClick={() => setIsRevenueModalOpen(true)}
                    className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg font-[BasisGrotesquePro] hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>


            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getRevenueData(dashboardData)}>
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
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3AD6F2"
                    strokeWidth={3}
                    dot={{ fill: '#3AD6F2', stroke: '#3AD6F2', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#3AD6F2', strokeWidth: 2, fill: '#3AD6F2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Client Engagement Funnel Section */}
        {widgetVisibility.Engagement && (
          <div ref={engagementChartRef} className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Client Engagement Funnel</h2>
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
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading engagement data...</div>
              ) : getClientEngagementData(dashboardData).length > 0 ? (
                getClientEngagementData(dashboardData).map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.stage}</div>
                      <div className="text-sm text-[#3B4A66] font-[BasisGrotesquePro]">{item.value} {item.percentage}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div
                        className="h-3 rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: '#3AD6F2' }}
                      >
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No engagement data available</div>
              )}
            </div>

            <div className="mt-6 bg-orange-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Conversion Rate</div>
                  <div className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                    {loading ? '...' : `${dashboardData?.client_engagement?.metrics?.conversion_rate || 0}%`}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Avg. Response Time</div>
                  <div className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro]">
                    {loading ? '...' : `${dashboardData?.client_engagement?.metrics?.avg_response_time || 0}${dashboardData?.client_engagement?.metrics?.avg_response_time_unit || 'h'}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Performance Leaderboard Section */}
        {widgetVisibility.Staff && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Staff Performance Leaderboard</h2>
                <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Top performer this month</p>
              </div>
              <div className="flex items-center gap-2">
                {/* <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button> */}
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading staff performance...</div>
              ) : dashboardData?.staff_performance?.leaderboard?.length > 0 ? (
                dashboardData.staff_performance.leaderboard.map((staff, index) => (
                  <div key={staff.staff_id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FEF3C7] rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-[#FBBF24]">{staff.rank}</span>
                      </div>
                      <div>
                        <div className="font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{staff.name}</div>
                        <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">{staff.tasks_completed} Task. {staff.avg_days} days Avg</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#3B4A66] font-[BasisGrotesquePro]">${staff.revenue?.toLocaleString() || '0'}</div>
                      {/* <div className="text-sm text-green-600 font-[BasisGrotesquePro]">{staff.performance_percentage}%</div> */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No staff performance data available</div>
              )}
            </div>
          </div>
        )}

        {/* Top Preparers Section */}
        {widgetVisibility.Performance && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Top Prepares (This Month)</h2>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading top preparers...</div>
              ) : dashboardData?.top_preparers?.data?.length > 0 ? (
                dashboardData.top_preparers.data.map((preparer, index) => (
                  <div key={preparer.preparer_id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{preparer.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">{preparer.returns} Returns</div>
                        <div className="font-bold text-[#3B4A66] font-[BasisGrotesquePro]">${preparer.revenue?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No preparer data available</div>
              )}
            </div>
          </div>
        )}

        {/* Compliance & Risk Status Section */}
        {widgetVisibility.Compliance && (
          <div ref={complianceChartRef} className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Compliance & Risk Status</h2>
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
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading compliance data...</div>
              ) : getComplianceData(dashboardData).length > 0 ? (
                getComplianceData(dashboardData).map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.status}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.score}</div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${item.badge === 'Low' ? 'bg-blue-100 text-blue-800' :
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
                        style={{ width: `${item.percentage}%`, backgroundColor: '#3AD6F2' }}
                      >
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No compliance data available</div>
              )}

              {dashboardData?.compliance_risk?.metrics && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">KPA Completion Rate</div>
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                          {dashboardData.compliance_risk.metrics.kpa_completion_rate || 0}%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${dashboardData.compliance_risk.metrics.kpa_completion_rate || 0}%`,
                            backgroundColor: '#3AD6F2'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Flagged Returns (Active)</div>
                        <div className="text-2xl font-bold text-red-600 font-[BasisGrotesquePro]">
                          {dashboardData.compliance_risk.metrics.flagged_returns_active || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">Overall compliance Score</div>
                      <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">
                        {dashboardData.compliance_risk.metrics.overall_compliance_score || 0}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: dashboardData?.key_metrics?.tasks?.target
                            ? `${Math.min((dashboardData.key_metrics.tasks.current / dashboardData.key_metrics.tasks.target) * 100, 100)}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                          {dashboardData?.key_metrics?.tasks?.breakdown?.tax_prep || 0}
                        </div>
                        <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Tax Prep</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                          {dashboardData?.key_metrics?.tasks?.breakdown?.review || 0}
                        </div>
                        <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Review</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#4B5563] font-[BasisGrotesquePro]">
                          {dashboardData?.key_metrics?.tasks?.breakdown?.followups || 0}
                        </div>
                        <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro]">Followups</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Status Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#3B4A66] font-[BasisGrotesquePro] mb-2">Subscription Status</h2>
            <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">Your current plan and usage details</p>
          </div>

          <div className="bg-[#F3F7FF] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div>
                  <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Current Plan</div>
                  <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">
                    {loading ? '...' : (dashboardData?.subscription?.current_plan || 'N/A')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Price</div>
                  <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">
                    {loading ? '...' : (dashboardData?.subscription?.price_formatted || '$0')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#343a40] font-[BasisGrotesquePro] mb-1">Next Billing</div>
                  <div className="text-lg font-semibold text-[#F56D2D] font-[BasisGrotesquePro]">
                    {loading ? '...' : (dashboardData?.subscription?.next_billing_date_formatted || 'N/A')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/firmadmin/subscription')}
                className="px-4 py-2 bg-white border border-[#dee2e6] text-[#343a40] rounded text-sm font-[BasisGrotesquePro] hover:bg-gray-50"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </div >
    </>
  );
}
