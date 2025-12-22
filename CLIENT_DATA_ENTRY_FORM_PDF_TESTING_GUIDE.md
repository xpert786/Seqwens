# Client Data Entry Form PDF Feature - Testing Guide

## Overview
This feature allows clients to sign their data entry form and generates a PDF document that includes all client information, signature, and timestamps. Firm admins can then view/download the signed PDF.

## Implementation Summary

### Files Modified/Created:
1. **`src/ClientOnboarding/utils/apiUtils.jsx`**
   - Added `dataIntakeAPI.requestSignForm()` - Request to sign form
   - Added `dataIntakeAPI.submitSignature()` - Submit signature
   - Added `firmAdminClientAPI.getClientDataEntryFormPDF()` - Download PDF for firm admins

2. **`src/ClientOnboarding/components/SignatureModal.jsx`** (NEW)
   - Modal component for signature capture
   - Supports both drawing signature and typing name
   - Uses `react-signature-canvas` library

3. **`src/ClientOnboarding/pages/DataIntake.jsx`**
   - Added signature section after form submission
   - Added signature request and submission handlers
   - Integrated SignatureModal component

4. **`src/FirmAdmin/Pages/ClientManagement/ClientTabs/DocumentsTab.jsx`**
   - Added "Download Signed Form PDF" button
   - Added PDF download handler

## Testing Instructions

### Prerequisites
1. Ensure you have:
   - A client account (taxpayer)
   - A firm admin account
   - Backend API endpoints are running and accessible

2. Backend API endpoints should be available:
   - `POST /api/taxpayer/data-entry-form/sign-request/`
   - `POST /api/taxpayer/data-entry-form/submit-signature/`
   - `GET /api/firm/clients/<client_id>/data-entry-form-pdf/`

### Test Scenario 1: Client Signs Data Entry Form

#### Step 1: Complete Data Entry Form
1. Login as a client (taxpayer)
2. Navigate to Data Intake Form (`/data-intake` or similar route)
3. Fill out all required fields:
   - Personal Information
   - Spouse Information (if applicable)
   - Dependents (if applicable)
   - Bank Information (optional)
4. Upload tax documents (optional)
5. Click "Submit" button
6. Verify form is saved successfully (success toast should appear)

#### Step 2: Request to Sign Form
1. After successful form submission, you should see a new section: **"Sign Your Data Entry Form"**
2. Click the **"Request to Sign Form"** button
3. Verify:
   - Loading state appears briefly
   - Success toast: "Signature request created. Please sign the form."
   - Button text changes to "Sign Form"
   - Signature section status shows "pending"

#### Step 3: Sign the Form
1. Click the **"Sign Form"** button
2. Signature modal should open
3. Test **Drawing Signature**:
   - Select "Draw Signature" tab (default)
   - Draw your signature on the canvas
   - Click "Clear" to reset if needed
   - Click "Submit Signature"
4. OR Test **Typing Name**:
   - Select "Type Name" tab
   - Enter your full name
   - Click "Submit Signature"
5. Verify:
   - Loading state during submission
   - Success toast: "Signature submitted successfully!"
   - Modal closes automatically
   - Signature section shows "Form Signed Successfully" with green checkmark
   - After 1.5 seconds, redirects to dashboard

#### Step 4: Verify Error Handling
1. Try submitting signature without drawing/typing:
   - Should show error: "Please draw your signature before submitting" or "Please enter your name before submitting"
2. Try requesting signature again after already signed:
   - Should handle gracefully (may show existing signature status)

### Test Scenario 2: Firm Admin Views/Downloads PDF

#### Step 1: Access Client Details
1. Login as firm admin
2. Navigate to Client Management
3. Select a client who has:
   - Completed their data entry form
   - Signed the form (from Test Scenario 1)

#### Step 2: Download Signed PDF
1. Go to the client's detail page
2. Click on **"Documents"** tab
3. Look for **"Download Signed Form PDF"** button in the top right
4. Click the button
5. Verify:
   - Loading state: "Downloading..." appears
   - PDF file downloads automatically
   - File name format: `client_data_entry_form_{client_id}_{client_name}.pdf`
   - Success toast: "PDF downloaded successfully"

#### Step 3: Verify PDF Content
1. Open the downloaded PDF
2. Verify it contains:
   - Client personal information
   - Spouse information (if applicable)
   - Dependents information (if applicable)
   - Bank information (with masked account numbers)
   - Client signature (image or typed text)
   - Signature date/time
   - Form completion timestamp
   - Audit footer with generation timestamp

