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
            {/* Header Section */}
            <div className="mb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="max-w-xl">
                        <h5 className="text-3xl font-extrabold text-gray-900 mb-3 font-[BasisGrotesquePro] tracking-tight">Add-On Marketplace</h5>
                        <p className="text-[#3B4A66] font-[BasisGrotesquePro] text-lg leading-relaxed">
                            Supercharge your platform with specialized tools and expanded limits designed to grow with your practice.
                        </p>
                    </div>

                    <div className="flex bg-white !rounded-2xl !border border-[#E8F0FF] p-1.5 shadow-sm">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`px-6 py-2.5 !rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'browse'
                                ? 'bg-[#3AD6F2] text-white shadow-lg'
                                : 'bg-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Explore Marketplace
                        </button>
                        <button
                            onClick={() => setActiveTab('myAddons')}
                            className={`px-6 py-2.5 !rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'myAddons'
                                ? 'bg-[#3AD6F2] text-white shadow-lg'
                                : 'bg-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            My Inventory
                            <span className={`px-2 py-0.5 !rounded-full text-[10px] font-black ${activeTab === 'myAddons' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {activeAddOns.length}
                            </span>
                        </button>
                    </div>
                </div>

                {activeTab === 'browse' && (
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 !rounded-2xl border border-white/50 shadow-inner">
                        {/* Search */}
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search extensions..."
                                className="block w-full pl-11 pr-4 py-3 bg-white !border border-[#E8F0FF] !rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3AD6F2]/30 focus:border-[#3AD6F2] transition-all outline-none"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 !rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.id
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-[#E8F0FF] hover:border-gray-300'
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="16" r="1" fill="currentColor" />
                        </svg>
                    </div>
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <div className="w-16 h-16 border-4 border-[#3AD6F2]/20 border-t-[#3AD6F2] rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Global Catalog...</p>
                </div>
            ) : (
                <div className="mt-6">
                    {/* Browse Content */}
                    {activeTab === 'browse' && (
                        <>
                            {filteredAddons.length === 0 ? (
                                <div className="text-center py-24 bg-white/50 !rounded-3xl border border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.8663 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h6 className="text-xl font-bold text-gray-900 mb-2">No extensions matched your search</h6>
                                    <p className="text-gray-500">Try adjusting your filters or search query to find what you need.</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                        className="mt-6 px-6 py-2 bg-gray-900 text-white !rounded-xl font-bold text-sm"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredAddons.map((addon) => (
                                        <MarketplaceCard key={addon.id} addon={addon} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Inventory Content */}
                    {activeTab === 'myAddons' && (
                        <div className="space-y-8">
                            {/* Costs Summary */}
                            {totalAddonCost > 0 && (
                                <div className="bg-gradient-to-r from-gray-900 to-[#1e293b] !rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#3AD6F2]/10 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700 group-hover:scale-125"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Current Commitment</p>
                                            <div className="flex items-baseline gap-2">
                                                <h2 className="text-5xl font-black">${totalAddonCost.toFixed(2)}</h2>
                                                <span className="text-gray-400 font-bold">/monthly</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 px-8 py-4 bg-white/5 backdrop-blur-md !rounded-2xl border border-white/10">
                                            <div className="text-center border-r border-white/10 pr-6">
                                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter mb-1">Active Modules</p>
                                                <p className="text-2xl font-black">{activeAddOns.length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter mb-1">Total Savings</p>
                                                <p className="text-2xl font-black text-[#3AD6F2]">$0.00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeAddOns.length === 0 ? (
                                <div className="text-center py-24 bg-white !rounded-3xl border border-dashed border-gray-200 shadow-sm">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C10.8954 2 10 2.89543 10 4V6H7C5.89543 6 5 6.89543 5 8V11H3C1.89543 11 1 11.8954 1 13V15C1 16.1046 1.89543 17 3 17H5V20C5 21.1046 5.89543 22 7 22H10V20C10 18.8954 10.8954 18 12 18C13.1046 18 14 18.8954 14 20V22H17C18.1046 22 19 21.1046 19 20V17H21C22.1046 17 23 16.1046 23 15V13C23 11.8954 22.1046 11 21 11H19V8C19 6.89543 18.1046 6 17 6H14V4C14 2.89543 13.1046 2 12 2Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h6 className="text-xl font-bold text-gray-900 mb-2">Inventory Empty</h6>
                                    <p className="text-gray-500 max-w-sm mx-auto">Explore our catalog of professional extensions to unlock advanced platform capabilities.</p>
                                    <button
                                        onClick={() => setActiveTab('browse')}
                                        className="mt-8 px-8 py-3 bg-[#F56D2D] text-white !rounded-xl font-bold shadow-lg hover:bg-[#EA580C] transition-all transform hover:scale-105"
                                    >
                                        Browse Marketplace
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {activeAddOns.map((firmAddon) => {
                                        const addon = firmAddon.addon || {};
                                        return (
                                            <div key={firmAddon.id} className="bg-white !rounded-2xl !border border-[#E8F0FF] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h6 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.name}</h6>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className={`w-2 h-2 rounded-full ${firmAddon.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                                                {firmAddon.is_active ? 'Active Extension' : 'Awaiting Activation'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6 line-clamp-2">
                                                    {addon.description || "Enhanced capabilities for your platform engagement."}
                                                </p>

                                                {firmAddon.usage_limit && (
                                                    <div className="mb-6 p-4 bg-gray-50 !rounded-xl border border-gray-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">System Utilization</span>
                                                            <span className="text-xs font-black text-gray-900">
                                                                {firmAddon.usage_display || `${firmAddon.usage} / ${firmAddon.usage_limit}`}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-[#3AD6F2] to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                                                                style={{
                                                                    width: `${Math.min(firmAddon.usage_percentage || 0, 100)}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">Monthly Cost</p>
                                                        <p className="text-lg font-black text-gray-900">${firmAddon.monthly_cost?.toFixed(2) || '0.00'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveAddon(firmAddon, addon.name)}
                                                        disabled={removingAddon === (firmAddon.addon?.id || firmAddon.addon_id)}
                                                        className="px-5 py-2 !rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-all border border-red-100 disabled:opacity-50"
                                                    >
                                                        {removingAddon === (firmAddon.addon?.id || firmAddon.addon_id) ? 'Deactivating...' : 'Deactivate'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Remove Addon Confirmation */}
            <ConfirmationModal
                isOpen={showRemoveAddonConfirm}
                onClose={() => {
                    if (!removingAddon) {
                        setShowRemoveAddonConfirm(false);
                        setAddonToRemove(null);
                    }
                }}
                onConfirm={confirmRemoveAddon}
                title="Deactivate Extension"
                message={addonToRemove ? `Confirm deactivation of "${addonToRemove.addonName}". This will immediately revoke access but you will be billed until the end of the current period.` : "Confirm deactivation of this extension."}
                confirmText="Deactivate Extension"
                cancelText="Keep Extension"
                isLoading={!!removingAddon}
                isDestructive={true}
            />
        </div>
    );
};

export default AddOns;
