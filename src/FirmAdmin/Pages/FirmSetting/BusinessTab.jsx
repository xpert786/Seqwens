import React, { useState } from 'react';

export default function BusinessTab() {
  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, open: '09:00', close: '17:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '17:00' },
    thursday: { enabled: true, open: '09:00', close: '17:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: true, open: '09:00', close: '18:00' },
    sunday: { enabled: false, open: '09:00', close: '17:00' }
  });

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const parseTime12Hour = (time12) => {
    if (!time12) return '';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toLowerCase();
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const toggleDay = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Business Hours */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 !border border-[#E8F0FF] overflow-hidden">
        <div className="mb-4 sm:mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Business Hours
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Set your firm's operating hours
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {days.map((day) => (
            <div key={day.key} className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={businessHours[day.key].enabled}
                    onChange={() => toggleDay(day.key)}
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
                    businessHours[day.key].enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      businessHours[day.key].enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
                <span className="w-10 sm:w-12 md:w-14 lg:w-16 xl:w-20 2xl:w-24 text-xs sm:text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">
                  {day.label}
                </span>
              </div>
              {businessHours[day.key].enabled ? (
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 flex-shrink-0 min-w-0">
                  <input
                    type="text"
                    value={formatTime12Hour(businessHours[day.key].open)}
                    onChange={(e) => {
                      const time24 = parseTime12Hour(e.target.value);
                      if (time24) {
                        setBusinessHours(prev => ({
                          ...prev,
                          [day.key]: { ...prev[day.key], open: time24 }
                        }));
                      }
                    }}
                    placeholder="09:00 am"
                    className="w-[70px] sm:w-[75px] md:w-[85px] lg:w-[100px] xl:w-[120px] 2xl:w-[130px] !rounded-lg !border border-[#E8F0FF] px-1 sm:px-1.5 md:px-2 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] bg-white"
                  />
                  <span className="text-xs sm:text-sm text-[#1F2A55] font-[BasisGrotesquePro] flex-shrink-0">To</span>
                  <input
                    type="text"
                    value={formatTime12Hour(businessHours[day.key].close)}
                    onChange={(e) => {
                      const time24 = parseTime12Hour(e.target.value);
                      if (time24) {
                        setBusinessHours(prev => ({
                          ...prev,
                          [day.key]: { ...prev[day.key], close: time24 }
                        }));
                      }
                    }}
                    placeholder="05:00 pm"
                    className="w-[70px] sm:w-[75px] md:w-[85px] lg:w-[100px] xl:w-[120px] 2xl:w-[130px] !rounded-lg !border border-[#E8F0FF] px-1 sm:px-1.5 md:px-2 lg:px-2.5 xl:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] bg-white"
                  />
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-[#1F2A55] font-[BasisGrotesquePro] flex-shrink-0">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-white rounded-2xl p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
            Regional Settings
          </h5>
          <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
            Configure regional preferences
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Timezone
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>Eastern Time</option>
              <option>Central Time</option>
              <option>Mountain Time</option>
              <option>Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Currency
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>CAD (C$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Date Format
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>mm/dd/yyyy</option>
              <option>dd/mm/yyyy</option>
              <option>yyyy-mm-dd</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Number Format
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>1,234.56</option>
              <option>1.234,56</option>
              <option>1 234,56</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Current Tax Year
            </label>
            <select className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white">
              <option>2024</option>
              <option>2023</option>
              <option>2025</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

