import React, { useState } from 'react';

const webhooks = [
  {
    id: 1,
    name: 'Client Registration Webhook',
    url: 'https://api.example.com/webhooks/client-registration',
    events: ['client.created', 'client.updated'],
    status: 'Active',
    lastTriggered: '2024-01-15 15:30:00'
  },
  {
    id: 2,
    name: 'Payment Processing Webhook',
    url: 'https://api.example.com/webhooks/payments',
    events: ['payment.completed', 'payment.failed'],
    status: 'Active',
    lastTriggered: '2024-01-15 15:30:00'
  },
  {
    id: 3,
    name: 'Document Upload Webhook',
    url: 'https://api.example.com/webhooks/documents',
    events: ['document.uploaded', 'document.signed'],
    status: 'Inactive',
    lastTriggered: '2024-01-15 15:30:00'
  }
];

export default function WebhooksTab() {
  const [activeWebhooks, setActiveWebhooks] = useState({
    1: true,
    2: true,
    3: false
  });

  const toggleWebhook = (id) => {
    setActiveWebhooks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8F0FF]">
      {/* Header Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
          Webhook Management
        </h4>
        <p className="text-sm text-[#4B5563] font-[BasisGrotesquePro]">
          Configure webhooks for real-time event notifications
        </p>
      </div>

      {/* Webhook Cards */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="bg-white rounded-2xl p-6 border border-[#E8F0FF]"
          >
            {/* Title, Status Badge, and Toggle */}
            <div className="flex items-start justify-between mb-5">
              <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro]">
                {webhook.name}
              </h5>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium font-[BasisGrotesquePro] ${
                    activeWebhooks[webhook.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {activeWebhooks[webhook.id] ? 'Active' : 'Inactive'}
                </span>
                <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={activeWebhooks[webhook.id]}
                    onChange={() => toggleWebhook(webhook.id)}
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                    activeWebhooks[webhook.id] ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      activeWebhooks[webhook.id] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
              </div>
            </div>

            {/* URL, Events, Last Triggered - Labels Left, Values Right */}
            <div className="space-y-5 mb-5">
              {/* URL */}
              <div className="flex items-start justify-between">
                <p className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">URL:</p>
                <p className="text-sm text-[#3B4A66] font-medium font-[BasisGrotesquePro]">
                  {webhook.url}
                </p>
              </div>

              {/* Events */}
              <div className="flex items-start justify-between">
                <p className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Events:</p>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 !rounded-full bg-[#FFFFFF] text-gray-700 text-xs font-medium font-[BasisGrotesquePro] !border border-[#4B5563]"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              {/* Last Triggered */}
              <div className="flex items-start justify-between">
                <p className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Last Triggered:</p>
                <p className="text-sm text-[#3B4A66] font-medium font-[BasisGrotesquePro]">{webhook.lastTriggered}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-[#131323] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
                Test Webhook
              </button>
              <button className="px-4 py-2 text-sm font-medium text-[#131323] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
                Edit
              </button>
              <button className="px-4 py-2 text-sm font-medium text-red-600 bg-white !border border-[#EF4444] !rounded-lg hover:bg-red-50 transition font-[BasisGrotesquePro]">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