#### Step 4: Test Error Cases
1. Try downloading PDF for client who hasn't completed form:
   - Should show error: "Client data entry form not found..."
2. Try downloading PDF for client who hasn't signed:
   - Should show error or handle gracefully
3. Test with invalid client ID:
   - Should show error: "Client not found or does not belong to your firm."

### Test Scenario 3: Edge Cases

#### Test 1: Client with Spouse
1. Complete form with spouse information
2. Sign the form
3. Verify PDF includes spouse information

#### Test 2: Client with Dependents
1. Complete form with dependents
2. Sign the form
3. Verify PDF includes all dependents

#### Test 3: Client without Bank Info
1. Complete form without bank information
2. Sign the form
3. Verify PDF doesn't show bank section or shows "Not provided"

#### Test 4: Multiple Signature Attempts
1. Request signature multiple times
2. Verify system handles existing signature requests correctly
3. Verify only one signature is stored

### Test Scenario 4: UI/UX Verification

#### Color Scheme Verification
1. Verify all buttons use project colors:
   - Primary action buttons: `#F56D2D` (orange)
   - Secondary buttons: `#3AD6F2` (cyan)
   - Borders: `#E8F0FF` (light blue)
   - Text colors: `#3B4A66`, `#1F2A55`, `#4B5563`

#### Responsive Design
1. Test on mobile devices:
   - Signature modal should be responsive
   - Signature canvas should be usable on touch devices
   - Buttons should be properly sized

#### Loading States
1. Verify loading indicators appear during:
   - Signature request
   - Signature submission
   - PDF download

#### Error Messages
1. Verify error messages are user-friendly
2. Verify error messages use toast notifications
3. Verify error messages match API error responses

## API Testing (Using cURL)

### Test 1: Request to Sign Form
```bash
# Replace YOUR_CLIENT_TOKEN with actual client token
curl -X POST "http://your-domain.com/api/taxpayer/data-entry-form/sign-request/" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Signature request created successfully",
  "data": {
    "signature_request_id": 123,
    "document_id": 456,
    "status": "pending",
    "signature_field_id": 789
  }
}
```

### Test 2: Submit Signature (Image)
```bash
# Replace YOUR_CLIENT_TOKEN and base64_image_data
curl -X POST "http://your-domain.com/api/taxpayer/data-entry-form/submit-signature/" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }'
```

### Test 3: Submit Signature (Typed Text)
```bash
curl -X POST "http://your-domain.com/api/taxpayer/data-entry-form/submit-signature/" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typed_text": "John Doe"
  }'
```

### Test 4: Download PDF (Firm Admin)
```bash
# Replace YOUR_FIRM_ADMIN_TOKEN and CLIENT_ID
curl -X GET "http://your-domain.com/api/firm/clients/789/data-entry-form-pdf/" \
  -H "Authorization: Bearer YOUR_FIRM_ADMIN_TOKEN" \
  -H "Accept: application/pdf" \
  --output client_data_entry_form.pdf
```

## Common Issues and Solutions

### Issue 1: Signature Modal Not Opening
**Solution:** 
- Check browser console for errors
- Verify `react-signature-canvas` is installed
- Check if signature request was successful

### Issue 2: PDF Download Fails
**Solution:**
- Verify client has completed and signed the form
- Check API endpoint is correct
- Verify firm admin has access to the client
- Check browser console for error details

### Issue 3: Signature Not Saving
**Solution:**
- Verify signature data is being sent correctly
- Check API response for errors
- Ensure signature request exists before submitting

### Issue 4: Canvas Not Drawing
**Solution:**
- Check if touch events are enabled on mobile
- Verify canvas dimensions are set correctly
- Try clearing and redrawing

## Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Testing

1. Test with large signature images
2. Test PDF generation time
3. Test multiple simultaneous signature requests
4. Test PDF download with slow network

## Security Testing

1. Verify clients can only sign their own forms
2. Verify firm admins can only access their firm's clients
3. Verify authentication tokens are required
4. Verify sensitive data (SSN, account numbers) are masked in PDF

## Success Criteria

✅ Client can complete data entry form
✅ Client can request to sign form
✅ Client can submit signature (draw or type)
✅ Firm admin can download signed PDF
✅ PDF contains all required information
✅ PDF includes signature and timestamps
✅ Error handling works correctly
✅ UI matches project color scheme
✅ Responsive design works on all devices

## Notes

- The signature feature appears only after the form is successfully submitted
- Clients can navigate away without signing, but the signature section will remain available
- PDF download is only available for firm admins/staff
- The feature uses the existing authentication system
- All API calls use the existing error handling utilities

