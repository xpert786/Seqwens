import React, { useState, useEffect } from 'react';
import { firmAdminSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import { US_TIMEZONES } from '../../../utils/timezoneConstants';

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
  // No longer needed: centralized in timezoneConstants.js

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

          // Set regional settings from regional_settings object
          if (response.data.regional_settings) {
            const regional = response.data.regional_settings;
            setRegionalSettings(prev => ({
              ...prev,
              timezone: regional.timezone || 'UTC',
              currency: regional.currency || 'USD'
            }));
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

      // Format data according to new API structure
      const businessData = {
        business_hours: businessHoursForAPI,
        regional_settings: {
          timezone: regionalSettings.timezone,
          currency: regionalSettings.currency
        }
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
          <div className="mb-4 sm:mb-5 text-center sm:text-left">
            <h5 className="text-lg font-semibold text-[#1F2A55] font-[BasisGrotesquePro] mb-1">
              Business Hours
            </h5>
            <p className="text-sm text-[#4B5563] font-regular font-[BasisGrotesquePro]">
              Set your firm's operating hours
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {days.map((day) => (
              <div key={day.key} className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={businessHours[day.key].enabled}
                      onChange={() => toggleDay(day.key)}
                    />
                    <div className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full px-1 transition-colors ${businessHours[day.key].enabled ? 'bg-[#F56D2D]' : 'bg-gray-300'
                      }`}>
                      <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white transition-transform ${businessHours[day.key].enabled ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                        }`} />
                    </div>
                  </label>
                  <span className="text-sm font-semibold text-[#1F2A55] font-[BasisGrotesquePro] min-w-[70px]">
                    {day.label}
                  </span>
                </div>
                {businessHours[day.key].enabled ? (
                  <div className="flex items-center gap-2 xs:ml-auto">
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
                      className="w-[90px] sm:w-[100px] !rounded-lg !border border-[#E8F0FF] px-2 py-2 text-[11px] sm:text-xs text-[#3B4A66] font-medium focus:outline-none font-[BasisGrotesquePro] bg-white text-center shadow-sm"
                    />
                    <span className="text-xs text-[#1F2A55] font-bold font-[BasisGrotesquePro]">To</span>
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
                      className="w-[90px] sm:w-[100px] !rounded-lg !border border-[#E8F0FF] px-2 py-2 text-[11px] sm:text-xs text-[#3B4A66] font-medium focus:outline-none font-[BasisGrotesquePro] bg-white text-center shadow-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-gray-400 font-[BasisGrotesquePro] xs:ml-auto pr-2 italic">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 !border border-[#E8F0FF]">
          <div className="mb-5 text-center sm:text-left">
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
                {US_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
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

          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center sm:justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-all duration-200 font-bold font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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

