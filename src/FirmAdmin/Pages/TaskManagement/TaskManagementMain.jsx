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
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

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

            <button 
              onClick={() => setShowCreateTaskModal(true)}
              className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
            >
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

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowCreateTaskModal(false)}
        >
          <div
            className="bg-white !rounded-lg shadow-xl w-full max-w-4xl"
            style={{
              borderRadius: '12px',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3 border-b border-[#E8F0FF]">
              <h4 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Create Task</h4>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="flex items-center justify-center text-blue-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#E8F0FF" />
                  <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-3 overflow-y-auto flex-1" style={{ maxHeight: 'calc(75vh - 100px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Overview */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 space-y-3 w-full">
                  <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">Overview</h6>

                  {/* Title */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Title</label>
                    <input
                      type="text"
                      placeholder="Enter task title"
                      className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Enter task description"
                      className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm"
                    />
                  </div>

                  {/* Status and Priority - Same Line */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Status</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                          <option>To Do</option>
                          <option>In Progress</option>
                          <option>Review</option>
                          <option>Completed</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Priority</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
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
                    </div>
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Assignees</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">Alex Rivera</span>
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-[#F56D2D] text-white rounded-full font-[BasisGrotesquePro]">Jamie Chen</span>
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">Morgan Patel</span>
                    </div>
                  </div>

                  {/* Client and Office - Same Line */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Client */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Client</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                          <option>Select Client</option>
                          <option>Sunrise LLC</option>
                          <option>Client 2</option>
                          <option>Client 3</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Office */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Office</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                          <option>Select Office</option>
                          <option>Office 1</option>
                          <option>Office 2</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Documents</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">W-2: W-2: John Doe</span>
                      <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">1099: 1099: Contractor Set</span>
                      <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro]">K-1: K-1: Partner A</span>
                    </div>
                  </div>

                  {/* Share Status With Client */}
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-5 bg-[#F56D2D] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E8F0FF] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F56D2D]"></div>
                    </label>
                    <span className="text-base text-gray-700 font-[BasisGrotesquePro]">Share Status With Client</span>
                  </div>

                  {/* Dependencies */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Dependencies</label>
                    <p className="text-xs text-gray-500 mb-1.5 font-[BasisGrotesquePro]">Task(s) that must be completed before this one starts.</p>
                    <div className="bg-white !border border-[#E8F0FF] !rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">W-2: W-2: John Doe</span>
                        <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">1099: 1099: Contractor Set</span>
                        <span className="inline-flex px-3 py-1.5 text-xs font-medium bg-white text-[#3B4A66] !border border-[#E8F0FF] rounded-full font-[BasisGrotesquePro] w-fit">K-1: K-1: Partner A</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Checklist & Attachments */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 space-y-3 w-full">
                  <h6 className="text-base font-semibold text-gray-900 font-[BasisGrotesquePro]">Checklist & Attachments</h6>

                  {/* Checklist */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-base font-medium text-gray-700 font-[BasisGrotesquePro]">Checklist</label>
                    </div>
                    <div className="bg-white !border border-[#E8F0FF] !rounded-lg p-3">
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                          <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Create Client Record</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                          <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Assign Preparer</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 text-[#3AD6F2] border-[#E8F0FF] rounded focus:ring-[#3AD6F2] flex-shrink-0" />
                          <div className="flex-1 px-3 py-2 bg-white !border border-[#E8F0FF] rounded-lg">
                            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Send Organizer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Attachments</label>
                    <div className="w-full px-3 py-3 bg-white border-1 border-dashed border-[#E8F0FF] rounded-lg flex flex-col items-center justify-center gap-2 font-[BasisGrotesquePro] cursor-pointer hover:bg-gray-50 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13V17C19 17.5304 18.7893 18.0391 18.4142 18.4142C18.0391 18.7893 17.5304 19 17 19H3C2.46957 19 1.96086 18.7893 1.58579 18.4142C1.21071 18.0391 1 17.5304 1 17V13M15 6L10 1M10 1L5 6M10 1V13" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span className="text-xs text-gray-700">Choose File</span>
                    </div>
                  </div>

                  {/* Status and Priority - Same Line */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Status</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
                          <option>To Do</option>
                          <option>In Progress</option>
                          <option>Review</option>
                          <option>Completed</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Priority</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-3 py-2 pr-10 text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] cursor-pointer text-sm">
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
                    </div>
                  </div>

                  {/* Time Tracking */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5 font-[BasisGrotesquePro]">Time Tracking</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button className="px-4 py-2 bg-white text-[#3B4A66] !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-xs font-medium">
                        Start
                      </button>
                      <button className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-xs font-medium">
                        Stop
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 font-[BasisGrotesquePro]">No logs yet</span>
                  </div>
                </div>
              </div>

              {/* Comments & Mentions Section */}
              <div className="mt-4">
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4">
                  <h6 className="text-base font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">Comments & Mentions</h6>
                  <textarea
                    rows={3}
                    placeholder="Write a comment. Use @Name to mention staff."
                    className="w-full px-3 py-2 bg-white !border border-[#E8F0FF] !rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] text-sm mb-3"
                  />
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-700 font-[BasisGrotesquePro]">Client visible: No</p>
                      <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">No comments yet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-2 p-3 border-t border-[#E8F0FF]">
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="px-4 py-2 bg-[#EF4444] text-white !rounded-lg hover:bg-[#DC2626] transition-colors font-[BasisGrotesquePro] text-sm"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagementMain;
