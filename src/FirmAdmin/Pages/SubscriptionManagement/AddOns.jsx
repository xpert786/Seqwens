import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { handleAPIError, firmAdminAddonsAPI } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../../components/ConfirmationModal';

const CATEGORIES = [
    {
        id: 'all', label: 'All Add-ons', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H10V10H4V4ZM4 14H10V20H4V14ZM14 4H20V10H14V4ZM14 14H20V20H14V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'esign', label: 'E-Sign', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.5 3.5A2.121 2.121 0 0 1 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'storage', label: 'Storage', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V21H3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 3H1V8H23V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'workflow', label: 'Workflows', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12A10 10 0 1 1 17.07 2.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'office', label: 'Offices', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V9H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 21V5H19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'staff', label: 'Staff', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'other', label: 'Extensions', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

    const fetchMarketplaceAddOns = useCallback(async () => {
        try {
            const response = await firmAdminAddonsAPI.listAllAvailableAddons();
            if (response.success && response.data) {
                setMarketplaceAddOns(Array.isArray(response.data) ? response.data : []);
            } else {
                setMarketplaceAddOns([]);
            }
        } catch (err) {
            console.error('Error fetching marketplace add-ons:', err);
            const errorMsg = handleAPIError(err);
            setError(errorMsg || 'Failed to load marketplace add-ons.');
        }
    }, []);

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

    const filteredAddons = useMemo(() => {
        return marketplaceAddOns.filter(addon => {
            const matchesCategory = selectedCategory === 'all' ||
                (addon.category && addon.category.toLowerCase() === selectedCategory.toLowerCase());
            const matchesSearch = !searchQuery ||
                addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (addon.description && addon.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [marketplaceAddOns, selectedCategory, searchQuery]);

    const MarketplaceCard = ({ addon }) => {
        const isIncluded = addon.is_included;
        const features = addon.features && addon.features.length > 0 ? addon.features.slice(0, 3) : [];

        return (
            <div className="bg-white border border-gray-100 rounded-xl p-6 transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                        {isIncluded ? (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase border border-indigo-100">
                                Included
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded text-[10px] font-bold uppercase border border-gray-100">
                                Marketplace
                            </span>
                        )}
                        {addon.is_added && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold uppercase border border-green-100">
                                Active
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <h5 className="text-base font-bold text-gray-900 mb-0.5">{addon.name}</h5>
                    {addon.capacity_display && (
                        <div className="text-sm font-semibold text-[#3AD6F2]">{addon.capacity_display}</div>
                    )}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-grow">{addon.description}</p>

                {features.length > 0 && (
                    <div className="space-y-1.5 mb-6 border-t border-gray-50 pt-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-[11px] text-gray-500">
                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-6 border-t border-gray-50 flex flex-col gap-4">
                    <div className="flex flex-col text-left">
                        <div className="text-2xl font-bold text-gray-900">
                            {isIncluded ? 'Included' : (addon.price_display || `$${parseFloat(addon.price || 0).toFixed(0)}`)}
                        </div>
                        {addon.scope === 'office' && !isIncluded && (
                            <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">
                                Per Office
                            </div>
                        )}
                    </div>

                    {!isIncluded && (
                        <div className="w-full">
                            {addon.is_available === false ? (
                                <button disabled className="w-full px-4 py-3 rounded-lg bg-gray-50 text-gray-400 text-sm font-bold border border-gray-100 cursor-not-allowed">
                                    Upgrade Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAddAddon(addon.id, addon.name)}
                                    disabled={addon.is_added || addingAddon === addon.id}
                                    className={`w-full px-6 py-3 rounded-lg text-sm font-bold transition-all ${addon.is_added
                                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                        : 'bg-[#007EAF] text-white hover:bg-[#006a94] shadow-sm'
                                        }`}
                                    style={{ borderRadius: "8px" }}
                                >
                                    {addingAddon === addon.id ? 'Starting...' : addon.is_added ? 'Activated' : 'Activate'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fadeIn pb-12">
            {/* Simple Clean Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
                <div>
                    <h4 className="text-2xl font-bold text-gray-900">Add-ons & Marketplace</h4>
                    <p className="text-sm text-gray-500 mt-1">Enhance your firm capabilities with integrated features.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Explore
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage My Features
                        {activeAddOns.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'active' ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-600'}`}>
                                {activeAddOns.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-[#3AD6F2] rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-400 font-bold mt-4 uppercase tracking-widest">Loading marketplace...</p>
                </div>
            ) : error ? (
                <div className="bg-white border border-red-100 p-10 rounded-2xl text-center">
                    <h5 className="text-red-900 font-bold mb-2">Something went wrong</h5>
                    <p className="text-sm text-red-600 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all">
                        Try Again
                    </button>
                </div>
            ) : activeTab === 'browse' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Simplified Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 sticky top-24 shadow-sm">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-left" style={{ fontFamily: 'BasisGrotesquePro' }}>CATEGORIES</h4>
                            <div className="flex flex-col space-y-1">
                                {CATEGORIES.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full flex items-center px-3 py-3 rounded-lg text-[14px] font-bold transition-all text-left justify-start group ${selectedCategory === category.id
                                            ? 'bg-blue-50 text-[#007EAF]'
                                            : 'text-gray-600 hover:bg-gray-50'}`}
                                        style={{ fontFamily: 'BasisGrotesquePro' }}
                                    >
                                        <div className={`w-8 flex-shrink-0 flex items-center justify-start transition-colors ${selectedCategory === category.id ? 'text-[#007EAF]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                            {category.icon}
                                        </div>
                                        <span className="whitespace-nowrap">{category.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-10 pt-10 border-t border-gray-100">
                                <h4 className="text-xl font-bold text-[#3B4A66]/80 uppercase tracking-tight mb-6" style={{ fontFamily: 'BasisGrotesquePro' }}>SEARCH</h4>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Find add-on..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple Marketplace Grid */}
                    <div className="lg:col-span-9">
                        {filteredAddons.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-20 text-center">
                                <p className="text-sm text-gray-500 font-medium">No results found matching your search.</p>
                                <button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }} className="mt-3 text-xs font-bold text-[#3AD6F2]">
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredAddons.map(addon => (
                                    <MarketplaceCard key={addon.id} addon={addon} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Clean Simple Summary */}
                    <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Active Enhancements</h3>
                            <p className="text-sm text-gray-500 mt-1">You are currently using {activeAddOns.length} active add-ons for your firm.</p>
                        </div>
                        <div className="text-center md:text-right border-l border-gray-50 pl-8">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Monthly Billing Impact</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">${parseFloat(totalAddonCost || 0).toFixed(0)}<span className="text-sm font-bold text-gray-400">.00</span></p>
                        </div>
                    </div>

                    {activeAddOns.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-200 rounded-xl py-24 text-center">
                            <h4 className="text-gray-900 font-bold mb-2">No active enhancements</h4>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">You haven't activated any marketplace features yet. Enhance your firm capacity by browsing our add-ons.</p>
                            <button onClick={() => setActiveTab('browse')} className="px-8 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all">
                                Browse Catalogue
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeAddOns.map(firmAddon => (
                                <div key={firmAddon.id} className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cost</p>
                                            <p className="text-lg font-bold text-gray-900">${parseFloat(firmAddon.monthly_cost || 0).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900 mb-1 leading-tight">{firmAddon.addon?.name || 'Add-on'}</h4>
                                        {firmAddon.capacity_display && (
                                            <div className="text-xs font-semibold text-[#3AD6F2] mb-3">{firmAddon.capacity_display} Included</div>
                                        )}
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{firmAddon.addon?.description}</p>
                                    </div>

                                    {firmAddon.usage_limit && (
                                        <div className="space-y-2 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usage</span>
                                                <span className="text-xs font-bold text-gray-900">{firmAddon.usage_display}</span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-1.5 border border-gray-100 p-0.5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${firmAddon.usage_percentage > 90 ? 'bg-red-500' : firmAddon.usage_percentage > 70 ? 'bg-orange-500' : 'bg-[#3AD6F2]'}`}
                                                    style={{ width: `${firmAddon.usage_percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Since {firmAddon.started_at ? new Date(firmAddon.started_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAddon(firmAddon, firmAddon.addon?.name)}
                                            disabled={removingAddon === (firmAddon.addon?.id || firmAddon.addon_id)}
                                            className="text-red-500 font-bold text-xs hover:text-red-700 transition-all flex items-center gap-1.5"

                                            style={{ borderRadius: "8px" }}

                                        >
                                            {removingAddon === (firmAddon.addon?.id || firmAddon.addon_id) ? 'Stopping...' : 'Deactivate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }

            <ConfirmationModal
                isOpen={showRemoveAddonConfirm}
                onClose={() => setShowRemoveAddonConfirm(false)}
                onConfirm={confirmRemoveAddon}
                title="Deactivate Add-on"
                message={`Are you sure you want to stop using '${addonToRemove?.addonName}'? This will remove access for all firm members.`}
                confirmText="Confirm Deactivation"
                confirmButtonClassName="bg-red-600 hover:bg-red-700 rounded-lg font-bold text-xs px-6 py-2"
                cancelButtonClassName="rounded-lg font-bold text-xs px-6 py-2 border-gray-200"
            />
        </div >
    );
};

export default AddOns;
