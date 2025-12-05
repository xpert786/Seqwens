import React, { useEffect, useMemo, useState } from "react";
import { superAdminAPI, handleAPIError } from "../../utils/superAdminAPI";
import { toast } from "react-toastify";

const fallbackMetrics = [
    { name: "CPU Usage", percentage: 0, valueLabel: "0%" },
    { name: "Memory Usage", percentage: 0, valueLabel: "0%" },
    { name: "Disk Usage", percentage: 0, valueLabel: "0%" },
    { name: "Network Utilization", percentage: 0, valueLabel: "0%" },
    { name: "Database Health", percentage: 0, valueLabel: "Unknown" },
];

const formatNumber = (value, fractionDigits = 2) => {
    if (value == null || Number.isNaN(Number(value))) {
        return "0";
    }
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

export default function SystemHealth() {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHealthMetrics = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await superAdminAPI.getSystemHealth();
                if (response?.success && response?.data) {
                    setHealthData(response.data);
                } else {
                    const message = response?.message || "Unable to fetch system health metrics.";
                    setError(message);
                }
            } catch (err) {
                const message = handleAPIError(err);
                setError(message);
                toast.error(message, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchHealthMetrics();
    }, []);

    const metrics = useMemo(() => {
        const metricValues = healthData?.metrics;
        if (!metricValues) return fallbackMetrics;

        const cpuUsage = metricValues.cpu_usage_percent ?? 0;
        const memoryUsage = metricValues.memory_usage_percent ?? 0;
        const memoryTotal = metricValues.memory_total_gb ?? 0;
        const memoryAvailable = metricValues.memory_available_gb ?? 0;
        const diskUsage = metricValues.disk_usage_percent ?? 0;
        const diskTotal = metricValues.disk_total_gb ?? 0;
        const diskUsed = metricValues.disk_used_gb ?? 0;
        const network = metricValues.network || {};
        const dbStatus = healthData?.database;

        return [
            {
                name: "CPU Usage",
                percentage: Math.round(cpuUsage),
                valueLabel: `${formatNumber(cpuUsage, 1)}%`,
            },
            {
                name: "Memory Usage",
                percentage: Math.round(memoryUsage),
                valueLabel: `${formatNumber(memoryUsage, 1)}% · ${formatNumber(memoryTotal - memoryAvailable, 1)} / ${formatNumber(memoryTotal, 1)} GB`,
            },
            {
                name: "Disk Usage",
                percentage: Math.round(diskUsage),
                valueLabel: `${formatNumber(diskUsage, 1)}% · ${formatNumber(diskUsed, 1)} / ${formatNumber(diskTotal, 1)} GB`,
            },
            {
                name: "Network Utilization",
                percentage: Math.min(Math.round(network.utilization_percent ?? 0), 100),
                valueLabel: `${formatNumber(network.utilization_percent ?? 0, 1)}% · ${formatNumber(network.throughput_mbps ?? 0, 2)} Mbps`,
            },
            {
                name: "Database Health",
                percentage: dbStatus?.status === "online" ? 100 : dbStatus?.status === "degraded" ? 60 : 20,
                valueLabel: dbStatus?.status
                    ? `${dbStatus.status.toUpperCase()} (${formatNumber(dbStatus.latency_ms ?? 0)} ms)`
                    : "Unknown",
            },
        ];
    }, [healthData]);

    const loadAverage = useMemo(() => {
        const load = healthData?.metrics?.load_average;
        if (!Array.isArray(load)) return null;
        return load.map((value) => formatNumber(value, 2)).join(" · ");
    }, [healthData]);

    const networkStats = healthData?.metrics?.network;
    const systemInfo = healthData?.system || {};

    return (
        <div className="rounded-xl min-h-screen">
            <div className="bg-white p-6 rounded-xl mb-6">
                <div className="mb-6">
                    <h5 className="text-gray-800 text-2xl font-medium font-[BasisGrotesquePro] mb-2">
                        System Health Monitor
                    </h5>
                    <p className="text-gray-500 text-sm font-normal font-[BasisGrotesquePro]">
                        Real-time system performance and resource usage
                    </p>
                </div>

                {loading && (
                    <div className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                        Loading system health data...
                    </div>
                )}

                {error && !loading && (
                    <div className="text-sm text-[#B91C1C] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2 font-[BasisGrotesquePro]">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Warning Banner if psutil not available */}
                        {healthData?.metrics?.warning && (
                            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-yellow-800 font-[BasisGrotesquePro]">
                                        <strong>Warning:</strong> {healthData.metrics.warning}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {metrics.map((metric) => (
                                <div key={metric.name} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                                            {metric.name}
                                        </div>
                                        <div className="text-gray-700 text-sm font-medium font-[BasisGrotesquePro]">
                                            {metric.valueLabel}
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-[#E8F0FF] rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-[#3B4A66] rounded-full transition-all duration-300 ease-in-out"
                                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-[#E8F0FF] rounded-lg p-5">
                                <h6 className="text-[#3B4A66] text-base font-semibold font-[BasisGrotesquePro] mb-2">
                                    Network Throughput
                                </h6>
                                {networkStats ? (
                                    <div className="space-y-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                        <div className="flex justify-between">
                                            <span>Throughput</span>
                                            <span>{formatNumber(networkStats.throughput_mbps ?? 0, 2)} Mbps</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Utilization</span>
                                            <span>{formatNumber(networkStats.utilization_percent ?? 0, 2)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Bytes Sent (total)</span>
                                            <span>{formatNumber(networkStats.bytes_sent_total ?? 0, 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Bytes Received (total)</span>
                                            <span>{formatNumber(networkStats.bytes_recv_total ?? 0, 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Bytes Sent / sec</span>
                                            <span>{formatNumber(networkStats.bytes_sent_per_sec ?? 0, 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Bytes Received / sec</span>
                                            <span>{formatNumber(networkStats.bytes_recv_per_sec ?? 0, 0)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro]">No network data available.</p>
                                )}
                            </div>
                            <div className="border border-[#E8F0FF] rounded-lg p-5">
                                <h6 className="text-[#3B4A66] text-base font-semibold font-[BasisGrotesquePro] mb-2">
                                    Load & Database
                                </h6>
                                <div className="space-y-2 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                    <div className="flex justify-between">
                                        <span>Load Average</span>
                                        <span>{loadAverage || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Database Status</span>
                                        <span className="font-medium text-[#3B4A66]">
                                            {(healthData?.database?.status || "Unknown").toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Database Latency</span>
                                        <span>
                                            {healthData?.database?.latency_ms != null
                                                ? `${formatNumber(healthData.database.latency_ms ?? 0, 2)} ms`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Metrics Section */}
                        {healthData?.application && (
                            <div className="mt-6">
                                <h6 className="text-[#3B4A66] text-lg font-semibold font-[BasisGrotesquePro] mb-4">
                                    Application Metrics
                                </h6>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    {/* Users Card */}
                                    {healthData.application.users && (
                                        <div className="border border-[#E8F0FF] rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                                            <div className="flex items-center gap-2 mb-3">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                                <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro]">Users</h6>
                                            </div>
                                            <div className="space-y-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-semibold text-[#3B4A66]">{healthData.application.users.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Active</span>
                                                    <span className="font-medium text-green-600">{healthData.application.users.active || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Inactive</span>
                                                    <span className="font-medium text-gray-500">{healthData.application.users.inactive || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Verified</span>
                                                    <span className="font-medium">{healthData.application.users.verified || 0}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-blue-100">
                                                    <span>New (24h)</span>
                                                    <span className="font-semibold text-blue-600">{healthData.application.users.new_last_24h || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Firms Card */}
                                    {healthData.application.firms && (
                                        <div className="border border-[#E8F0FF] rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
                                            <div className="flex items-center gap-2 mb-3">
                                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                </svg>
                                                <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro]">Firms</h6>
                                            </div>
                                            <div className="space-y-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-semibold text-[#3B4A66]">{healthData.application.firms.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Active</span>
                                                    <span className="font-medium text-green-600">{healthData.application.firms.active || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Inactive</span>
                                                    <span className="font-medium text-gray-500">{healthData.application.firms.inactive || 0}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-purple-100">
                                                    <span>New (24h)</span>
                                                    <span className="font-semibold text-purple-600">{healthData.application.firms.new_last_24h || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Card */}
                                    {healthData.application.documents && (
                                        <div className="border border-[#E8F0FF] rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
                                            <div className="flex items-center gap-2 mb-3">
                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                                <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro]">Documents</h6>
                                            </div>
                                            <div className="space-y-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-semibold text-[#3B4A66]">{healthData.application.documents.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-green-100">
                                                    <span>Uploaded (24h)</span>
                                                    <span className="font-semibold text-green-600">{healthData.application.documents.uploaded_last_24h || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Invoices Card */}
                                    {healthData.application.invoices && (
                                        <div className="border border-[#E8F0FF] rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white">
                                            <div className="flex items-center gap-2 mb-3">
                                                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                </svg>
                                                <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro]">Invoices</h6>
                                            </div>
                                            <div className="space-y-2 text-xs text-[#6B7280] font-[BasisGrotesquePro]">
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-semibold text-[#3B4A66]">{healthData.application.invoices.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Paid</span>
                                                    <span className="font-medium text-green-600">{healthData.application.invoices.paid || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Pending</span>
                                                    <span className="font-medium text-orange-600">{healthData.application.invoices.pending || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Roles Breakdown */}
                                {healthData.application.users?.by_role && (
                                    <div className="border border-[#E8F0FF] rounded-lg p-4 mb-4">
                                        <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro] mb-3">
                                            Users by Role
                                        </h6>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-[BasisGrotesquePro]">
                                            {Object.entries(healthData.application.users.by_role).map(([key, value]) => (
                                                <div key={key} className="bg-gray-50 rounded p-2 text-center">
                                                    <div className="text-[#6B7280] mb-1">{value.name || key}</div>
                                                    <div className="text-lg font-semibold text-[#3B4A66]">{value.count || 0}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Database Details */}
                                {healthData.application.database && (
                                    <div className="border border-[#E8F0FF] rounded-lg p-4">
                                        <h6 className="text-[#3B4A66] text-sm font-semibold font-[BasisGrotesquePro] mb-3">
                                            Database Statistics
                                        </h6>
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center text-xs font-[BasisGrotesquePro] mb-2">
                                                <span className="text-[#6B7280]">Database Size</span>
                                                <span className="text-[#3B4A66] font-semibold">
                                                    {healthData.application.database.size_mb 
                                                        ? `${formatNumber(healthData.application.database.size_mb, 2)} MB` 
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                        {healthData.application.database.table_counts && (
                                            <div>
                                                <div className="text-xs text-[#6B7280] font-[BasisGrotesquePro] mb-2 font-semibold">
                                                    Table Counts
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-[BasisGrotesquePro]">
                                                    {Object.entries(healthData.application.database.table_counts).map(([table, count]) => (
                                                        <div key={table} className="bg-gray-50 rounded px-2 py-1.5 flex justify-between items-center">
                                                            <span className="text-[#6B7280] capitalize">{table}</span>
                                                            <span className="font-semibold text-[#3B4A66]">{count || 0}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 border border-[#E8F0FF] rounded-lg p-5">
                            <h6 className="text-[#3B4A66] text-base font-semibold font-[BasisGrotesquePro] mb-3">
                                System Information
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#6B7280] font-[BasisGrotesquePro]">
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Platform</span>
                                    <span className="text-right break-words">
                                        {systemInfo.platform && systemInfo.platform_release
                                            ? `${systemInfo.platform} ${systemInfo.platform_release}`
                                            : systemInfo.platform || "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Platform Version</span>
                                    <span className="text-right break-words">{systemInfo.platform_version || "—"}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Machine</span>
                                    <span className="text-right break-words">{systemInfo.machine || "—"}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Processor</span>
                                    <span className="text-right break-words">{systemInfo.processor || "—"}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Python Version</span>
                                    <span className="text-right break-words">{systemInfo.python_version || "—"}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Uptime</span>
                                    <span className="text-right break-words">{healthData?.uptime_human || "—"}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Uptime (seconds)</span>
                                    <span className="text-right break-words">
                                        {healthData?.uptime_seconds != null
                                            ? formatNumber(healthData.uptime_seconds, 0)
                                            : "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium text-[#3B4A66]">Last Updated</span>
                                    <span className="text-right break-words">
                                        {formatDateTime(healthData?.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
