import React from 'react';

const SecurityTab = ({ client }) => {

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-[#E8F0FF]">
        <h3 className="text-lg font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">
          Security Settings - Test
        </h3>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
          Client: {client?.name || 'No client data'}
        </p>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
          ID: {client?.id || 'No ID'}
        </p>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
          Email: {client?.email || 'No email'}
        </p>
      </div>
    </div>
  );
};

export default SecurityTab;
