# Quick Testing Checklist - New Features

## Pre-Testing Setup
- [ ] Backend APIs are running and accessible
- [ ] Test users created (multi-firm, single-firm, pending, disabled)
- [ ] Test invites generated
- [ ] Browser console open for error checking

---

## Account Switcher (Top-Right Header)

### Basic Functionality
- [ ] Component visible only when user has 2+ memberships
- [ ] Shows current firm name, role, and status badge
- [ ] Dropdown opens on click
- [ ] Lists all firm memberships with details
- [ ] Current membership marked with checkmark
- [ ] Can switch to different firm
- [ ] Redirects to correct dashboard after switch
- [ ] Success toast notification appears

### Status & Roles
- [ ] Active status shows green badge
- [ ] Pending status shows yellow badge
- [ ] Disabled status shows gray badge
- [ ] Role names display correctly (Firm Admin, Team Member, etc.)
- [ ] Office scope shown for team members

### Error Handling
- [ ] No console errors when API fails
- [ ] Component doesn't display on error
- [ ] Page loads normally even if API fails
- [ ] No infinite loading state

### UI/UX
- [ ] Uses firm primary/secondary colors
- [ ] Hover states work
- [ ] Click outside closes dropdown
- [ ] Responsive on mobile

---

## Invite Acceptance Flow

### New User Flow
- [ ] Invite page loads with token
- [ ] Shows firm name and inviter details
- [ ] Password setup form works
- [ ] Phone number validation works
- [ ] Form validation prevents invalid submission
- [ ] Success redirect to dashboard

### Existing User Flow
- [ ] Detects existing email
- [ ] Shows "Sign In" and "Forgot Password?" buttons
- [ ] Sign In redirects with return URL
- [ ] After sign-in, returns to invite acceptance
- [ ] Data sharing modal appears (if second firm)

### Error Handling
- [ ] Invalid token shows error message
- [ ] Expired token shows error message
- [ ] Duplicate invite shows error alert
- [ ] Error messages are user-friendly

---

## Data Sharing Modal

### Display
- [ ] Modal appears when accepting second firm invite
- [ ] Warning message about disabling current firm access
- [ ] Three options: All, None, Selected
- [ ] Category checkboxes appear for "Selected"
- [ ] Select All / Deselect All buttons work

### Functionality
- [ ] "All" shares all data
- [ ] "None" shares no data
- [ ] "Selected" shares only chosen categories
- [ ] Validation requires at least one category if "Selected"
- [ ] Cancel closes modal without changes
- [ ] Confirm saves selection and redirects

### UI
- [ ] Modal styled correctly
- [ ] Checkboxes use firm primary color
- [ ] Responsive on mobile
- [ ] Keyboard accessible

---

## Duplicate Invite Error

- [ ] Error alert displays when duplicate invite detected
- [ ] Message: "This user already has access to your firm."
- [ ] Link to user management page works
- [ ] Alert styled appropriately
- [ ] No technical error details shown to user

---

## Office Scope Management

### Display
- [ ] Office scope shown on staff details page
- [ ] Shows "All Offices" or list of offices
- [ ] "Edit" button visible and clickable

### Edit Modal
- [ ] Modal opens with office list
- [ ] All offices listed with checkboxes
- [ ] Current selection pre-checked
- [ ] Select All / Clear All work
- [ ] Can toggle individual offices

### Save/Cancel
- [ ] Save button updates office scope
- [ ] Success toast notification
- [ ] Modal closes after save
- [ ] Display updates with new selection
- [ ] Cancel closes without saving
- [ ] Loading state during save

### Error Handling
- [ ] Error message on API failure
- [ ] Modal stays open on error
- [ ] User can retry or cancel

---

## Membership Status Badges

### Display Locations
- [ ] Badges in Account Switcher
- [ ] Badges in user profile
- [ ] Badges in team member list

### Status Types
- [ ] Active = Green badge
- [ ] Pending = Yellow badge
- [ ] Disabled = Gray badge
- [ ] Unknown = Blue badge (fallback)

### Styling
- [ ] Consistent styling across all locations
- [ ] Proper colors and contrast
- [ ] Readable text
- [ ] Proper sizing

---

## Integration Tests

- [ ] Complete new user invite flow works end-to-end
- [ ] Complete existing user + second firm flow works
- [ ] Firm switching works multiple times
- [ ] Office scope persists after firm switch
- [ ] All features work together without conflicts

---

## Edge Cases

- [ ] Network timeout handled gracefully
- [ ] 401 Unauthorized handled (token refresh)
- [ ] Rapid clicking doesn't cause issues
- [ ] Large number of memberships (10+) works
- [ ] Large number of offices (20+) works
- [ ] Special characters in names display correctly
- [ ] Very long names handled (truncate/wrap)
- [ ] Mobile responsive
- [ ] Browser back/forward works
- [ ] Concurrent sessions work

---

## Performance

- [ ] Account Switcher loads in < 1 second
- [ ] Invite page loads in < 2 seconds
- [ ] API calls respond in < 500ms
- [ ] No blocking of main page load
- [ ] Smooth animations/transitions

---

## Accessibility

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces all elements
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements have labels

---

## Browser Console

- [ ] No uncaught errors
- [ ] No React warnings
- [ ] No API errors (except suppressed memberships)
- [ ] No CORS errors
- [ ] No memory leaks
- [ ] No infinite loops

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Notes

**Issues Found:**
1. 
2. 
3. 

**Tested By:** _________________  
**Date:** _________________  
**Status:** [ ] Pass [ ] Fail [ ] Pass with Issues

