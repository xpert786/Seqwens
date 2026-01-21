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
    includedOffices: ''
  });



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

  const getFeatures = () => {
    const list = [];

    // User Limit
    const users = limits.maxUsers;
    if (users !== '') {
      const usersNum = parseInt(users);
      if (usersNum === 0 || users.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited Users');
      } else {
        list.push(`Up to ${usersNum} User${usersNum === 1 ? '' : 's'}`);
      }
    }

    // Client Limit
    const clients = limits.maxClients;
    if (clients !== '') {
      const clientsNum = parseInt(clients);
      if (clientsNum === 0 || clients.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited Client Accounts');
      } else {
        list.push(`${clientsNum} Client Account${clientsNum === 1 ? '' : 's'}`);
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
      const eSignsNum = parseInt(eSigns);
      if (eSignsNum === 0 || eSigns.toString().toLowerCase() === 'unlimited') {
        list.push('Unlimited E-Signature Requests/month');
      } else {
        list.push(`${eSignsNum} E-Signature Request${eSignsNum === 1 ? '' : 's'}/month`);
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
    // Clear all form values when changing tabs in Add mode
    setPricing({ monthly: '', yearly: '', discount: '' });
    setLimits({ maxUsers: '', maxClients: '', storage: '', eSignatures: '', includedOffices: '' });
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
            <h2 className="text-2xl font-bold" style={{ color: '#3B4A66' }}>Add New Subscription Plan</h2>
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
              {activeTab !== 'Elite' && (
                <div className="p-3 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Limits & Features</h3>
                  <div className="space-y-4 flex flex-row gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Users</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={limits.maxUsers ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          const newMaxUsers = v === '' ? '' : parseInt(v) || 0;
                          setLimits(prev => {
                            const updated = { ...prev, maxUsers: v === '' ? '' : v };
                            // If max clients exceeds new max users, cap it to max users
                            if (newMaxUsers !== '' && prev.maxClients !== '' && parseInt(prev.maxClients) > newMaxUsers) {
                              updated.maxClients = newMaxUsers;
                            }
                            return updated;
                          });
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value);
                          const maxUsers = isNaN(n) ? 0 : Math.max(0, n);
                          setLimits(prev => {
                            const updated = { ...prev, maxUsers: maxUsers };
                            // Ensure max clients doesn't exceed max users
                            if (prev.maxClients !== '' && parseInt(prev.maxClients) > maxUsers) {
                              updated.maxClients = maxUsers;
                            }
                            return updated;
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />

                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#3B4A66' }}>Max Clients</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={limits.maxClients ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLimits({ ...limits, maxClients: v === '' ? '' : v });
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value);
                          const maxClients = isNaN(n) ? 0 : Math.max(0, n);
                          const maxUsers = parseInt(limits.maxUsers) || 0;
                          // Cap max clients to max users if it exceeds
                          const cappedMaxClients = maxClients > maxUsers ? maxUsers : maxClients;
                          setLimits({ ...limits, maxClients: cappedMaxClients });
                          if (maxClients > maxUsers) {
                            toast.warning(`Max clients cannot exceed max users. Set to ${maxUsers}.`, {
                              position: "top-right",
                              autoClose: 3000,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />
                      {limits.maxUsers !== '' && limits.maxClients !== '' && parseInt(limits.maxClients) > parseInt(limits.maxUsers) && (
                        <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                          Max clients cannot exceed max users ({limits.maxUsers})
                        </p>
                      )}

                    </div>
                  </div>
                  <div className='space-y-4 flex flex-row gap-4 w-fit'>
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
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={limits.eSignatures ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLimits({ ...limits, eSignatures: v === '' ? '' : v });
                        }}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value);
                          setLimits({ ...limits, eSignatures: isNaN(n) ? 0 : Math.max(0, n) });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                      />

                    </div>
                  </div>
                  <div className="mt-4">
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
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      Number of office locations included in the base plan
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Features List Section - Full Width */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Features List</h3>
                  <ul className="space-y-2">
                    {getFeatures().map((feature, index) => (
                      <li key={index} className="flex items-center text-sm" style={{ color: '#3B4A66' }}>
                        <span className="w-1 h-1 bg-black rounded-full mr-3"></span>
                        {feature}
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
                        additional_storage_addon: true,
                        additional_user_addon: true,
                        priority_support_addon: true,
                        is_active: true
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
