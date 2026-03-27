import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl } from '../../ClientOnboarding/utils/corsConfig';

export default function AddSubscription({ planType, onClose }) {
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

  const [displaySettings, setDisplaySettings] = useState({
    displayName: '',
    description: '',
    publicFeatures: [],
    displayOrder: 0,
    badgeText: '',
    badgeColor: '#F56D2D',
  });

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(normalizePlanType(planType));
  }, [planType]);

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

  const generateFeaturesFromLimits = () => {
    const list = [];

    // User Limit
    const users = limits.maxUsers;
    if (users !== '') {
      if (users.toString().toLowerCase() === 'unlimited') {
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
      if (clients.toString().toLowerCase() === 'unlimited') {
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
      if (eSigns.toString().toLowerCase() === 'unlimited') {
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

  const getFeatures = () => {
    // If public features are manually defined, use those
    if (displaySettings.publicFeatures && displaySettings.publicFeatures.length > 0) {
      return displaySettings.publicFeatures;
    }
    return generateFeaturesFromLimits();
  };

  const addFeatureBullet = () => {
    setDisplaySettings(prev => ({
      ...prev,
      publicFeatures: [...prev.publicFeatures, '']
    }));
  };

  const updateFeatureBullet = (index, value) => {
    const newFeatures = [...displaySettings.publicFeatures];
    newFeatures[index] = value;
    setDisplaySettings(prev => ({
      ...prev,
      publicFeatures: newFeatures
    }));
  };

  const removeFeatureBullet = (index) => {
    setDisplaySettings(prev => ({
      ...prev,
      publicFeatures: prev.publicFeatures.filter((_, i) => i !== index)
    }));
  };

  const autoFillFeatures = () => {
    if (window.confirm('This will replace your current features with auto-generated ones from limits. Continue?')) {
      setDisplaySettings(prev => ({
        ...prev,
        publicFeatures: generateFeaturesFromLimits()
      }));
    }
  };

  const handleTabChange = (plan) => {
    setActiveTab(plan);
    // Clear all form values when changing tabs in Add mode
    setPricing({ monthly: '', yearly: '', discount: '' });
    setLimits({ maxUsers: '', maxClients: '', storage: '', eSignatures: '', includedOffices: '', maxWorkflows: '' });
    setDisplaySettings({
      displayName: '',
      description: '',
      publicFeatures: [],
      displayOrder: 0,
      badgeText: '',
      badgeColor: '#F56D2D',
    });
  };

  return (
    <div className="w-full h-full p-3 ">
      <div className="rounded-lg  w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm text-[#3B4A66] hover:underline focus:outline-none"
          >
            ← Back to Subscription Plans
          </button>
          <div className="mt-4">
            <h3 className="text-2xl font-bold" style={{ color: '#3B4A66' }}>Add New Subscription Plan</h3>
            <p className="text-sm mt-1" style={{ color: '#3B4A66' }}>Create a new subscription plan with custom pricing, features, and limits</p>
          </div>
        </div>

        {/* Plan Tabs */}
        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-white p-2 w-fit" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
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
          <div className="space-y-6 p-1">
            {/* First Row - Pricing and Limits in 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pricing Section */}
              <div className="p-4 bg-white h-fit" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Pricing</h3>
                <div className="space-y-4 flex flex-row gap-4">
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

              {/* Limits & Features Section */}
              <div className="p-3 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Limits & Features</h3>
                <div className="space-y-4 flex flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Users</label>
                    <input
                      type="text"
                      value={limits.maxUsers ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits(prev => ({ ...prev, maxUsers: v }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      placeholder="e.g. 10 or Unlimited"
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Clients</label>
                    <input
                      type="text"
                      value={limits.maxClients ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits(prev => ({ ...prev, maxClients: v }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      placeholder="e.g. 100 or Unlimited"
                    />
                  </div>
                </div>
                <div className='space-y-4 flex flex-row gap-4 w-fit mt-4'>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>E-Signatures/month</label>
                    <input
                      type="text"
                      value={limits.eSignatures ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits(prev => ({ ...prev, eSignatures: v }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      placeholder="e.g. 50 or Unlimited"
                    />

                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Workflows</label>
                    <input
                      type="text"
                      value={limits.maxWorkflows ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits(prev => ({ ...prev, maxWorkflows: v }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      placeholder="e.g. 5 or Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Included Offices</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={limits.includedOffices ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits({ ...limits, includedOffices: v === '' ? '' : v });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Display & Website Settings */}
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Badge Text (Optional)</label>
                  <input
                    type="text"
                    value={displaySettings.badgeText}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="e.g., Most Popular"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  />
                </div>

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

                <div className="lg:col-span-2 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium" style={{ color: '#3B4A66' }}>Plan Features</label>
                    <button
                      type="button"
                      onClick={autoFillFeatures}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 uppercase tracking-tighter"
                    >
                      Auto-fill from limits
                    </button>
                  </div>

                  <div className="space-y-3">
                    {displaySettings.publicFeatures.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeatureBullet(index, e.target.value)}
                          placeholder={`Feature #${index + 1}`}
                          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeFeatureBullet(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addFeatureBullet}
                      className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                      Add Feature Bullet
                    </button>
                  </div>
                </div>
              </div>

              {showAdvancedSettings && (
                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Badge Color (Hex)</label>
                    <input
                      type="text"
                      value={displaySettings.badgeColor}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, badgeColor: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Features List Section - Full Width */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#3B4A66' }}>Features Preview</h3>

                  {/* Show Description in Preview */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Plan Description:</p>
                    <p className="text-sm italic" style={{ color: '#3B4A66' }}>
                      {displaySettings.description || 'No description provided.'}
                    </p>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bullet Points:</p>
                  <ul className="space-y-2">
                    {getFeatures().map((feature, index) => (
                      <li key={index} className="flex items-center text-sm" style={{ color: '#3B4A66' }}>
                        <span className="w-1.5 h-1.5 bg-[#F56D2D] rounded-full mr-3"></span>
                        {feature || <span className="opacity-30 italic">Untitled Feature</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3 ml-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 transition-colors"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      setError('');
                      setSuccess(false);
                      const isElite = activeTab === 'Elite';
                      const payload = {
                        subscription_type: activeTab.toLowerCase(),
                        monthly_price: Number(pricing.monthly || 0),
                        yearly_price: Number(pricing.yearly || 0),
                        discount_percentage_yearly: Number(pricing.discount || 0),
                        max_users: isElite ? 'Unlimited' : (limits.maxUsers || 0).toString(),
                        max_clients: isElite ? 'Unlimited' : (limits.maxClients || 0).toString(),
                        storage_gb: isElite ? 5000 : Number(limits.storage || 0),
                        e_signatures_per_month: isElite ? 'Unlimited' : (limits.eSignatures || 0).toString(),
                        included_offices: isElite ? 100 : Number(limits.includedOffices || 1),
                        max_workflows: isElite ? 'Unlimited' : (limits.maxWorkflows || 0).toString(),
                        additional_storage_addon: true,
                        additional_user_addon: true,
                        priority_support_addon: true,
                        is_active: true,

                        // Display settings
                        display_name: displaySettings.displayName || null,
                        description: displaySettings.description || null,
                        public_features: displaySettings.publicFeatures.filter(f => f.trim() !== ''),
                        display_order: displaySettings.displayOrder,
                        badge_text: displaySettings.badgeText || null,
                        badge_color: displaySettings.badgeColor || null,
                      };
                      try {
                        const response = await fetch(`${getApiBaseUrl()}/user/subscription-plans/`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getAccessToken()}`
                          },
                          body: JSON.stringify(payload)
                        });
                        if (!response.ok) {
                          const errData = await response.json();
                          throw new Error(errData?.detail || 'Failed to add subscription plan');
                        }
                        setSuccess(true);
                        toast.success('Subscription plan added successfully!', {
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
                    }}
                    className="px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Plan'}
                  </button>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
