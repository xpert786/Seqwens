import {FilIcon,Fil2Icon,File3Icon} from "../../Components/icons";
export default function ActivityLogTab({ activityLog }) {
  const getIcon = (iconName) => {
    const icons = {
      payment: (
       <FilIcon/>
      ),
      send: (
       <Fil2Icon/>
      ),
      document: (
       <File3Icon/>
      )
    };
    return icons[iconName] || null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h6 className="text-lg font-bold mb-2 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>Activity Timeline</h6>
      <p className="text-sm mb-6 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>Complete history of actions taken on this Invoice</p>
      <div className="space-y-4 mt-6">
        {activityLog.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-4 pb-3 border-b" style={{ borderColor: '#F3F4F6' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" >
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1">
              <p className="text-base font-medium font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>{activity.description}</p>
              <p className="text-sm font-[BasisGrotesquePro] " style={{ color: '#6B7280' }}>by {activity.by} • {activity.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

