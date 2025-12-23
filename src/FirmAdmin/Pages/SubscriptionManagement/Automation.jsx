import React from 'react';
import AutoRenewal from './Automation-tab/AutoRenewal';

const Automation = () => {
    return (
        <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6">
            <h5 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Automation & Notifications</h5>
            <AutoRenewal />
        </div>
    );
};

export default Automation;

