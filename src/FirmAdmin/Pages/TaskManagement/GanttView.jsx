import React, { useState } from 'react';

const GanttView = () => {
  const [weeks, setWeeks] = useState(8);
  const [zoomLevel, setZoomLevel] = useState(1);

  const tasks = [
    {
      id: 1,
      name: 'Request W-2 for Acme',
      client: 'c1',
      startDate: new Date(2025, 8, 1), // Sep 1
      endDate: new Date(2025, 8, 6), // Sep 6
      color: 'bg-[#E8F0FF]',
      textColor: 'text-[#3B4A66]',
      status: 'Not Started'
    },
    {
      id: 2,
      name: 'Due Diligence - Greenfield',
      client: 'c2',
      startDate: new Date(2025, 8, 1), // Sep 1
      endDate: new Date(2025, 8, 11), // Sep 11
      color: 'bg-[#F56D2D]',
      textColor: 'text-white'
    },
    {
      id: 3,
      name: 'Onboard Sunrise LLC',
      client: 'c3',
      startDate: new Date(2025, 8, 4), // Sep 4
      endDate: new Date(2025, 8, 13), // Sep 13
      color: 'bg-[#F56D2D]',
      textColor: 'text-white'
    },
    {
      id: 4,
      name: 'Past Due: IRS Notice Follow-up',
      client: 'c1',
      startDate: new Date(2025, 7, 30), // Aug 30 (before timeline start)
      endDate: new Date(2025, 7, 31), // Aug 31 (extends into timeline)
      color: 'bg-[#F56D2D]',
      textColor: 'text-white'
    }
  ];

  const generateTimeline = () => {
    const startDate = new Date(2025, 7, 31); // Aug 31
    const days = [];
    for (let i = 0; i < 16; i++) { // Aug 31 to Sep 15 (16 days)
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const timeline = generateTimeline();
  const getDayPosition = (date) => {
    const startDate = new Date(2025, 7, 31);
    const diffTime = date - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTaskWidth = (startDate, endDate) => {
    const startPos = getDayPosition(startDate);
    const endPos = getDayPosition(endDate);
    return endPos - startPos + 1;
  };

  const getTaskLeft = (startDate) => {
    return getDayPosition(startDate) - 1;
  };

  return (
    <div className="mt-6">
      <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
            Gantt ({weeks} Weeks)
          </h5>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['4w', '8w', '12w'].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeeks(parseInt(w))}
                  className={`px-3 py-1 text-xs font-medium !rounded-lg transition-colors font-[BasisGrotesquePro] !border border-[#E8F0FF] ${
                    weeks === parseInt(w)
                      ? 'bg-[#3AD6F2] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="px-3 py-1 text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 !rounded-lg transition-colors font-[BasisGrotesquePro] !border border-[#E8F0FF]"
              >
                -Zoom
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="px-3 py-1 text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 !rounded-lg transition-colors font-[BasisGrotesquePro] !border border-[#E8F0FF]"
              >
                +Zoom
              </button>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-full" style={{ minWidth: '1200px' }}>
            {/* Timeline Header */}
            <div className="flex !border-b border-[#E2E8F0] !border-t border-[#E2E8F0]">
              <div className="w-[200px] font-semibold text-sm text-[#4B5563] font-[BasisGrotesquePro] py-2 px-2 !border-r border-[#E2E8F0] !border-l border-[#E2E8F0]">Task</div>
              <div className="flex-1 flex">
                {timeline.map((date, idx) => (
                  <div key={idx} className="flex-1 text-center text-xs text-[#4B5563] font-[BasisGrotesquePro] !border-r border-[#E2E8F0]">
                    <div className="font-semibold py-1">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="py-1">{date.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-0">
              {tasks.map((task) => {
                const width = getTaskWidth(task.startDate, task.endDate);
                const left = getTaskLeft(task.startDate);
                const minWidth = Math.max(1, width * (100 / 16));
                
                return (
                  <div key={task.id} className="flex items-center !border-b border-[#E2E8F0]">
                    <div className="w-[200px] py-3 px-2 text-sm text-gray-900 font-[BasisGrotesquePro] !border-r border-[#E2E8F0] !border-l border-[#E2E8F0] bg-white relative z-10">
                      <div className="font-medium">{task.name}</div>
                      <div className="text-xs text-gray-500">Client: {task.client}</div>
                    </div>
                    <div className="flex-1 relative h-12 overflow-visible !border-r border-[#E2E8F0] px-1">
                      <div
                        className={`absolute h-8 top-2 ${task.color} ${task.textColor} flex items-center px-2 text-xs font-medium !rounded-lg font-[BasisGrotesquePro] whitespace-nowrap`}
                        style={{
                          left: left < 0 ? '2px' : `calc(${left * (100 / 16)}% + 2px)`,
                          width: left < 0 
                            ? `calc(${(width + left) * (100 / 16)}% - 4px)` 
                            : `calc(${width * (100 / 16)}% - 4px)`,
                          minWidth: width === 1 ? '60px' : `${width * 40}px`
                        }}
                      >
                        {task.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#E8F0FF] rounded"></div>
            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#3AD6F2] rounded"></div>
            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#22C55E] rounded"></div>
            <span className="text-xs text-gray-700 font-[BasisGrotesquePro]">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttView;

