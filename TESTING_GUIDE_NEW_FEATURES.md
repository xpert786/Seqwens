# Testing Guide - New Team Member Features

## Overview
This guide covers testing for the newly implemented team member features including Account Switcher, Invite Acceptance Flow, Data Sharing, Office Scope Management, and Membership Status Badges.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Account/Firm Switcher](#accountfirm-switcher)
3. [Invite Acceptance Flow](#invite-acceptance-flow)
4. [Data Sharing Selection](#data-sharing-selection)
5. [Duplicate Invite Error Handling](#duplicate-invite-error-handling)
6. [Office Scope Management](#office-scope-management)
7. [Membership Status Badges](#membership-status-badges)
8. [Integration Testing](#integration-testing)
9. [Edge Cases](#edge-cases)

---

## Prerequisites

### Backend API Requirements
Ensure the following API endpoints are available and working:
- `GET /api/user/memberships/` - Get all user memberships
- `POST /api/user/switch-firm/` - Switch firm context
- `GET /api/firm-admin/staff/{id}/office-scope/` - Get staff office scope
- `PUT /api/firm-admin/staff/{id}/office-scope/` - Update staff office scope
- `GET /api/firm-admin/offices/` - List all offices

### Test User Setup
1. **Multi-Firm User**: User with access to 2+ firms with different roles
2. **Single Firm User**: User with access to only one firm
3. **Pending Membership User**: User with pending membership status
4. **Disabled Membership User**: User with disabled membership
5. **Existing Email User**: User with existing account receiving invite
6. **New User**: User without existing account receiving invite

### Browser Requirements
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Account/Firm Switcher

### Location
- **Component**: `AccountSwitcher.jsx`
- **Display Location**: Top-right corner of Firm Admin header
- **Visibility**: Only shows when user has 2+ firm memberships

### Test Scenarios

#### TC-AS-001: Component Visibility
**Steps:**
1. Log in as a user with only 1 firm membership
2. Navigate to Firm Admin dashboard

**Expected Result:**
- Account Switcher component should NOT be visible
- No console errors related to memberships API

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-002: Component Display (Multiple Memberships)
**Steps:**
1. Log in as a user with 2+ firm memberships
2. Navigate to Firm Admin dashboard
3. Check top-right corner of header

**Expected Result:**
- Account Switcher button visible
- Shows current firm name
- Shows current role (e.g., "Firm Admin")
- Shows current status badge (Active/Pending/Disabled)
- Dropdown arrow icon visible

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-003: Dropdown Functionality
**Steps:**
1. Click on Account Switcher button
2. Verify dropdown opens

**Expected Result:**
- Dropdown appears below button
- Shows "All Firms" header
- Lists all firm memberships
- Each item shows:
  - Firm name
  - Role (e.g., "Firm Admin", "Team Member")
  - Status badge
  - Office scope (if applicable)
- Current membership marked with checkmark
- Current membership highlighted with secondary color

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-004: Firm Switching
**Steps:**
1. Open Account Switcher dropdown
2. Click on a different firm membership
3. Wait for switch to complete

**Expected Result:**
- Loading state shows (button disabled)
- Success toast notification appears
- Page redirects to appropriate dashboard based on role:
  - `firm_admin` → `/firmadmin`
  - `team_member`/`tax_preparer` → `/taxdashboard`
  - `client`/`taxpayer` → `/dashboard`
- New firm name displayed in switcher
- User data updated in storage
- No page reload (smooth transition)

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-005: Pending Membership Handling
**Steps:**
1. Log in as user with pending membership
2. Open Account Switcher dropdown
3. Check pending membership display

**Expected Result:**
- Pending membership shown with yellow/amber badge
- Pending membership item has reduced opacity
- Clicking pending membership does NOT switch (or shows appropriate message)
- Status text: "Pending"

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-006: Disabled Membership Handling
**Steps:**
1. Log in as user with disabled membership
2. Open Account Switcher dropdown
3. Check disabled membership display

**Expected Result:**
- Disabled membership shown with gray badge
- Status text: "Disabled"
- Disabled membership may be clickable but should show error or be non-interactive

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-007: Office Scope Display
**Steps:**
1. Log in as team member with office scope restrictions
2. Open Account Switcher dropdown
3. Check office scope display

**Expected Result:**
- Office scope shown below role/status
- Format: "Offices: Office Name 1, Office Name 2"
- Only shown if office scope exists and is not "All Offices"

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-008: Error Handling (API Failure)
**Steps:**
1. Disable network or break API endpoint
2. Log in as user
3. Navigate to Firm Admin dashboard

**Expected Result:**
- No console errors (errors suppressed for memberships endpoint)
- Account Switcher does not display
- Page loads normally
- No infinite loading state

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-009: Color Scheme Consistency
**Steps:**
1. Set custom firm primary and secondary colors in branding
2. Log in and check Account Switcher

**Expected Result:**
- Button uses `--firm-primary-color` CSS variable
- Active membership uses `--firm-secondary-color` CSS variable
- Colors match firm branding
- Hover states use darker shade of primary color

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-AS-010: Click Outside to Close
**Steps:**
1. Open Account Switcher dropdown
2. Click outside the dropdown area

**Expected Result:**
- Dropdown closes immediately
- No lag or delay

**Actual Result:** [ ] Pass [ ] Fail

---

## Invite Acceptance Flow

### Location
- **Component**: `AcceptInvite.jsx`
- **Route**: `/accept-invite/:token`

### Test Scenarios

#### TC-IA-001: New User Invite Acceptance
**Steps:**
1. Receive invite link for new email address
2. Click invite link
3. Complete the acceptance flow

**Expected Result:**
- Invite details page loads
- Shows firm name
- Shows inviter name
- Shows role being assigned
- Password setup form visible
- Phone number field visible
- Submit button enabled after validation
- Success redirect to appropriate dashboard

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-002: Existing Email Detection
**Steps:**
1. Receive invite for email that already has an account
2. Click invite link
3. Verify existing email detection

**Expected Result:**
- Warning message displayed: "This email address is already associated with an existing account"
- Message explains user needs to sign in
- "Sign In" button visible
- "Forgot Password?" link visible
- Sign In button redirects to `/login?returnUrl=/accept-invite/{token}`
- After sign-in, redirects back to invite acceptance page

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-003: Sign In Flow After Existing Email Detection
**Steps:**
1. Follow TC-IA-002 to sign in page
2. Enter credentials and sign in
3. Verify redirect back to invite acceptance

**Expected Result:**
- After successful sign-in, redirects to `/accept-invite/{token}`
- Invite acceptance page loads with invite data
- Data sharing modal appears (if accepting from second firm)
- User can complete invite acceptance

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-004: Invalid Token Handling
**Steps:**
1. Navigate to `/accept-invite/invalid-token-12345`
2. Verify error handling

**Expected Result:**
- Error message displayed: "Invalid or expired invitation token"
- Clear error message
- Option to request new invite or contact support
- No crash or blank page

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-005: Expired Token Handling
**Steps:**
1. Use invite link that has expired
2. Attempt to accept invite

**Expected Result:**
- Error message: "This invitation has expired"
- Clear instructions on what to do next
- Option to request new invite

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-006: Password Validation
**Steps:**
1. Navigate to invite acceptance page
2. Enter invalid passwords in password fields
3. Verify validation

**Expected Result:**
- Real-time validation feedback
- Password requirements shown:
  - Minimum 8 characters
  - At least one number
  - Upper and lowercase letters
  - Special character
- Error messages for each failed requirement
- Submit button disabled until all requirements met

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-IA-007: Phone Number Validation
**Steps:**
1. Navigate to invite acceptance page
2. Enter invalid phone number formats
3. Verify validation

**Expected Result:**
- Phone number format validation
- Error message for invalid format
- Accepts valid formats (US, international)
- Submit button disabled with invalid phone

**Actual Result:** [ ] Pass [ ] Fail

---

## Data Sharing Selection

### Location
- **Component**: `DataSharingModal.jsx`
- **Trigger**: Appears when accepting invite from second firm

### Test Scenarios

#### TC-DS-001: Modal Display (Second Firm Invite)
**Steps:**
1. Log in as user with existing firm membership
2. Accept invite from different firm
3. Verify data sharing modal appears

**Expected Result:**
- Modal appears automatically
- Warning message: "Accepting this invitation will disable your access to [Current Firm Name]"
- Three options visible:
  - "All" - Share all data
  - "None" - Share no data
  - "Selected" - Share specific categories
- Category checkboxes shown when "Selected" is chosen
- "Select All" and "Deselect All" buttons visible
- Cancel and Confirm buttons at bottom

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-002: Share All Data
**Steps:**
1. Open data sharing modal
2. Select "All" option
3. Click "Confirm"

**Expected Result:**
- All data shared with new firm
- Access to current firm disabled
- Success message displayed
- Redirect to new firm dashboard

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-003: Share No Data
**Steps:**
1. Open data sharing modal
2. Select "None" option
3. Click "Confirm"

**Expected Result:**
- No data shared with new firm
- Access to current firm disabled
- Success message displayed
- Redirect to new firm dashboard
- User starts with clean slate in new firm

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-004: Share Selected Categories
**Steps:**
1. Open data sharing modal
2. Select "Selected" option
3. Check/uncheck category checkboxes
4. Click "Confirm"

**Expected Result:**
- Category checkboxes appear when "Selected" is chosen
- Can select multiple categories
- "Select All" selects all categories
- "Deselect All" clears all selections
- At least one category must be selected to confirm
- Validation error if trying to confirm with no categories selected
- Only selected categories shared with new firm

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-005: Category Selection UI
**Steps:**
1. Open data sharing modal
2. Select "Selected" option
3. Verify category list

**Expected Result:**
- Categories displayed in grid layout
- Each category has checkbox and label
- Categories include:
  - Documents
  - Tax Returns
  - Client Information
  - Financial Data
  - (Add actual categories from your system)
- Checkboxes use firm primary color when checked
- Clear visual feedback on selection

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-006: Select All / Deselect All
**Steps:**
1. Open data sharing modal
2. Select "Selected" option
3. Click "Select All"
4. Click "Deselect All"

**Expected Result:**
- "Select All" checks all category checkboxes
- "Deselect All" unchecks all category checkboxes
- Buttons work correctly
- Visual feedback immediate

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-007: Cancel Data Sharing
**Steps:**
1. Open data sharing modal
2. Click "Cancel" button

**Expected Result:**
- Modal closes
- User remains on current firm
- No data sharing occurs
- No access changes

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DS-008: Modal Not Shown (First Firm)
**Steps:**
1. Log in as new user (no existing firm)
2. Accept first firm invite

**Expected Result:**
- Data sharing modal does NOT appear
- Direct acceptance flow
- No warning about disabling access

**Actual Result:** [ ] Pass [ ] Fail

---

## Duplicate Invite Error Handling

### Location
- **Component**: `AcceptInvite.jsx`
- **Trigger**: When accepting invite for user who already has access

### Test Scenarios

#### TC-DI-001: Duplicate Invite Detection
**Steps:**
1. User already has access to Firm A
2. Admin sends another invite to same user for Firm A
3. User clicks invite link

**Expected Result:**
- Error alert/banner displayed
- Message: "This user already has access to your firm."
- Suggestion: "To update permissions, please visit the user management page."
- Link to user management page (`/firmadmin/staff` or appropriate route)
- Link is clickable and navigates correctly
- Alert styled with warning/error colors

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DI-002: Duplicate Invite API Error
**Steps:**
1. Attempt to accept invite that backend rejects as duplicate
2. Verify error handling

**Expected Result:**
- Error caught and displayed
- User-friendly error message
- No technical error stack trace shown to user
- Clear next steps provided

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-DI-003: Link to User Management
**Steps:**
1. Trigger duplicate invite error
2. Click link to user management page

**Expected Result:**
- Navigates to staff/user management page
- Page loads correctly
- User can update permissions from there

**Actual Result:** [ ] Pass [ ] Fail

---

## Office Scope Management

### Location
- **Component**: `OfficeScopeManager.jsx`
- **Display**: Staff Details page
- **Trigger**: "Edit" button next to office scope

### Test Scenarios

#### TC-OS-001: Office Scope Display
**Steps:**
1. Navigate to Staff/Team Member management page
2. View a team member's details
3. Check office scope display

**Expected Result:**
- Office scope section visible
- Shows current office access:
  - "All Offices" if no restrictions
  - List of office names if restricted
- "Edit" button visible next to office scope
- Display format: "Current Office Access: [All Offices / Office 1, Office 2]"

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-002: Open Edit Modal
**Steps:**
1. Navigate to staff details page
2. Click "Edit" button next to office scope

**Expected Result:**
- Modal opens with title "Edit Office Access"
- Description: "Select offices this team member can access:"
- List of all offices with checkboxes
- Currently selected offices are checked
- "Select All" and "Clear All" buttons visible
- Cancel and Save buttons at bottom

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-003: Office Selection
**Steps:**
1. Open office scope edit modal
2. Check/uncheck office checkboxes
3. Verify selection

**Expected Result:**
- Can select multiple offices
- Checkboxes use firm primary color
- Visual feedback on selection
- Can toggle offices on/off
- Current selection persists while modal open

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-004: Select All Offices
**Steps:**
1. Open office scope edit modal
2. Click "Select All" button

**Expected Result:**
- All office checkboxes become checked
- Button works correctly
- Immediate visual feedback

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-005: Clear All Offices
**Steps:**
1. Open office scope edit modal
2. Click "Clear All" button

**Expected Result:**
- All office checkboxes become unchecked
- Button works correctly
- Immediate visual feedback

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-006: Save Office Scope
**Steps:**
1. Open office scope edit modal
2. Select/deselect offices
3. Click "Save" button

**Expected Result:**
- Loading state shows ("Saving...")
- API call made to update office scope
- Success toast notification: "Office access updated successfully!"
- Modal closes
- Office scope display updates to show new selection
- Changes persist after page refresh

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-007: Cancel Office Scope Edit
**Steps:**
1. Open office scope edit modal
2. Make changes to office selection
3. Click "Cancel" button

**Expected Result:**
- Modal closes
- No changes saved
- Original office scope remains unchanged
- No API call made

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-008: Office Scope API Error
**Steps:**
1. Open office scope edit modal
2. Make changes
3. Break API endpoint or network
4. Click "Save"

**Expected Result:**
- Error message displayed in modal
- Error toast notification
- Modal remains open (doesn't close on error)
- User can retry or cancel
- No data loss

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-009: Loading State
**Steps:**
1. Open office scope edit modal
2. Click "Save"
3. Verify loading state

**Expected Result:**
- "Save" button shows "Saving..." text
- Button disabled during save
- "Cancel" button disabled during save
- Loading indicator visible

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-OS-010: Empty Office List
**Steps:**
1. Navigate to staff details for user with no offices assigned
2. Verify display

**Expected Result:**
- Shows "No offices" or empty state
- Edit button still available
- Can assign offices via edit modal

**Actual Result:** [ ] Pass [ ] Fail

---

## Membership Status Badges

### Location
- **Component**: `MembershipStatusBadge.jsx`
- **Display Locations**: 
  - Account Switcher
  - User Profile
  - Team Member List

### Test Scenarios

#### TC-MS-001: Active Status Badge
**Steps:**
1. View user with "active" status
2. Check badge display

**Expected Result:**
- Badge displays "Active"
- Green background color (#D4EDDA)
- Dark green text (#155724)
- Rounded corners
- Proper padding and sizing

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-002: Pending Status Badge
**Steps:**
1. View user with "pending" status
2. Check badge display

**Expected Result:**
- Badge displays "Pending"
- Yellow/amber background (#FFF3CD)
- Dark yellow text (#856404)
- Consistent styling with other badges

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-003: Disabled Status Badge
**Steps:**
1. View user with "disabled" status
2. Check badge display

**Expected Result:**
- Badge displays "Disabled"
- Gray background (#E2E3E5)
- Dark gray text (#495057)
- Consistent styling

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-004: Badge in Account Switcher
**Steps:**
1. Open Account Switcher dropdown
2. Check status badges for each membership

**Expected Result:**
- Each membership shows status badge
- Badge appears next to role
- Format: "Role • [Status Badge]"
- Colors match status type

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-005: Badge in User Profile
**Steps:**
1. Navigate to user profile page
2. Check status badge display

**Expected Result:**
- Status badge visible
- Correct status displayed
- Proper styling and positioning
- Accessible and readable

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-006: Badge in Team Member List
**Steps:**
1. Navigate to Staff/Team Member management page
2. Check status badges in list

**Expected Result:**
- Each team member shows status badge
- Badges aligned properly in table/list
- Consistent styling across all badges
- Easy to scan and identify status

**Actual Result:** [ ] Pass [ ] Fail

---

#### TC-MS-007: Unknown Status Handling
**Steps:**
1. View user with unknown/null status
2. Check badge display

**Expected Result:**
- Badge displays "Unknown" or default state
- Default blue styling (#E0F2FE background, #0369A1 text)
- No crash or error
- Graceful fallback

**Actual Result:** [ ] Pass [ ] Fail

---

## Integration Testing

### TC-INT-001: Complete Invite Flow (New User)
**Steps:**
1. Admin sends invite to new email
2. User clicks invite link
3. User sets password and phone
4. User accepts invite
5. User logs in and accesses dashboard

**Expected Result:**
- All steps complete successfully
- User can access assigned firm
- User appears in team member list
- Office scope set correctly (if applicable)
- Status shows as "Active"

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-INT-002: Complete Invite Flow (Existing User, Second Firm)
**Steps:**
1. User has existing account with Firm A
2. Admin from Firm B sends invite
3. User clicks invite link
4. User signs in
5. Data sharing modal appears
6. User selects data sharing option
7. User accepts invite

**Expected Result:**
- Sign-in flow works correctly
- Redirect back to invite acceptance works
- Data sharing modal appears
- Selected data shared correctly
- User can switch between firms using Account Switcher
- Both memberships visible in Account Switcher

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-INT-003: Firm Switching Workflow
**Steps:**
1. User with 2+ firm memberships logs in
2. User switches firm using Account Switcher
3. User performs actions in new firm
4. User switches back to original firm

**Expected Result:**
- Firm switch successful
- User data updates correctly
- Dashboard loads for correct firm
- Office scope restrictions apply correctly
- Can switch multiple times without issues
- No data leakage between firms

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-INT-004: Office Scope + Firm Switching
**Steps:**
1. Admin sets office scope for team member
2. Team member switches firm (if applicable)
3. Team member switches back
4. Verify office scope persists

**Expected Result:**
- Office scope saved correctly
- Office scope persists after firm switch
- Office scope restrictions apply correctly
- Can edit office scope after switching

**Actual Result:** [ ] Pass [ ] Fail

---

## Edge Cases

### TC-EC-001: Network Timeout
**Steps:**
1. Simulate slow network or timeout
2. Attempt to use Account Switcher

**Expected Result:**
- Timeout handled gracefully (3 second timeout)
- No infinite loading
- Component doesn't display if API fails
- No console errors

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-002: API 401 Unauthorized
**Steps:**
1. Token expires during session
2. Attempt to switch firm or fetch memberships

**Expected Result:**
- Token refresh attempted
- If refresh fails, redirect to login
- No crash or error loop

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-003: Rapid Clicking
**Steps:**
1. Rapidly click Account Switcher button
2. Rapidly switch between firms

**Expected Result:**
- No duplicate API calls
- Loading state prevents multiple switches
- UI remains responsive
- No race conditions

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-004: Large Number of Memberships
**Steps:**
1. User with 10+ firm memberships
2. Open Account Switcher dropdown

**Expected Result:**
- All memberships displayed
- Dropdown scrollable if needed
- Performance remains good
- No UI lag

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-005: Large Number of Offices
**Steps:**
1. Firm with 20+ offices
2. Open office scope edit modal

**Expected Result:**
- All offices listed
- Modal scrollable
- Select All/Clear All work correctly
- Performance remains good

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-006: Special Characters in Names
**Steps:**
1. Firm name with special characters
2. Office name with special characters
3. Verify display in all components

**Expected Result:**
- Special characters display correctly
- No HTML injection
- No layout breaking
- Proper encoding

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-007: Very Long Names
**Steps:**
1. Firm name with 100+ characters
2. Office name with 100+ characters
3. Verify display

**Expected Result:**
- Text truncates or wraps appropriately
- No layout breaking
- Tooltip or full name on hover (if implemented)
- Readable display

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-008: Mobile Responsiveness
**Steps:**
1. Test all features on mobile device
2. Check Account Switcher on mobile
3. Check modals on mobile
4. Check office scope management on mobile

**Expected Result:**
- All components responsive
- Touch interactions work
- Modals fit screen
- Dropdowns position correctly
- No horizontal scrolling

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-009: Browser Back/Forward
**Steps:**
1. Navigate through invite flow
2. Use browser back button
3. Use browser forward button

**Expected Result:**
- Browser navigation works correctly
- State preserved where appropriate
- No errors on back/forward
- URL updates correctly

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-EC-010: Concurrent Sessions
**Steps:**
1. User logged in on two devices
2. Switch firm on device 1
3. Check device 2

**Expected Result:**
- Firm switch on one device doesn't break other
- Token refresh works correctly
- No session conflicts
- Each device maintains its own state

**Actual Result:** [ ] Pass [ ] Fail

---

## Performance Testing

### TC-PERF-001: Initial Load Time
**Steps:**
1. Measure time to load Account Switcher
2. Measure time to load invite acceptance page

**Expected Result:**
- Account Switcher loads in < 1 second
- Invite acceptance page loads in < 2 seconds
- No blocking of main page load

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-PERF-002: API Response Time
**Steps:**
1. Measure API response time for memberships
2. Measure API response time for office scope

**Expected Result:**
- Memberships API responds in < 500ms
- Office scope API responds in < 500ms
- Timeout at 3 seconds if slower

**Actual Result:** [ ] Pass [ ] Fail

---

## Accessibility Testing

### TC-A11Y-001: Keyboard Navigation
**Steps:**
1. Navigate Account Switcher with keyboard only
2. Navigate modals with keyboard only
3. Use Tab, Enter, Escape keys

**Expected Result:**
- All interactive elements keyboard accessible
- Focus indicators visible
- Tab order logical
- Escape closes modals
- Enter activates buttons

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-A11Y-002: Screen Reader
**Steps:**
1. Use screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through all new features

**Expected Result:**
- All elements have proper labels
- Status badges announced correctly
- Modal titles announced
- Error messages announced
- Success messages announced

**Actual Result:** [ ] Pass [ ] Fail

---

### TC-A11Y-003: Color Contrast
**Steps:**
1. Check color contrast of all text
2. Check status badge colors

**Expected Result:**
- Text meets WCAG AA standards (4.5:1 ratio)
- Status badges have sufficient contrast
- All text readable

**Actual Result:** [ ] Pass [ ] Fail

---

## Browser Console Checks

### Console Error Checklist
- [ ] No uncaught errors
- [ ] No React warnings
- [ ] No API errors (except suppressed memberships errors)
- [ ] No CORS errors
- [ ] No memory leaks
- [ ] No infinite loops

---

## Notes Section

### Issues Found:
1. 
2. 
3. 

### Suggestions:
1. 
2. 
3. 

---

## Sign-off

**Tester Name:** _________________________

**Date:** _________________________

**Overall Status:** [ ] Pass [ ] Fail [ ] Pass with Issues

**Comments:**
_________________________________________________
_________________________________________________
_________________________________________________

