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
