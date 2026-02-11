import { US_TIMEZONES as COMMON_US_TIMEZONES } from '../../../utils/timezoneConstants';

// Mantain for backward compatibility if needed, but pointing to central source
export const US_TIMEZONES = COMMON_US_TIMEZONES;

export const getTimezoneLabel = (value) => {
    const tz = US_TIMEZONES.find(t => t.value === value);
    return tz ? tz.label : value;
};
