import React from 'react';

const availableIntegrations = [
  {
    id: 1,
    name: 'DocuSign',
    description: 'Electronic signature platform',
    category: 'Documents',
    isPopular: true,
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.7324 3.44531V7.94031C17.7324 8.54906 17.9762 9.13406 18.4074 9.56531C18.841 9.99703 19.428 10.2393 20.0399 10.2391H25.1962" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9.87125 9.12251H13.9525M9.87125 14.5638H20.7538M9.87125 20.005H20.7538M25.625 10.2738V20.9838C25.6002 21.6843 25.437 22.373 25.1448 23.0102C24.8526 23.6473 24.4372 24.2204 23.9225 24.6963C23.4074 25.1744 22.8031 25.5463 22.1443 25.7908C21.4854 26.0353 20.7848 26.1476 20.0825 26.1213H10.595C9.88842 26.1535 9.18242 26.0461 8.51747 25.805C7.85252 25.5639 7.24169 25.1939 6.72 24.7163C6.20034 24.2391 5.78068 23.6634 5.48541 23.0226C5.19014 22.3819 5.02514 21.6888 5 20.9838V8.14126C5.02482 7.44072 5.18803 6.75203 5.48022 6.11486C5.77242 5.47769 6.18783 4.90465 6.7025 4.42876C7.2176 3.95066 7.82185 3.57873 8.48073 3.33423C9.13961 3.08972 9.84021 2.97743 10.5425 3.00376H17.685C18.7753 2.9999 19.8278 3.40334 20.6363 4.13501L24.3362 7.53751C24.7311 7.8776 25.0499 8.29701 25.2719 8.76844C25.4939 9.23987 25.6143 9.75276 25.625 10.2738Z" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    )
  },
  {
    id: 2,
    name: 'Dropbox',
    description: 'Cloud storage and file sharing',
    category: 'Storage',
    isPopular: true,
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.835 13.7484C22.835 14.1234 23.0975 14.4521 23.4562 14.5609C24.4574 14.868 25.3153 15.5238 25.8743 16.4094C26.4332 17.295 26.6562 18.3516 26.5027 19.3875C26.3492 20.4234 25.8294 21.37 25.0377 22.0554C24.2459 22.7409 23.2347 23.1198 22.1875 23.1234H9.21875C9.14375 23.1234 9.06958 23.1213 8.99625 23.1171C8.91458 23.1213 8.8325 23.1234 8.75 23.1234C7.34104 23.1234 5.98978 22.5637 4.9935 21.5674C3.99721 20.5711 3.4375 19.2198 3.4375 17.8109C3.4375 16.4019 3.99721 15.0507 4.9935 14.0544C5.98978 13.0581 7.34104 12.4984 8.75 12.4984C8.87339 12.4984 8.99328 12.4574 9.09081 12.3818C9.18834 12.3062 9.25797 12.2004 9.28875 12.0809C9.69447 10.4517 10.6823 9.02725 12.066 8.07629C13.4497 7.12533 15.1336 6.71358 16.8 6.91871C18.4663 7.12383 20.0001 7.93166 21.1118 9.1898C22.2236 10.4479 22.8365 12.0694 22.835 13.7484Z" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    )
  },
  {
    id: 3,
    name: 'Slack',
    description: 'Team communication and collaboration',
    category: 'Communication',
    isPopular: false,
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.4729 1.93359L5.625 17.8125H13.125L11.2787 27.9627C11.2752 27.9826 11.2761 28.0031 11.2813 28.0226C11.2866 28.0421 11.296 28.0603 11.3091 28.0757C11.3221 28.0912 11.3383 28.1036 11.3567 28.1122C11.375 28.1207 11.395 28.1251 11.4152 28.125C11.4368 28.125 11.458 28.1199 11.4772 28.1103C11.4964 28.1006 11.5131 28.0866 11.526 28.0693L24.375 12.1875H16.875L18.7301 2.03613C18.7326 2.01591 18.7307 1.99539 18.7247 1.97593C18.7186 1.95647 18.7085 1.93852 18.695 1.92328C18.6815 1.90804 18.6648 1.89585 18.6462 1.88752C18.6276 1.8792 18.6075 1.87493 18.5871 1.875C18.5648 1.87509 18.5428 1.88044 18.523 1.89062C18.5031 1.9008 18.4859 1.91553 18.4729 1.93359Z" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    )
  },
  {
    id: 4,
    name: 'Zapier',
    description: 'Workflow automation platform',
    category: 'Automation',
    isPopular: true,
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.4729 1.93359L5.625 17.8125H13.125L11.2787 27.9627C11.2752 27.9826 11.2761 28.0031 11.2813 28.0226C11.2866 28.0421 11.296 28.0603 11.3091 28.0757C11.3221 28.0912 11.3383 28.1036 11.3567 28.1122C11.375 28.1207 11.395 28.1251 11.4152 28.125C11.4368 28.125 11.458 28.1199 11.4772 28.1103C11.4964 28.1006 11.5131 28.0866 11.526 28.0693L24.375 12.1875H16.875L18.7301 2.03613C18.7326 2.01591 18.7307 1.99539 18.7247 1.97593C18.7186 1.95647 18.7085 1.93852 18.695 1.92328C18.6815 1.90804 18.6648 1.89585 18.6462 1.88752C18.6276 1.8792 18.6075 1.87493 18.5871 1.875C18.5648 1.87509 18.5428 1.88044 18.523 1.89062C18.5031 1.9008 18.4859 1.91553 18.4729 1.93359Z" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    )
  }
];

export default function AvailableTab() {
  return (
    <div className="bg-white !rounded-2xl p-4 md:p-6 !border border-[#E8F0FF]">
      {/* Header Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
          Available Integrations
        </h4>
        <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
          Browse and connect new services to enhance your workflow
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
        {availableIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-2xl p-6 border border-[#E8F0FF] hover:shadow-lg transition-shadow relative"
          >
            {/* Popular Badge - Top Right */}
            {integration.isPopular && (
              <div className="absolute top-5 right-5">
                <span className="px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-medium font-[BasisGrotesquePro]">
                  Popular
                </span>
              </div>
            )}

            {/* Icon - Top Left */}
            <div className="mb-3">
              <div className="flex items-center justify-start">
                <span className="text-[#3AD6F2]">{integration.icon}</span>
              </div>
            </div>

            {/* Name and Description - Below Icon */}
            <div className="mb-5 pr-20">
              <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] leading-tight mb-1">
                {integration.name}
              </h5>
              <p className="text-sm text-[#4B5563] font-medium font-[BasisGrotesquePro]">
                {integration.description}
              </p>
            </div>

            {/* Category with Label */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#3B4A66] font-[BasisGrotesquePro]">Category:</span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-gray-300 text-[#1F2A55] text-xs font-medium font-[BasisGrotesquePro]">
                  {integration.category}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] !rounded-lg font-[BasisGrotesquePro]">
                Connect
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro]">
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

