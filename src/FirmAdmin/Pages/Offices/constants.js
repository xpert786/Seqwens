export const US_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (America/New_York)' },
    { value: 'America/Chicago', label: 'Central Time (America/Chicago)' },
    { value: 'America/Denver', label: 'Mountain Time (America/Denver)' },
    { value: 'America/Phoenix', label: 'Mountain Time – Arizona (America/Phoenix)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (America/Los_Angeles)' },
    { value: 'America/Anchorage', label: 'Alaska Time (America/Anchorage)' },
    { value: 'America/Honolulu', label: 'Hawaii Time (America/Honolulu)' },
];

export const getTimezoneLabel = (value) => {
    const tz = US_TIMEZONES.find(t => t.value === value);
    return tz ? tz.label : value;
};
