# Feedback Feature - API Specification

This document lists all the APIs required for the Feedback Feature that allows users to submit feedback about the application.

## Base URL
```
Production: http://168.231.121.7/seqwens/api/
Development: http://localhost:8000/api/
```

## Authentication
All requests require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## 1. Get Feedback Status

**Endpoint:** `GET /accounts/feedback/status/`

**Description:** Check if the authenticated user has already submitted feedback. This is used to determine whether to show the feedback modal.

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Example Request:**
```bash
GET /seqwens/api/accounts/feedback/status/
```

**Example Response (Feedback Not Submitted):**
```json
{
  "success": true,
  "has_feedback": false,
  "submitted": false,
  "feedback_submitted": false,
  "message": "Feedback status retrieved successfully"
}
```

**Example Response (Feedback Already Submitted):**
```json
{
  "success": true,
  "has_feedback": true,
  "submitted": true,
  "feedback_submitted": true,
  "feedback": {
    "id": 123,
    "stars": "5",
    "comment": "Great application!",
    "role": "tax_preparer",
    "submitted_at": "2025-12-29T10:00:00Z"
  },
  "message": "Feedback status retrieved successfully"
}
```

**Response Fields:**
- `success` (boolean): Whether the request was successful
- `has_feedback` (boolean): Whether the user has submitted feedback (primary field)
- `submitted` (boolean): Alternative field name for has_feedback
- `feedback_submitted` (boolean): Alternative field name for has_feedback
- `feedback` (object, optional): Feedback details if already submitted
  - `id` (number): Feedback ID
  - `stars` (string): Rating (1-5)
  - `comment` (string): Feedback comment
  - `role` (string): User role when feedback was submitted
  - `submitted_at` (string): ISO 8601 timestamp

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "An error occurred while processing your request"
}
```

---

## 2. Submit Feedback

**Endpoint:** `POST /user/feedback/`

**Description:** Submit user feedback with a star rating and optional comment.

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "stars": "5",
  "comment": "Great application! Very user-friendly.",
  "role": "tax_preparer"
}
```

**Request Body Fields:**
- `stars` (string, required): Rating from 1 to 5 (must be string format: "1", "2", "3", "4", or "5")
- `comment` (string, optional): Feedback comment/text (can be empty string)
- `role` (string, optional): User role (e.g., "client", "tax_preparer", "admin", "super_admin")

**Example Request:**
```bash
POST /seqwens/api/user/feedback/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "stars": "5",
  "comment": "The workflow feature is excellent!",
  "role": "tax_preparer"
}
```

**cURL Example:**
```bash
curl -X POST "http://168.231.121.7/seqwens/api/user/feedback/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "stars": "5",
    "comment": "Great application!",
    "role": "tax_preparer"
  }'
```

