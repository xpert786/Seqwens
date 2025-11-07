import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KanbanView = () => {
  const navigate = useNavigate();

  const [kanbanTasks, setKanbanTasks] = useState({
    'To Do': [
      {
        id: 1,
        title: 'Client Onboarding',
        description: 'Onboarding',
        priority: 'High',
        priorityColor: 'bg-white text-[#22C55E]  !border border-[#22C55E] !rounded-[10px]',
        statusIndicators: ['High', 'In Progress', 'Done']
      },
      {
        id: 2,
        title: 'IRS Rejection Correction',
        description: 'Onboarding',
        priority: 'Urgent',
        priorityColor: 'bg-white text-[#EF4444] !border border-[#EF4444] !rounded-[10px]',
        statusIndicators: ['High', 'In Progress', 'Done']
      }
    ],
    'In Progress': [
      {
        id: 3,
        title: 'Client Onboarding',
        description: 'Onboarding',
        priority: 'High',
        priorityColor: 'bg-white text-[#22C55E] !border border-[#22C55E] !rounded-[10px]',
        statusIndicators: ['High', 'In Progress', 'Done']
      },
      {
        id: 4,
        title: 'Due Diligence - Greenfield',
        description: 'Compliance',
        priority: 'High',
        priorityColor: 'bg-white text-[#22C55E] !border border-[#22C55E] !rounded-[10px]',
        statusIndicators: ['High', 'In Progress', 'Done']
      }
    ],
    'Completed': [
      {
        id: 5,
        title: 'Client Onboarding',
        description: 'Onboarding',
        priority: 'High',
        priorityColor: 'bg-white text-[#22C55E] !border border-[#22C55E] !rounded-[10px]',
        statusIndicators: ['High', 'In Progress', 'Done']
      }
    ],
    'Overdue': []
  });

  const columns = ['To Do', 'In Progress', 'Completed', 'Overdue'];

  const getStatusIndicatorColor = (indicator) => {
    if (indicator === 'Done') return 'bg-[#F56D2D] text-white !border border-[#F56D2D]';
    return '!bg-white text-gray-700 !border border-[#E8F0FF]';
  };

  return (
    <div className="mt-6">
      <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {columns.map((column) => (
              <div key={column} className="min-w-[280px] w-[280px] flex-shrink-0 bg-[#FFFFFF] rounded-xl !border border-[#E8F0FF] p-3">
                <h5 className="text-base font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">{column}</h5>
                
                {kanbanTasks[column].length === 0 ? (
                  <p className="text-sm text-gray-500 font-[BasisGrotesquePro]">No tasks</p>
                ) : (
                  <div className="space-y-3">
                    {kanbanTasks[column].map((task) => (
                      <div
                        key={task.id}
                        className="bg-white !border border-[#E8F0FF] !rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/firmadmin/tasks/${task.id}`)}
                      >
                        <div className="mb-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h6 className="text-sm font-semibold text-gray-900 font-[BasisGrotesquePro] flex-1 break-words">{task.title}</h6>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium !rounded-full font-[BasisGrotesquePro] flex-shrink-0 ${task.priorityColor}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-[BasisGrotesquePro]">{task.description}</p>
                        </div>

                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {task.statusIndicators.map((indicator, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex px-2 py-0.5 text-xs font-medium !rounded-full font-[BasisGrotesquePro] ${getStatusIndicatorColor(indicator)}`}
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanView;

