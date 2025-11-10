import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaUsers, FaClock, FaExclamationTriangle, FaChevronUp, FaChevronDown, FaDownload, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { BlueDollarIcon, BlueUserIcon, BlueClockIcon, BlueExclamationTriangleIcon, ActiveIcon, ArrowgreenIcon, ClockgreenIcon, RedDownIcon, Action3Icon, AddSubscriptionPlanIcon } from '../Components/icons';
import EditSubscriptionPlan from './EditSubscriptionPlan';
import AddSubscription from './AddSubscription';
import { superAdminAPI, handleAPIError } from '../utils/superAdminAPI';

export default function Subscriptions() {
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showAddPlan, setshowAddPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Solo');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [barTooltipTimeout, setBarTooltipTimeout] = useState(null);

  // API data states
  const [plansData, setPlansData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both plans and chart data in parallel
        const [plansResponse, chartsResponse] = await Promise.all([
          superAdminAPI.getSubscriptionPlans(),
          superAdminAPI.getSubscriptionCharts('revenue', 30)
        ]);

        setPlansData(plansResponse.data);
        setChartData(chartsResponse.data);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // If edit plan is open, show the edit plan screen
  if (showEditPlan) {
    return (
      <EditSubscriptionPlan
        planType={selectedPlan}
        onClose={() => setShowEditPlan(false)}
      />
    );
  }

  // If add plan is open, show the add plan screen
  if (showAddPlan) {
    return (
      <AddSubscription
        planType="Solo"
        onClose={() => setshowAddPlan(false)}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="taxdashboardr-titler font-bold mb-2" style={{ color: '#3B4A66' }}>Subscription & Billing Management</h3>
          <p style={{ color: '#3B4A66' }}>Monitor and manage all platform subscriptions</p>
        </div>
        <div className="flex gap-3">
          <button className="px-2 py-1 text-[10px] bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center" style={{ borderRadius: '7px', }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25" stroke="#4B5563" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            Export Report
          </button>
          <button
            onClick={() => {
              setshowAddPlan(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-[10px] text-white transition-colors"
            style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}
          >
            <AddSubscriptionPlanIcon className="text-sm" />
            Add Subscription Plan
          </button>
          <button
            onClick={() => {
              setSelectedPlan('Solo');
              setShowEditPlan(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-[10px] text-white transition-colors"
            style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e55a2b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#F56D2D'}
          >
            <FaEdit className="text-sm" />
            Edit Plan
          </button>
        </div>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Total Revenue</p>
              <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
                {plansData?.formatted_total_revenue || '$0.00'}
              </p>
              <div className="flex items-center gap-1">
                <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                  +{plansData?.average_growth || '0'}%
                </span>

              </div>
            </div>

            <BlueDollarIcon className="text-lg" />

          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Active Subscriptions</p>
              <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
                {plansData?.plans?.reduce((total, plan) => total + plan.total_subscribers, 0) || 0}
              </p>
              <div className="flex items-center gap-1">
                <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                  +{plansData?.average_growth || '0'}%
                </span>

              </div>
            </div>
            <BlueUserIcon className="text-lg" />
          </div>
        </div>

        {/* Trial Subscriptions */}
        <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Most Popular Plan</p>
              <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
                {plansData?.most_popular_plan?.charAt(0).toUpperCase() + plansData?.most_popular_plan?.slice(1) || 'N/A'}
              </p>
              <div className="flex items-center gap-1">
                <ClockgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>Top performer</span>

              </div>
            </div>
            <BlueClockIcon className="text-lg" />
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: '#3B4A66' }}>Average Growth</p>
              <p className="text-xl font-bold mb-1" style={{ color: '#3B4A66' }}>
                {plansData?.average_growth || '0'}%
              </p>
              <div className="flex items-center gap-1">
                <ArrowgreenIcon className="text-xs" style={{ color: '#10B981' }} />
                <span className="text-xs font-medium" style={{ color: '#10B981' }}>Monthly</span>

              </div>
            </div>
            <BlueExclamationTriangleIcon className="text-lg" />
          </div>
        </div>
      </div>

      {/* Plan and Alerts Section */}
      <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: '60% 35%' }}>
        {/* Plan Section */}
        <div className='bg-white p-3' style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-center mb-3 ">
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#3B4A66' }}>Plan</h3>
              <p className="text-sm" style={{ color: '#3B4A66' }}>Revenue and growth metrics by subscription plan</p>
            </div>
          </div>

          <div className="space-y-2">
            {plansData?.plans?.map((plan) => {
              const getPlanColor = (planType) => {
                switch (planType) {
                  case 'solo': return 'bg-[#FBBF24]';
                  case 'team': return 'bg-green-500';
                  case 'professional': return 'bg-[#1E40AF]';
                  case 'enterprise': return 'bg-[#CEC6FF]';
                  default: return 'bg-gray-500';
                }
              };

              return (
                <div
                  key={plan.id}
                  className="bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
                  onClick={() => {
                    setSelectedPlan(plan.plan_display);
                    setShowEditPlan(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className={`${getPlanColor(plan.plan_type)} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {plan.plan_display}
                      </span>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#3B4A66', fontWeight: '800' }}>
                          {plan.total_subscribers} subscribers
                        </p>
                        <div className='flex flex-row gap-2'>
                          <p className="text-xs" style={{ color: '#3B4A66' }}>
                            {plan.formatted_revenue} revenue.
                          </p>
                          <p className="text-xs" style={{ color: '#3B4A66' }}>
                            {plan.formatted_growth} growth
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1" style={{ color: '#3B4A66' }}>
                        {plan.formatted_price}/month
                      </p>
                      <p className="text-xs" style={{ color: '#3B4A66' }}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className='bg-white p-3' style={{ border: '1px solid #E8F0FF', borderRadius: '7px', height: 'fit-content' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#3B4A66' }}>Alerts & Notifications</h3>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#3B4A66' }}>Email Notifications</p>
                  <p className="text-xs" style={{ color: '#3B4A66' }}>Send email when  <br /> subscription events occur</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className="relative inline-flex h-6 w-11 items-center transition-colors"
                  style={{
                    borderRadius: '20px',
                    backgroundColor: emailNotifications ? '#F56D2D' : '#D1D5DB'
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: emailNotifications ? 'translateX(24px)' : 'translateX(4px)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* SMS Alerts */}
            <div className="bg-white p-4" >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#3B4A66' }}>SMS Alerts</p>
                  <p className="text-xs" style={{ color: '#3B4A66' }}>Optional SMS notifications</p>
                </div>
                <button
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className="relative inline-flex h-6 w-11 items-center transition-colors"
                  style={{
                    borderRadius: '20px',
                    backgroundColor: smsAlerts ? '#F56D2D' : '#D1D5DB'
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: smsAlerts ? 'translateX(24px)' : 'translateX(4px)'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Performance Section */}
      <div className="mb-8 bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#3B4A66' }}>Plan Performance</h3>
        <p className="text-xs mb-6" style={{ color: '#3B4A66' }}>MRR, churn, and plan distribution</p>

        <div className="grid grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white p-6" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
            <div className="h-64 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 ml-8">
                {/* Horizontal grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-dashed opacity-30"
                    style={{
                      top: `${i * 25}%`,
                      borderColor: '#E5E7EB',
                      height: '1px'
                    }}
                  />
                ))}
                {/* Vertical grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="absolute h-full border-l border-dashed opacity-30"
                    style={{
                      left: `${(i * 100) / 5}%`,
                      borderColor: '#E5E7EB',
                      width: '1px'
                    }}
                  />
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs" style={{ color: '#3B4A66' }}>
                {(() => {
                  if (chartData?.datasets?.[0]?.data) {
                    const data = chartData.datasets[0].data;
                    const maxValue = Math.max(...data);
                    const minValue = Math.min(...data);
                    const range = maxValue - minValue || 1;
                    const step = range / 4;

                    return [4, 3, 2, 1, 0].map(i => {
                      const value = minValue + (step * i);
                      return <span key={i}>{Math.round(value).toLocaleString()}</span>;
                    });
                  }
                  return [28000, 21000, 14000, 7000, 0].map((value, i) => (
                    <span key={i}>{value.toLocaleString()}</span>
                  ));
                })()}
              </div>

              {/* Chart area */}
              <div className="ml-8 h-full flex items-end justify-between px-4 pb-4 relative">
                {/* Chart lines and points */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
                  {chartData?.datasets?.[0]?.data && (() => {
                    const data = chartData.datasets[0].data;
                    const maxValue = Math.max(...data);
                    const minValue = Math.min(...data);
                    const range = maxValue - minValue || 1;
                    const chartHeight = 200;
                    const chartWidth = 400;
                    const pointSpacing = chartWidth / (data.length - 1);

                    // Create path for the line
                    const pathData = data.map((value, index) => {
                      const x = index * pointSpacing + 16;
                      const y = chartHeight - ((value - minValue) / range) * chartHeight;
                      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        {/* Revenue line */}
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#4CAF50"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points */}
                        {data.map((value, index) => {
                          const x = index * pointSpacing + 16;
                          const y = chartHeight - ((value - minValue) / range) * chartHeight;
                          const date = chartData.labels?.[index] ? new Date(chartData.labels[index]) : null;
                          const formattedDate = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`;

                          return (
                            <g key={`point-${index}`}>
                              {/* Invisible larger hover area */}
                              <circle
                                cx={x}
                                cy={y}
                                r="12"
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => {
                                  if (tooltipTimeout) clearTimeout(tooltipTimeout);
                                  setHoveredPoint({
                                    type: 'revenue',
                                    index,
                                    value,
                                    month: formattedDate,
                                    x: x,
                                    y: y
                                  });
                                }}
                                onMouseLeave={() => {
                                  const timeout = setTimeout(() => setHoveredPoint(null), 100);
                                  setTooltipTimeout(timeout);
                                }}
                              />
                              {/* Visible dot */}
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill="white"
                                stroke="#4CAF50"
                                strokeWidth="2"
                              />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                  {chartData?.labels?.slice(0, 6).map((label, index) => {
                    const date = new Date(label);
                    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <span key={index} className="text-xs" style={{ color: '#3B4A66' }}>
                        {formattedDate}
                      </span>
                    );
                  }) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                    <span key={index} className="text-xs" style={{ color: '#3B4A66' }}>{month}</span>
                  ))}
                </div>

                {/* Dynamic Tooltip - shows on hover */}
                {hoveredPoint && (
                  <div
                    className="absolute"
                    style={{
                      left: `${hoveredPoint.x}px`,
                      top: `${hoveredPoint.y - 50}px`,
                      zIndex: 20,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-3 border" style={{ minWidth: '120px' }}>
                      <div className="text-sm font-medium" style={{ color: '#374151' }}>{hoveredPoint.month}</div>
                      <div
                        className="text-sm"
                        style={{ color: hoveredPoint.type === 'green' ? '#4CAF50' : '#FF7043' }}
                      >
                        Value: {hoveredPoint.value.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
            <div className="h-64 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 ml-8">
                {/* Horizontal grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-dashed opacity-30"
                    style={{
                      top: `${i * 25}%`,
                      borderColor: '#E5E7EB',
                      height: '1px'
                    }}
                  />
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs" style={{ color: '#3B4A66' }}>
                {(() => {
                  if (plansData?.plans) {
                    const maxSubscribers = Math.max(...plansData.plans.map(plan => plan.total_subscribers));
                    const step = maxSubscribers / 4;
                    return [4, 3, 2, 1, 0].map(i => {
                      const value = Math.round(step * i);
                      return <span key={i}>{value}</span>;
                    });
                  }
                  return [600, 450, 300, 150, 0].map((value, i) => (
                    <span key={i}>{value}</span>
                  ));
                })()}
              </div>

              {/* Chart area */}
              <div className="ml-8 h-full flex items-end justify-between px-4 pb-4 relative">
                {(() => {
                  if (plansData?.plans) {
                    const maxSubscribers = Math.max(...plansData.plans.map(plan => plan.total_subscribers));
                    return plansData.plans.map((plan, index) => ({
                      label: plan.plan_display,
                      value: plan.total_subscribers,
                      height: (plan.total_subscribers / (maxSubscribers || 1)) * 200
                    }));
                  }
                  return [
                    { label: 'Solo', value: 440, height: (440 / 600) * 200 },
                    { label: 'Team', value: 450, height: (450 / 600) * 200 },
                    { label: 'Professional', value: 240, height: (240 / 600) * 200 },
                    { label: 'Enterprise', value: 35, height: (35 / 600) * 200 }
                  ];
                })().map((item, index) => (
                  <div key={index} className="flex flex-col items-center relative">
                    {/* Invisible larger hover area */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        width: '60px', // Wider hover area
                        height: `${item.height + 20}px`, // Taller hover area
                        zIndex: 10,
                        transform: 'translateX(-50%)'
                      }}
                      onMouseEnter={() => {
                        if (barTooltipTimeout) clearTimeout(barTooltipTimeout);
                        setHoveredBar({
                          label: item.label,
                          value: item.value,
                          x: index * 80 + 40, // Center of the bar area
                          y: 200 - item.height - 20 // Above the bar
                        });
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => setHoveredBar(null), 100);
                        setBarTooltipTimeout(timeout);
                      }}
                    />
                    {/* Visible bar */}
                    <div
                      className="w-12 rounded-t transition-opacity"
                      style={{
                        height: `${item.height}px`,
                        backgroundColor: '#4285F4',
                        opacity: hoveredBar?.label === item.label ? 0.8 : 1
                      }}
                    ></div>
                    <span className="text-xs mt-2" style={{ color: '#3B4A66' }}>{item.label}</span>
                  </div>
                ))}

                {/* Dynamic Bar Tooltip */}
                {hoveredBar && (
                  <div
                    className="absolute"
                    style={{
                      left: `${hoveredBar.x}px`,
                      top: `${hoveredBar.y}px`,
                      zIndex: 20,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-3 border" style={{ minWidth: '100px' }}>
                      <div className="text-sm font-medium" style={{ color: '#374151' }}>{hoveredBar.label}</div>
                      <div className="text-sm" style={{ color: '#4285F4' }}>Firms: {hoveredBar.value}</div>
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div>
        {/* Filter Bar */}
        <div className='mb-4'>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search Firm, Tickets or Users.."
                style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}
                className="w-[400px] pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select className="px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <option>All Plans</option>
              <option>Solo</option>
              <option>Team</option>
              <option>Professional</option>
              <option>Enterprise</option>
            </select>
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold" style={{ color: '#3B4A66' }}>Subscriptions</h3>
              <p className="text-sm" style={{ color: '#3B4A66' }}>Detailed view of all platform subscriptions</p>
            </div>
          </div>

          {/* Table Header */}
          <div className=" px-6 py-3 mb-2">
            <div className="grid grid-cols-7 gap-4 text-sm font-medium" style={{ color: '#3B4A66' }}>
              <div>Firm</div>
              <div>Plan</div>
              <div>Status</div>
              <div>Amount</div>
              <div>Next Billing</div>
              <div>Total Paid</div>
              <div>Actions</div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="bg-white p-4" style={{ border: '1px solid #E0E0E0', borderRadius: '8px' }}>
              <div className="grid grid-cols-7 gap-4 items-center">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#3B4A66' }}>Johnson & Associates</p>
                  <p className="text-xs" style={{ color: '#6C757D' }}>Michael Johnson</p>
                </div>
                <div>
                  <span className="bg-[#1E40AF] text-white px-3 py-1 text-xs font-medium" style={{ borderRadius: '12px' }}>Professional</span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66', fontWeight: '600' }}>$299.00</p>
                  <p className="text-xs" style={{ color: '#6C757D', fontWeight: '600' }}>Monthly</p>
                </div>
                <div>
                  <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{ borderRadius: '12px' }}>Active</span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66' }}>15-01-2025</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66' }}>$2,990.00</p>
                </div>
                <div>
                  <Action3Icon className="text-sm" style={{ color: '#3B4A66' }} />
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="bg-white p-4" style={{ border: '1px solid #E0E0E0', borderRadius: '8px' }}>
              <div className="grid grid-cols-7 gap-4 items-center">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#3B4A66' }}>Metro Tax Services</p>
                  <p className="text-xs" style={{ color: '#6C757D' }}>Michael Johnson</p>
                </div>
                <div>
                  <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{ borderRadius: '12px' }}>Team</span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66', fontWeight: '600' }}>$149.00</p>
                  <p className="text-xs" style={{ color: '#6C757D', fontWeight: '600' }}>Monthly</p>
                </div>
                <div>
                  <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium" style={{ borderRadius: '12px' }}>Active</span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66' }}>12-02-2025</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#3B4A66' }}>$1,490.00</p>
                </div>
                <div>
                  <Action3Icon className="text-sm" style={{ color: '#3B4A66' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
