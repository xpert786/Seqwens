import React, { useState, useRef } from 'react';
import { REMINDER_TYPES, TIMING_TYPES, TIMING_UNITS, NOTIFICATION_CHANNELS } from './workflowConstants';

const ReminderConfigurationModal = ({ isOpen, onClose, onSave }) => {
  const [userTypeGroup, setUserTypeGroup] = useState('taxpayer');
  const [timingDays, setTimingDays] = useState(3);
  const [timingType, setTimingType] = useState('before_due');
  const [timingUnit, setTimingUnit] = useState('days');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    in_app: false
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const textareaRef = useRef(null);

  const availableVariables = [
    { key: 'stage_name', label: 'Stage Name', placeholder: '{stage_name}' },
    { key: 'workflow_name', label: 'Workflow Name', placeholder: '{workflow_name}' },
    { key: 'client_name', label: 'Client Name', placeholder: '{client_name}' },
    { key: 'due_date', label: 'Due Date', placeholder: '{due_date}' }
  ];

  if (!isOpen) return null;

  // Drag and drop handlers
  const handleVariableDragStart = (e, placeholder) => {
    e.dataTransfer.setData('text/plain', placeholder);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTextareaDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleTextareaDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the textarea
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleTextareaDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const placeholder = e.dataTransfer.getData('text/plain');
    if (!placeholder) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || messageTemplate.length;
    const end = textarea.selectionEnd || messageTemplate.length;
    
    // Add space before if needed
    const beforeText = messageTemplate.slice(0, start);
    const afterText = messageTemplate.slice(end);
    const needsSpaceBefore = beforeText && !beforeText.endsWith(' ') && !beforeText.endsWith('\n') ? ' ' : '';
    const needsSpaceAfter = afterText && !afterText.startsWith(' ') && !afterText.startsWith('\n') ? ' ' : '';
    
    const newValue = beforeText + needsSpaceBefore + placeholder + needsSpaceAfter + afterText;
    setMessageTemplate(newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newPosition = start + needsSpaceBefore.length + placeholder.length + needsSpaceAfter.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleVariableClick = (placeholder) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || messageTemplate.length;
    const end = textarea.selectionEnd || messageTemplate.length;
    
    // Add space before if needed
    const beforeText = messageTemplate.slice(0, start);
    const afterText = messageTemplate.slice(end);
    const needsSpaceBefore = beforeText && !beforeText.endsWith(' ') && !beforeText.endsWith('\n') ? ' ' : '';
    const needsSpaceAfter = afterText && !afterText.startsWith(' ') && !afterText.startsWith('\n') ? ' ' : '';
    
    const newValue = beforeText + needsSpaceBefore + placeholder + needsSpaceAfter + afterText;
    setMessageTemplate(newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newPosition = start + needsSpaceBefore.length + placeholder.length + needsSpaceAfter.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleSave = () => {
    if (!messageTemplate.trim()) {
      alert('Message template is required');
      return;
    }
    
    const selectedChannels = Object.keys(channels).filter(key => channels[key]);
    if (selectedChannels.length === 0) {
      alert('At least one notification channel must be selected');
      return;
    }
    
    const reminderData = {
      reminder_type: userTypeGroup,
      timing_value: timingDays,
      timing_type: timingType,
      timing_unit: timingUnit,
      message_template: messageTemplate.trim(),
      notification_channels: selectedChannels,
      is_active: true
    };
    onSave(reminderData);
    // Reset form
    setUserTypeGroup('taxpayer');
    setTimingDays(3);
    setTimingType('before_due');
    setTimingUnit('days');
    setMessageTemplate('');
    setChannels({ email: true, sms: false, in_app: false });
    setIsDraggingOver(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999, position: 'fixed' }}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ borderRadius: '12px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8F0FF]">
          <h3 className="text-xl font-bold text-gray-900 font-[BasisGrotesquePro]">Add Reminder</h3>
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
          {/* Remind */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Remind <span className="text-red-500">*</span>
            </label>
            <select
              value={userTypeGroup}
              onChange={(e) => setUserTypeGroup(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
            >
              {REMINDER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timing */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Timing <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={timingDays}
                onChange={(e) => setTimingDays(parseInt(e.target.value) || 0)}
                min="0"
                className="w-24 px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
              />
              <select
                value={timingUnit}
                onChange={(e) => setTimingUnit(e.target.value)}
                className="w-24 px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
              >
                {TIMING_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
              <select
                value={timingType}
                onChange={(e) => setTimingType(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[#E8F0FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro]"
              >
                {TIMING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Template - Prominent Section */}
          <div className="bg-[#F9FAFB] border-2 border-[#E8F0FF] rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3 font-[BasisGrotesquePro]">
              Message Template <span className="text-red-500">*</span>
            </label>
            
            {/* Available Variables - Button Style */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2 font-[BasisGrotesquePro]">
                Available Variables (Drag & Drop or Click):
              </p>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    draggable
                    onDragStart={(e) => handleVariableDragStart(e, variable.placeholder)}
                    onClick={() => handleVariableClick(variable.placeholder)}
                    className="px-3 py-1.5 text-xs font-medium text-[#3B4A66] bg-white border border-[#E8F0FF] rounded-lg hover:bg-[#F3F7FF] hover:border-[#00C0C6] transition-all cursor-move active:cursor-grabbing font-[BasisGrotesquePro] shadow-sm hover:shadow-md"
                    style={{ borderRadius: '8px' }}
                    title={`Click or drag to insert ${variable.label}`}
                  >
                    {variable.placeholder}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea with Drop Zone */}
            <textarea
              ref={textareaRef}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              onDragOver={handleTextareaDragOver}
              onDragLeave={handleTextareaDragLeave}
              onDrop={handleTextareaDrop}
              placeholder="Reminder: {stage_name} is due soon. Please complete required actions for {workflow_name} for {client_name}."
              rows={5}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3AD6F2] font-[BasisGrotesquePro] resize-none transition-all ${
                isDraggingOver 
                  ? 'border-[#00C0C6] bg-[#F0FDFF]' 
                  : 'border-[#E8F0FF] bg-white'
              }`}
            />
            <p className="text-xs text-gray-500 mt-2 font-[BasisGrotesquePro]">
              💡 Tip: Drag variables above into the message or click them to insert at cursor position
            </p>
          </div>

          {/* Notification Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 font-[BasisGrotesquePro]">
              Notification Channels <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {NOTIFICATION_CHANNELS.map((channel) => (
                <label key={channel.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channels[channel.value]}
                    onChange={(e) => setChannels({ ...channels, [channel.value]: e.target.checked })}
                    className="rounded border-[#E8F0FF]"
                  />
                  <span className="text-sm text-gray-700 font-[BasisGrotesquePro]">
                    {channel.value === 'email' && '📧 '}
                    {channel.value === 'sms' && '📱 '}
                    {channel.value === 'in_app' && '🔔 '}
                    {channel.label}
                  </span>
                </label>
              ))}
            </div>
            {Object.values(channels).every(v => !v) && (
              <p className="text-xs text-red-500 mt-1 font-[BasisGrotesquePro]">
                At least one channel must be selected
              </p>
            )}
          </div>
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
            Save Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderConfigurationModal;

