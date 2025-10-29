import React, { useState } from 'react';
import TabNavigation from '../../Components/TabNavigation';

const TaskManagementMain = () => {
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
<path d="M9 11L12 14L22 4" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      )
    },
    {
      title: 'In Progress',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 3L20 12L6 21V3Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      )
    },
    {
      title: 'Pending',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 6V12L16 14" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        
      )
    },
    {
      title: 'Overdue',
      value: '1',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 8V12" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 16H12.01" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      )
    },
    {
      title: 'Total Hours',
      value: '9',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3AD6F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
            <p className="text-gray-600">Track and manage all firm tasks and workflows</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Create Task
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex  justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <div className="text-blue-500">
                  {kpi.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className=" rounded-lg  p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search Bar */}
            <div className="flex-1">
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
                  className="block bg-white w-full pl-10 pr-3 py-2 border-1 border-[#E8F0FF] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex space-x-3">
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-[#4B5563] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>All Priorities</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-[#4B5563] focus:ring-2 focus:ring-blue-500 focus:border-transparent "
                >
                  <option>All Categories</option>
                  <option>Tax Preparation</option>
                  <option>Business Review</option>
                  <option>Amendment</option>
                  <option>Document Management</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 w-fit">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">All Tasks (4)</h4>
            <p className="text-gray-600">Complete list of tasks with status, assignments, and progress</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
              <thead className="">
                <tr>
                  <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {taskData.map((task) => (
                  <tr key={task.id}>
                    <td colSpan="8" className="p-0">
                      <div className="border border-[#E8F0FF] p-1 mb-2 rounded-lg ">
                        <div className="grid grid-cols-8 gap-6 items-center" style={{ minWidth: '1200px' }}>
                          <div className="px-3 py-2 min-w-[200px]">
                            <div>
                              <div className="text-sm font-medium text-gray-900 pr-10 ">{task.task}</div>
                              <div className="text-sm text-gray-500">{task.description}</div>
                            </div>
                          </div>
                           <div className="px-3 py-2 min-w-[150px]">
                             <div className="flex items-center">
                               <div className="flex-shrink-0 h-8 w-8 mr-3">
                                 <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                   <span className="text-xs font-medium text-gray-600">{task.assignedTo.initials}</span>
                                 </div>
                               </div>
                               <div className="text-sm font-medium text-gray-900">{task.assignedTo.name}</div>
                             </div>
                           </div>
                          <div className="px-3 py-2 text-sm text-gray-900 min-w-[120px]">{task.client}</div>
                          <div className="px-3 py-2 min-w-[80px] flex justify-start">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="px-3 py-2 min-w-[100px] flex justify-start">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="px-3 py-2 min-w-[120px] flex items-center justify-start">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-[#3AD6F2] h-2 rounded-full" 
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{task.progress}%</span>
                            </div>
                          </div>
                          <div className="px-3 py-2 min-w-[120px]">
                            <div>
                              <div className="text-sm text-gray-900">{task.dueDate}</div>
                              <div className="text-sm text-gray-500">{task.hours}</div>
                            </div>
                          </div>
                          <div className="px-3 py-2 text-sm font-medium min-w-[80px] relative dropdown-container">
                            <button 
                              onClick={() => handleActionClick(task.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openDropdown === task.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg border border-gray-200 z-50">
                                <div className="">
                                  <button
                                    onClick={() => handleActionSelect('View Details', task.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FFF4E6] hover:text-gray-900 transition-colors"
                                    style={{borderRadius: '7px'}}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleActionSelect('Edit Task', task.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors"
                                    style={{borderRadius: '7px'}}
                                  >
                                    Edit Task
                                  </button>
                                  <button
                                    onClick={() => handleActionSelect('Start Timer', task.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors"
                                    style={{borderRadius: '7px'}}
                                  >
                                    Start Timer
                                  </button>
                                  <button
                                    onClick={() => handleActionSelect('Delete Task', task.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors"
                                    style={{borderRadius: '7px'}}
                                  >
                                    Delete Task
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagementMain;
