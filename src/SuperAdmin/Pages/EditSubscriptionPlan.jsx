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

  // State for Add-Ons
  const [planAddons, setPlanAddons] = useState([]);
  const [selectedAddonCategory, setSelectedAddonCategory] = useState('all');

  // State for "Add New Addon for This Plan" modal
  const [showNewAddonModal, setShowNewAddonModal] = useState(false);
  const [newAddonForm, setNewAddonForm] = useState({
    name: '',
    description: '',
    category: 'other',
    price: '',
    price_unit: 'per month',
    scope: 'firm',
    billing_frequency: 'monthly',
    unit_type: 'unit',
    unit_quantity: 1,
  });
  const [creatingAddon, setCreatingAddon] = useState(false);

  // State for editing an existing addon
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [editAddonForm, setEditAddonForm] = useState({});

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

          // Load plan add-ons
          if (planData.addons_with_pricing) {
            setPlanAddons(planData.addons_with_pricing);
          } else {
            setPlanAddons([]);
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

      // Display settings
      display_name: displaySettings.displayName || null,
      description: displaySettings.description || null,
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

        // Log detailed error for debugging
        console.error('API Error Response:', errData);

        let errorMessage = errData?.message || errData?.detail || 'Failed to update subscription plan';

        // Check for specific field errors
        if (errData?.errors && typeof errData.errors === 'object') {
          const fieldErrors = Object.entries(errData.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          if (fieldErrors) {
            errorMessage = `Validation failed: ${fieldErrors}`;
          }
        }

        throw new Error(errorMessage);
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
      console.error('Update Error:', e);
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

  // Delete add-on permanently
  const handleDeleteAddon = async (addonId, addonName) => {
    if (!window.confirm(`Delete "${addonName}" from the ${activeTab} plan? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/user/superadmin/add-ons/${addonId}/delete/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete add-on');
      setPlanAddons(prev => prev.filter(a => a.id !== addonId));
      toast.success(`"${addonName}" deleted.`, { position: 'top-right', autoClose: 3000 });
    } catch (e) {
      toast.error(e.message || 'Error deleting add-on', { position: 'top-right', autoClose: 3000 });
    }
  };

  // Start editing an addon inline
  const handleStartEdit = (addon) => {
    setEditingAddonId(addon.id);
    setEditAddonForm({
      name: addon.name || '',
      description: addon.description || '',
      price: addon.price || '',
      price_unit: addon.price_unit || 'per month',
      billing_frequency: addon.billing_frequency || 'monthly',
      scope: addon.scope || 'firm',
      category: addon.category || 'other',
      unit_quantity: addon.unit_quantity || 1,
      unit_type: addon.unit_type || 'unit',
    });
  };

  // Save addon edit via PATCH
  const handleSaveEdit = async (addonId) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/user/superadmin/add-ons/${addonId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
        body: JSON.stringify({
          name: editAddonForm.name,
          description: editAddonForm.description,
          price: parseFloat(editAddonForm.price) || 0,
          price_unit: editAddonForm.price_unit,
          billing_frequency: editAddonForm.billing_frequency || 'monthly',
          scope: editAddonForm.scope,
          category: editAddonForm.category,
          unit_quantity: parseInt(editAddonForm.unit_quantity) || 1,
          unit_type: editAddonForm.unit_type,
        })
      });
      if (!res.ok) throw new Error('Failed to update add-on');
      setEditingAddonId(null);
      toast.success('Add-on updated.', { position: 'top-right', autoClose: 3000 });
      // Re-fetch plan data so the addon card reflects the latest server values in the
      // correct addons_with_pricing shape (avoids type-mismatch from AddOnSerializer output).
      await fetchPlanData(activeTab);
    } catch (e) {
      toast.error(e.message || 'Error updating add-on', { position: 'top-right', autoClose: 3000 });
    }
  };

  // Create a new add-on for this plan
  const handleAddNewAddonForPlan = async () => {
    if (!newAddonForm.name.trim()) {
      toast.error('Add-on name is required.', { position: 'top-right', autoClose: 3000 });
      return;
    }
    setCreatingAddon(true);
    try {
      let derivedPriceUnit = 'per month';
      if (newAddonForm.billing_frequency === 'yearly') derivedPriceUnit = 'per year';
      if (newAddonForm.billing_frequency === 'one_time') derivedPriceUnit = 'one-time';

      const payload = {
        name: newAddonForm.name.trim(),
        description: newAddonForm.description.trim(),
        category: newAddonForm.category,
        addon_type: `${newAddonForm.category}_${Date.now()}`,
        price: parseFloat(newAddonForm.price) || 0,
        price_unit: derivedPriceUnit,
        unit_type: newAddonForm.unit_type || 'unit',
        unit_quantity: parseInt(newAddonForm.unit_quantity) || 1,
        scope: newAddonForm.scope,
        billing_frequency: newAddonForm.billing_frequency,
        is_active: true,
        plan_type: activeTab.toLowerCase(),
      };

      const response = await fetch(`${getApiBaseUrl()}/user/superadmin/add-ons/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || errData?.detail || 'Failed to create add-on');
      }
      const result = await response.json();
      const createdAddon = result.data || result;

      // Add to local state
      setPlanAddons(prev => [...prev, {
        id: createdAddon.id,
        name: createdAddon.name,
        category: createdAddon.category,
        description: createdAddon.description,
        billing_frequency: createdAddon.billing_frequency,
        price: parseFloat(createdAddon.price) || 0,
        price_unit: createdAddon.price_unit,
        scope: createdAddon.scope,
        is_available: true,
      }]);
      setSelectedAddonCategory('all');
      setShowNewAddonModal(false);
      setNewAddonForm({
        name: '', description: '', category: 'other',
        price: '', price_unit: 'per month',
        scope: 'firm', billing_frequency: 'monthly',
        unit_type: 'unit', unit_quantity: 1,
      });
      toast.success(`"${createdAddon.name}" created for the ${activeTab} plan.`, {
        position: 'top-right', autoClose: 3000,
      });
    } catch (e) {
      toast.error(e.message || 'Error creating add-on', { position: 'top-right', autoClose: 3000 });
    } finally {
      setCreatingAddon(false);
    }
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

            <div className="p-6 bg-white" id="addon-config" style={{ border: '1px solid #E8F0FF', borderRadius: '8px' }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: '#3B4A66' }}>Plan Add-Ons</h3>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    Add-ons available only to firms on the <span className="font-bold" style={{ color: '#3B4A66' }}>{activeTab}</span> plan.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewAddonModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                  style={{ backgroundColor: '#3B4A66' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                  New Add-on
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                {['all', 'esign', 'storage', 'workflow', 'office', 'staff', 'other'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedAddonCategory(cat)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${selectedAddonCategory === cat
                      ? 'bg-[#3B4A66] text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                  >
                    {cat === 'all' ? 'All Types' : cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {planAddons.filter(a => selectedAddonCategory === 'all' || (a.category && a.category === selectedAddonCategory)).length > 0 ? (
                  planAddons
                    .filter(a => selectedAddonCategory === 'all' || (a.category && a.category === selectedAddonCategory))
                    .map((addon) => (
                      <div
                        key={addon.id}
                        className="p-5 bg-white transition-all"
                        style={{ border: '1px solid #E8F0FF', borderRadius: '12px' }}
                      >
                        {editingAddonId === addon.id ? (
                          /* ── Inline Edit Mode ── */
                          <div className="space-y-4">
                            {/* Name */}
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Add-on Name</label>
                              <input
                                type="text" value={editAddonForm.name}
                                onChange={e => setEditAddonForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                placeholder="Add-on name"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                              <textarea
                                value={editAddonForm.description}
                                onChange={e => setEditAddonForm(f => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                placeholder="Description"
                              />
                            </div>

                            {/* Price, Billing Term, Scope, Category — 2×2 grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-40" style={{ color: '#3B4A66' }}>$</span>
                                  <input
                                    type="number" step="0.01" min="0"
                                    value={editAddonForm.price}
                                    onChange={e => setEditAddonForm(f => ({ ...f, price: e.target.value }))}
                                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billing Term</label>
                                <select
                                  value={editAddonForm.billing_frequency}
                                  onChange={e => setEditAddonForm(f => ({ ...f, billing_frequency: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                >
                                  <option value="monthly">Monthly</option>
                                  <option value="yearly">Annually</option>
                                  <option value="one_time">One-time Fee</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scope</label>
                                <select
                                  value={editAddonForm.scope}
                                  onChange={e => setEditAddonForm(f => ({ ...f, scope: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                >
                                  <option value="firm">Firm-wide</option>
                                  <option value="office">Per Office</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                                <select
                                  value={editAddonForm.category}
                                  onChange={e => setEditAddonForm(f => ({ ...f, category: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                >
                                  <option value="esign">E-Sign</option>
                                  <option value="storage">Storage</option>
                                  <option value="workflow">Workflow</option>
                                  <option value="office">Office</option>
                                  <option value="staff">Staff</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>

                            {/* Capacity Edit Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Limit Value</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Qty</span>
                                  <input
                                    type="number" min="1"
                                    value={editAddonForm.unit_quantity}
                                    onChange={e => setEditAddonForm(f => ({ ...f, unit_quantity: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit Type</label>
                                <input
                                  type="text"
                                  value={editAddonForm.unit_type}
                                  onChange={e => setEditAddonForm(f => ({ ...f, unit_type: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                                  placeholder="Unit (e.g. GB)"
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid #E8F0FF' }}>
                              <button
                                onClick={() => setEditingAddonId(null)}
                                className="px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                                style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                              >Cancel</button>
                              <button
                                onClick={() => handleSaveEdit(addon.id)}
                                className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                                style={{ backgroundColor: '#3B4A66' }}
                              >Save</button>
                            </div>
                          </div>
                        ) : (
                          /* ── View Mode ── */
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm" style={{ color: '#3B4A66' }}>{addon.name}</h4>
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-tight border border-gray-200">
                                    {addon.category || 'other'}
                                  </span>
                                </div>
                                {addon.description && (
                                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{addon.description}</p>
                                )}
                                {(addon.unit_quantity > 0 || addon.unit_type) && (
                                  <p className="text-[10px] font-semibold mt-1" style={{ color: '#4B5563' }}>
                                    Includes: {addon.unit_quantity || 1} {addon.unit_type === 'unit' ? 'Units' : addon.unit_type}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {/* Edit button */}
                                <button
                                  type="button" title="Edit"
                                  onClick={() => handleStartEdit(addon)}
                                  className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-blue-50 transition-colors"
                                  style={{ border: '1px solid #BFDBFE', color: '#3B82F6' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                {/* Delete button */}
                                <button
                                  type="button" title="Delete"
                                  onClick={() => handleDeleteAddon(addon.id, addon.name)}
                                  className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 transition-colors"
                                  style={{ border: '1px solid #FCA5A5', color: '#EF4444' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid #E8F0FF' }}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg font-bold" style={{ color: '#3B4A66' }}>${parseFloat(addon.price || 0).toFixed(2)}</span>
                                <span className="text-[10px] font-medium opacity-60" style={{ color: '#3B4A66' }}>{addon.billing_frequency === 'one_time' ? 'one-time' : addon.billing_frequency === 'yearly' ? 'per year' : 'per month'}</span>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full" style={{
                                backgroundColor: addon.scope === 'office' ? '#FEF3C7' : '#DBEAFE',
                                color: addon.scope === 'office' ? '#92400E' : '#1E40AF',
                                border: `1px solid ${addon.scope === 'office' ? '#FDE68A' : '#93C5FD'}`
                              }}>
                                {addon.scope === 'office' ? 'Per Office' : 'Firm-wide'}
                              </span>
                              {addon.billing_frequency && (
                                <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                                  {addon.billing_frequency === 'monthly' ? 'Billed Monthly' : addon.billing_frequency === 'yearly' ? 'Billed Yearly' : 'One-Time'}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="md:col-span-2 py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm font-medium italic" style={{ color: '#9CA3AF' }}>
                      {selectedAddonCategory === 'all'
                        ? 'No add-ons for this plan yet. Click "New Add-on" to create one.'
                        : `No "${selectedAddonCategory}" add-ons for this plan.`}
                    </p>
                  </div>
                )}
              </div>
            </div>

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

      {/* ─── Create New Add-on Modal ─── */}
      {showNewAddonModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewAddonModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ border: '1px solid #E8F0FF' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E8F0FF' }}>
              <div>
                <h4 className="text-lg font-bold" style={{ color: '#3B4A66' }}>Create New Add-on</h4>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  Create an add-on exclusively for the{' '}
                  <span className="font-bold" style={{ color: '#3B4A66' }}>{activeTab}</span> plan.
                </p>
              </div>
              <button
                onClick={() => setShowNewAddonModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Add-on Name *</label>
                <input
                  type="text"
                  value={newAddonForm.name}
                  onChange={e => setNewAddonForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priority E-Sign Pack"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Description</label>
                <textarea
                  value={newAddonForm.description}
                  onChange={e => setNewAddonForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of what this add-on provides..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                />
              </div>

              {/* Category + Billing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Category</label>
                  <select
                    value={newAddonForm.category}
                    onChange={e => setNewAddonForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  >
                    <option value="esign">E-Sign</option>
                    <option value="storage">Storage</option>
                    <option value="workflow">Workflow</option>
                    <option value="office">Office</option>
                    <option value="staff">Staff</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Billing</label>
                  <select
                    value={newAddonForm.billing_frequency}
                    onChange={e => setNewAddonForm(f => ({ ...f, billing_frequency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One-Time</option>
                  </select>
                </div>
              </div>

              {/* Price + Scope */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Price ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-40" style={{ color: '#3B4A66' }}>$</span>
                    <input
                      type="number" step="0.01" min="0"
                      value={newAddonForm.price}
                      onChange={e => setNewAddonForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Scope</label>
                  <select
                    value={newAddonForm.scope}
                    onChange={e => setNewAddonForm(f => ({ ...f, scope: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  >
                    <option value="firm">Firm-wide</option>
                    <option value="office">Per Office</option>
                  </select>
                </div>
              </div>

              {/* Unit Label + Quantity */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Unit Label <span className="text-gray-400 font-normal">(e.g. signatures, GB)</span></label>
                  <input
                    type="text"
                    value={newAddonForm.unit_type}
                    onChange={e => setNewAddonForm(f => ({ ...f, unit_type: e.target.value }))}
                    placeholder="e.g. signatures, GB, users"
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#3B4A66' }}>Quantity</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Qty</span>
                    <input
                      type="number" min="1"
                      value={newAddonForm.unit_quantity}
                      onChange={e => setNewAddonForm(f => ({ ...f, unit_quantity: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
                    />
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-xs" style={{ color: '#1E40AF' }}>
                  This add-on will be created exclusively for the <strong>{activeTab}</strong> plan. Only firms subscribed to this plan will see it.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: '#E8F0FF' }}>
              <button
                onClick={() => setShowNewAddonModal(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg border transition-colors"
                style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewAddonForPlan}
                disabled={creatingAddon || !newAddonForm.name.trim()}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: '#3B4A66' }}
              >
                {creatingAddon ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Create &amp; Add to {activeTab}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
