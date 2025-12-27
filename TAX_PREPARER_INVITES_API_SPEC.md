# Tax Preparer Invites Section - API Specification

## Overview
This document outlines all the APIs needed to implement an "Invites" section for tax preparers where they can view, accept, and decline pending staff invites (invites to join firms as tax preparers).

## Feature Description
Instead of requiring tax preparers to click email links to accept invites, they can:
1. View all pending staff invites in a dedicated "Invites" section
2. See invite details (firm name, role, invited date, expiry date, etc.)
3. Accept invites directly from the UI
4. Decline invites
5. View accepted/declined invite history (optional)

---

## Required APIs

### 1. List Pending Staff Invites
**Endpoint:** `GET /seqwens/api/user/tax-preparer/staff-invites/pending/`

**Description:** Get a paginated list of pending staff invites for the authenticated tax preparer.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 10)
- `search` (string, optional): Search by firm name or email
- `status` (string, optional): Filter by status (e.g., "pending", "expired")

**Response:**
```json
{
  "success": true,
  "message": "Pending staff invites retrieved successfully",
  "data": {
    "invites": [
      {
        "id": 29,
        "firm_id": 5,
        "firm_name": "ABC Tax Firm",
        "firm_email": "admin@abctax.com",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone_number": "+1234567890",
        "role": "tax_preparer",
        "status": "pending",
        "invited_at": "2025-12-27T06:58:19.561642Z",
        "expires_at": "2026-01-03T06:58:19.561324Z",
        "invited_by": {
          "id": 10,
          "name": "Firm Admin",
          "email": "admin@abctax.com"
        },
        "invite_link": "http://168.231.121.7/seqwens-frontend/invite?token=...",
        "is_expired": false,
        "days_until_expiry": 7
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_count": 5,
      "total_pages": 1
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to retrieve pending invites",
  "data": []
}
```

---

### 2. Get Staff Invite Details
**Endpoint:** `GET /seqwens/api/user/tax-preparer/staff-invites/{invite_id}/`

**Description:** Get detailed information about a specific staff invite.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `invite_id` (integer, required): The ID of the invite

**Response:**
```json
{
  "success": true,
  "message": "Staff invite details retrieved successfully",
  "data": {
    "id": 29,
    "firm_id": 5,
    "firm_name": "ABC Tax Firm",
    "firm_email": "admin@abctax.com",
    "firm_logo": "http://168.231.121.7/seqwens/media/firm_logos/logo.png",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+1234567890",
    "role": "tax_preparer",
    "status": "pending",
    "invited_at": "2025-12-27T06:58:19.561642Z",
    "expires_at": "2026-01-03T06:58:19.561324Z",
    "invited_by": {
      "id": 10,
      "name": "Firm Admin",
      "email": "admin@abctax.com"
    },
    "invite_link": "http://168.231.121.7/seqwens-frontend/invite?token=...",
    "is_expired": false,
    "days_until_expiry": 7,
    "office_scope": [],  // Optional: office IDs if office scope is set
    "delivery_summary": {
      "email_sent": true,
      "sms_sent": false,
      "error": null
    }
  }
}
```

---

### 3. Accept Staff Invite
**Endpoint:** `POST /seqwens/api/user/tax-preparer/staff-invites/{invite_id}/accept/`

**Description:** Accept a pending staff invite. This will add the tax preparer to the firm.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `invite_id` (integer, required): The ID of the invite to accept

**Request Body:**
```json
{
  "data_sharing_scope": "all",  // Optional: "all", "none", "selected"
  "selected_categories": []      // Optional: Array of category IDs if scope is "selected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff invite accepted successfully",
  "data": {
    "id": 29,
    "firm_id": 5,
    "firm_name": "ABC Tax Firm",
    "role": "tax_preparer",
    "status": "accepted",
    "accepted_at": "2025-12-27T10:30:00.000000Z",
    "membership": {
      "id": 15,
      "firm_id": 5,
      "user_id": 42,
      "role": "tax_preparer",
      "status": "active",
      "joined_at": "2025-12-27T10:30:00.000000Z"
    }
  }
}
```

**Error Response (if invite expired):**
```json
{
  "success": false,
  "message": "This invite has expired",
  "data": null
}
```

**Error Response (if already accepted):**
```json
{
  "success": false,
  "message": "This invite has already been accepted",
  "data": null
}
```

---

### 4. Decline Staff Invite
**Endpoint:** `POST /seqwens/api/user/tax-preparer/staff-invites/{invite_id}/decline/`

**Description:** Decline a pending staff invite.

**Authentication:** Required (Bearer token)

**Path Parameters:**
- `invite_id` (integer, required): The ID of the invite to decline

**Request Body (optional):**
```json
{
  "reason": "Not interested"  // Optional: Reason for declining
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff invite declined successfully",
  "data": {
    "id": 29,
    "status": "declined",
    "declined_at": "2025-12-27T10:30:00.000000Z"
  }
}
```

---

### 5. List All Staff Invites (History - Optional)
**Endpoint:** `GET /seqwens/api/user/tax-preparer/staff-invites/`

