import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComplianceDetails = () => {
    const navigate = useNavigate();

    const staticData = [
        { id: 1, returnName: 'Tax Return 2024 - A', status: 'Pending Review', riskLevel: 'High', date: '2024-10-15' },
        { id: 2, returnName: 'Tax Return 2024 - B', status: 'Completed', riskLevel: 'Low', date: '2024-10-12' },
        { id: 3, returnName: 'Tax Return 2024 - C', status: 'In Progress', riskLevel: 'Medium', date: '2024-10-10' },
        { id: 4, returnName: 'Tax Return 2024 - D', status: 'Flagged', riskLevel: 'High', date: '2024-10-08' },
        { id: 5, returnName: 'Tax Return 2024 - E', status: 'Completed', riskLevel: 'Low', date: '2024-10-05' },
    ];

    return (
        <div className="w-full px-6 py-6 bg-[#F6F7FF] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#3B4A66] font-[BasisGrotesquePro]">Compliance & Risk Details</h2>
                    <p className="text-sm text-[#6B7280] font-[BasisGrotesquePro] mt-1">
                        Detailed view of flagged returns and compliance risks.
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

            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Return Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Submission Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-[BasisGrotesquePro]">
                                    Risk Level
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staticData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro]">{item.returnName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 font-[BasisGrotesquePro]">{item.date}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-[BasisGrotesquePro]
                      ${item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                item.status === 'Flagged' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-[BasisGrotesquePro]
                      ${item.riskLevel === 'High' ? 'text-red-600 font-bold' :
                                                item.riskLevel === 'Medium' ? 'text-yellow-600' :
                                                    'text-green-600'}`}>
                                            {item.riskLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900 font-[BasisGrotesquePro]">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-[BasisGrotesquePro]">Showing 5 of 5 entries</span>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDetails;
