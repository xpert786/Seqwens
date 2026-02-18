import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl } from '../../ClientOnboarding/utils/corsConfig';
import '../style/EditSubscriptionPlan.css';

export default function EditSubscriptionPlan({ planType, onClose }) {
  const plans = ['Starter', 'Growth', 'Pro', 'Elite'];

  const normalizePlanType = (value) => {
    if (!value) {
      return 'Starter';
    }
    const lowerValue = value.toLowerCase();

    // Explicit mapping for old names
    const mapping = {
      'solo': 'Starter',
      'team': 'Growth',
      'growth': 'Growth',
      'professional': 'Pro',
      'enterprise': 'Elite'
    };

    if (mapping[lowerValue]) {
      return mapping[lowerValue];
    }

    const matchedPlan = plans.find((plan) => plan.toLowerCase() === lowerValue);
    if (matchedPlan) {
      return matchedPlan;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const [activeTab, setActiveTab] = useState(normalizePlanType(planType));
  const [pricing, setPricing] = useState({
    monthly: '',
    yearly: '',
    discount: ''
  });

  const [limits, setLimits] = useState({
    maxUsers: '',
    maxClients: '',
    storage: '',
    eSignatures: '',
    includedOffices: '',
    maxWorkflows: ''
  });

  // New display settings state
  const [displaySettings, setDisplaySettings] = useState({
    displayName: '',
    description: '',
    showOnWebsite: true,
    showPriceOnWebsite: true,
    priceCtaText: 'Contact Sales',
    priceCtaUrl: '',
    showClientLimit: true,
    showUserLimit: true,
    showStorageLimit: true,
    showWorkflowLimit: true,
    showEsignatureLimit: true,
    showOfficeLimit: true,
    publicFeatures: [],
    hiddenFeatures: [],
    displayOrder: 0,
    badgeText: '',
    badgeColor: '',
    isFullyConfigurable: false
  });

  // State for Add-On Pricing
  const [addonsPricing, setAddonsPricing] = useState([]);

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(false);

  useEffect(() => {
    setActiveTab(normalizePlanType(planType));
  }, [planType]);

  // Function to fetch existing plan data
  const fetchPlanData = async (planType) => {
    setFetchingPlan(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/user/subscription-plans/${planType.toLowerCase()}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const planData = result.data;
          const monthly = parseFloat(planData.monthly_price) || 0;
          const discount = parseFloat(planData.discount_percentage_yearly) || 0;
          // Calculate yearly price based on monthly and discount
          const calculatedYearly = monthly > 0 ? (monthly * 12) * (1 - discount / 100) : 0;
          setPricing({
            monthly: monthly,
            yearly: calculatedYearly.toFixed(2),
            discount: discount
          });

          // Handle "Unlimited" values properly
          const parseLimit = (value) => {
            if (value === null || value === undefined) return '';
            const strValue = String(value).toLowerCase();
            if (strValue === 'unlimited' || strValue === '0' || parseInt(strValue) === 0) {
              return 'Unlimited';
            }
            return parseInt(value) || 0;
          };

          setLimits({
            maxUsers: parseLimit(planData.max_users),
            maxClients: parseLimit(planData.max_clients),
            storage: parseFloat(planData.storage_gb) || 0,
            eSignatures: parseLimit(planData.e_signatures_per_month),
            includedOffices: parseInt(planData.included_offices) || 1,
            maxWorkflows: parseLimit(planData.max_workflows)
          });

          // Load display settings
          setDisplaySettings({
            displayName: planData.display_name || '',
            description: planData.description || '',
            showOnWebsite: planData.show_on_website !== false,
            showPriceOnWebsite: planData.show_price_on_website !== false,
            priceCtaText: planData.price_cta_text || 'Contact Sales',
            priceCtaUrl: planData.price_cta_url || '',
            showClientLimit: planData.show_client_limit !== false,
            showUserLimit: planData.show_user_limit !== false,
            showStorageLimit: planData.show_storage_limit !== false,
            showWorkflowLimit: planData.show_workflow_limit !== false,
            showEsignatureLimit: planData.show_esignature_limit !== false,
            showOfficeLimit: planData.show_office_limit !== false,
            publicFeatures: planData.public_features || [],
            hiddenFeatures: planData.hidden_features || [],
            displayOrder: planData.display_order || 0,
            badgeText: planData.badge_text || '',
            badgeColor: planData.badge_color || '',
            isFullyConfigurable: planData.is_fully_configurable || false
          });

          // Load Add-On Pricing
          if (planData.addons_with_pricing) {
            setAddonsPricing(planData.addons_with_pricing);
          } else {
            setAddonsPricing([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    } finally {
      setFetchingPlan(false);
    }
  };

  // Fetch plan data when activeTab changes
  useEffect(() => {
    if (activeTab) {
      fetchPlanData(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Calculate yearly price automatically based on monthly price and discount
  useEffect(() => {
    const monthly = parseFloat(pricing.monthly) || 0;
    const discount = parseFloat(pricing.discount) || 0;

    if (monthly > 0) {
      // Yearly price = (Monthly price * 12) * (1 - discount/100)
      const yearlyPrice = (monthly * 12) * (1 - discount / 100);
      setPricing(prev => ({
        ...prev,
        yearly: yearlyPrice.toFixed(2)
      }));
    } else {
      setPricing(prev => ({
        ...prev,
        yearly: ''
      }));
    }
  }, [pricing.monthly, pricing.discount]);

  const getFeatures = () => {
    const list = [];

    // User Limit
    const users = limits.maxUsers;
    if (users !== '') {
      if (users === 'Unlimited' || users.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited Users');
      } else {
        const usersNum = parseInt(users);
        if (usersNum === 0) {
          list.push('Unlimited Users');
        } else {
          list.push(`Up to ${usersNum} User${usersNum === 1 ? '' : 's'}`);
        }
      }
    }

    // Client Limit
    const clients = limits.maxClients;
    if (clients !== '') {
      if (clients === 'Unlimited' || clients.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited Client Accounts');
      } else {
        const clientsNum = parseInt(clients);
        if (clientsNum === 0) {
          list.push('Unlimited Client Accounts');
        } else {
          list.push(`${clientsNum} Client Account${clientsNum === 1 ? '' : 's'}`);
        }
      }
    }

    // Storage
    const storage = limits.storage;
    if (storage !== '') {
      const storageNum = parseFloat(storage);
      list.push(`${storageNum} GB Storage`);
    }

    // E-Signatures
    const eSigns = limits.eSignatures;
    if (eSigns !== '') {
      if (eSigns === 'Unlimited' || eSigns.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited E-Signature Requests/month');
      } else {
        const eSignsNum = parseInt(eSigns);
        if (eSignsNum === 0) {
          list.push('Unlimited E-Signature Requests/month');
        } else {
          list.push(`${eSignsNum} E-Signature Request${eSignsNum === 1 ? '' : 's'}/month`);
        }
      }
    }

    // Workflows
    const workflows = limits.maxWorkflows;
    if (workflows !== '') {
      if (workflows === 'Unlimited' || workflows.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited Active Workflows');
      } else {
        const workflowsNum = parseInt(workflows);
        if (workflowsNum === 0) {
          list.push('Unlimited Active Workflows');
        } else {
          list.push(`Up to ${workflowsNum} Active Workflow${workflowsNum === 1 ? '' : 's'}`);
        }
      }
    }

    // Add generic features if the list is still short
    if (list.length > 0) {
      list.push('Secure Document Management');
      list.push('Client Intake Portal');
    }

    return list;
  };

  const handleTabChange = (plan) => {
    setActiveTab(plan);
    // Reset advanced settings view when changing tabs
    setShowAdvancedSettings(false);
    // The useEffect will automatically fetch the plan data when activeTab changes
  };

  // Helper to format limit for API
  const formatLimitForApi = (value) => {
    if (value === 'Unlimited' || value.toString().toLowerCase() === 'unlimited') {
      return 'Unlimited';
    }
    return value.toString();
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    // Prepare addon pricing update payload
    const addonsPricingPayload = addonsPricing.map(addon => ({
      addon_id: addon.id,
      price: addon.price,
      price_unit: addon.price_unit,
      is_included: addon.is_included,
      is_available: addon.is_available
    }));

    const payload = {
      subscription_type: activeTab.toLowerCase(),
      monthly_price: Number(pricing.monthly || 0),
      yearly_price: Number(pricing.yearly || 0),
      discount_percentage_yearly: Number(pricing.discount || 0),
      max_users: formatLimitForApi(limits.maxUsers || 0),
      max_clients: formatLimitForApi(limits.maxClients || 0),
      storage_gb: Number(limits.storage || 0),
      e_signatures_per_month: formatLimitForApi(limits.eSignatures || 0),
      included_offices: Number(limits.includedOffices || 1),
      max_workflows: formatLimitForApi(limits.maxWorkflows || 0),
      additional_storage_addon: true,
      additional_user_addon: true,
      priority_support_addon: true,
      is_active: true,

      // New display settings
      display_name: displaySettings.displayName || null,
      description: displaySettings.description || null,
      show_on_website: displaySettings.showOnWebsite,
      show_price_on_website: displaySettings.showPriceOnWebsite,
      price_cta_text: displaySettings.priceCtaText || null,
      price_cta_url: displaySettings.priceCtaUrl || null,
      show_client_limit: displaySettings.showClientLimit,
      show_user_limit: displaySettings.showUserLimit,
      show_storage_limit: displaySettings.showStorageLimit,
      show_workflow_limit: displaySettings.showWorkflowLimit,
      show_esignature_limit: displaySettings.showEsignatureLimit,
      show_office_limit: displaySettings.showOfficeLimit,
      public_features: displaySettings.publicFeatures.length > 0 ? displaySettings.publicFeatures : [],
      hidden_features: displaySettings.hiddenFeatures.length > 0 ? displaySettings.hiddenFeatures : [],
      display_order: displaySettings.displayOrder,
      badge_text: displaySettings.badgeText || null,
      badge_color: displaySettings.badgeColor || null,
      is_fully_configurable: displaySettings.isFullyConfigurable,

      // Add-ons Pricing Update
      addons_pricing_update: addonsPricingPayload
    };

    try {
      // Use PATCH for updating existing plan
      const planTypeLower = activeTab.toLowerCase();
      const response = await fetch(`${getApiBaseUrl()}/user/subscription-plans/${planTypeLower}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || errData?.detail || 'Failed to update subscription plan');
      }
      setSuccess(true);
      toast.success('Subscription plan updated successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (e) {
      setError(e.message || 'Error occurred');
      toast.error(e.message || 'Error occurred', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if value is "Unlimited"
  const isUnlimited = (value) => {
    return value === 'Unlimited' || value.toString().toLowerCase() === 'unlimited';
  };

  return (
    <div className="w-full h-full lg:p-3 md:p-2 sm:p-1 edit-plan-page">
      <div className="rounded-lg w-full max-w-6xl mx-auto edit-plan-container">
        {/* Header */}
        <div className="p-6 edit-plan-header">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm text-[#3B4A66] hover:underline focus:outline-none edit-plan-back"
          >
            ← Back to Subscription Plans
          </button>
          <div className="mt-4">
            <h3 className="text-2xl font-bold" style={{ color: '#3B4A66' }}>Edit Subscription Plan</h3>
            <p className="text-sm mt-1" style={{ color: '#3B4A66' }}>Modify pricing, features, limits, and display settings for subscription plans</p>
          </div>
        </div>

        {/* Plan Tabs */}
        <div className="lg:p-6 md:p-4 sm:p-2 edit-plan-tabs-wrap">
          <div className="flex gap-2 mb-6 bg-white p-2 w-fit edit-plan-tabs" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
            {plans.map((plan) => (
              <button
                key={plan}
                onClick={() => handleTabChange(plan)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === plan
                  ? 'text-white'
                  : 'hover:bg-gray-100'
                  }`}
                style={{
                  color: activeTab === plan ? 'white' : '#3B4A66',
                  backgroundColor: activeTab === plan ? '#3B4A66' : 'white',
                  borderRadius: '7px',

                }}
              >
                {plan}
              </button>
            ))}
          </div>

          {/* Content Sections */}
          <div className="space-y-6 p-1 edit-plan-content">
            {/* First Row - Pricing and Limits in 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 edit-plan-row">
              <>
                {/* Pricing Section */}
                <div className="p-4 bg-white h-fit" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Pricing</h3>
                  <div className="space-y-4 flex flex-row gap-4 edit-plan-inline">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Monthly Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.monthly ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPricing({ ...pricing, monthly: v === '' ? '' : v });
                        }}
                        onBlur={(e) => {
                          const n = parseFloat(e.target.value);
                          setPricing({ ...pricing, monthly: isNaN(n) ? 0 : Math.max(0, Number(n.toFixed(2))) });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />

                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Yearly Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricing.yearly ?? ''}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          border: '1px solid #E8F0FF',
                          color: '#3B4A66',
                          backgroundColor: '#F3F4F6',
                          cursor: 'not-allowed'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                        Auto-calculated from monthly price and discount
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Discount Percentage (Yearly)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={pricing.discount ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPricing({ ...pricing, discount: v === '' ? '' : v });
                      }}
                      onBlur={(e) => {
                        const n = parseFloat(e.target.value);
                        const clamped = isNaN(n) ? 0 : Math.min(100, Math.max(0, Number(n.toFixed(2))));
                        setPricing({ ...pricing, discount: clamped });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />
                  </div>
                </div>

                {/* Limits Section - Now available for ALL plans including Elite */}
                <div className="p-3 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Limits & Features</h3>
                  <div className="space-y-4 flex flex-row gap-4 edit-plan-inline">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Users</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={limits.maxUsers ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLimits(prev => ({ ...prev, maxUsers: v }));
                          }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v.toLowerCase() === 'unlimited') {
                              setLimits(prev => ({ ...prev, maxUsers: 'Unlimited' }));
                            } else {
                              const n = parseInt(v);
                              setLimits(prev => ({ ...prev, maxUsers: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          placeholder="e.g., 10 or Unlimited"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        />
                        <button
                          type="button"
                          onClick={() => setLimits(prev => ({ ...prev, maxUsers: 'Unlimited' }))}
                          className={`px-2 py-1 text-xs rounded ${isUnlimited(limits.maxUsers) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Clients</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={limits.maxClients ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLimits(prev => ({ ...prev, maxClients: v }));
                          }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v.toLowerCase() === 'unlimited') {
                              setLimits(prev => ({ ...prev, maxClients: 'Unlimited' }));
                            } else {
                              const n = parseInt(v);
                              setLimits(prev => ({ ...prev, maxClients: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          placeholder="e.g., 100 or Unlimited"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        />
                        <button
                          type="button"
                          onClick={() => setLimits(prev => ({ ...prev, maxClients: 'Unlimited' }))}
                          className={`px-2 py-1 text-xs rounded ${isUnlimited(limits.maxClients) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-4 flex flex-row gap-4 w-fit edit-plan-inline'>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Storage (GB)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={limits.storage ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLimits({ ...limits, storage: v === '' ? '' : v });
                        }}
                        onBlur={(e) => {
                          const n = parseFloat(e.target.value);
                          setLimits({ ...limits, storage: isNaN(n) ? 0 : Math.max(0, Number(n.toFixed(2))) });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>E-Signatures/month</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={limits.eSignatures ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLimits(prev => ({ ...prev, eSignatures: v }));
                          }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v.toLowerCase() === 'unlimited') {
                              setLimits(prev => ({ ...prev, eSignatures: 'Unlimited' }));
                            } else {
                              const n = parseInt(v);
                              setLimits(prev => ({ ...prev, eSignatures: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          placeholder="e.g., 50 or Unlimited"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        />
                        <button
                          type="button"
                          onClick={() => setLimits(prev => ({ ...prev, eSignatures: 'Unlimited' }))}
                          className={`px-2 py-1 text-xs rounded ${isUnlimited(limits.eSignatures) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-4 flex flex-row gap-4 w-fit edit-plan-inline'>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Workflows</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={limits.maxWorkflows ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLimits(prev => ({ ...prev, maxWorkflows: v }));
                          }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v.toLowerCase() === 'unlimited') {
                              setLimits(prev => ({ ...prev, maxWorkflows: 'Unlimited' }));
                            } else {
                              const n = parseInt(v);
                              setLimits(prev => ({ ...prev, maxWorkflows: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          placeholder="e.g., 5 or Unlimited"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        />
                        <button
                          type="button"
                          onClick={() => setLimits(prev => ({ ...prev, maxWorkflows: 'Unlimited' }))}
                          className={`px-2 py-1 text-xs rounded ${isUnlimited(limits.maxWorkflows) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Included Offices</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={limits.includedOffices ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLimits({ ...limits, includedOffices: v === '' ? '' : v });
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value);
                          setLimits({ ...limits, includedOffices: isNaN(n) ? 1 : Math.max(0, n) });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>
              </>
            </div>

            {/* Add-On Pricing Configuration */}
            {/* <div className="p-3 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Add-On Pricing Configuration</h3>
              <p className="text-sm mb-4 text-gray-500">Configure specific add-on pricing for this plan. Overrides global default pricing.</p>

              <div className="space-y-4">
                {addonsPricing.length > 0 ? (
                  addonsPricing.map((addon, index) => (
                    <div key={addon.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-sm text-[#3B4A66]">{addon.name}</h4>
                          <p className="text-xs text-gray-500">Global Default: ${addon.default_price} {addon.default_price_unit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addon.is_available}
                              onChange={(e) => {
                                const newAddons = [...addonsPricing];
                                newAddons[index].is_available = e.target.checked;
                                setAddonsPricing(newAddons);
                              }}
                              className="w-3 h-3 rounded"
                            />
                            <span className="text-xs text-gray-600">Available</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={addon.is_included}
                              onChange={(e) => {
                                const newAddons = [...addonsPricing];
                                newAddons[index].is_included = e.target.checked;
                                // If included, price is 0 (or irrelevant)
                                if (e.target.checked) {
                                  newAddons[index].price = 0;
                                }
                                setAddonsPricing(newAddons);
                              }}
                              className="w-3 h-3 rounded"
                            />
                            <span className="text-xs text-gray-600">Included (Free)</span>
                          </label>
                        </div>
                      </div>

                      {!addon.is_included && addon.is_available && (
                        <div className="flex gap-4 mt-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1 text-[#3B4A66]">Plan Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={addon.price}
                              onChange={(e) => {
                                const newAddons = [...addonsPricing];
                                newAddons[index].price = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setAddonsPricing(newAddons);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1 text-[#3B4A66]">Unit</label>
                            <input
                              type="text"
                              value={addon.price_unit || ''}
                              onChange={(e) => {
                                const newAddons = [...addonsPricing];
                                newAddons[index].price_unit = e.target.value;
                                setAddonsPricing(newAddons);
                              }}
                              placeholder={addon.default_price_unit}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No active add-ons found.</p>
                )}
              </div>
            </div> */}

            {/* Display Settings Section */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#3B4A66' }}>Display & Website Settings</h3>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="text-sm px-3 py-1 rounded"
                  style={{ backgroundColor: showAdvancedSettings ? '#3B4A66' : '#E8F0FF', color: showAdvancedSettings ? 'white' : '#3B4A66' }}
                >
                  {showAdvancedSettings ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Display Name (Optional)</label>
                  <input
                    type="text"
                    value={displaySettings.displayName}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder={`e.g., Enterprise (defaults to "${activeTab}")`}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    Custom name shown on website (leave empty to use "{activeTab}")
                  </p>
                </div>

                {/* Badge Text */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Badge Text (Optional)</label>
                  <input
                    type="text"
                    value={displaySettings.badgeText}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="e.g., Most Popular, Best Value"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  />
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Description</label>
                  <textarea
                    value={displaySettings.description}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Marketing description for this plan..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  />
                </div>

                {/* Visibility Toggles */}
                <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.showOnWebsite}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, showOnWebsite: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: '#3B4A66' }}>Show on Website</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.showPriceOnWebsite}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, showPriceOnWebsite: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: '#3B4A66' }}>Show Price</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.isFullyConfigurable}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, isFullyConfigurable: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: '#3B4A66' }}>Fully Configurable</span>
                  </label>
                </div>

                {/* CTA Settings (shown when price is hidden) */}
                {!displaySettings.showPriceOnWebsite && (
                  <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>CTA Button Text</label>
                      <input
                        type="text"
                        value={displaySettings.priceCtaText}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, priceCtaText: e.target.value }))}
                        placeholder="Contact Sales"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>CTA URL (Optional)</label>
                      <input
                        type="url"
                        value={displaySettings.priceCtaUrl}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, priceCtaUrl: e.target.value }))}
                        placeholder="https://calendly.com/your-link"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              {showAdvancedSettings && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-semibold mb-4" style={{ color: '#3B4A66' }}>Limit Visibility (What to show on website)</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showUserLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showUserLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show User Limit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showClientLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showClientLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show Client Limit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showStorageLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showStorageLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show Storage Limit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showWorkflowLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showWorkflowLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show Workflow Limit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showEsignatureLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showEsignatureLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show E-Signature Limit</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.showOfficeLimit}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, showOfficeLimit: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#3B4A66' }}>Show Office Limit</span>
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Display Order</label>
                      <input
                        type="number"
                        min="0"
                        value={displaySettings.displayOrder}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Lower numbers appear first</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Badge Color (Hex)</label>
                      <input
                        type="text"
                        value={displaySettings.badgeColor}
                        onChange={(e) => setDisplaySettings(prev => ({ ...prev, badgeColor: e.target.value }))}
                        placeholder="#F56D2D"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features List Section - Full Width */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start edit-plan-actions">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Features Preview</h3>
                  <ul className="space-y-2">
                    {getFeatures().map((feature, index) => (
                      <li key={index} className="flex items-center text-sm" style={{ color: '#3B4A66' }}>
                        <span className="w-1 h-1 bg-black rounded-full mr-3"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>


          </div>
          <div className="flex gap-3 ml-6 edit-plan-action-buttons align-center justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 transition-colors"
              style={{ border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
