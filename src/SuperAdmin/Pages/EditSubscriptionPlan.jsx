import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { XIcon } from '../Components/icons';
import { getAccessToken } from '../../ClientOnboarding/utils/userUtils';
import { getApiBaseUrl } from '../../ClientOnboarding/utils/corsConfig';

export default function EditSubscriptionPlan({ planType, onClose }) {
  const [activeTab, setActiveTab] = useState(planType || 'Solo');
  const [pricing, setPricing] = useState({
    monthly: '',
    yearly: '',
    discount: ''
  });

  const [limits, setLimits] = useState({
    maxUsers: '',
    maxClients: '',
    storage: '',
    eSignatures: ''
  });

  const [addOns, setAddOns] = useState({
    additionalStorage: false,
    prioritySupport: false,
    additionalUser: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(false);

  const plans = ['Solo', 'Team', 'Professional', 'Enterprise'];

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
          setPricing({
            monthly: parseFloat(planData.monthly_price) || 0,
            yearly: parseFloat(planData.yearly_price) || 0,
            discount: parseFloat(planData.discount_percentage_yearly) || 0
          });
          setLimits({
            maxUsers: parseInt(planData.max_users) || 0,
            maxClients: parseInt(planData.max_clients) || 0,
            storage: parseFloat(planData.storage_gb) || 0,
            eSignatures: parseInt(planData.e_signatures_per_month) || 0
          });
          setAddOns({
            additionalStorage: planData.additional_storage_addon || false,
            prioritySupport: planData.priority_support_addon || false,
            additionalUser: planData.additional_user_addon || false
          });
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

  const getFeatures = (plan) => {
    const features = {
      Solo: [
        'Up to 1 User',
        '50 Client Accounts',
        '10 GB Storage',
        '25 E-Signature Requests/month'
      ],
      Team: [
        'Up to 10 Users',
        '500 Client Accounts',
        '50 GB Storage',
        '100 E-Signature Requests/month'
      ],
      Professional: [
        'Up to 25 Users',
        '1000 Client Accounts',
        '100 GB Storage',
        '250 E-Signature Requests/month'
      ],
      Enterprise: [
        'Up to 100 Users',
        '5000 Client Accounts',
        '500 GB Storage',
        '1000 E-Signature Requests/month'
      ]
    };
    return features[plan] || [];
  };

  const handleTabChange = (plan) => {
    setActiveTab(plan);
    // The useEffect will automatically fetch the plan data when activeTab changes
  };

  return (
    <div className="w-full h-full p-3 ">
      <div className="rounded-lg  w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#3B4A66' }}>Edit Subscription Plan</h2>
            <p className="text-sm mt-1" style={{ color: '#3B4A66' }}>Modify pricing, features, and limits for subscription plans</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 "
          >
            <XIcon size={24} />
          </button>
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
                      onChange={(e) => {
                        const v = e.target.value;
                        setPricing({ ...pricing, yearly: v === '' ? '' : v });
                      }}
                      onBlur={(e) => {
                        const n = parseFloat(e.target.value);
                        setPricing({ ...pricing, yearly: isNaN(n) ? 0 : Math.max(0, Number(n.toFixed(2))) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />

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
                      type="number"
                      step="1"
                      min="0"
                      value={limits.maxUsers ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLimits({ ...limits, maxUsers: v === '' ? '' : v });
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value);
                        setLimits({ ...limits, maxUsers: isNaN(n) ? 0 : Math.max(0, n) });
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
                        setLimits({ ...limits, maxClients: isNaN(n) ? 0 : Math.max(0, n) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />

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
              </div>
            </div>

            {/* Features List Section - Full Width */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '7px' }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Features List</h3>
                  <ul className="space-y-2">
                    {getFeatures(activeTab).map((feature, index) => (
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
                      const payload = {
                        subscription_type: activeTab.toLowerCase(),
                        monthly_price: Number(pricing.monthly || 0),
                        yearly_price: Number(pricing.yearly || 0),
                        discount_percentage_yearly: Number(pricing.discount || 0),
                        max_users: Number(limits.maxUsers || 0),
                        max_clients: Number(limits.maxClients || 0),
                        storage_gb: Number(limits.storage || 0),
                        e_signatures_per_month: Number(limits.eSignatures || 0),
                        additional_storage_addon: addOns.additionalStorage,
                        additional_user_addon: addOns.additionalUser,
                        priority_support_addon: addOns.prioritySupport,
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
                          throw new Error(errData?.detail || 'Failed to update subscription plan');
                        }
                        setSuccess(true);
                        alert('Subscription plan updated successfully!');
                        setTimeout(() => {
                          onClose();
                        }, 500);
                      } catch (e) {
                        setError(e.message || 'Error occurred');
                        alert(`Error: ${e.message || 'Error occurred'}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: '#F56D2D', borderRadius: '7px' }}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Compatible Add-Ons Section - Full Width */}
            <div className="p-6 bg-white" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3B4A66' }}>Compatible Add-Ons</h3>
              <div className="space-y-4">
                {/* First Row - Additional Storage and Priority Support */}
                <div className="flex gap-8">
                  <div className="flex justify-between items-center flex-1">
                    <span className="text-sm" style={{ color: '#3B4A66' }}>Additional Storage</span>
                    <button
                      onClick={() => setAddOns({ ...addOns, additionalStorage: !addOns.additionalStorage })}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${addOns.additionalStorage ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      style={{ borderRadius: '20px' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addOns.additionalStorage ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-center flex-1">
                    <span className="text-sm" style={{ color: '#3B4A66' }}>Priority Support</span>
                    <button
                      onClick={() => setAddOns({ ...addOns, prioritySupport: !addOns.prioritySupport })}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${addOns.prioritySupport ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      style={{ borderRadius: '20px' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addOns.prioritySupport ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Second Row - Additional User */}
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#3B4A66' }}>Additional User</span>
                  <button
                    onClick={() => setAddOns({ ...addOns, additionalUser: !addOns.additionalUser })}
                    className={`relative inline-flex h-6 w-11 items-center transition-colors ${addOns.additionalUser ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    style={{ borderRadius: '20px' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addOns.additionalUser ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
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
