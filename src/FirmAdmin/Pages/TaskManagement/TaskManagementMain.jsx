import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TableView from './TableView';
import KanbanView from './KanbanView';
import CalendarView from './CalendarView';
import GanttView from './GanttView';
import ReportingView from './ReportingView';

const TaskManagementMain = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Table View');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [openDropdown, setOpenDropdown] = useState(null);

  const tabs = ['Table View', 'Kanban', 'Calendar', 'Gantt', 'Reporting'];

  // KPI Data
  const kpiData = [
    {
      title: 'Completed',
      value: '0',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      )
    },
    {
      title: 'In Progress',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L20 12L6 21V3Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      )
    },
    {
      title: 'Pending',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 6V12L16 14" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      )
    },
    {
      title: 'Overdue',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 8V12" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 16H12.01" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      )
    },
    {
      title: 'Total Hours',
      value: '9',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      )
    }
  ];

  // Task Data
  const taskData = [
    {
      id: 1,
      task: 'Complete 2023 Tax Return - John Smith',
      description: 'Tax Preparation',
      assignedTo: { initials: 'MC', name: 'Michael Chen' },
      client: 'John Smith',
      priority: 'High',
      status: 'In progress',
      progress: 75,
      dueDate: '2024-03-20',
      hours: '6h / 8h'
    },
    {
      id: 2,
      task: 'Quarterly Business Review - Davis LLC',
      description: 'Business Review',
      assignedTo: { initials: 'SM', name: 'Sarah Martinez' },
      client: 'Michael Davis',
      priority: 'Medium',
      status: 'Pending',
      progress: 0,
      dueDate: '2024-03-22',
      hours: '0h / 4h'
    },
    {
      id: 3,
      task: 'Amendment Filing - Emily Wilson',
      description: 'Amendment',
      assignedTo: { initials: 'DR', name: 'David Rodriguez' },
      client: 'Emily Wilson',
      priority: 'High',
      status: 'Review',
      progress: 90,
      dueDate: '2024-03-18',
      hours: '2.5h / 3h'
    },
    {
      id: 4,
      task: 'Document Collection - Sarah Johnson',
      description: 'Document Management',
      assignedTo: { initials: 'DR', name: 'Lisa Thompson' },
      client: 'Sarah Johnson',
      priority: 'Low',
      status: 'Overdue',
      progress: 25,
      dueDate: '2024-03-15',
      hours: '0.5h / 2h'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-[#EF4444] text-white';
      case 'Medium': return 'bg-[#FBBF24] text-white';
      case 'Low': return 'bg-[#10B981] text-white';
      default: return 'bg-[#6B7280] text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In progress': return 'bg-[#1E40AF] text-white';
      case 'Pending': return 'bg-[#FBBF24] text-white';
      case 'Review': return 'bg-[#854D0E] text-white';
      case 'Overdue': return 'bg-[#EF4444] text-white';
      default: return 'bg-[#6B7280] text-white';
    }
  };

  const handleActionClick = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  const handleActionSelect = (action, taskId) => {
    console.log(`${action} clicked for task ${taskId}`);
    setOpenDropdown(null);
    if (action === 'View Details') {
      navigate(`/firmadmin/tasks/${taskId}`);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7FF] p-6">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-4 lg:space-y-0">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Task Management</h4>
            <p className="text-gray-600 font-[BasisGrotesquePro]">Track and manage all firm tasks and workflows</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-x-2 font-[BasisGrotesquePro]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25"
                  stroke="#4B5563"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Export Report
            </button>

            <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro]">{kpi.title}</p>
                <div className="text-[#3AD6F2] flex-shrink-0">
                  {kpi.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
            {/* Search Bar */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block bg-white w-full pl-10 pr-3 py-2 !border border-[#E8F0FF] !rounded-lg  focus:border-transparent font-[BasisGrotesquePro]"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex space-x-3">
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2.5 pr-10 text-[#4B5563] focus:outline-none font-[BasisGrotesquePro] cursor-pointer min-w-[160px]"
                >
                  <option>All Priorities</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2.5 pr-10 text-[#4B5563] focus:outline-none font-[BasisGrotesquePro] cursor-pointer min-w-[160px]"
                >
                  <option>All Categories</option>
                  <option>Tax Preparation</option>
                  <option>Business Review</option>
                  <option>Amendment</option>
                  <option>Document Management</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics and Trigger Buttons */}
          {(activeTab === 'Kanban' || activeTab === 'Calendar') && (
            <div className="flex items-center gap-3 mb-4 overflow-x-auto">
              <div className="flex items-center gap-3 text-sm font-[BasisGrotesquePro] flex-shrink-0">
                <span className="bg-white text-gray-700 !border border-[#E8F0FF] !rounded-full px-3 py-1 whitespace-nowrap">All: 4</span>
                <span className="bg-white text-gray-700 !border border-[#E8F0FF] !rounded-full px-3 py-1 whitespace-nowrap">To Do: 2</span>
                <span className="bg-white text-gray-700 !border border-[#E8F0FF] !rounded-full px-3 py-1 whitespace-nowrap">In Progress: 2</span>
                <span className="bg-white text-gray-700 !border border-[#E8F0FF] !rounded-full px-3 py-1 whitespace-nowrap">Done: 0</span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm whitespace-nowrap">
                  Trigger: New Client Onboarded
                </button>
                <button className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm whitespace-nowrap">
                  Trigger: IRS Rejection
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="w-fit">
            <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-3">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] whitespace-nowrap ${activeTab === tab
                      ? 'bg-[#3AD6F2] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'Table View' && (
          <TableView
            taskData={taskData}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
            handleActionClick={handleActionClick}
            openDropdown={openDropdown}
            handleActionSelect={handleActionSelect}
          />
        )}
        {activeTab === 'Kanban' && <KanbanView />}
        {activeTab === 'Calendar' && <CalendarView />}
        {activeTab === 'Gantt' && <GanttView />}
        {activeTab === 'Reporting' && <ReportingView />}
      </div>
    </div>
  );
};

export default TaskManagementMain;
