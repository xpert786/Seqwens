import React from 'react';

export default function ActivityLogTab({ staffMember, activityLog }) {
  return (
    <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Activity Log - {staffMember.name}</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Recent activities and actions performed by this staff member</p>
      </div>
      <div className="space-y-4">
        {activityLog.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 !border border-[#E8F0FF] rounded-lg">
            <div className=" mt-4 flex-shrink-0">
              {activity.icon === 'clock' && (
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#22C55E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
               
              )}
              {activity.icon === 'calendar' && (
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="#22C55E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
               
              )}
              {activity.icon === 'document' && (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {activity.icon === 'message' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 8.246C13.5 8.44491 13.421 8.63568 13.2803 8.77633C13.1397 8.91698 12.9489 8.996 12.75 8.996H6.75C6.55109 8.996 6.36032 8.91698 6.21967 8.77633C6.07902 8.63568 6 8.44491 6 8.246C6 8.04709 6.07902 7.85632 6.21967 7.71567C6.36032 7.57502 6.55109 7.496 6.75 7.496H12.75C12.9489 7.496 13.1397 7.57502 13.2803 7.71567C13.421 7.85632 13.5 8.04709 13.5 8.246ZM12.75 10.496H6.75C6.55109 10.496 6.36032 10.575 6.21967 10.7157C6.07902 10.8563 6 11.0471 6 11.246C6 11.4449 6.07902 11.6357 6.21967 11.7763C6.36032 11.917 6.55109 11.996 6.75 11.996H12.75C12.9489 11.996 13.1397 11.917 13.2803 11.7763C13.421 11.6357 13.5 11.4449 13.5 11.246C13.5 11.0471 13.421 10.8563 13.2803 10.7157C13.1397 10.575 12.9489 10.496 12.75 10.496ZM19.5 9.746C19.5004 11.4293 19.0649 13.084 18.236 14.5491C17.4072 16.0142 16.2131 17.2398 14.77 18.1065C13.327 18.9732 11.6841 19.4515 10.0014 19.4949C8.31863 19.5383 6.6533 19.1453 5.1675 18.3541L1.97531 19.4182C1.71102 19.5063 1.4274 19.5191 1.15624 19.4551C0.885089 19.3911 0.637113 19.2529 0.44011 19.0559C0.243108 18.8589 0.104864 18.6109 0.0408727 18.3398C-0.0231183 18.0686 -0.0103272 17.785 0.0778122 17.5207L1.14187 14.3285C0.446389 13.0209 0.0579347 11.5721 0.0059975 10.0919C-0.0459397 8.61177 0.240005 7.13925 0.842128 5.78613C1.44425 4.433 2.34672 3.23482 3.48105 2.28256C4.61537 1.33029 5.95173 0.648948 7.38869 0.290259C8.82565 -0.0684305 10.3254 -0.0950433 11.7742 0.21244C13.223 0.519923 14.5827 1.15342 15.7501 2.06485C16.9175 2.97627 17.8619 4.14168 18.5116 5.47259C19.1614 6.8035 19.4994 8.26495 19.5 9.746ZM18 9.746C17.9996 8.48049 17.7082 7.23203 17.1481 6.0972C16.588 4.96237 15.7744 3.9716 14.7701 3.20153C13.7659 2.43147 12.5979 1.90276 11.3567 1.6563C10.1154 1.40985 8.83405 1.45226 7.61178 1.78025C6.38951 2.10824 5.25909 2.71302 4.30796 3.54781C3.35682 4.38259 2.61049 5.42499 2.12668 6.59437C1.64288 7.76375 1.43458 9.02876 1.5179 10.2915C1.60122 11.5543 1.97393 12.781 2.60719 13.8766C2.66034 13.9686 2.69334 14.0708 2.704 14.1765C2.71467 14.2822 2.70276 14.389 2.66906 14.4898L1.5 17.996L5.00625 16.8269C5.08262 16.8009 5.16275 16.7876 5.24344 16.7876C5.37516 16.7878 5.5045 16.8227 5.61844 16.8888C6.87263 17.6145 8.29581 17.997 9.74479 17.9979C11.1938 17.9988 12.6174 17.6181 13.8725 16.894C15.1276 16.17 16.1699 15.1281 16.8945 13.8733C17.619 12.6185 18.0003 11.195 18 9.746Z" fill="#22C55E"/>
                </svg>
                
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 font-[BasisGrotesquePro] mb-1">{activity.title}</div>
              <div className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-1">Client: {activity.client}</div>
              <div className="text-xs text-gray-500 font-[BasisGrotesquePro]">{activity.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

