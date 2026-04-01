import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TaxDashboardWidget from "../component/TaxDashboardWidegt";
import {
  FileIcon,
  Contacted,
  CompletedIcon,
  Building,
  Client,
  Msg,
  Clocking,
  Schedule,
  Analytics,
} from "../component/icons";
import { handleAPIError, dashboardAPI } from "../../ClientOnboarding/utils/apiUtils";

// ------------------- Task Card Component ------------------------
const TaskCard = ({ title, due, status, user, icon, value, onClick, className }) => {
  const isHighPriority = status?.some(s => s?.toLowerCase() === 'high');
  const isMediumPriority = status?.some(s => s?.toLowerCase() === 'medium');

  const badgeColor = isHighPriority ? 'bg-red-500' : isMediumPriority ? 'bg-yellow-400' : 'bg-green-500';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-3 sm:p-4 border border-[#E8F0FF] hover:border-[#F56D2D]/30 transition-all cursor-pointer ${className || ''}`}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-[#3AD6F2]">
            {icon || <FileIcon size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm sm:text-base font-semibold text-[#3B4A66] font-[BasisGrotesquePro] truncate mb-0.5">
              {title}
            </h5>
            <p className="text-[11px] sm:text-xs text-gray-500 font-[BasisGrotesquePro] mb-0">
              {due}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {status?.length > 0 && (
            <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full text-white font-medium capitalize ${badgeColor}`}>
              {status[0]}
            </span>
          )}
          {value && <span className="text-[10px] sm:text-xs font-bold text-[#F56D2D] font-[BasisGrotesquePro]">{value}</span>}
        </div>
      </div>
      <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#3B4A66] font-medium font-[BasisGrotesquePro]">
          {user}
        </div>
      </div>
    </div>
  );
};

// ------------------- Main Dashboard --------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [myTasksPage, setMyTasksPage] = useState(1);
  const [deadlinesPage, setDeadlinesPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const isFirstTime = localStorage.getItem("firstTimeUser");
    if (isFirstTime === "true") {
      navigate("/dashboard-first");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await dashboardAPI.getTaxPreparerDashboard();
        if (result.success && result.data) {
          setMyTasks(result.data.my_tasks || []);
          setUpcomingDeadlines(result.data.upcoming_deadlines || []);
          setRecentMessages(result.data.recent_messages || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        handleAPIError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const paginatedTasks = myTasks.slice((myTasksPage - 1) * ITEMS_PER_PAGE, myTasksPage * ITEMS_PER_PAGE);
  const paginatedDeadlines = upcomingDeadlines.slice((deadlinesPage - 1) * ITEMS_PER_PAGE, deadlinesPage * ITEMS_PER_PAGE);

  const quickActions = [
    { icon: <Client size={22} />, label: "Clients", path: '/taxdashboard/clients', color: 'bg-blue-50 text-[#3AD6F2]' },
    { icon: <FileIcon size={22} />, label: "Docs", path: '/taxdashboard/documents', color: 'bg-orange-50 text-[#F56D2D]' },
    { icon: <Schedule size={22} />, label: "Cal", path: '/taxdashboard/calendar', color: 'bg-purple-50 text-purple-500' },
    { icon: <Analytics size={22} />, label: "Tasks", path: '/taxdashboard/tasks', color: 'bg-green-50 text-emerald-500' }
  ];

  const SectionHeader = ({ title, subtitle, onViewAll }) => (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro] mb-1">{title}</h3>
        <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">{subtitle}</p>
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="px-4 py-2 bg-orange-50 text-[#F56D2D] text-xs font-bold rounded-xl hover:bg-[#F56D2D] hover:text-white transition-all font-[BasisGrotesquePro]"
        >
          View All
        </button>
      )}
    </div>
  );

  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#F56D2D] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
        >
          Previous
        </button>
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#F56D2D] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="w-full pb-8">
      <TaxDashboardWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 items-stretch">
        {/* My Tasks Section */}
        <div className="bg-white !rounded-2xl p-6 sm:p-8 border border-[#E8F0FF] flex flex-col">
          <SectionHeader
            title="My Tasks"
            subtitle="Tasks assigned to you"
            onViewAll={() => navigate('/taxdashboard/tasks')}
          />
          <div className="flex flex-col gap-4 flex-grow">
            {loading ? (
              <div className="flex justify-center py-12 text-gray-400 animate-pulse font-medium">Loading tasks...</div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium">No tasks assigned</div>
            ) : (
              paginatedTasks.map((task, i) => (
                <TaskCard
                  key={task.id || i}
                  title={task.task_title || task.title || 'Untitled Task'}
                  due={task.due_date_formatted || `Due: ${task.due_date || 'N/A'}`}
                  status={[task.priority_display || task.priority || 'medium']}
                  user={
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center scale-90"><Contacted size={12}/></div>
                       <span>{task.client?.name || 'Unknown Client'}</span>
                    </div>
                  }
                  onClick={() => navigate('/taxdashboard/tasks')}
                />
              ))
            )}
          </div>
          <Pagination
            currentPage={myTasksPage}
            totalItems={myTasks.length}
            onPageChange={setMyTasksPage}
          />
        </div>

        {/* Upcoming Deadlines Section */}
        <div className="bg-white !rounded-2xl p-6 sm:p-8 border border-[#E8F0FF] flex flex-col">
          <SectionHeader
            title="Deadlines"
            subtitle="Important dates to watch"
            onViewAll={() => navigate('/taxdashboard/tasks')}
          />
          <div className="flex flex-col gap-4 flex-grow">
            {loading ? (
              <div className="flex justify-center py-12 text-gray-400 animate-pulse font-medium">Loading deadlines...</div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium">No upcoming deadlines</div>
            ) : (
              paginatedDeadlines.map((deadline, i) => (
                <TaskCard
                  key={deadline.id || i}
                  title={deadline.title || 'Untitled'}
                  due={deadline.due_date_formatted || `Due: ${deadline.due_date || 'N/A'}`}
                  status={[deadline.priority_display || deadline.priority || 'medium']}
                  value={deadline.time_left || (deadline.days_left !== undefined ? `${deadline.days_left} days left` : '')}
                  user={
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center scale-90"><Contacted size={12}/></div>
                       <span>{deadline.client?.name || 'Unknown Client'}</span>
                    </div>
                  }
                  onClick={() => navigate('/taxdashboard/tasks')}
                />
              ))
            )}
          </div>
          <Pagination
            currentPage={deadlinesPage}
            totalItems={upcomingDeadlines.length}
            onPageChange={setDeadlinesPage}
          />
        </div>

        {/* Recent Messages Section */}
        <div className="bg-white !rounded-2xl p-6 sm:p-8 border border-[#E8F0FF] flex flex-col">
          <SectionHeader
            title="Communications"
            subtitle="Latest messages from clients"
            onViewAll={() => navigate('/taxdashboard/messages')}
          />
          <div className="flex flex-col gap-4 flex-grow">
            {loading ? (
              <div className="flex justify-center py-12 text-gray-400 animate-pulse font-medium">Loading messages...</div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium text-sm">No recent messages</div>
            ) : (
              recentMessages.slice(0, 3).map((msg, i) => (
                <div
                  key={msg.id || i}
                  onClick={() => navigate(`/taxdashboard/messages?thread=${msg.thread_id}`)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    (msg.sender?.role === 'client' || msg.sender_type === 'Client') ? 'bg-[#F3F7FF] border-[#E8F0FF]' : 'bg-white border-[#E8F0FF]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 font-[BasisGrotesquePro]">
                        {msg.sender?.name || msg.sender_name || 'Unknown'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F56D2D]"></span>
                      <span className="text-[10px] font-bold text-[#F56D2D] uppercase tracking-wider">
                        {msg.sender_type || (msg.sender?.role === 'client' ? 'Client' : 'Internal')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                      <Clocking size={12} />
                      <span>{msg.time_ago || 'Just now'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Msg size={16} className="text-[#F56D2D]" />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1 m-0 font-[BasisGrotesquePro]">
                      {msg.message_preview || msg.message_snippet || msg.content || 'No preview available'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white !rounded-2xl p-6 sm:p-8 border border-[#E8F0FF] flex flex-col justify-between">
          <SectionHeader
            title="Quick Shortcuts"
            subtitle="Common navigation actions"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 flex-grow content-start">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-[#F56D2D] group transition-all duration-300 border border-transparent hover:border-[#F56D2D]"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${action.color} group-hover:bg-white/20 group-hover:text-white`}>
                  {action.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-600 group-hover:text-white font-[BasisGrotesquePro] uppercase tracking-wider">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 p-4 bg-[#F3F7FF] rounded-2xl border border-[#E8F0FF]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#3AD6F2]">
                   <Analytics size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-900 m-0">Need assistance?</p>
                   <p className="text-[10px] text-gray-500 m-0">Visit the help center</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
