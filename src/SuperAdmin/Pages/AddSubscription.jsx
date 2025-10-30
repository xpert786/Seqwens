import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { XIcon } from '../Components/icons';

export default function EditSubscriptionPlan({ planType, onClose }) {
  const [activeTab, setActiveTab] = useState(planType);
  const [pricing, setPricing] = useState({
    monthly: planType === 'Solo' ? 49 : planType === 'Team' ? 149 : planType === 'Professional' ? 299 : 0,
    yearly: planType === 'Solo' ? 499 : planType === 'Team' ? 1499 : planType === 'Professional' ? 2999 : 0,
    discount: planType === 'Solo' ? 17 : planType === 'Team' ? 17 : planType === 'Professional' ? 17 : 0
  });
  
  const [limits, setLimits] = useState({
    maxUsers: planType === 'Solo' ? 1 : planType === 'Team' ? 10 : planType === 'Professional' ? 25 : 100,
    maxClients: planType === 'Solo' ? 50 : planType === 'Team' ? 500 : planType === 'Professional' ? 1000 : 5000,
    storage: planType === 'Solo' ? 10 : planType === 'Team' ? 50 : planType === 'Professional' ? 100 : 500,
    eSignatures: planType === 'Solo' ? 25 : planType === 'Team' ? 100 : planType === 'Professional' ? 250 : 1000
  });

  const [addOns, setAddOns] = useState({
    additionalStorage: false,
    prioritySupport: false,
    additionalUser: planType === 'Team' ? true : false
  });

  const plans = ['Solo', 'Team', 'Professional', 'Enterprise'];

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
    // Update pricing and limits based on selected plan
    const planData = {
      Solo: { monthly: 49, yearly: 499, discount: 17, maxUsers: 1, maxClients: 50, storage: 10, eSignatures: 25 },
      Team: { monthly: 149, yearly: 1499, discount: 17, maxUsers: 10, maxClients: 500, storage: 50, eSignatures: 100 },
      Professional: { monthly: 299, yearly: 2999, discount: 17, maxUsers: 25, maxClients: 1000, storage: 100, eSignatures: 250 },
      Enterprise: { monthly: 0, yearly: 0, discount: 0, maxUsers: 100, maxClients: 5000, storage: 500, eSignatures: 1000 }
    };
    
    const data = planData[plan];
    setPricing({ monthly: data.monthly, yearly: data.yearly, discount: data.discount });
    setLimits({ maxUsers: data.maxUsers, maxClients: data.maxClients, storage: data.storage, eSignatures: data.eSignatures });
    setAddOns({ additionalStorage: false, prioritySupport: false, additionalUser: plan === 'Team' });
  };

  return (
    <div className="w-full h-full p-3 ">
      <div className="rounded-lg  w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div>
            <h2 className="text-2xl font-bold" style={{color: '#3B4A66'}}>Add New Subscription Plan</h2>
            <p className="text-sm mt-1" style={{color: '#3B4A66'}}>Create a new subscription plan with custom pricing, features, and limits</p>
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
           <div className="flex gap-2 mb-6 bg-white p-2 w-fit" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
             {plans.map((plan) => (
               <button
                 key={plan}
                 onClick={() => handleTabChange(plan)}
                 className={`px-4 py-2 text-sm font-medium transition-colors ${
                   activeTab === plan
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
              <div className="p-4 bg-white h-fit" style={{border: '1px solid #E8F0FF', borderRadius: '8px'}}>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#3B4A66'}}>Pricing</h3>
                <div className="space-y-4 flex flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Monthly Price ($)</label>
                    <input
                      type="number"
                      value={pricing.monthly}
                      onChange={(e) => setPricing({...pricing, monthly: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Yearly Price ($)</label>
                    <input
                      type="number"
                      value={pricing.yearly}
                      onChange={(e) => setPricing({...pricing, yearly: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Discount Percentage (Yearly)</label>
                    <input
                      type="number"
                      value={pricing.discount}
                      onChange={(e) => setPricing({...pricing, discount: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                
              </div>

              {/* Limits & Features Section */}
              <div className="p-3 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '8px'}}>
                <h3 className="text-lg font-semibold mb-4" style={{color: '#3B4A66'}}>Limits & Features</h3>
                <div className="space-y-4 flex flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Max Users</label>
                    <input
                      type="number"
                      value={limits.maxUsers}
                      onChange={(e) => setLimits({...limits, maxUsers: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Max Clients</label>
                    <input
                      type="number"
                      value={limits.maxClients}
                      onChange={(e) => setLimits({...limits, maxClients: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  </div>
                  <div className='space-y-4 flex flex-row gap-4 w-fit'>
                    <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>Storage (GB)</label>
                    <input
                      type="number"
                      value={limits.storage}
                      onChange={(e) => setLimits({...limits, storage: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#3B4A66'}}>E-Signatures/month</label>
                    <input
                      type="number"
                      value={limits.eSignatures}
                      onChange={(e) => setLimits({...limits, eSignatures: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{border: '1px solid #E8F0FF', color: '#3B4A66'}}
                    />
                  </div>
                  </div>
              </div>
            </div>

            {/* Features List Section - Full Width */}
            <div className="p-6 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4" style={{color: '#3B4A66'}}>Features List</h3>
                  <ul className="space-y-2">
                    {getFeatures(activeTab).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm" style={{color: '#3B4A66'}}>
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
                    style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle save logic here
                      console.log('Saving plan:', activeTab, { pricing, limits, addOns });
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg text-white transition-colors"
                    style={{backgroundColor: '#F56D2D', borderRadius: '7px'}}
                  >
                    Add Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Compatible Add-Ons Section - Full Width */}
            <div className="p-6 bg-white" style={{border: '1px solid #E8F0FF', borderRadius: '8px'}}>
              <h3 className="text-lg font-semibold mb-4" style={{color: '#3B4A66'}}>Compatible Add-Ons</h3>
              <div className="space-y-4">
                {/* First Row - Additional Storage and Priority Support */}
                <div className="flex gap-8">
                  <div className="flex justify-between items-center flex-1">
                    <span className="text-sm" style={{color: '#3B4A66'}}>Additional Storage</span>
                    <button
                      onClick={() => setAddOns({...addOns, additionalStorage: !addOns.additionalStorage})}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                        addOns.additionalStorage ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                      style={{ borderRadius: '20px' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          addOns.additionalStorage ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-center flex-1">
                    <span className="text-sm" style={{color: '#3B4A66'}}>Priority Support</span>
                    <button
                      onClick={() => setAddOns({...addOns, prioritySupport: !addOns.prioritySupport})}
                      className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                        addOns.prioritySupport ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                      style={{ borderRadius: '20px' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          addOns.prioritySupport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {/* Second Row - Additional User */}
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{color: '#3B4A66'}}>Additional User</span>
                  <button
                    onClick={() => setAddOns({...addOns, additionalUser: !addOns.additionalUser})}
                    className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                      addOns.additionalUser ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                    style={{ borderRadius: '20px' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        addOns.additionalUser ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-3">
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors"
            style={{border: '1px solid #E8F0FF', color: '#3B4A66', borderRadius: '7px'}}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle save logic here
              console.log('Saving plan:', activeTab, { pricing, limits, addOns });
              onClose();
            }}
            className="px-4 py-2 transition-colors"
            style={{backgroundColor: '#F56D2D', color: 'white', borderRadius: '7px'}}
          >
            Add Plan
          </button>
        </div>
      </div>
    </div>
  );
}
