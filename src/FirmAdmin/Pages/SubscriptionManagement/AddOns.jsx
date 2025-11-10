import React, { useState } from 'react';

const AddOns = () => {
    const [activeTab, setActiveTab] = useState('browse');

    const browseAddOns = [
        {
            id: 1,
            title: "Extra E-Signature Envelopes",
            description: "Additional e-signature capacity for busy seasons",
            badge: "Available",
            features: ["Pay per envelope used", "No monthly commitment", "Instant activation"],
            usage: { label: "Usage", current: 45, total: 100, unit: "envelopes" },
            price: "$0.5",
            priceLabel: "per use"
        },
        {
            id: 2,
            title: "SMS Credit Bundle",
            description: "Send SMS notifications and reminders to clients",
            badge: "Available",
            features: ["1000 SMS credits included", "Automated reminders", "Two-way messaging"],
            usage: { label: "Usage", current: 250, total: 1000, unit: "credits" },
            price: "$50",
            priceLabel: "for credits"
        },
        {
            id: 3,
            title: "Additional Staff Seats",
            description: "Add more team members to your account",
            badge: "Available",
            features: ["Full feature access", "Individual permissions", "User activity tracking"],
            usage: { label: "Usage", current: 3, total: 5, unit: "seats" },
            price: "$25/month",
            priceLabel: "monthly billing"
        },
        {
            id: 4,
            title: "Premium Security Package",
            description: "Enhanced security features and monitoring",
            badge: "Available",
            features: ["Advanced threat detection", "Real-time security monitoring", "Enhanced encryption"],
            price: "$99/month",
            priceLabel: "monthly billing"
        },
        {
            id: 5,
            title: "Advanced Analytics Suite",
            description: "Deep insights into your practice performance",
            badge: "Available",
            features: ["Custom dashboard builder", "Revenue forecasting", "Client behavior analytics"],
            price: "$79/month",
            priceLabel: "monthly billing"
        },
        {
            id: 6,
            title: "AI Compliance Assistant",
            description: "Intelligent compliance monitoring and alerts",
            badge: "Available",
            features: ["Real-time compliance scanning", "Regulatory update alerts", "Document risk assessment"],
            price: "$149/month",
            priceLabel: "monthly billing"
        }
    ];

    const myAddOns = [
        {
            id: 1,
            title: "Additional Staff Seats",
            price: "$25/month",
            badge: "Available",
            usage: { label: "Current Usage", current: 3, total: 5, unit: "seats" }
        },
        {
            id: 2,
            title: "Additional Cloud Storage",
            price: "$29/month",
            usage: { label: "Current Usage", current: 35, total: 50, unit: "GB" }
        }
    ];

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
                            My Add-on's({myAddOns.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Browse Add-on's Content */}
            {activeTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {browseAddOns.map((addon) => (
                <div key={addon.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.title}</h6>
                        {addon.badge && (
                            <span className="px-2 py-1 bg-[#FFFFFF] !border border-[#E8F0FF] text-gray-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                {addon.badge}
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

                    {addon.usage && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">{addon.usage.label}</span>
                                <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">{addon.usage.current}/{addon.usage.total} {addon.usage.unit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: `${(addon.usage.current / addon.usage.total) * 100}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-end justify-between gap-3">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.price}</span>
                            <span className="text-sm text-gray-600 font-bold font-[BasisGrotesquePro]">{addon.priceLabel}</span>
                        </div>
                        <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-sm font-medium whitespace-nowrap">
                            Add
                        </button>
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* My Add-on's Content */}
            {activeTab === 'myAddons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {myAddOns.map((addon) => (
                <div key={addon.id} className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 relative shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h6 className="text-lg font-bold text-gray-900 font-[BasisGrotesquePro]">{addon.title}</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">{addon.price}</p>
                        </div>
                        {addon.badge && (
                            <span className="px-2 py-1 bg-[#FFFFFF] !border border-[#E8F0FF] text-gray-700 !rounded-full text-xs font-medium font-[BasisGrotesquePro] whitespace-nowrap">
                                {addon.badge}
                            </span>
                        )}
                    </div>

                    {addon.usage && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600 font-[BasisGrotesquePro]">{addon.usage.label}</span>
                                <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">{addon.usage.current}/{addon.usage.total} {addon.usage.unit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-[#3AD6F2] h-2 rounded-full" style={{ width: `${(addon.usage.current / addon.usage.total) * 100}%` }}></div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button className="flex-1 px-4 py-2 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                            Manage
                        </button>
                        <button className="flex-1 px-4 py-2 bg-white !border border-[#3B4A66] text-gray-700 !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                            Remove
                        </button>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
    );
};

export default AddOns;


