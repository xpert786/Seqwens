import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firmAdminDashboardAPI } from '../../../ClientOnboarding/utils/apiUtils';

const ComplianceDetails = () => {
    const navigate = useNavigate();
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await firmAdminDashboardAPI.getComplianceRiskData();

                if (result.success && result.data) {
                    setComplianceData(result.data);
                } else {
                    throw new Error(result.message || 'Failed to fetch compliance data');
                }
            } catch (err) {
                console.error('Error fetching compliance details:', err);
                setError('Failed to load compliance data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen flex justify-center items-center bg-[#F6F7FF]">
                <div className="text-[#3B4A66] font-[BasisGrotesquePro]">Loading compliance data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex justify-center items-center bg-[#F6F7FF]">
                <div className="text-red-500 font-[BasisGrotesquePro]">{error}</div>
            </div>
        );
    }

    const { summary, status_breakdown, category_details, action_items } = complianceData || {};

    return (
        <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">Compliance & Risk Details</h3>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                        Detailed view of compliance scores, risks, and action items.
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-white border border-[#dee2e6] text-[#343a40] rounded text-sm font-[BasisGrotesquePro] hover:bg-gray-50 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Overall Score</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-3xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">{summary?.overall_compliance_score}%</span>
                        <span className={`text-sm font-medium mb-1 ${summary?.overall_risk_level === 'high' ? 'text-red-500' :
                            summary?.overall_risk_level === 'medium' ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                            ({summary?.overall_risk_level?.toUpperCase()} Risk)
                        </span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">KPA Completion</p>
                    <p className="text-3xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] mt-1">{summary?.kpa_completion_rate}%</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">Flagged Returns</p>
                    <p className="text-3xl font-bold text-[#3B4A66] font-[BasisGrotesquePro] mt-1">{summary?.flagged_returns_active}</p>
                </div>
                {/* Status Breakdown Visual (Simplified) */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-2">Status Breakdown</p>
                    <div className="flex w-full h-4 rounded-full overflow-hidden">
                        {status_breakdown?.map((item, index) => (
                            <div
                                key={index}
                                style={{ width: `${item.percentage}%` }}
                                className={`h-full ${item.status === 'Completed' ? 'bg-green-500' :
                                    item.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                title={`${item.status}: ${item.percentage}%`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        {status_breakdown?.map((item, index) => (
                            <span key={index}>{item.status} ({item.percentage}%)</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Category Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 font-[BasisGrotesquePro]">Risk Category Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Risk Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {category_details?.map((category, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{category.category}</div>
                                                <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">{category.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-sm font-bold text-gray-700 font-[BasisGrotesquePro] mr-2">{category.score}/{category.max_score}</span>
                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                        <div className={`h-1.5 rounded-full ${category.score >= 80 ? 'bg-green-500' :
                                                            category.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`} style={{ width: `${(category.score / category.max_score) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-[BasisGrotesquePro]
                                ${category.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                                                        category.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'}`}>
                                                    {category.risk_level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-600 font-[BasisGrotesquePro] max-w-xs">{category.recommendation}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action Items */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden h-full">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 font-[BasisGrotesquePro]">Action Items</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {action_items?.map((item, index) => (
                                <div key={index} className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded font-[BasisGrotesquePro] ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {item.priority.toUpperCase()} Priority
                                        </span>
                                        <span className="text-xs text-gray-400 font-[BasisGrotesquePro]">{item.category}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-[#3B4A66] font-[BasisGrotesquePro] mb-1">{item.title}</h4>
                                    <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">{item.description}</p>
                                </div>
                            ))}
                            {(!action_items || action_items.length === 0) && (
                                <p className="text-center text-gray-500 text-sm py-4">No pending action items.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDetails;
