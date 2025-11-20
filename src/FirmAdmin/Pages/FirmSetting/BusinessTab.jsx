import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';

export default function BusinessTab() {
  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, open: '09:00', close: '17:00' },
    tuesday: { enabled: true, open: '09:00', close: '17:00' },
    wednesday: { enabled: true, open: '09:00', close: '17:00' },
    thursday: { enabled: true, open: '09:00', close: '17:00' },
    friday: { enabled: true, open: '09:00', close: '17:00' },
    saturday: { enabled: false, open: '09:00', close: '17:00' },
    sunday: { enabled: false, open: '09:00', close: '17:00' }
  });

  const [regionalSettings, setRegionalSettings] = useState({
    timezone: 'UTC',
    currency: 'USD',
    date_format: 'mm/dd/yyyy',
    number_format: '1,234.56',
    current_tax_year: new Date().getFullYear()
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Timezone mapping
  const timezoneMap = {
    'America/New_York': 'Eastern Time',
    'America/Chicago': 'Central Time',
    'America/Denver': 'Mountain Time',
    'America/Los_Angeles': 'Pacific Time',
    'UTC': 'UTC'
  };

  const timezoneReverseMap = {
    'Eastern Time': 'America/New_York',
    'Central Time': 'America/Chicago',
    'Mountain Time': 'America/Denver',
    'Pacific Time': 'America/Los_Angeles',
    'UTC': 'UTC'
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const parseTime12Hour = (time12) => {
    if (!time12) return '';
    // Handle both "09:00 AM" and "09:00" formats
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3] ? match[3].toLowerCase() : null;
    
    // If no AM/PM, assume 24-hour format
    if (!ampm) {
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    // Convert 12-hour to 24-hour
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Fetch business information on mount
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await firmAdminSettingsAPI.getBusinessInfo();
        
        if (response.success && response.data) {
          // Convert business hours from API format (12-hour) to internal format (24-hour)
          if (response.data.business_hours) {
            const convertedHours = {};
            Object.keys(response.data.business_hours).forEach(day => {
              const dayData = response.data.business_hours[day];
              convertedHours[day] = {
                enabled: dayData.enabled || false,
                open: dayData.start_time ? parseTime12Hour(dayData.start_time) : '09:00',
                close: dayData.end_time ? parseTime12Hour(dayData.end_time) : '17:00'
              };
            });
            setBusinessHours(convertedHours);
          }

          // Set regional settings
          if (response.data.timezone || response.data.currency || response.data.date_format) {
            setRegionalSettings({
              timezone: timezoneMap[response.data.timezone] || response.data.timezone || 'UTC',
              currency: response.data.currency || 'USD',
              date_format: response.data.date_format || 'mm/dd/yyyy',
              number_format: response.data.number_format || '1,234.56',
              current_tax_year: response.data.current_tax_year || new Date().getFullYear()
            });
          }
        } else {
          throw new Error(response.message || 'Failed to load business information');
        }
      } catch (err) {
        console.error('Error fetching business info:', err);
        const errorMsg = handleAPIError(err);
        setError(errorMsg || 'Failed to load business information');
        toast.error(errorMsg || 'Failed to load business information');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  const toggleDay = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  // Handle regional settings change
  const handleRegionalChange = (field, value) => {
    setRegionalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Convert business hours from internal format (24-hour) to API format (12-hour)
      const businessHoursForAPI = {};
      Object.keys(businessHours).forEach(day => {
        const dayData = businessHours[day];
        businessHoursForAPI[day] = {
          enabled: dayData.enabled,
          start_time: dayData.enabled ? formatTime12Hour(dayData.open) : null,
          end_time: dayData.enabled ? formatTime12Hour(dayData.close) : null
        };
      });

      // Convert timezone display name to timezone identifier
      const timezoneId = timezoneReverseMap[regionalSettings.timezone] || regionalSettings.timezone;

      const businessData = {
        business_hours: businessHoursForAPI,
        timezone: timezoneId,
        currency: regionalSettings.currency,
        date_format: regionalSettings.date_format,
        number_format: regionalSettings.number_format,
        current_tax_year: parseInt(regionalSettings.current_tax_year, 10)
      };

      const response = await firmAdminSettingsAPI.updateBusinessInfo(businessData, 'PATCH');
      
      if (response.success) {
        toast.success('Business settings updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update business settings');
      }
    } catch (err) {
      console.error('Error updating business info:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to update business settings');
      toast.error(errorMsg || 'Failed to update business settings');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading business settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
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
            <select 
              value={regionalSettings.timezone}
              onChange={(e) => handleRegionalChange('timezone', e.target.value)}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              <option value="UTC">UTC</option>
              <option value="Eastern Time">Eastern Time</option>
              <option value="Central Time">Central Time</option>
              <option value="Mountain Time">Mountain Time</option>
              <option value="Pacific Time">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Currency
            </label>
            <select 
              value={regionalSettings.currency}
              onChange={(e) => handleRegionalChange('currency', e.target.value)}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Date Format
            </label>
            <select 
              value={regionalSettings.date_format}
              onChange={(e) => handleRegionalChange('date_format', e.target.value)}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              <option value="mm/dd/yyyy">mm/dd/yyyy</option>
              <option value="dd/mm/yyyy">dd/mm/yyyy</option>
              <option value="yyyy-mm-dd">yyyy-mm-dd</option>
              <option value="dd-mm-yyyy">dd-mm-yyyy</option>
              <option value="yyyy/mm/dd">yyyy/mm/dd</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Number Format
            </label>
            <select 
              value={regionalSettings.number_format}
              onChange={(e) => handleRegionalChange('number_format', e.target.value)}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              <option value="1,234.56">1,234.56</option>
              <option value="1.234,56">1.234,56</option>
              <option value="1234.56">1234.56</option>
              <option value="1234,56">1234,56</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4A66] font-[BasisGrotesquePro] mb-2">
              Current Tax Year
            </label>
            <select 
              value={regionalSettings.current_tax_year}
              onChange={(e) => handleRegionalChange('current_tax_year', parseInt(e.target.value, 10))}
              className="w-full !rounded-lg !border border-[#E8F0FF] px-3 py-2 text-sm text-[#3B4A66] font-regular focus:outline-none font-[BasisGrotesquePro] cursor-pointer bg-white"
            >
              {Array.from({ length: 26 }, (_, i) => {
                const year = 2000 + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#F56D2D] text-white rounded-lg hover:bg-[#E55A1D] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