**Example Response (Success):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 123,
    "stars": "5",
    "comment": "Great application!",
    "role": "tax_preparer",
    "user": 49,
    "user_email": "preparer@example.com",
    "submitted_at": "2025-12-29T15:30:00Z"
  }
}
```

**Response Fields:**
- `success` (boolean): Whether the request was successful
- `message` (string): Success message
- `data` (object): Submitted feedback details
  - `id` (number): Feedback ID
  - `stars` (string): Rating submitted
  - `comment` (string): Comment submitted
  - `role` (string): User role
  - `user` (number): User ID
  - `user_email` (string): User email
  - `submitted_at` (string): ISO 8601 timestamp

**Error Responses:**

**400 Bad Request (Missing Stars):**
```json
{
  "success": false,
  "message": "Rating is required",
  "errors": {
    "stars": ["This field is required."]
  }
}
```

**400 Bad Request (Invalid Stars):**
```json
{
  "success": false,
  "message": "Invalid rating",
  "errors": {
    "stars": ["Rating must be between 1 and 5."]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "An error occurred while processing your request"
}
```

---

## Frontend Implementation Details

### Component Flow

1. **FeedbackWrapper Component:**
   - Wraps the entire application
   - On mount, checks if user is logged in
   - Skips feedback check for superadmin/support_admin/billing_admin users
   - Calls `getFeedbackStatus()` API
   - If feedback not submitted AND modal not shown before, displays modal after 1 second delay
   - Uses localStorage to track if modal has been shown (`feedback_modal_shown`)

2. **FeedbackModal Component:**
   - Displays star rating (1-5 stars)
   - Optional comment textarea
   - Submit button
   - Calls `submitFeedback()` API on submit
   - Shows success/error toast notifications
   - Closes modal after successful submission

### User Roles

The feedback system supports the following user roles:
- `client` - Regular client users
- `tax_preparer` - Tax preparer users
- `admin` - Firm admin users
- `super_admin` - Super admin users (skipped from feedback)
- `support_admin` - Support admin users (skipped from feedback)
- `billing_admin` - Billing admin users (skipped from feedback)

### LocalStorage Keys

- `feedback_modal_shown`: Set to `'true'` when modal is shown or closed, prevents showing again

### Validation Rules

1. **Stars Rating:**
   - Required field
   - Must be a string value: "1", "2", "3", "4", or "5"
   - Cannot be 0 or empty

2. **Comment:**
   - Optional field
   - Can be empty string
   - Should be trimmed before submission

3. **Role:**
   - Optional field
   - Automatically populated from user's `userType` in localStorage

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/accounts/feedback/status/` | Check if user has submitted feedback | Yes |
| POST | `/user/feedback/` | Submit new feedback | Yes |

---

## Error Handling

### Frontend Error Handling

The frontend handles errors gracefully:

1. **404 Not Found (getFeedbackStatus):**
   - Logs error to console
   - Does not show feedback modal
   - Continues normal application flow

2. **Network Errors:**
   - Shows error toast notification
   - Allows user to retry submission

3. **Validation Errors:**
   - Shows inline error messages
   - Prevents form submission until valid

### Recommended Backend Implementation

1. **Get Feedback Status:**
   - If endpoint doesn't exist, return 404 (current behavior is acceptable)
   - If endpoint exists, return proper JSON response
   - Check user authentication
   - Query database for user's feedback submission

2. **Submit Feedback:**
   - Validate stars field (required, 1-5)
   - Validate comment (optional, max length if needed)
   - Store feedback in database
   - Associate with user account
   - Return success response with feedback details

---

## Database Schema (Recommended)

```sql
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    stars VARCHAR(1) NOT NULL CHECK (stars IN ('1', '2', '3', '4', '5')),
    comment TEXT,
    role VARCHAR(50),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_submitted_at ON feedback(submitted_at);
```

---

## Testing

### Test Cases

1. **Get Feedback Status - Not Submitted:**
   - User has not submitted feedback
   - Should return `has_feedback: false`
   - Modal should be shown (if not shown before)

2. **Get Feedback Status - Already Submitted:**
   - User has submitted feedback
   - Should return `has_feedback: true`
   - Modal should NOT be shown

3. **Submit Feedback - Valid:**
   - Submit with stars 1-5
   - Optional comment
   - Should return success response
   - Status check should now return `has_feedback: true`

4. **Submit Feedback - Invalid:**
   - Submit without stars
   - Should return 400 error
   - Should show validation error

5. **Authentication:**
   - Unauthenticated requests should return 401
   - Authenticated requests should work normally

---

## Notes

1. The `getFeedbackStatus` endpoint currently returns 404, which is handled gracefully by the frontend. The feature will work once the backend endpoint is implemented.

2. The stars field must be sent as a string ("1"-"5"), not an integer.

3. The feedback modal is shown only once per user (tracked via localStorage and API status).

4. Superadmin, support_admin, and billing_admin users are excluded from feedback collection.

5. The feedback feature is global and wraps the entire application, so it works for all user types (except excluded roles).

