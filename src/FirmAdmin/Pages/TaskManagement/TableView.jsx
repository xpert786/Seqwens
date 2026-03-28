import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TableView = ({ taskData, totalCount, getPriorityColor, getStatusColor, handleActionClick, openDropdown, handleActionSelect }) => {
  const navigate = useNavigate();
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        handleActionClick(null);
      }
    };
    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openDropdown]);

  return (
    <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-2 font-[BasisGrotesquePro]">All Tasks ({totalCount || taskData.length})</h4>
        <p className="text-gray-600 font-[BasisGrotesquePro]">Complete list of tasks with status, assignments, and progress</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: taskData.length > 0 ? '1200px' : '100%' }}>
          {taskData.length > 0 && (
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
          )}
          <tbody className="bg-white">
            {taskData.length === 0 ? (
              <tr className="w-full">
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
                            <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] line-clamp-2">{task.task_title}</div>
                            <div className="text-sm text-gray-500 font-[BasisGrotesquePro] mt-0.5">{task.description}</div>
                          </div>
                        </div>
                        <div className="px-3 py-2 min-w-[150px]">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 mr-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 font-[BasisGrotesquePro]">{task.assigned_to_initials}</span>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{task.assigned_to_name}</div>
                          </div>
                        </div>
                        <div className="px-3 py-2 text-sm text-gray-900 min-w-[120px] font-[BasisGrotesquePro] whitespace-nowrap ml-8">{task.client_name}</div>
                        <div className="px-3 py-2 min-w-[80px] flex justify-start">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold !rounded-full font-[BasisGrotesquePro] ml-8 ${getPriorityColor(task.priority)}`}>
                            {task.priority_display || task.priority}
                          </span>
                        </div>
                        <div className="px-3 py-2 min-w-[100px] flex justify-start">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold !rounded-full font-[BasisGrotesquePro] ${getStatusColor(task.status)}`}>
                            {task.status_display || task.status}
                          </span>
                        </div>
                        <div className="px-3 py-2 min-w-[120px] flex items-center justify-start">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-[#3AD6F2] h-2 rounded-full"
                                style={{ width: `${task.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 font-[BasisGrotesquePro]">{task.progress_percentage || 0}%</span>
                          </div>
                        </div>
                        <div className="px-3 py-2 min-w-[120px]">
                          <div>
                            <div className="text-sm text-gray-900 font-[BasisGrotesquePro] whitespace-nowrap">{task.due_date_formatted || task.due_date}</div>
                            <div className="text-sm text-gray-500 font-[BasisGrotesquePro] whitespace-nowrap">{task.hours_display}</div>

                          </div>
                        </div>
                        <div className="px-3 py-2 text-sm font-medium min-w-[80px] flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPos({ top: rect.bottom + 6, left: rect.right - 160 });
                              handleActionClick(openDropdown === task.id ? null : task.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu — fixed position to escape overflow clipping */}
                          {openDropdown === task.id && (
                            <div
                              ref={dropdownRef}
                              className="w-40 bg-white rounded-lg border border-gray-200 shadow-lg"
                              style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('View Details', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FFF4E6] hover:!text-black transition-colors font-[BasisGrotesquePro]"
                                style={{ borderRadius: '7px' }}
                              >
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionSelect('Delete Task', task.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:!text-red-600 transition-colors font-[BasisGrotesquePro]"
                                style={{ borderRadius: '7px' }}
                              >
                                Delete Task
                              </button>
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
    </div >
  );
};

export default TableView;

