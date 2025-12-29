# Workflow Feature - Step-by-Step Testing Guide

## Prerequisites

1. **Ensure the backend API is running** and accessible at `http://168.231.121.7/seqwens/api/`
2. **Have test accounts ready:**
   - One Taxpayer/Client account
   - One Tax Preparer account
   - One Firm Admin account (for creating workflows)

3. **Browser Developer Tools** open (F12) to check:
   - Console for errors
   - Network tab for API calls
   - Application tab for localStorage/sessionStorage

---

## Part 1: Testing as Firm Admin (Setup Workflow)

### Step 1.1: Login as Firm Admin
1. Navigate to `/seqwens-frontend/login`
2. Login with firm admin credentials
3. You should be redirected to `/firmadmin`

### Step 1.2: Create a Workflow Template (if not exists)
1. Navigate to `/firmadmin/workflow`
2. Click "Create Template" or use existing template
3. Ensure the workflow has stages like:
   - Document Request
   - Document Verification
   - E-Signature
   - Complete

### Step 1.3: Start a Workflow for a Client
1. Go to Client Management (`/firmadmin/clients`)
2. Find a client or create one
3. Click "Start Workflow" or use the workflow management page
4. Select:
   - A workflow template
   - The client (tax case)
   - A tax preparer to assign
5. Click "Start Workflow"
6. **Verify:** Success toast appears and workflow is created

---

## Part 2: Testing as Tax Preparer

### Step 2.1: Login as Tax Preparer
1. Navigate to `/seqwens-frontend/login`
2. Login with tax preparer credentials
3. You should be redirected to `/taxdashboard`

### Step 2.2: View Workflows List
1. Navigate to `/taxdashboard/workflows`
2. **Verify:**
   - You see the workflow list
   - Workflows show:
     - Client name
     - Workflow template name
     - Current stage
     - Progress percentage
     - Status badge (Active/Completed/etc.)

### Step 2.3: Create a Document Request
1. On the workflows page, find an active workflow
2. Click "Create Request" button
3. **Fill in the form:**
   - **Title:** "2024 Tax Documents Request"
   - **Description:** "Please provide the following documents..."
   - **Categories:** Select at least one (e.g., "W-2 Forms", "1099 Forms")
   - **Due Date:** Enter a future date in MM/DD/YYYY format (e.g., 12/31/2024)
4. Click "Create Request"
5. **Verify:**
   - Success toast appears
   - Modal closes
   - Document request appears in the workflow card
   - Request shows correct status (Pending)

### Step 2.4: Test Date Input Formatting
1. In the Create Request modal, click the Due Date field
2. Type: `12312024` (without slashes)
3. **Verify:** It automatically formats to `12/31/2024`
4. Try invalid dates:
   - `13/01/2024` (invalid month) - should show error
   - `02/30/2024` (invalid day) - should show error
   - Past dates - should show "Due date must be in the future"

### Step 2.5: View Workflow Details
1. Click "View Details" on a workflow
2. **Verify:**
   - Workflow details page loads
   - Shows progress bar
   - Shows current stage
   - Shows document requests list
   - Shows timeline

---

## Part 3: Testing as Taxpayer/Client

### Step 3.1: Login as Taxpayer
1. Navigate to `/seqwens-frontend/login`
2. Login with client/taxpayer credentials
3. You should be redirected to `/dashboard`

### Step 3.2: View Workflow Dashboard
1. Navigate to `/dashboard/workflow`
2. **Verify:**
   - Workflow dashboard loads
   - Shows:
     - Workflow template name
     - Assigned preparer name
     - Current stage
     - Progress bar (0-100%)
     - Active document requests
     - Timeline view

### Step 3.3: View Document Request
1. On the workflow dashboard, find a document request card
2. **Verify:**
   - Request title is displayed
   - Status badge shows "Pending" (yellow/orange)
   - Categories are shown as chips/tags
   - Due date is displayed in MM/DD/YYYY format
   - Days remaining countdown is shown
   - "Upload Documents" button is visible

### Step 3.4: Upload Documents (Method 1: Click Upload)
1. Click "Upload Documents" button on a request
2. **Verify:**
   - Upload modal opens
   - Shows request title and categories
   - Shows drag-and-drop zone
   - Shows "PDF only, max 10MB" message

### Step 3.5: Test File Validation
1. In the upload modal, try to upload:
   - **Invalid file type:** Upload a `.txt` or `.jpg` file
   - **Verify:** Error message "Only PDF files are allowed"
2. Try to upload:
   - **Large file:** Upload a PDF > 10MB (if available)
   - **Verify:** Error message "File size exceeds 10MB limit"
3. Try to upload:
   - **Valid PDF:** Upload a PDF file < 10MB
   - **Verify:** File appears in the file list with:
     - File name
     - File size
     - Remove button

