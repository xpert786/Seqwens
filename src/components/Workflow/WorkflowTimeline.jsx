import React from 'react';

/**
 * WorkflowTimeline Component
 * Visual timeline of workflow progress
 */
const WorkflowTimeline = ({ stages = [], currentStage = null }) => {
  const getStageStatus = (stage) => {
    if (!currentStage) return 'pending';
    
    const currentStageId = typeof currentStage === 'object' ? currentStage.id : currentStage;
    const stageId = typeof stage === 'object' ? stage.id : stage;
    const stageName = typeof stage === 'object' ? stage.name : stage;
    const currentStageName = typeof currentStage === 'object' ? currentStage.name : currentStage;
    
    // Check if this stage is completed
    if (typeof stage === 'object' && stage.completed_at) {
      return 'completed';
    }
    
    // Check if this is the current stage
    if (stageId === currentStageId || stageName === currentStageName) {
      return 'current';
    }
    
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-600">
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          </div>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  if (!stages || stages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 font-[BasisGrotesquePro]">
        No stages available
      </div>
    );
  }

  return (
    <div className="workflow-timeline">
      {stages.map((stage, index) => {
        const status = getStageStatus(stage);
        const stageName = typeof stage === 'object' ? stage.name : stage;
        const completedAt = typeof stage === 'object' ? stage.completed_at : null;
        const isLast = index === stages.length - 1;

        return (
          <div key={index} className="relative flex items-start mb-6">
            {/* Timeline line */}
            {!isLast && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-full ${
                  status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
                style={{ height: 'calc(100% + 1.5rem)' }}
              />
            )}

            {/* Stage icon */}
            <div className="relative z-10 mr-4">{getStatusIcon(status)}</div>

            {/* Stage content */}
            <div className="flex-1 pt-1">
              <div className={`font-semibold text-sm ${getStatusColor(status)} font-[BasisGrotesquePro]`}>
                {stageName}
              </div>
              {completedAt && (
                <div className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                  Completed: {new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
              {status === 'current' && (
                <div className="text-xs text-blue-600 mt-1 font-[BasisGrotesquePro]">
                  In Progress
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowTimeline;

