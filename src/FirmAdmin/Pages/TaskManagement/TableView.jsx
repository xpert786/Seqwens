import React from 'react';
import { useNavigate } from 'react-router-dom';

const TableView = ({ taskData, totalCount, getPriorityColor, getStatusColor, handleActionClick, openDropdown, handleActionSelect }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">All Tasks ({totalCount || taskData.length})</h4>
        <p className="text-gray-600 font-[BasisGrotesquePro]">Complete list of tasks with status, assignments, and progress</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
          <thead className="">
            <tr>
              <th className="px-10 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider font-[BasisGrotesquePro]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {taskData.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center">
                  <p className="text-gray-500 font-[BasisGrotesquePro]">No tasks found</p>
                </td>
              </tr>
            ) : (
              taskData.map((task) => (
              <tr key={task.id}>
                <td colSpan="8" className="p-0">
                  <div 
                    className="!border border-[#E8F0FF] p-1 mb-2 !rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/firmadmin/tasks/${task.id}`)}
                  >
                    <div className="grid grid-cols-8 gap-6 items-center" style={{ minWidth: '1200px' }}>
                      <div className="px-3 py-2 min-w-[200px]">
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] line-clamp-2">{task.task}</div>
                          <div className="text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">{task.description}</div>
                        </div>
                      </div>
                      <div className="px-3 py-2 min-w-[150px]">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">{task.assignedTo.initials}</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{task.assignedTo.name}</div>
                        </div>
                      </div>
                      <div className="px-3 py-2 text-sm text-gray-900 min-w-[120px] font-[BasisGrotesquePro] whitespace-nowrap ml-8">{task.client}</div>
                      <div className="px-3 py-2 min-w-[80px] flex justify-start">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold !rounded-full font-[BasisGrotesquePro] ml-8 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="px-3 py-2 min-w-[100px] flex justify-start">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold !rounded-full font-[BasisGrotesquePro] ${getStatusColor(task.status)}`}>
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
                          <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">{task.progress}%</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 min-w-[120px]">
                        <div>
                          <div className="text-sm text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{task.dueDate}</div>
                          <div className="text-sm text-gray-500 font-[BasisGrotesquePro] whitespace-nowrap">{task.hours}</div>
                        </div>
                      </div>
                      <div className="px-3 py-2 text-sm font-medium min-w-[80px] relative dropdown-container flex justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(task.id);
                          }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('View Details', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FFF4E6] hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
                                style={{borderRadius: '7px'}}
                              >
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('Edit Task', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
                                style={{borderRadius: '7px'}}
                              >
                                Edit Task
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('Start Timer', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
                                style={{borderRadius: '7px'}}
                              >
                                Start Timer
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('Delete Task', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-gray-900 transition-colors font-[BasisGrotesquePro]"
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;