### Step 3.6: Test Drag-and-Drop Upload
1. Open file explorer
2. Drag a valid PDF file into the drop zone
3. **Verify:**
   - Drop zone highlights (blue border)
   - File appears in the file list
   - File is ready to upload

### Step 3.7: Upload Documents
1. Add one or more valid PDF files
2. Click "Upload All" button
3. **Verify:**
   - Upload progress bar appears for each file
   - Progress updates (0% → 100%)
   - Success checkmark appears when complete
   - Success toast: "All files uploaded successfully"
   - Modal closes automatically (or manually close)
   - Request status changes to "Submitted" (blue)

### Step 3.8: Test Storage Warning (if applicable)
1. If storage is near limit (80%+), **verify:**
   - Warning banner appears at top of workflow page
   - Shows storage usage percentage
   - Shows progress bar (yellow/orange)
2. If storage is at 100%+, **verify:**
   - Error modal appears
   - Upload buttons are disabled
   - Shows "Delete Files" and "Upgrade Plan" options

### Step 3.9: View Uploaded Documents
1. After uploading, refresh the page
2. **Verify:**
   - Document request shows "Submitted" status
   - Uploaded documents are listed (if API returns them)
   - Can view/download documents

---

## Part 4: Testing Document Verification (Tax Preparer)

### Step 4.1: Return to Tax Preparer View
1. Login as tax preparer again
2. Navigate to `/taxdashboard/workflows`

### Step 4.2: Verify Documents
1. Find a workflow with a "Submitted" document request
2. Click "Verify Documents" button
3. **Verify:**
   - Verification modal opens
   - Shows:
     - Request title
     - Client name
     - Submitted date
     - List of uploaded documents
     - Each document has:
       - Checkbox
       - View button
       - Download button

### Step 4.3: View Document
1. Click "View" button on a document
2. **Verify:**
   - PDF opens in new tab
   - Document is viewable

### Step 4.4: Download Document
1. Click "Download" button on a document
2. **Verify:**
   - File downloads to your computer
   - File name is correct

### Step 4.5: Verify Documents (Approve)
1. Check the checkbox for documents you want to verify
2. (Optional) Add verification notes
3. Click "Verify & Continue" button
4. **Verify:**
   - Success toast: "Documents verified successfully"
   - Modal closes
   - Request status changes to "Verified" (green)
   - Workflow may advance to next stage

### Step 4.6: Reject Documents (Alternative)
1. Open verification modal for a submitted request
2. Add notes explaining why documents are rejected
3. Click "Reject & Request Revision" button
4. **Verify:**
   - Success toast: "Documents rejected"
   - Request status changes to "Needs Revision" (red)
   - Client can see the rejection and notes

---

## Part 5: Testing Workflow Progress

### Step 5.1: Check Timeline Updates
1. As taxpayer, navigate to `/dashboard/workflow`
2. **Verify:**
   - Timeline shows:
     - ✅ Completed stages (green checkmark)
     - 🔵 Current stage (blue highlight)
     - ⚪ Pending stages (gray)
   - Dates are shown for completed stages

### Step 5.2: Check Progress Bar
1. On workflow dashboard, check the progress bar
2. **Verify:**
   - Progress percentage matches workflow completion
   - Progress bar fills from 0% to current percentage
   - Percentage updates as stages complete

### Step 5.3: Test Real-time Updates (Polling)
1. As taxpayer, upload a document
2. As tax preparer, verify the document
3. **Verify:**
   - Taxpayer's workflow page updates within 30 seconds
   - Progress bar updates
   - Status badges update
   - Timeline updates

---

## Part 6: Testing Error Scenarios

### Step 6.1: Test Network Error
1. Disconnect internet
2. Try to upload a document
3. **Verify:**
   - Error message appears
   - Retry option is available
   - Upload can be retried when connection restored

### Step 6.2: Test Invalid API Response
1. Check browser console (F12)
2. Look for API errors
3. **Verify:**
   - Errors are caught and displayed
   - User-friendly error messages shown
   - App doesn't crash

### Step 6.3: Test Missing Workflow
1. As a new taxpayer with no workflow
2. Navigate to `/dashboard/workflow`
3. **Verify:**
   - Shows "No Active Workflow" message
   - Message is helpful and clear
   - Doesn't show errors

### Step 6.4: Test Storage Limit Exceeded
1. If possible, set storage to 100%+ (via API or admin)
2. Try to upload a document
3. **Verify:**
   - Error modal appears
   - Upload is blocked
   - Shows storage usage details
   - Provides upgrade/manage options

---

## Part 7: Testing Responsive Design

### Step 7.1: Test Mobile View
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select a mobile device (e.g., iPhone 12)
4. Navigate to workflow pages
5. **Verify:**
   - Layout adapts to mobile
   - Buttons are touch-friendly
   - Text is readable
   - Cards stack vertically
   - Modals are full-screen or scrollable

