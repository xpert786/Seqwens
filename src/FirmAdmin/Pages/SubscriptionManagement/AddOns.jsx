import React, { useState, useEffect, useCallback } from 'react';
import { handleAPIError, firmAdminAddonsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';

const AddOns = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [marketplaceAddOns, setMarketplaceAddOns] = useState([]);
    const [activeAddOns, setActiveAddOns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalAddonCost, setTotalAddonCost] = useState(0);
    const [addingAddon, setAddingAddon] = useState(null);
    const [removingAddon, setRemovingAddon] = useState(null);
    const [showRemoveAddonConfirm, setShowRemoveAddonConfirm] = useState(false);
    const [addonToRemove, setAddonToRemove] = useState(null);

    // Fetch marketplace add-ons (available addon types)
    const fetchMarketplaceAddOns = useCallback(async () => {
        try {
            const response = await firmAdminAddonsAPI.listMarketplaceAddons();

            if (response.success && response.data) {
                // Response structure: data.addon_types
                setMarketplaceAddOns(Array.isArray(response.data.addon_types) ? response.data.addon_types : []);
            } else {
                setMarketplaceAddOns([]);
            }
        } catch (err) {
            console.error('Error fetching marketplace add-ons:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load marketplace add-ons. Please try again.');
            setMarketplaceAddOns([]);
        }
    }, []);

    // Fetch active add-ons
    const fetchActiveAddOns = useCallback(async () => {
        try {
            const response = await firmAdminAddonsAPI.getFirmAddons();

            if (response.success && response.data) {
                setActiveAddOns(response.data.addons || []);
                setTotalAddonCost(response.data.total_addon_cost || 0);
            } else {
                setActiveAddOns([]);
                setTotalAddonCost(0);
            }
        } catch (err) {
            console.error('Error fetching active add-ons:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load active add-ons. Please try again.');
            setActiveAddOns([]);
            setTotalAddonCost(0);
        }
    }, []);

    // Fetch data on mount and when tab changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            await Promise.all([
                fetchMarketplaceAddOns(),
                fetchActiveAddOns()
            ]);
            setLoading(false);
        };
        fetchData();
    }, [fetchMarketplaceAddOns, fetchActiveAddOns]);

    // Refresh data when tab changes
    useEffect(() => {
        if (activeTab === 'myAddons') {
            fetchActiveAddOns();
        }
    }, [activeTab, fetchActiveAddOns]);

    // Add add-on to subscription
    const handleAddAddon = async (addonId, addonName, usageLimit = null) => {
        try {
            setAddingAddon(addonId);
            const payload = {
                addon_id: addonId
            };
            
            // Add usage_limit if provided
            if (usageLimit !== null && usageLimit !== undefined) {
                payload.usage_limit = usageLimit;
            }
            
            const response = await firmAdminAddonsAPI.addAddonToFirm(payload);

            if (response.success) {
                // Check if payment is required (checkout_url present)
                if (response.data?.checkout_url) {
                    toast.info(response.message || 'Redirecting to payment...', {
                        position: 'top-right',
                        autoClose: 3000
                    });
                    // Redirect to Stripe checkout
                    window.location.href = response.data.checkout_url;
                } else {
                    toast.success(response.message || `Add-on '${addonName}' added successfully!`, {
                        position: 'top-right',
                        autoClose: 3000
                    });
                    // Refresh both lists
                    await Promise.all([
                        fetchMarketplaceAddOns(),
                        fetchActiveAddOns()
                    ]);
                }
            } else {
                throw new Error(response.message || 'Failed to add add-on');
            }
        } catch (err) {
            console.error('Error adding add-on:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to add add-on. Please try again.', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setAddingAddon(null);
        }
    };

    // Remove add-on from subscription
    // Note: API uses AddOn type ID, not FirmAddOn ID
    const handleRemoveAddon = async (firmAddon, addonName) => {
        // Extract the addon type ID from the firmAddon object
        const addonTypeId = firmAddon.addon?.id || firmAddon.addon_id;
        setAddonToRemove({ addonTypeId, addonName, firmAddon });
        setShowRemoveAddonConfirm(true);
    };

    const confirmRemoveAddon = async () => {
        if (!addonToRemove) return;

        try {
            setRemovingAddon(addonToRemove.addonTypeId);
            // API uses AddOn type ID, not FirmAddOn ID
            const response = await firmAdminAddonsAPI.removeAddonFromFirm(addonToRemove.addonTypeId);

            if (response.success) {
                toast.success(response.message || `Add-on '${addonToRemove.addonName}' removed successfully!`, {
                    position: 'top-right',
                    autoClose: 3000
                });
                // Refresh both lists
                await Promise.all([
                    fetchMarketplaceAddOns(),
                    fetchActiveAddOns()
                ]);
                setShowRemoveAddonConfirm(false);
                setAddonToRemove(null);
            } else {
                throw new Error(response.message || 'Failed to remove add-on');
            }
        } catch (err) {
            console.error('Error removing add-on:', err);
            const errorMsg = handleAPIError(err);
            toast.error(errorMsg || 'Failed to remove add-on. Please try again.', {
                position: 'top-right',
                autoClose: 3000
            });
        } finally {
            setRemovingAddon(null);
        }
    };

    // Format billing frequency display
    const formatBillingFrequency = (frequency) => {
        if (frequency === 'monthly') return 'monthly billing';
        if (frequency === 'one_time') return 'one-time';
        return frequency || '';
    };

    return (
        <div>
            {/* Header Section */}
            <div className="mb-6">
                <div className="mb-4">
                    <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Add-On Marketplace</h5>
                    <p className="text-sm sm:text-base text-gray-600 font-[BasisGrotesquePro] mb-4">Enhance your practice with powerful add-ons and integrations</p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-1.5 sm:p-2 w-fit mb-6">
                    <div className="flex gap-2 sm:gap-3">
                        <button 
                            onClick={() => setActiveTab('browse')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === 'browse' 
                                    ? 'bg-[#3AD6F2] text-white' 
                                    : 'bg-transparent text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Browse Add-on's
                        </button>
                        <button 
                            onClick={() => setActiveTab('myAddons')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 !rounded-lg font-[BasisGrotesquePro] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === 'myAddons' 
                                    ? 'bg-[#3AD6F2] text-white' 
                                    : 'bg-transparent text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            My Add-on's ({activeAddOns.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Total Cost Display for My Add-ons */}
            {activeTab === 'myAddons' && totalAddonCost > 0 && (
                <div className="mb-6 bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Total Add-on Cost</span>
                        <span className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">${totalAddonCost.toFixed(2)}/month</span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading add-ons...</p>
                </div>
            ) : (
                <>
                    {/* Browse Add-on's Content */}
                    {activeTab === 'browse' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {marketplaceAddOns.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-sm text-gray-600">No add-ons available in the marketplace</p>
                                </div>
                            ) : (
                                marketplaceAddOns.map((addon) => (
                                    <div key={addon.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.name}</h6>
                                            {addon.is_added ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                                    Added
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-[#FFFFFF] !border border-[#E8F0FF] text-gray-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                                    Available
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">{addon.description}</p>

                                        {addon.features && addon.features.length > 0 && (
                                            <div className="mb-4">
                                                <h6 className="text-sm font-semibold text-gray-900 mb-1 font-[BasisGrotesquePro]">Key Features</h6>
                                                <ul className="space-y-1.5 list-none m-0 p-0">
                                                    {addon.features.map((feature, index) => (
                                                        <li key={index} className="text-sm text-gray-700 font-[BasisGrotesquePro] leading-relaxed">{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Status for added add-ons */}
                                        {addon.is_added && (
                                            <div className="mb-4">
                                                <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">
                                                    {addon.is_active ? 'Active in your subscription' : 'Added but inactive'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-end justify-between gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                                    ${parseFloat(addon.price || 0).toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-600 font-bold font-[BasisGrotesquePro]">
                                                    {addon.price_display || `${addon.price_unit || formatBillingFrequency(addon.billing_frequency)}`}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleAddAddon(addon.id, addon.name)}
                                                disabled={addon.is_added || addingAddon === addon.id}
                                                className={`px-4 py-2 !rounded-lg transition-colors font-[BasisGrotesquePro] text-sm font-medium whitespace-nowrap ${
                                                    addon.is_added
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : addingAddon === addon.id
                                                        ? 'bg-gray-400 text-white cursor-wait'
                                                        : 'bg-[#F56D2D] text-white hover:bg-[#EA580C]'
                                                }`}
                                            >
                                                {addingAddon === addon.id ? 'Adding...' : addon.is_added ? 'Added' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* My Add-on's Content */}
                    {activeTab === 'myAddons' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            {activeAddOns.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-sm text-gray-600">No active add-ons. Browse the marketplace to add some!</p>
                                </div>
                            ) : (
                                activeAddOns.map((firmAddon) => {
                                    const addon = firmAddon.addon || {};
                                    return (
                                        <div key={firmAddon.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.name}</h6>
                                                    <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
                                                        {addon.price_display || `$${parseFloat(addon.price || 0).toFixed(2)}`}
                                                    </p>
                                                </div>
                                                {firmAddon.is_active ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>

                                            {addon.description && (
                                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-4">{addon.description}</p>
                                            )}

                                            {/* Usage display */}
                                            {firmAddon.usage_limit && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">Current Usage</span>
                                                        <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">
                                                            {firmAddon.usage_display || `${firmAddon.usage}/${firmAddon.usage_limit}`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-[#3AD6F2] h-2 rounded-full" 
                                                            style={{ 
                                                                width: `${Math.min(firmAddon.usage_percentage || 0, 100)}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Monthly cost display */}
                                            {firmAddon.monthly_cost > 0 && (
                                                <div className="mb-4">
                                                    <span className="text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">
                                                        Monthly Cost: ${firmAddon.monthly_cost.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex gap-3 mt-4">
                                                {/* <button 
                                                    className="flex-1 px-4 py-2 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium"
                                                    disabled
                                                >
                                                    Manage
                                                </button> */}
                                                <button 
                                                    onClick={() => handleRemoveAddon(firmAddon, addon.name)}
                                                    disabled={removingAddon === (firmAddon.addon?.id || firmAddon.addon_id)}
                                                    className={`flex-1 px-4 py-2 !rounded-lg transition-colors font-[BasisGrotesquePro] text-sm font-medium ${
                                                        removingAddon === (firmAddon.addon?.id || firmAddon.addon_id)
                                                            ? 'bg-gray-400 text-white cursor-wait'
                                                            : 'bg-white !border border-[#3B4A66] text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {removingAddon === (firmAddon.addon?.id || firmAddon.addon_id) ? 'Removing...' : 'Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Remove Addon Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRemoveAddonConfirm}
                onClose={() => {
                    if (!removingAddon) {
                        setShowRemoveAddonConfirm(false);
                        setAddonToRemove(null);
                    }
                }}
                onConfirm={confirmRemoveAddon}
                title="Remove Add-on"
                message={addonToRemove ? `Are you sure you want to remove "${addonToRemove.addonName}" from your subscription?` : "Are you sure you want to remove this add-on from your subscription?"}
                confirmText="Remove"
                cancelText="Cancel"
                isLoading={!!removingAddon}
                isDestructive={true}
            />
        </div>
    );
};

export default AddOns;