**Description:** Get a paginated list of all staff invites (pending, accepted, declined, expired) for the authenticated tax preparer.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status ("pending", "accepted", "declined", "expired")
- `search` (string, optional): Search by firm name or email
- `sort_by` (string, optional): Sort field ("invited_at", "expires_at", "firm_name")
- `sort_order` (string, optional): Sort order ("asc", "desc")

**Response:**
```json
{
  "success": true,
  "message": "Staff invites retrieved successfully",
  "data": {
    "invites": [
      {
        "id": 29,
        "firm_id": 5,
        "firm_name": "ABC Tax Firm",
        "email": "john.doe@example.com",
        "role": "tax_preparer",
        "status": "pending",
        "invited_at": "2025-12-27T06:58:19.561642Z",
        "expires_at": "2026-01-03T06:58:19.561324Z",
        "accepted_at": null,
        "declined_at": null,
        "is_expired": false
      },
      {
        "id": 28,
        "firm_id": 3,
        "firm_name": "XYZ Tax Services",
        "email": "john.doe@example.com",
        "role": "tax_preparer",
        "status": "accepted",
        "invited_at": "2025-12-20T10:00:00.000000Z",
        "expires_at": "2025-12-27T10:00:00.000000Z",
        "accepted_at": "2025-12-21T14:30:00.000000Z",
        "declined_at": null,
        "is_expired": false
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_count": 12,
      "total_pages": 2
    },
    "summary": {
      "pending": 5,
      "accepted": 4,
      "declined": 2,
      "expired": 1
    }
  }
}
```

---

## API Implementation Notes

### Authentication
All endpoints require Bearer token authentication. The token should be included in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Error Handling
All endpoints should return consistent error responses:
```json
{
  "success": false,
  "message": "Error message here",
  "data": null,
  "errors": {
    "field_name": ["Error message for this field"]
  }
}
```

### Status Codes
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Invite not found
- `409 Conflict`: Invite already accepted/declined
- `422 Unprocessable Entity`: Validation errors

### Data Sharing Scope (for Accept Endpoint)
When accepting an invite, if the user already has memberships in other firms, they may need to specify data sharing preferences:
- `"all"`: Share all data with the new firm
- `"none"`: Don't share any data
- `"selected"`: Share only selected categories (requires `selected_categories` array)

---

## Frontend Implementation Requirements

### 1. New Route
Add route in `src/Taxpreparer/TaxRoutes.jsx`:
```jsx
<Route path="invites" element={<StaffInvitesPage />} />
```

### 2. Sidebar Menu Item
Add "Invites" link in `src/Taxpreparer/component/TaxSidebar.jsx`:
```jsx
<Link to="/taxdashboard/invites" className={linkClass("/taxdashboard/invites")}>
  <span className={iconWrapperClass("/taxdashboard/invites")}>
    <InviteIcon />
  </span>
  Invites
</Link>
```

### 3. API Methods
Add to `src/ClientOnboarding/utils/apiUtils.jsx`:
```javascript
export const taxPreparerStaffInvitesAPI = {
  // List pending invites
  getPendingInvites: async (params = {}) => {
    const { page, page_size, search, status } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (page_size) queryParams.append('page_size', page_size);
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/tax-preparer/staff-invites/pending/${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  // Get invite details
  getInviteDetails: async (inviteId) => {
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/`, 'GET');
  },

  // Accept invite
  acceptInvite: async (inviteId, data = {}) => {
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/accept/`, 'POST', data);
  },

  // Decline invite
  declineInvite: async (inviteId, reason = null) => {
    const payload = reason ? { reason } : {};
    return await apiRequest(`/user/tax-preparer/staff-invites/${inviteId}/decline/`, 'POST', payload);
  },

  // List all invites (history)
  getAllInvites: async (params = {}) => {
    const { page, page_size, status, search, sort_by, sort_order } = params;
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (page_size) queryParams.append('page_size', page_size);
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (sort_order) queryParams.append('sort_order', sort_order);
    const queryString = queryParams.toString();
    return await apiRequest(`/user/tax-preparer/staff-invites/${queryString ? `?${queryString}` : ''}`, 'GET');
  }
};
```

### 4. Component Structure
Create `src/Taxpreparer/pages/Invites/StaffInvitesPage.jsx` with:
- List view of pending invites
- Invite cards showing firm name, role, expiry date
- Accept/Decline buttons
- Pagination
- Filter by status
- Search functionality
- Optional: History tab showing all invites

---

## Summary

**Required APIs:**
1. ✅ `GET /user/tax-preparer/staff-invites/pending/` - List pending invites
2. ✅ `GET /user/tax-preparer/staff-invites/{invite_id}/` - Get invite details
3. ✅ `POST /user/tax-preparer/staff-invites/{invite_id}/accept/` - Accept invite
4. ✅ `POST /user/tax-preparer/staff-invites/{invite_id}/decline/` - Decline invite
5. ✅ `GET /user/tax-preparer/staff-invites/` - List all invites (history - optional)

**Minimum Required (MVP):**
- APIs 1, 3, and 4 are essential
- API 2 (details) can be optional if all data is in the list response
- API 5 (history) is optional for future enhancement

