import React from 'react';

export default function CurrentTasksTab({ currentTasks }) {
  return (
    <div className="bg-white rounded-xl !border border-[#E8F0FF] p-6">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">Current Tasks ({currentTasks.length})</h5>
        <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">Active tasks and their progress</p>
      </div>
      <div className="space-y-4">
        {currentTasks.map((task) => (
          <div key={task.id} className="!border border-[#E8F0FF] rounded-lg p-4">
            {/* Title and Priority/Status Badges - Same Row */}
            <div className="flex items-start justify-between mb-2">
              <h6 className="font-medium text-gray-900 font-[BasisGrotesquePro] flex-1">{task.title}</h6>
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  task.priority === 'High' ? 'bg-[#EF4444] text-white' : 'bg-yellow-500 text-white'
                } font-[BasisGrotesquePro]`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  task.status === 'In Progress' ? 'bg-[#1E40AF] text-white' : 'bg-[#FBBF24] text-white'
                } font-[BasisGrotesquePro]`}>
                  {task.status}
                </span>
              </div>
            </div>
            
            {/* Due Date and Completion Percentage - Same Row */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-[BasisGrotesquePro]">Due: {task.dueDate}</p>
              <p className="text-xs text-[#3B4A66] font-bold  font-[BasisGrotesquePro]">{task.progress}% complete</p>
            </div>
            
            {/* Progress Bar - Below Due Date/Percentage */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#3AD6F2] h-2 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

