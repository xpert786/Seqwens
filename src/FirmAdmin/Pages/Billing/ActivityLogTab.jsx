import { FilIcon, Fil2Icon, File3Icon } from "../../Components/icons";
export default function ActivityLogTab({ activityLog }) {
  const getIcon = (iconName) => {
    const icons = {
      payment: (
        <FilIcon />
      ),
      send: (
        <Fil2Icon />
      ),
      document: (
        <File3Icon />
      )
    };
    return icons[iconName] || null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-[#E8F0FF]">
      <div className="mb-8">
        <h6 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 font-[BasisGrotesquePro]">Activity Timeline</h6>
        <p className="text-xl sm:text-2xl font-black text-gray-900 font-[BasisGrotesquePro] tracking-tight">Invoice History</p>
      </div>

      <div className="relative space-y-2">
        {/* Vertical Line */}
        <div className="absolute left-6 top-2 bottom-6 w-0.5 bg-gray-50"></div>

        {activityLog.length > 0 ? (
          activityLog.map((activity, idx) => (
            <div key={idx} className="relative flex items-start gap-6 p-4 rounded-xl hover:bg-gray-50/50 transition-colors group">
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white border-2 border-gray-50 shadow-sm flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform">
                <div className="scale-110">
                  {getIcon(activity.icon)}
                </div>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm sm:text-base font-bold text-gray-800 font-[BasisGrotesquePro] leading-snug">{activity.description}</p>
                <div className="flex flex-wrap items-center gap-x-2 mt-1.5">
                  <p className="text-[11px] font-bold text-gray-400 font-[BasisGrotesquePro]">by <span className="text-gray-600 font-black uppercase tracking-wider">{activity.by}</span></p>
                  <span className="text-gray-200">•</span>
                  <p className="text-[11px] font-bold text-gray-400 font-[BasisGrotesquePro]">{activity.date}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-400 font-[BasisGrotesquePro]">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

