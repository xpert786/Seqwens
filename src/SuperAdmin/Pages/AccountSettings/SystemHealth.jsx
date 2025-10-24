import React, { useState } from "react";

export default function SystemHealth() {
    const [featureFlags, setFeatureFlags] = useState({
        newDashboardUI: true,
        advancedAnalytics: true,
        mobileAppIntegration: false,
        aiPoweredInsights: true,
        realTimeNotifications: true
    });

    const systemMetrics = [
        { name: "CPU Usage", percentage: 45 },
        { name: "Memory Usage", percentage: 67 },
        { name: "Disk Usage", percentage: 37 },
        { name: "Network I/O", percentage: 89 },
        { name: "Database Health", percentage: 92 }
    ];

    const features = [
        {
            id: "newDashboardUI",
            name: "New Dashboard UI",
            description: "Updated dashboard interface",
            rolloutProgress: 100,
            enabled: featureFlags.newDashboardUI
        },
        {
            id: "advancedAnalytics",
            name: "Advanced Analytics",
            description: "Enhanced reporting features",
            rolloutProgress: 75,
            enabled: featureFlags.advancedAnalytics
        },
        {
            id: "mobileAppIntegration",
            name: "Mobile App Integration",
            description: "Mobile app connectivity",
            rolloutProgress: 0,
            enabled: featureFlags.mobileAppIntegration
        },
        {
            id: "aiPoweredInsights",
            name: "AI-Powered Insights",
            description: "Machine learning analytics",
            rolloutProgress: 25,
            enabled: featureFlags.aiPoweredInsights
        },
        {
            id: "realTimeNotifications",
            name: "Real-time Notifications",
            description: "Instant push notifications",
            rolloutProgress: 100,
            enabled: featureFlags.realTimeNotifications
        }
    ];

    const toggleFeature = (featureId) => {
        setFeatureFlags(prev => ({
            ...prev,
            [featureId]: !prev[featureId]
        }));
    };

    return (
        <div className=" rounded-xl min-h-screen">
            {/* System Health Monitor Section */}
            <div className="bg-white p-6 rounded-xl mb-6">
                {/* Header */}
                <div className="mb-6">
                    <h5 className="text-gray-800 text-2xl font-medium font-[BasisGrotesquePro] mb-2">
                        System Health Monitor
                    </h5>
                    <p className="text-gray-500 text-sm font-normal font-[BasisGrotesquePro]">
                        Real-time system performance and resource usage
                    </p>
                </div>

                {/* System Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {systemMetrics.map((metric, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                                    {metric.name}
                                </div>
                                <div className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                                    {metric.percentage}%
                                </div>
                            </div>
                            <div className="w-full h-2 bg-[#E8F0FF] rounded-full overflow-hidden relative">
                                <div 
                                    className="h-full bg-[#3B4A66] rounded-full transition-all duration-300 ease-in-out"
                                    style={{ width: `${metric.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feature Flags Section */}
            <div className="bg-white p-6 rounded-xl mb-6">
                {/* Header */}
                <div className="mb-6">
                    <h5 className="text-gray-800 text-2xl font-medium font-[BasisGrotesquePro] mb-2">
                        Feature Flags
                    </h5>
                    <p className="text-gray-500 text-sm font-normal font-[BasisGrotesquePro]">
                        Control feature rollouts and A/B testing
                    </p>
                </div>

                {/* Feature Flags List */}
                <div className="flex flex-col gap-4 ">
                    {features.map((feature) => (
                        <div key={feature.id} className="bg-white border border-gray-200 rounded-lg p-5">
                            {/* First Row: Toggle, Title, Configure Button */}
                            <div className="flex items-center gap-5 mb-4">
                                {/* Toggle Switch */}
                                <div 
                                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 ${
                                        feature.enabled ? 'bg-orange-500' : 'bg-gray-300'
                                    }`}
                                    onClick={() => toggleFeature(feature.id)}
                                >
                                    <div 
                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                                            feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                        }`}
                                    />
                                </div>

                                {/* Feature Info */}
                                <div className="flex-1">
                                    <div className="text-gray-800 text-base font-medium font-[BasisGrotesquePro] mb-1">
                                        {feature.name}
                                    </div>
                                    <div className="text-gray-500 text-sm font-normal font-[BasisGrotesquePro]">
                                        {feature.description}
                                    </div>
                                </div>

                                {/* Configure Button */}
                                <button
                                    type="button"
                                    className="bg-orange-500 text-white text-sm font-normal font-[BasisGrotesquePro] border-none px-4 py-2 rounded cursor-pointer flex-shrink-0 hover:bg-orange-600 transition-colors duration-200"
                                >
                                    Configure
                                </button>
                            </div>

                            {/* Second Row: Progress Bar with Full Width */}
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 text-sm font-medium font-[BasisGrotesquePro]">
                                        Rollout Progress
                                    </span>
                                    <span className="text-gray-500 text-sm font-normal font-[BasisGrotesquePro]">
                                        {feature.rolloutProgress}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-[#E8F0FF] rounded overflow-hidden relative">
                                    <div 
                                        className="h-full bg-[#3B4A66] rounded transition-all duration-300 ease-in-out"
                                        style={{ width: `${feature.rolloutProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
