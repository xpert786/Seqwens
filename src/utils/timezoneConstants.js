export const US_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MST)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'America/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export const getTimezoneLabel = (value) => {
    const tz = US_TIMEZONES.find(t => t.value === value);
    return tz ? tz.label : value;
};
