import React from 'react';
import SchedulingCalendar from './SchedulingCalendar';

/**
 * The Appointments page uses the same calendar experience as the main
 * Scheduling calendar. Reusing the component ensures feature parity
 * (data fetching, highlighting, modals, etc.) across both routes.
 */
const Appointments = () => {
  return <SchedulingCalendar />;
};

export default Appointments;

