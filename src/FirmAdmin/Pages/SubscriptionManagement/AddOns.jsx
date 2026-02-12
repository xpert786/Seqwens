import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { handleAPIError, firmAdminAddonsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';

const CATEGORIES = [
    {
        id: 'all', label: 'All Add-ons', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H10V10H4V4ZM4 14H10V20H4V14ZM14 4H20V10H14V4ZM14 14H20V20H14V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'esign', label: 'E-Sign', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.5 3.5A2.121 2.121 0 0 1 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'storage', label: 'Storage', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V21H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 3H1V8H23V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'workflow', label: 'Workflows', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12A10 10 0 1 1 17.07 2.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'office', label: 'Offices', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V9H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 21V5H19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 13H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'staff', label: 'Staff', icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2522 22.1614 16.5523C21.6184 15.8524 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
];

const AddOns = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [marketplaceAddOns, setMarketplaceAddOns] = useState([]);
    const [activeAddOns, setActiveAddOns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalAddonCost, setTotalAddonCost] = useState(0);
    const [addingAddon, setAddingAddon] = useState(null);
    const [removingAddon, setRemovingAddon] = useState(null);
    const [showRemoveAddonConfirm, setShowRemoveAddonConfirm] = useState(false);
    const [addonToRemove, setAddonToRemove] = useState(null);

    // Fetch marketplace add-ons (Full Catalogue)
    const fetchMarketplaceAddOns = useCallback(async () => {
        try {
            const response = await firmAdminAddonsAPI.getCatalogueAddons();
            if (response.success && response.data) {
                setMarketplaceAddOns(Array.isArray(response.data.addon_types) ? response.data.addon_types : []);
            } else {
                setMarketplaceAddOns([]);
            }
        } catch (err) {
            console.error('Error fetching marketplace add-ons:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load marketplace add-ons.');
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
            setError(errorMsg || 'Failed to load active add-ons.');
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            await Promise.all([fetchMarketplaceAddOns(), fetchActiveAddOns()]);
            setLoading(false);
        };
        fetchData();
    }, [fetchMarketplaceAddOns, fetchActiveAddOns]);

    const handleAddAddon = async (addonId, addonName) => {
        try {
            setAddingAddon(addonId);
            const response = await firmAdminAddonsAPI.addAddonToFirm({ addon_id: addonId });

            if (response.success) {
                if (response.data?.checkout_url) {
                    toast.info('Redirecting to payment...', { position: 'top-right' });
                    window.location.href = response.data.checkout_url;
                } else {
                    toast.success(`Add-on '${addonName}' added successfully!`);
                    await Promise.all([fetchMarketplaceAddOns(), fetchActiveAddOns()]);
                }
            } else {
                throw new Error(response.message || 'Failed to add add-on');
            }
        } catch (err) {
            console.error('Error adding add-on:', err);
            toast.error(handleAPIError(err) || 'Failed to add add-on.');
        } finally {
            setAddingAddon(null);
        }
    };

    const handleRemoveAddon = (firmAddon, addonName) => {
        const addonTypeId = firmAddon.addon?.id || firmAddon.addon_id;
        setAddonToRemove({ addonTypeId, addonName, firmAddon });
        setShowRemoveAddonConfirm(true);
    };

    const confirmRemoveAddon = async () => {
        if (!addonToRemove) return;
        try {
            setRemovingAddon(addonToRemove.addonTypeId);
            const response = await firmAdminAddonsAPI.removeAddonFromFirm(addonToRemove.addonTypeId);
            if (response.success) {
                toast.success(`Add-on '${addonToRemove.addonName}' removed successfully!`);
                await Promise.all([fetchMarketplaceAddOns(), fetchActiveAddOns()]);
                setShowRemoveAddonConfirm(false);
                setAddonToRemove(null);
            } else {
                throw new Error(response.message || 'Failed to remove add-on');
            }
        } catch (err) {
            console.error('Error removing add-on:', err);
            toast.error(handleAPIError(err) || 'Failed to remove add-on.');
        } finally {
            setRemovingAddon(null);
        }
    };

    // Filtered marketplace add-ons
    const filteredAddons = useMemo(() => {
        return marketplaceAddOns.filter(addon => {
            const matchesCategory = selectedCategory === 'all' ||
                (addon.addon_type && addon.addon_type.toLowerCase().includes(selectedCategory.toLowerCase()));
            const matchesSearch = !searchQuery ||
                addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (addon.description && addon.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [marketplaceAddOns, selectedCategory, searchQuery]);

    const getFallbackFeatures = (type = '') => {
        const t = type.toLowerCase();
        if (t.includes('esign')) return ['Legally binding e-signatures', 'Unlimited envelopes', 'Audit trails'];
        if (t.includes('storage')) return ['Secure document storage', 'Cloud backup', 'Organization tools'];
        if (t.includes('office')) return ['Additional office locations', 'Local presence', 'Multi-office management'];
        if (t.includes('client')) return ['Manage more clients', 'Client portal access', 'Secure communication'];
        if (t.includes('staff')) return ['Add team members', 'Role-based access', 'Collaboration tools'];
        if (t.includes('workflow')) return ['Automated processes', 'Task tracking', 'Custom pipelines'];
        return ['Standard platform features', 'Seamless integration', 'Premium support'];
    };

    // Card component for marketplace items
    const MarketplaceCard = ({ addon }) => {
        const features = addon.features && addon.features.length > 0 ? addon.features : getFallbackFeatures(addon.addon_type);
        const isIncluded = addon.is_included;

        return (
            <div className={`group bg-white !rounded-2xl !border border-[#E8F0FF] p-6 relative shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${addon.is_added ? 'ring-1 ring-green-100' : ''}`}>
                {/* Status Badges */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                        {isIncluded ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 !rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                Included in Plan
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-600 !rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                                Marketplace
                            </span>
                        )}
                        {addon.is_added && (
                            <span className="px-2.5 py-1 bg-green-50 text-green-600 !rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                Active
                            </span>
                        )}
                        {addon.is_available === false && (
                            <span className="px-2.5 py-1 bg-gray-50 text-gray-400 !rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                                Plan Upgrade Required
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-grow">
                    <h6 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2 group-hover:text-[#3AD6F2] transition-colors">{addon.name}</h6>
                    <p className={`text-sm text-gray-600 font-[BasisGrotesquePro] line-clamp-2 mb-6 ${addon.is_available === false ? 'opacity-60' : ''}`}>{addon.description}</p>

                    <div className="space-y-3 mb-8">
                        <h7 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-[BasisGrotesquePro]">Key Capabilities</h7>
                        <ul className="space-y-2.5">
                            {features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2.5">
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${addon.is_available === false ? 'bg-gray-50' : 'bg-blue-50'}`}>
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 1L3.5 6.5L1 4" stroke={addon.is_available === false ? "#9CA3AF" : "#3AD6F2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-[BasisGrotesquePro] ${addon.is_available === false ? 'text-gray-400' : 'text-gray-700'}`}>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className={`text-2xl font-bold font-[BasisGrotesquePro] ${addon.is_available === false ? 'text-gray-300' : 'text-gray-900'}`}>
                            {isIncluded ? '$0.00' : addon.price_display || `$${parseFloat(addon.price || 0).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {addon.billing_frequency === 'monthly' ? 'per month' : 'one-time fee'}
                        </span>
                    </div>

                    {!isIncluded && (
                        addon.is_available === false ? (
                            <button
                                disabled
                                className="px-5 py-2 !rounded-xl bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed font-bold text-[10px] uppercase tracking-wider"
                            >
                                Upgrade Plan
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAddAddon(addon.id, addon.name)}
                                disabled={addon.is_added || addingAddon === addon.id}
                                className={`px-6 py-2.5 !rounded-xl transition-all duration-300 font-bold text-sm shadow-sm ${addon.is_added
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : addingAddon === addon.id
                                        ? 'bg-[#3AD6F2] text-white cursor-wait'
                                        : 'bg-[#F56D2D] text-white hover:bg-[#EA580C] hover:shadow-md transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {addingAddon === addon.id ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Adding
                                    </span>
                                ) : addon.is_added ? 'Enabled' : 'Activate Now'}
                            </button>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fadeIn">


        </div>
    );
};

export default AddOns;
