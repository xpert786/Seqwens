import React from 'react';

const apiKeys = [
  {
    id: 1,
    name: 'Stripe API Key',
    value: '**********',
    type: 'input'
  },
  {
    id: 2,
    name: 'Mailchimp API Key',
    value: '**********',
    type: 'input'
  },
  {
    id: 3,
    name: 'QuickBooks Client ID',
    value: '**********',
    type: 'input'
  },
  {
    id: 4,
    name: 'DocuSign Integration Key',
    value: 'Select client',
    type: 'select'
  },
  {
    id: 5,
    name: 'Google Calendar API Key',
    value: 'Select client',
    type: 'select'
  },
 
  {
    id: 6,
    name: 'Custom API Key',
    value: 'Select client',
    type: 'select'
  }
];

export default function APIKeysTab() {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8F0FF]">
      {/* Header Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
          API Key Management
        </h4>
        <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
          Manage API keys for external integrations
        </p>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id}>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              {apiKey.name}
            </label>
            {apiKey.type === 'input' ? (
              <input
                type="password"
                defaultValue={apiKey.value}
                className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none font-[BasisGrotesquePro]"
              />
            ) : (
              <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#1F2A55] focus:outline-none cursor-pointer font-[BasisGrotesquePro]">
                <option>{apiKey.value}</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 !border-t border-[#E8F0FF]">
        <button className="px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
          Test Connection
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg hover:bg-[#FF7142] transition font-[BasisGrotesquePro]">
          Save API Key
        </button>
      </div>
    </div>
  );
}

