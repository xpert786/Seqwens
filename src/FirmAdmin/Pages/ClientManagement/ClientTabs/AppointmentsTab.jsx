import React from 'react';

export default function AppointmentsTab({ client }) {
  const appointments = [
    {
      id: 1,
      title: 'Quarterly Business Review',
      dateTime: 'March 25, 2025 at 2:00 PM',
      status: 'Scheduled',
      statusColor: 'bg-[#DBEAFE] text-[#1E40AF]',
      icon: 'calendar'
    },
    {
      id: 2,
      title: 'Tax Return Review',
      dateTime: 'March 15, 2025 at 10:00 AM',
      status: 'Completed',
      statusColor: 'bg-[#DCFCE7] text-[#166534]',
      icon: 'checkmark'
    },
    {
      id: 3,
      title: 'Document Collection',
      dateTime: 'March 20, 2025 at 11:00 AM',
      status: 'Pending',
      statusColor: 'bg-[#FFEDD5] text-[#9A3412]',
      icon: 'info'
    }
  ];

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'calendar':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <path d="M11 7.25V9.75M16 7.25V9.75M7.875 12.25H19.125M9.125 8.5H17.875C18.5654 8.5 19.125 9.05964 19.125 9.75V18.5C19.125 19.1904 18.5654 19.75 17.875 19.75H9.125C8.43464 19.75 7.875 19.1904 7.875 18.5V9.75C7.875 9.05964 8.43464 8.5 9.125 8.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
        );
      case 'checkmark':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <g clip-path="url(#clip0_2277_7952)">
          <path d="M19.75 12.9247V13.4997C19.7492 14.8474 19.3128 16.1588 18.5058 17.2383C17.6989 18.3178 16.5646 19.1075 15.2721 19.4896C13.9796 19.8717 12.5983 19.8259 11.334 19.3588C10.0698 18.8917 8.99041 18.0285 8.25685 16.8978C7.52329 15.7672 7.17487 14.4297 7.26355 13.0849C7.35223 11.74 7.87325 10.4599 8.74892 9.43534C9.6246 8.41081 10.808 7.69679 12.1226 7.39976C13.4372 7.10274 14.8127 7.23863 16.0438 7.78717M11.625 12.8747L13.5 14.7497L19.75 8.49967" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
          <clipPath id="clip0_2277_7952">
          <rect width="15" height="15" fill="white" transform="translate(6 6)"/>
          </clipPath>
          </defs>
          </svg>
          
        );
      case 'info':
        return (
          <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="27" height="27" rx="8" fill="#E8F0FF"/>
          <g clip-path="url(#clip0_2277_7959)">
          <path d="M13.5 11V13.5M13.5 16H13.5063M19.75 13.5C19.75 16.9518 16.9518 19.75 13.5 19.75C10.0482 19.75 7.25 16.9518 7.25 13.5C7.25 10.0482 10.0482 7.25 13.5 7.25C16.9518 7.25 19.75 10.0482 19.75 13.5Z" stroke="#3AD6F2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
          <clipPath id="clip0_2277_7959">
          <rect width="15" height="15" fill="white" transform="translate(6 6)"/>
          </clipPath>
          </defs>
          </svg>
          
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white !rounded-lg p-6 !border border-[#E8F0FF]">
      <div className="mb-6">
        <h5 className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-2">Appointments</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Scheduled meetings and consultations</p>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0">
            <div className={`w-10 h-10   flex items-center justify-center flex-shrink-0`}>
              {getIcon(appointment.icon)}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro] mb-1">{appointment.title}</p>
              <p className="text-sm text-gray-500 font-[BasisGrotesquePro] mb-2">{appointment.dateTime}</p>
            </div>
            <div className="flex-shrink-0">
              <span className={`px-3 py-1 text-xs font-medium !rounded-[20px] ${appointment.statusColor} font-[BasisGrotesquePro]`}>
                {appointment.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
