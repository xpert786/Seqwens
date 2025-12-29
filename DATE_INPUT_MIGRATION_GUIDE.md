# Date Input Migration Guide

This document outlines the changes made to standardize date input formatting across the project.

## What Was Changed

1. **Created Reusable Utilities** (`src/ClientOnboarding/utils/dateUtils.jsx`):
   - `formatDateInput(value)` - Formats input as MM/DD/YYYY with auto-slash insertion
   - `formatDateForAPI(dateString)` - Converts MM/DD/YYYY to YYYY-MM-DD for API calls
   - `formatDateForDisplay(dateString)` - Converts YYYY-MM-DD to MM/DD/YYYY for display
   - `isValidDate(dateString)` - Validates MM/DD/YYYY format

2. **Created Reusable Component** (`src/components/DateInput.jsx`):
   - React component that automatically formats dates as MM/DD/YYYY
   - Auto-adds "/" separators as user types
   - Max length of 10 characters (MM/DD/YYYY)

## Files Updated

### ✅ Completed
- `src/FirmAdmin/Pages/Billing/CreateInvoiceModal.jsx` - Uses DateInput component
- `src/Taxpreparer/pages/Billing/TaxPreparerCreateInvoiceModal.jsx` - Uses DateInput component

### 📋 Remaining Files to Update

The following files contain date inputs that should be updated to use the DateInput component or formatDateInput utility:

1. **Appointments & Scheduling:**
   - `src/FirmAdmin/Pages/Scheduling & calendar/Appointments.jsx`
   - `src/FirmAdmin/Pages/Scheduling & calendar/SchedulingCalendar.jsx`
   - `src/ClientOnboarding/pages/Appointments.jsx`

2. **Data Intake:**
   - `src/ClientOnboarding/pages/DataIntake.jsx` - Date of Birth fields

3. **Task Management:**
   - `src/FirmAdmin/Pages/TaskManagement/CreateTaskModal.jsx`
   - `src/Taxpreparer/pages/Tasks/TasksPage.jsx`

4. **Other Forms:**
   - `src/FirmAdmin/Pages/ESignatureManagement.jsx`
   - `src/FirmAdmin/Pages/Staff/StaffTabs/ActivityLogTab.jsx` (uses type="date" - may need different approach)

## How to Update Remaining Files

### Option 1: Use DateInput Component (Recommended)

```jsx
import DateInput from '../../../components/DateInput';

// Replace:
<input
  type="text"
  value={dateValue}
  onChange={(e) => setDateValue(e.target.value)}
  placeholder="mm/dd/yyyy"
/>

// With:
<DateInput
  value={dateValue}
  onChange={(e) => setDateValue(e.target.value)}
  placeholder="mm/dd/yyyy"
/>
```

### Option 2: Use formatDateInput Utility

```jsx
import { formatDateInput } from '../../../ClientOnboarding/utils/dateUtils';

// In your onChange handler:
const handleDateChange = (e) => {
  const formatted = formatDateInput(e.target.value);
  setDateValue(formatted);
};

// Then use regular input:
<input
  type="text"
  value={dateValue}
  onChange={handleDateChange}
  placeholder="mm/dd/yyyy"
  maxLength={10}
/>
```

### For API Calls

When sending dates to the API, convert from MM/DD/YYYY to YYYY-MM-DD:

```jsx
import { formatDateForAPI } from '../../../ClientOnboarding/utils/dateUtils';

const apiDate = formatDateForAPI(dateValue); // Converts MM/DD/YYYY to YYYY-MM-DD
```

## Notes

- All date inputs should display in **MM/DD/YYYY** format
- Slashes are automatically added as the user types
- Maximum length is 10 characters (MM/DD/YYYY)
- For API calls, dates should be converted to YYYY-MM-DD format using `formatDateForAPI`
- For display from API, dates should be converted from YYYY-MM-DD to MM/DD/YYYY using `formatDateForDisplay`