### Step 7.2: Test Tablet View
1. Switch to tablet view (e.g., iPad)
2. **Verify:**
   - Layout is optimized for tablet
   - Cards are in grid layout
   - Navigation is accessible

### Step 7.3: Test Desktop View
1. Use full desktop view (1920x1080)
2. **Verify:**
   - All elements are visible
   - No horizontal scrolling
   - Proper spacing and alignment

---

## Part 8: Testing Search and Filters

### Step 8.1: Test Search (Tax Preparer)
1. As tax preparer, go to `/taxdashboard/workflows`
2. Type a client name in search box
3. **Verify:**
   - Results filter in real-time
   - Only matching workflows shown
   - Search is case-insensitive

### Step 8.2: Test Filters
1. Click filter buttons: "All", "Active", "Completed"
2. **Verify:**
   - Workflows filter correctly
   - Active button is highlighted
   - Count updates if shown

---

## Part 9: Testing Date Formatting

### Step 9.1: Test Date Input
1. In Create Request modal, click Due Date field
2. Type: `01012025` (without slashes)
3. **Verify:** Formats to `01/01/2025`
4. Type: `12252024`
5. **Verify:** Formats to `12/25/2024`

### Step 9.2: Test Date Display
1. View document requests
2. **Verify:**
   - All dates display in MM/DD/YYYY format
   - Due dates show correctly
   - Submitted dates show correctly
   - Completed dates show correctly

### Step 9.3: Test Date Validation
1. Try invalid dates:
   - `13/01/2024` → Should show error
   - `02/30/2024` → Should show error
   - `01/01/2023` (past date) → Should show "must be in future"

---

## Part 10: Testing API Integration

### Step 10.1: Check API Calls (Network Tab)
1. Open DevTools → Network tab
2. Perform workflow actions
3. **Verify API calls:**
   - `GET /taxpayer/workflow/` - Fetches workflow
   - `POST /taxpayer/workflows/document-requests/create/` - Creates request
   - `POST /taxpayer/workflows/document-requests/:id/upload/` - Uploads file
   - `POST /taxpayer/workflows/document-requests/verify/` - Verifies documents
   - All requests include Authorization header
   - Responses are handled correctly

### Step 10.2: Check Error Handling
1. In Network tab, block a specific API call
2. Perform the action
3. **Verify:**
   - Error is caught
   - User-friendly message shown
   - App doesn't crash
   - Can retry the action

---

## Checklist Summary

### ✅ Core Functionality
- [ ] Workflow dashboard loads for taxpayer
- [ ] Workflow list loads for tax preparer
- [ ] Document request creation works
- [ ] File upload works with progress
- [ ] Document verification works
- [ ] Timeline updates correctly
- [ ] Progress bar updates

### ✅ Date Formatting
- [ ] Date input auto-formats MM/DD/YYYY
- [ ] Dates display correctly
- [ ] Date validation works

### ✅ File Upload
- [ ] PDF validation works
- [ ] File size validation works
- [ ] Upload progress shows
- [ ] Multiple files work
- [ ] Storage limit checking works

### ✅ UI/UX
- [ ] Responsive design works
- [ ] Loading states show
- [ ] Error messages are clear
- [ ] Success toasts appear
- [ ] Empty states show correctly

### ✅ Error Handling
- [ ] Network errors handled
- [ ] API errors handled
- [ ] Validation errors shown
- [ ] Storage limit errors handled

---

## Common Issues & Solutions

### Issue: "No workflows found"
**Solution:** Ensure a workflow is started for the client by firm admin

### Issue: "Upload fails"
**Solution:** 
- Check file is PDF and < 10MB
- Check storage limit
- Check network connection
- Check API endpoint is correct

### Issue: "Date not formatting"
**Solution:** Ensure DateInput component is used, not regular input

### Issue: "Workflow not updating"
**Solution:** 
- Wait 30 seconds for polling
- Refresh page manually
- Check API response

### Issue: "Permission denied"
**Solution:** 
- Check user has correct role
- Check permission groups are set
- Check route protection

---

## Testing Data Examples

### Sample Document Request:
- **Title:** "2024 Tax Documents Request"
- **Description:** "Please provide W-2 forms and 1099 forms for 2024 tax year"
- **Categories:** W-2 Forms, 1099 Forms
- **Due Date:** 12/31/2024

### Sample Test Files:
- Small PDF (< 1MB) - for quick testing
- Medium PDF (5MB) - for normal testing
- Large PDF (> 10MB) - for size validation testing
- Non-PDF file - for type validation testing

---

## Next Steps After Testing

1. **Report Issues:** Document any bugs or issues found
2. **Performance:** Check load times and optimize if needed
3. **Accessibility:** Test with screen readers
4. **Browser Compatibility:** Test in Chrome, Firefox, Safari, Edge
5. **Integration:** Test with actual backend API

---

**Happy Testing! 🚀**

