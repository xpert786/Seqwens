import React, { useState } from 'react';

const DateRangePicker = ({ 
  onDateRangeChange, 
  initialStartDate = null, 
  initialEndDate = null,
  className = '',
  style = {}
}) => {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, clear it
    if (endDate && new Date(newStartDate) > new Date(endDate)) {
      setEndDate('');
    }
    
    // Notify parent of changes
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: newStartDate,
        endDate: endDate && new Date(newStartDate) <= new Date(endDate) ? endDate : ''
      });
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    // Notify parent of changes
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate,
        endDate: newEndDate
      });
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: '',
        endDate: ''
      });
    }
  };

  return (
    <div className={`flex gap-2 items-end ${className}`} style={style}>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          min={startDate || undefined}
          className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ border: '1px solid #E8F0FF', color: '#3B4A66' }}
          disabled={!startDate}
        />
      </div>
      
      {(startDate || endDate) && (
        <button
          onClick={handleClear}
          className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 self-end mb-1"
          title="Clear dates"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default DateRangePicker;