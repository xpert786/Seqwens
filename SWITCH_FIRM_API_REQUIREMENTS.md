# Switch Firm API Requirements

## Current Implementation

The AccountSwitcher uses the `/user/switch-firm/` API to switch between firm memberships.

## Required API Response Format

The `/user/switch-firm/` API should return:

```json
{
  "success": true,
  "message": "Firm switched successfully",
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "user_type": "tax_preparer", // or "admin", "client", etc.
      "firm": {
        "id": 14,  // ← IMPORTANT: This should be the switched firm ID
        "name": "New Firm Name"
      },
      "firm_id": 14,  // ← Also include firm_id for compatibility
      // ... other user fields
    },
    "firms": [  // ← IMPORTANT: Include updated firms array with is_current flags
      {
        "id": 14,
        "name": "New Firm Name",
        "status": "active",
        "is_current": true,  // ← The switched firm should have is_current: true
        "membership": {
          "id": 15,
          "role": "TeamMember",  // or "TaxPreparer", "FirmAdmin", etc.
          "role_display": "Team Member",
          "status": "Active",
          "status_display": "Active",
          "office_location_scope": {
            "office_ids": [],
            "offices": [],
            "has_restriction": false
          }
        }
      },
      {
        "id": 13,
        "name": "Previous Firm",
        "status": "active",
        "is_current": false,  // ← Other firms should have is_current: false
        "membership": {
          // ... membership data
        }
      }
    ],
    "tokens": {  // Optional: If tokens need to be refreshed
      "access": "new_access_token",
      "refresh": "new_refresh_token"
    }
  }
}
```

## What the Frontend Does

1. **Calls the API**: `POST /user/switch-firm/` with `{ firm_id: <firmId> }`

2. **Updates Storage**:
   - Updates `userData` with the new user object (including `firm.id`)
   - Updates `userType` based on the membership role
   - Updates `firmsData` with the firms array (updating `is_current` flags)
   - Updates tokens if provided

3. **Updates State**:
   - Updates local `memberships` state with correct `is_current` flags
   - Sets `currentFirm` to the switched membership

4. **Redirects**:
   - Based on the membership role:
     - `team_member` / `tax_preparer` → `/taxdashboard`
     - `firm_admin` / `admin` → `/firmadmin`
     - `taxpayer` / `client` → `/dashboard`

## If API Doesn't Return Firms Array

If the API response doesn't include the `firms` array, the frontend will:
- Update the existing `firmsData` in storage manually
- Set `is_current: true` for the switched firm
- Set `is_current: false` for all other firms

However, **it's recommended that the API returns the updated firms array** to ensure consistency.

## Current Firm Detection After Reload

After page reload, the AccountSwitcher:
1. Loads firms from `firmsData` in storage
2. Finds firm with `is_current: true`
3. Falls back to checking `userData.firm.id`
4. Falls back to first active membership

## Summary

**You already have the API** (`/user/switch-firm/`), but ensure it returns:
- ✅ Updated `user` object with `firm.id` set to the switched firm
- ✅ Updated `firms` array with correct `is_current` flags
- ✅ (Optional) New tokens if needed

The frontend will handle the rest automatically.

