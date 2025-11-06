import React from 'react';

export default function TimelineTab({ client }) {
  const activities = [
    {
      id: 1,
      icon: 'document',
      description: 'Uploaded 2023 Tax Return',
      user: 'John Smith',
      date: '15-03-2025 10:30 AM'
    },
    {
      id: 2,
      icon: 'message',
      description: 'Sent Follow-Up Message About Missing Documents',
      user: 'Michael Chen',
      date: '13-03-2025 9:45 AM'
    },
    {
      id: 3,
      icon: 'calendar',
      description: 'Scheduled Quarterly Review Meeting',
      user: 'Michael Chen',
      date: '13-02-2025 4:20 PM'
    }
  ];

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'document':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <path d="M14.75 7.25V9.75C14.75 10.0815 14.8817 10.3995 15.1161 10.6339C15.3505 10.8683 15.6685 11 16 11H18.5M12.25 11.625H11M16 14.125H11M16 16.625H11M15.375 7.25H9.75C9.41848 7.25 9.10054 7.3817 8.86612 7.61612C8.6317 7.85054 8.5 8.16848 8.5 8.5V18.5C8.5 18.8315 8.6317 19.1495 8.86612 19.3839C9.10054 19.6183 9.41848 19.75 9.75 19.75H17.25C17.5815 19.75 17.8995 19.6183 18.1339 19.3839C18.3683 19.1495 18.5 18.8315 18.5 18.5V10.375L15.375 7.25Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
        );
      case 'message':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <path d="M19.75 7.25L15.7916 18.5596C15.642 18.9871 15.0467 19.0113 14.8628 18.5975L12.875 14.125M19.75 7.25L8.44036 11.2084C8.01294 11.358 7.98866 11.9533 8.40247 12.1372L12.875 14.125M19.75 7.25L12.875 14.125" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
        );
      case 'calendar':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Activity Timeline</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Recent activities and interactions with this client</p>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 bg-white !rounded-lg !border border-[#E8F0FF]">
            <div className="w-10 h-10  !rounded-lg flex items-center justify-center flex-shrink-0 text-[#3B4A66]">
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">{activity.description}</p>
              <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">
                by {activity.user} · {activity.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
