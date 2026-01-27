import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataIntakeForm from '../../../ClientOnboarding/pages/DataIntake';
import { FaArrowLeft } from 'react-icons/fa';

export default function FirmAdminDataIntakePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F6F7FF]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors p-0 bg-transparent border-0"
                        style={{ fontFamily: 'BasisGrotesquePro' }}
                    >
                        <FaArrowLeft /> Back to Client
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">
                                Client Data Intake Form
                            </h1>
                            <p className="text-gray-600 font-[BasisGrotesquePro] mt-1">
                                View and edit client's intake form data
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#E8F0FF] p-4 sm:p-6">
                    <DataIntakeForm targetClientId={id} />
                </div>
            </div>
        </div>
    );
}
