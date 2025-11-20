import React from 'react';

const integrations = [
  {
    id: 1,
    name: 'Stripe',
    description: 'Payment processing and billing.',
    category: 'Payments',
    status: 'Connected',
    health: 'Healthy',
    lastSync: '2024-01-15 15:30:00',
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 15C2.5 10.2863 2.5 7.92875 3.965 6.465C5.43 5.00125 7.78625 5 12.5 5H17.5C22.2137 5 24.5712 5 26.035 6.465C27.4987 7.93 27.5 10.2863 27.5 15C27.5 19.7137 27.5 22.0712 26.035 23.535C24.57 24.9987 22.2137 25 17.5 25H12.5C7.78625 25 5.42875 25 3.965 23.535C2.50125 22.07 2.5 19.7137 2.5 15Z" stroke="#3AD6F2" stroke-width="2.5" />
        <path d="M12.5 20H7.5M17.5 20H15.625M2.5 12.5H27.5" stroke="#3AD6F2" stroke-width="2.5" stroke-linecap="round" />
      </svg>

    )
  },
  {
    id: 2,
    name: 'Google Calendar',
    description: 'Calendar synchronization.',
    category: 'Productivity',
    status: 'Connected',
    health: 'Healthy',
    lastSync: '2024-01-15 15:25:00',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#3AD6F2" strokeWidth="2" fill="none" />
        <path d="M16 2V6M8 2V6M3 10H21" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 3,
    name: 'QuickBooks Online',
    description: 'Accounting and bookkeeping.',
    category: 'Accounting',
    status: 'Connected',
    health: 'Warning',
    lastSync: '2024-01-15 14:45:00',
    icon: (
      <svg width="23" height="27" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.25 0C14.1425 0 16.82 0.51 18.8225 1.38625C19.8213 1.82375 20.7087 2.37625 21.3625 3.05375C21.9688 3.67875 22.4188 4.46375 22.49 5.37375L22.5 5.625V18.125C22.5 19.1425 22.0238 20.0125 21.3625 20.6962C20.7087 21.3737 19.8213 21.9263 18.8225 22.3638C16.82 23.2388 14.1425 23.75 11.25 23.75C8.3575 23.75 5.68 23.24 3.6775 22.3638C2.67875 21.9263 1.79125 21.3737 1.1375 20.6962C0.53125 20.0712 0.0812499 19.2863 0.00999987 18.3763L0 18.125V5.625C0 4.6075 0.47625 3.7375 1.1375 3.05375C1.79125 2.37625 2.67875 1.82375 3.6775 1.38625C5.68 0.51125 8.3575 0 11.25 0ZM20 15.5087C19.6213 15.7362 19.2279 15.9383 18.8225 16.1138C16.82 16.9888 14.1425 17.5 11.25 17.5C8.3575 17.5 5.68 16.99 3.6775 16.1138C3.27207 15.9383 2.87871 15.7362 2.5 15.5087V18.125C2.5 18.315 2.5825 18.595 2.935 18.9587C3.2925 19.3288 3.87 19.7188 4.68 20.0737C6.2975 20.7812 8.61875 21.25 11.25 21.25C13.8813 21.25 16.2025 20.7812 17.82 20.0737C18.63 19.7188 19.2075 19.3288 19.565 18.9587C19.9175 18.5963 20 18.315 20 18.125V15.5087ZM20 9.25875C19.6213 9.4862 19.2279 9.68831 18.8225 9.86375C16.82 10.7387 14.1425 11.25 11.25 11.25C8.3575 11.25 5.68 10.74 3.6775 9.86375C3.27207 9.68831 2.87871 9.4862 2.5 9.25875V11.875C2.5 12.065 2.5825 12.345 2.935 12.7087C3.2925 13.0787 3.87 13.4688 4.68 13.8237C6.2975 14.5312 8.61875 15 11.25 15C13.8813 15 16.2025 14.5312 17.82 13.8237C18.63 13.4688 19.2075 13.0787 19.565 12.7087C19.9175 12.3462 20 12.065 20 11.875V9.25875ZM11.25 2.5C8.61875 2.5 6.2975 2.96875 4.68 3.67625C3.87 4.03125 3.2925 4.42125 2.935 4.79125C2.5825 5.15375 2.5 5.435 2.5 5.625C2.5 5.815 2.5825 6.095 2.935 6.45875C3.2925 6.82875 3.87 7.21875 4.68 7.57375C6.2975 8.28125 8.61875 8.75 11.25 8.75C13.8813 8.75 16.2025 8.28125 17.82 7.57375C18.63 7.21875 19.2075 6.82875 19.565 6.45875C19.9175 6.09625 20 5.815 20 5.625C20 5.435 19.9175 5.155 19.565 4.79125C19.2075 4.42125 18.63 4.03125 17.82 3.67625C16.2025 2.96875 13.8813 2.5 11.25 2.5Z" fill="#3AD6F2" />
      </svg>

    )
  },
  {
    id: 4,
    name: 'Mailchimp',
    description: 'Email marketing and automation.',
    category: 'Marketing',
    status: 'Connected',
    health: 'Healthy',
    lastSync: '2024-04-15 15:00:00',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#3AD6F2" strokeWidth="2" fill="none" />
        <path d="M22 6L12 13L2 6" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

export default function ConnectedTab() {
  return (
    <div className="bg-white !rounded-2xl p-4 md:p-6 !border border-[#E8F0FF]">
      {/* Header Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
          Connected Integrations
        </h4>
        <p className="text-sm text-[#7B8AB2] font-[BasisGrotesquePro]">
          Manage your active integrations and their settings
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-2xl p-3 md:p-6 border border-[#E8F0FF]  transition-shadow relative"
          >
            {/* Status Badge - Top Right */}
            <div className="absolute top-5 right-5">
              <span className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium font-[BasisGrotesquePro]">
                {integration.status}
              </span>
            </div>

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
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Category:</span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-gray-300 text-[#1F2A55] text-xs font-medium font-[BasisGrotesquePro]">
                  {integration.category}
                </span>
              </div>
            </div>

            {/* Health with Label */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Health:</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium font-[BasisGrotesquePro] ${integration.health === 'Healthy'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                    }`}
                >
                  {integration.health}
                </span>
              </div>
            </div>

            {/* Last Sync with Label */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold text-[#3B4A66] font-[BasisGrotesquePro]">Last Sync:</span>
                <span className="text-sm text-[#4B5563] font-medium font-[BasisGrotesquePro]">{integration.lastSync}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#1F2A55] bg-white !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition font-[BasisGrotesquePro] flex items-center justify-center gap-1.5 sm:gap-2">
                <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.7854 9.16406C7.88997 9.16406 8.7854 8.26863 8.7854 7.16406C8.7854 6.05949 7.88997 5.16406 6.7854 5.16406C5.68083 5.16406 4.7854 6.05949 4.7854 7.16406C4.7854 8.26863 5.68083 9.16406 6.7854 9.16406Z" stroke="#131323" />
                  <path d="M1.22612 6.26C1.54146 6.45733 1.74412 6.79467 1.74412 7.16667C1.74412 7.53867 1.54146 7.876 1.22612 8.07333C1.01212 8.20867 0.873457 8.316 0.775457 8.444C0.668851 8.58296 0.590666 8.74156 0.545368 8.91074C0.50007 9.07992 0.488547 9.25636 0.511457 9.43C0.546123 9.69267 0.701457 9.962 1.01146 10.5C1.32279 11.038 1.47812 11.3067 1.68812 11.4687C1.82708 11.5753 1.98568 11.6535 2.15486 11.6988C2.32404 11.7441 2.50049 11.7556 2.67412 11.7327C2.83412 11.7113 2.99612 11.646 3.22012 11.5273C3.38049 11.4398 3.56044 11.3944 3.74314 11.3953C3.92585 11.3962 4.10533 11.4435 4.26479 11.5327C4.58679 11.7193 4.77812 12.0627 4.79146 12.4347C4.80079 12.688 4.82479 12.8613 4.88679 13.01C4.9538 13.1719 5.05205 13.319 5.17594 13.4428C5.29982 13.5667 5.44691 13.665 5.60879 13.732C5.85346 13.8333 6.16412 13.8333 6.78546 13.8333C7.40679 13.8333 7.71746 13.8333 7.96212 13.732C8.124 13.665 8.27109 13.5667 8.39497 13.4428C8.51886 13.319 8.61711 13.1719 8.68412 13.01C8.74546 12.8613 8.77012 12.688 8.77946 12.4347C8.79279 12.0627 8.98412 11.7187 9.30612 11.5327C9.46558 11.4435 9.64507 11.3962 9.82777 11.3953C10.0105 11.3944 10.1904 11.4398 10.3508 11.5273C10.5748 11.646 10.7375 11.7113 10.8975 11.7327C11.2479 11.7788 11.6023 11.6838 11.8828 11.4687C12.0928 11.3073 12.2481 11.038 12.5588 10.5C12.6975 10.26 12.8048 10.074 12.8848 9.918M12.3448 8.074C12.1888 7.97899 12.0595 7.84599 11.9689 7.68743C11.8783 7.52887 11.8294 7.34993 11.8268 7.16733C11.8268 6.79467 12.0295 6.45733 12.3448 6.25933C12.5588 6.12467 12.6968 6.01733 12.7955 5.88933C12.9021 5.75038 12.9802 5.59178 13.0255 5.4226C13.0708 5.25342 13.0824 5.07697 13.0595 4.90333C13.0248 4.64067 12.8695 4.37133 12.5595 3.83333C12.2481 3.29533 12.0928 3.02667 11.8828 2.86467C11.7438 2.75806 11.5852 2.67988 11.4161 2.63458C11.2469 2.58928 11.0704 2.57776 10.8968 2.60067C10.7368 2.622 10.5748 2.68733 10.3501 2.806C10.1898 2.89343 10.01 2.9388 9.82744 2.93786C9.64486 2.93693 9.4655 2.88973 9.30612 2.80067C9.14922 2.70713 9.0186 2.57532 8.92649 2.41757C8.83439 2.25982 8.7838 2.08129 8.77946 1.89867C8.77012 1.64533 8.74612 1.472 8.68412 1.32333C8.61711 1.16145 8.51886 1.01437 8.39497 0.890482C8.27109 0.766597 8.124 0.668342 7.96212 0.601333C7.71746 0.5 7.40679 0.5 6.78546 0.5C6.16412 0.5 5.85346 0.5 5.60879 0.601333C5.44691 0.668342 5.29982 0.766597 5.17594 0.890482C5.05205 1.01437 4.9538 1.16145 4.88679 1.32333C4.82546 1.472 4.80079 1.64533 4.79146 1.89867C4.78712 2.08129 4.73653 2.25982 4.64442 2.41757C4.55231 2.57532 4.42169 2.70713 4.26479 2.80067C4.10533 2.88985 3.92585 2.93712 3.74314 2.93805C3.56044 2.93898 3.38049 2.89355 3.22012 2.806C2.99612 2.68733 2.83346 2.622 2.67346 2.60067C2.323 2.55458 1.96859 2.64954 1.68812 2.86467C1.47879 3.02667 1.32279 3.29533 1.01212 3.83333C0.873457 4.07333 0.766123 4.25933 0.686123 4.41533" stroke="#131323" stroke-linecap="round" />
                </svg>

                <span className="truncate">Configure</span>
              </button>
              <button className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#F56D2D] !rounded-lg  font-[BasisGrotesquePro]">
                Disconnect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

