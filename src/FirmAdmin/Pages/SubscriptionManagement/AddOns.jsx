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

    // Fetch marketplace add-ons (Full Master List)
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

    // Fetch active add-ons for this firm
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
            // Don't set global error here to avoid blocking Browse tab if active fails
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
            <div className={`group bg-white !rounded-3xl border border-[#E8F0FF] p-8 relative shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full ${addon.is_added ? 'ring-2 ring-green-100/50' : ''}`}>
                {/* Status Badges */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-wrap gap-2">
                        {isIncluded ? (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 !rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-indigo-100 shadow-sm">
                                Included in Plan
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-orange-50 text-orange-600 !rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-orange-100 shadow-sm">
                                Marketplace
                            </span>
                        )}
                        {addon.is_added && (
                            <span className="px-3 py-1 bg-green-50 text-green-600 !rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-green-100 shadow-sm flex items-center gap-1.5 font-[BasisGrotesquePro]">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                            </span>
                        )}
                        {addon.is_available === false && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-400 !rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-gray-200">
                                Plan Upgrade Required
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-grow">
                    <h5 className="text-2xl font-black text-[#1A1C21] font-[BasisGrotesquePro] mb-3 group-hover:text-[#3AD6F2] transition-colors leading-tight">{addon.name}</h5>
                    <p className={`text-sm text-gray-500 font-[BasisGrotesquePro] leading-relaxed mb-8 line-clamp-3 ${addon.is_available === false ? 'opacity-60' : ''}`}>{addon.description || 'Enhance your experience with this powerful add-on feature.'}</p>

                    <div className="space-y-4 mb-8 bg-gray-50/50 p-5 !rounded-2xl border border-gray-50/80">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-[BasisGrotesquePro]">Key Capabilities</div>
                        <ul className="space-y-3.5">
                            {features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-5 h-5 !rounded-lg flex items-center justify-center mt-0.5 ${addon.is_available === false ? 'bg-gray-100' : 'bg-[#3AD6F2]/20'}`}>
                                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10.5 1.5L4.5 9L1.5 6" stroke={addon.is_available === false ? "#A0AEC0" : "#3AD6F2"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className={`text-[13px] font-bold font-[BasisGrotesquePro] ${addon.is_available === false ? 'text-gray-400' : 'text-[#1A1C21]/80'}`}>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-black font-[BasisGrotesquePro] tracking-tight ${addon.is_available === false ? 'text-gray-300' : 'text-[#1A1C21]'}`}>
                                {isIncluded ? '$0' : (addon.price_display ? addon.price_display.split('/')[0] : `$${parseFloat(addon.price || 0).toFixed(0)}`)}
                            </span>
                            <span className="text-xs font-black text-gray-400">/mo</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                            {addon.billing_frequency === 'monthly' ? 'monthly sub' : 'one-time fee'}
                        </span>
                    </div>

                    {!isIncluded && (
                        addon.is_available === false ? (
                            <button
                                disabled
                                className="px-6 py-3.5 !rounded-xl bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed font-black text-[11px] uppercase tracking-wider"
                            >
                                Upgrade Plan
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAddAddon(addon.id, addon.name)}
                                disabled={addon.is_added || addingAddon === addon.id}
                                className={`px-8 py-4 !rounded-2xl transition-all duration-500 font-black text-[13px] shadow-sm transform ${addon.is_added
                                    ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                                    : addingAddon === addon.id
                                        ? 'bg-[#3AD6F2] text-white cursor-wait shadow-xl'
                                        : 'bg-[#F56D2D] text-white hover:bg-[#EA580C] hover:shadow-2xl hover:-translate-y-1 active:scale-95'
                                    }`}
                            >
                                {addingAddon === addon.id ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Adding...
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
        <div className="animate-fadeIn pb-12 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white !rounded-3xl border border-[#E8F0FF] p-8 mb-10 shadow-[0_4px_20px_-4px_rgba(232,240,255,0.4)] relative overflow-hidden">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3AD6F2]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                    <div>
                        <h4 className="text-3xl font-black text-[#1A1C21] font-[BasisGrotesquePro] mb-2 tracking-tight">Add-ons Marketplace</h4>
                        <p className="text-gray-500 text-base font-medium font-[BasisGrotesquePro] max-w-xl leading-relaxed">Boost your firm's productivity and client experience with curated enterprise-grade integrations.</p>
                    </div>
                    <div className="flex bg-gray-100/80 p-1.5 !rounded-2xl border border-gray-100/50 self-stretch md:self-auto shadow-inner">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`px-8 py-3 !rounded-xl text-[13px] font-bold transition-all duration-500 ${activeTab === 'browse' ? 'bg-white text-[#F56D2D] shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Explore Marketplace
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-8 py-3 !rounded-xl text-[13px] font-bold transition-all duration-500 flex items-center gap-2 ${activeTab === 'active' ? 'bg-white text-[#F56D2D] shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Manage My Features
                            {activeAddOns.length > 0 && (
                                <span className={`px-2 py-0.5 !rounded-full text-[10px] ${activeTab === 'active' ? 'bg-orange-50 text-orange-600' : 'bg-gray-200 text-gray-600'}`}>
                                    {activeAddOns.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#3AD6F2]/10 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-[#3AD6F2] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-400 font-black mt-8 tracking-[0.3em] uppercase text-[10px]">Curating Experience...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50/50 border border-red-100 text-red-600 p-12 !rounded-3xl text-center max-w-2xl mx-auto shadow-sm">
                    <div className="w-20 h-20 bg-red-100 text-red-600 !rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h5 className="font-black text-2xl mb-2 text-red-900 leading-tight">Sync Encountered a Problem</h5>
                    <p className="text-sm text-red-700/80 mb-8 max-w-md mx-auto font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-10 py-4 bg-red-600 text-white !rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-100 hover:shadow-red-200 active:scale-95"
                    >
                        Re-initialize Catalogue
                    </button>
                </div>
            ) : activeTab === 'browse' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1">
                        <div className="bg-white !rounded-[2.5rem] border border-[#E8F0FF] p-8 shadow-sm lg:sticky lg:top-32 transition-all duration-300">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <div className="w-8 h-[1px] bg-gray-200"></div>
                                Categories
                            </h4>
                            <div className="space-y-3 mb-12">
                                {CATEGORIES.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 !rounded-2xl transition-all duration-500 group relative ${selectedCategory === category.id
                                            ? 'bg-[#3AD6F2]/10 text-[#3AD6F2] shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <div className={`p-2.5 !rounded-xl transition-all duration-500 ${selectedCategory === category.id
                                            ? 'bg-[#3AD6F2] text-white rotate-6 shadow-md'
                                            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'}`}>
                                            {category.icon}
                                        </div>
                                        <span className={`text-[14px] font-black ${selectedCategory === category.id ? 'translate-x-1' : 'transition-transform duration-300'}`}>{category.label}</span>
                                        {selectedCategory === category.id && (
                                            <div className="absolute right-5 w-1.5 h-1.5 bg-[#3AD6F2] rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-10 border-t border-gray-100">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3 font-[BasisGrotesquePro]">
                                    <div className="w-8 h-[1px] bg-gray-200"></div>
                                    Find add-on
                                </h4>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Quick search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4.5 bg-gray-50/50 border border-gray-100 !rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#3AD6F2]/10 focus:bg-white focus:border-[#3AD6F2]/30 transition-all duration-500 text-sm font-bold placeholder:text-gray-300"
                                    />
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#3AD6F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add-on Grid */}
                    <div className="lg:col-span-3">
                        {filteredAddons.length === 0 ? (
                            <div className="bg-white !rounded-2xl border border-dashed border-gray-200 py-24 text-center">
                                <div className="w-20 h-20 bg-gray-50 !rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-gray-900 font-bold mb-1">No add-ons found</h4>
                                <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                                <button
                                    onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                                    className="mt-6 text-[#3AD6F2] font-bold text-sm hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                {filteredAddons.map(addon => (
                                    <MarketplaceCard key={addon.id} addon={addon} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-slideUp">
                    {/* Active Add-ons Summary */}
                    <div className="bg-[#1A1C21] !rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-[#3AD6F2]/20 rounded-full blur-[120px] transition-all duration-1000"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="max-w-xl text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 !rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 backdrop-blur-md">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.5)]"></div>
                                    Subscription Status: Optimized
                                </div>
                                <h3 className="text-4xl font-black mb-4 tracking-tight leading-tight">My Active Features</h3>
                                <p className="text-gray-400 text-lg font-medium leading-relaxed">Your firm is currently leveraging {activeAddOns.length} enterprise add-ons. You're operating at peak efficiency.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-2xl p-10 !rounded-[2rem] border border-white/10 text-center min-w-[300px] shadow-2xl transition hover:scale-105 duration-500">
                                <p className="text-[11px] uppercase font-black tracking-[0.3em] text-gray-400 mb-2">Total Monthly Investment</p>
                                <div className="flex items-baseline justify-center gap-1.5">
                                    <p className="text-6xl font-black tracking-tighter">${parseFloat(totalAddonCost || 0).toFixed(0)}</p>
                                    <span className="text-xl font-bold text-[#F56D2D]">.00</span>
                                </div>
                                <p className="text-xs font-bold text-gray-500 mt-2">Prorated adjustments applied cycles</p>
                            </div>
                        </div>
                    </div>

                    {activeAddOns.length === 0 ? (
                        <div className="bg-white !rounded-[3rem] border border-dashed border-gray-200 py-40 text-center shadow-inner">
                            <div className="w-28 h-28 bg-gray-50 !rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm">
                                <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h4 className="text-[#1A1C21] font-black text-3xl mb-4">No active enhancements</h4>
                            <p className="text-gray-500 text-lg max-w-lg mx-auto mb-12 font-medium leading-relaxed">Your firm hasn't activated any marketplace features yet. Unlock more power by exploring our curated add-ons.</p>
                            <button
                                onClick={() => setActiveTab('browse')}
                                className="px-12 py-4 bg-[#F56D2D] text-white !rounded-2xl font-black text-base shadow-2xl shadow-orange-100/50 hover:shadow-orange-200 transform transition-all hover:-translate-y-1.5 active:scale-95"
                            >
                                Browse Enhancements
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {activeAddOns.map(firmAddon => (
                                <div key={firmAddon.id} className="bg-white !rounded-3xl border border-[#E8F0FF] p-8 shadow-sm flex flex-col hover:shadow-xl transition-all duration-500 group relative border-green-100/50">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 bg-green-50 text-green-600 !rounded-2xl shadow-inner group-hover:rotate-6 transition-transform">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Cost</p>
                                            <p className="text-2xl font-black text-[#1A1C21] tracking-tight">${parseFloat(firmAddon.monthly_cost || 0).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <h4 className="font-extrabold text-[#1A1C21] text-xl mb-3 group-hover:text-[#3AD6F2] transition-colors leading-tight">{firmAddon.addon?.name || 'Standard Add-on'}</h4>
                                        <p className="text-sm text-gray-500 font-medium line-clamp-3 mb-8 h-15 leading-relaxed font-[BasisGrotesquePro]">{firmAddon.addon?.description}</p>

                                        {firmAddon.usage_limit && (
                                            <div className="space-y-4 mb-8 p-5 bg-gray-50 !rounded-2xl border border-gray-100 shadow-inner">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency Status</span>
                                                    <span className="text-[13px] font-black text-[#1A1C21]">{firmAddon.usage_display}</span>
                                                </div>
                                                <div className="w-full bg-white rounded-full h-3 p-1 border border-gray-100 shadow-sm">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 relative ${firmAddon.usage_percentage > 90 
                                                            ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                                            : firmAddon.usage_percentage > 70 
                                                                ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                                                                : 'bg-gradient-to-r from-[#3AD6F2] to-[#3AD6F2]/80'}`}
                                                        style={{ width: `${firmAddon.usage_percentage}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 rounded-full animate-shimmer"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-8 border-t border-gray-100 flex flex-col gap-4">
                                        <div className="flex justify-between items-center bg-gray-50/50 px-5 py-4 !rounded-xl">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">Activated On</span>
                                            <span className="text-xs font-black text-gray-700 bg-white px-3 py-1.5 !rounded-lg border border-gray-100 shadow-sm">{firmAddon.started_at ? new Date(firmAddon.started_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAddon(firmAddon, firmAddon.addon?.name)}
                                            disabled={removingAddon === (firmAddon.addon?.id || firmAddon.addon_id)}
                                            className="w-full py-4 !rounded-2xl text-red-600 bg-red-50/50 border border-red-100 font-black text-[13px] hover:bg-red-50 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg active:scale-95"
                                        >
                                            {removingAddon === (firmAddon.addon?.id || firmAddon.addon_id) ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                    Revoking Access...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Deactivate Feature
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={showRemoveAddonConfirm}
                onClose={() => setShowRemoveAddonConfirm(false)}
                onConfirm={confirmRemoveAddon}
                title="Deactivate Enhancement"
                message={`Are you sure you want to retire '${addonToRemove?.addonName}'? This action will immediately terminate access for all firm members. Prorated adjustments will be applied to your next billing cycle.`}
                confirmText="Retire Feature"
                confirmButtonClassName="bg-red-600 hover:bg-red-700 !rounded-2xl font-black text-sm py-4 px-10 shadow-xl shadow-red-100"
                cancelButtonClassName="!rounded-2xl font-black text-sm py-4 px-10 border-gray-200"
            />
        </div>
    );
};

export default AddOns;
