import React, { useState } from 'react';

const TriggerConfigurationModal = ({ isOpen, onClose, onSave }) => {
  const [triggerType, setTriggerType] = useState('time_based');
  const [timeConfig, setTimeConfig] = useState({
    wait_days: 7,
    target_stage_id: null
  });
  const [eventConfig, setEventConfig] = useState({
    event_type: 'task_completed',
    conditions: [],
    target_stage_id: null
  });

  if (!isOpen) return null;

  const handleSave = () => {
    let triggerData;
    
    if (triggerType === 'time_based') {
      triggerData = {
        trigger_type: 'time_based',
        is_active: true,
        configuration: {
          wait_days: timeConfig.wait_days,
          target_stage_id: timeConfig.target_stage_id
        }
      };
    } else {
      triggerData = {
        trigger_type: 'event_based',
        is_active: true,
        configuration: {
          event_type: eventConfig.event_type,
          conditions: eventConfig.conditions,
          target_stage_id: eventConfig.target_stage_id
        }
      };
    }

    onSave(triggerData);
    // Reset form
    setTriggerType('time_based');
    setTimeConfig({ wait_days: 7, target_stage_id: null });
    setEventConfig({ event_type: 'task_completed', conditions: [], target_stage_id: null });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ borderRadius: '12px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8F0FF]">
          <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Add Trigger</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="12" fill="#E8F0FF" />
              <path d="M16.066 8.99502C16.1377 8.92587 16.1948 8.84314 16.2342 8.75165C16.2735 8.66017 16.2943 8.56176 16.2952 8.46218C16.2961 8.3626 16.2772 8.26383 16.2395 8.17164C16.2018 8.07945 16.1462 7.99568 16.0758 7.92523C16.0054 7.85478 15.9217 7.79905 15.8295 7.7613C15.7374 7.72354 15.6386 7.70452 15.5391 7.70534C15.4395 7.70616 15.341 7.7268 15.2495 7.76606C15.158 7.80532 15.0752 7.86242 15.006 7.93402L12 10.939L8.995 7.93402C8.92634 7.86033 8.84354 7.80123 8.75154 7.76024C8.65954 7.71925 8.56022 7.69721 8.45952 7.69543C8.35882 7.69365 8.25879 7.71218 8.1654 7.7499C8.07201 7.78762 7.98718 7.84376 7.91596 7.91498C7.84474 7.9862 7.7886 8.07103 7.75087 8.16442C7.71315 8.25781 7.69463 8.35784 7.69641 8.45854C7.69818 8.55925 7.72022 8.65856 7.76122 8.75056C7.80221 8.84256 7.86131 8.92536 7.935 8.99402L10.938 12L7.933 15.005C7.80052 15.1472 7.72839 15.3352 7.73182 15.5295C7.73525 15.7238 7.81396 15.9092 7.95138 16.0466C8.08879 16.1841 8.27417 16.2628 8.46847 16.2662C8.66278 16.2696 8.85082 16.1975 8.993 16.065L12 13.06L15.005 16.066C15.1472 16.1985 15.3352 16.2706 15.5295 16.2672C15.7238 16.2638 15.9092 16.1851 16.0466 16.0476C16.184 15.9102 16.2627 15.7248 16.2662 15.5305C16.2696 15.3362 16.1975 15.1482 16.065 15.006L13.062 12L16.066 8.99502Z" fill="#3B4A66" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Trigger Type <span className="text-red-500">*</span>
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
            >
              <option value="time_based">Time-based</option>
              <option value="event_based">Event-based</option>
            </select>
          </div>

          {/* Time-based Configuration */}
          {triggerType === 'time_based' && (
            <div className="border border-[#E8F0FF] rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Time Configuration</h5>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                    Wait
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={timeConfig.wait_days}
                      onChange={(e) => setTimeConfig({ ...timeConfig, wait_days: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-24 px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                    />
                    <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">Days</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                    Then advance to stage
                  </label>
                  <input
                    type="text"
                    value={timeConfig.target_stage_id || ''}
                    onChange={(e) => setTimeConfig({ ...timeConfig, target_stage_id: e.target.value })}
                    placeholder="Stage name or ID"
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                    Leave empty to advance to next stage
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Event-based Configuration */}
          {triggerType === 'event_based' && (
            <div className="border border-[#E8F0FF] rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-4 font-[BasisGrotesquePro]">Event Configuration</h5>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                    When
                  </label>
                  <select
                    value={eventConfig.event_type}
                    onChange={(e) => setEventConfig({ ...eventConfig, event_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  >
                    <option value="task_completed">Task Completed</option>
                    <option value="document_uploaded">Document Uploaded</option>
                    <option value="esign_completed">E-Signature Completed</option>
                    <option value="all_actions_completed">All Actions Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                    Then advance to stage
                  </label>
                  <input
                    type="text"
                    value={eventConfig.target_stage_id || ''}
                    onChange={(e) => setEventConfig({ ...eventConfig, target_stage_id: e.target.value })}
                    placeholder="Stage name or ID"
                    className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-[BasisGrotesquePro]">
                    Leave empty to advance to next stage
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
                    Conditions (Optional)
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-[#E8F0FF]"
                      />
                      <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                        Task type = "Document Collection"
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#E8F0FF]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-[BasisGrotesquePro]"
            style={{ borderRadius: '8px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#F56D2D] rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro]"
            style={{ borderRadius: '8px' }}
          >
            Save Trigger
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriggerConfigurationModal;

