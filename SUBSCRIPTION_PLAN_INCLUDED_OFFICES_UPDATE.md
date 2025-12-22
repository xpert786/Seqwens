# Subscription Plan - Included Offices Field Implementation

## Overview
Added the `included_offices` field to all subscription plan management features. This field tracks the number of office locations included in each subscription plan, which is used for billing calculations when firms expand beyond their included office limit.

## Changes Made

### 1. Super Admin - Edit Subscription Plan (`src/SuperAdmin/Pages/EditSubscriptionPlan.jsx`)
- ✅ Added `includedOffices` to the `limits` state
- ✅ Added input field for "Included Offices" in the Limits & Features section
- ✅ Added placeholder text: "Number of office locations included in the base plan"
- ✅ Default value: 1 office
- ✅ Validation: Must be >= 0
- ✅ Included in API payload when updating plans
- ✅ Fetches `included_offices` from API when loading plan data
- ✅ Changed API call from POST to PATCH for updating existing plans

### 2. Super Admin - Add Subscription Plan (`src/SuperAdmin/Pages/AddSubscription.jsx`)
- ✅ Added `includedOffices` to the `limits` state
- ✅ Added input field for "Included Offices" in the Limits & Features section
- ✅ Added placeholder text: "Number of office locations included in the base plan"
- ✅ Default value: 1 office
- ✅ Validation: Must be >= 0
- ✅ Included in API payload when creating new plans
- ✅ Resets to empty when switching plan tabs

### 3. Firm Admin - Finalize Subscription (`src/FirmAdmin/Pages/SubscriptionManagement/FinalizeSubscription.jsx`)
- ✅ Added `included_offices` display in plan features list
- ✅ Shows as: "{X} Office Location(s) Included"
- ✅ Handles both detailed plan data and default features
- ✅ Added to default feature lists for all plan types:
  - Solo: 1 Office Location
  - Team: 1 Office Location
  - Professional: 3 Office Locations
  - Enterprise: 5 Office Locations

### 4. Firm Admin - All Plans (`src/FirmAdmin/Pages/SubscriptionManagement/AllPlans.jsx`)
- ✅ Added `included_offices` display in plan features list
- ✅ Shows as: "{X} Office Location(s) Included"
- ✅ Checks if already in `features_list` to avoid duplicates
- ✅ Falls back to plan's `included_offices` value if not in features
- ✅ Added to default feature lists for all plan types

## Field Details

### Field Name: `included_offices`
- **Type:** Integer
- **Required:** Yes (for create/update)
- **Default:** 1
- **Validation:** Must be >= 0
- **Description:** Number of office locations included in the base subscription plan

### UI Location
The field appears in the "Limits & Features" section, below the "E-Signatures/month" field, with:
- Label: "Included Offices"
- Input type: Number
- Placeholder: "1"
- Help text: "Number of office locations included in the base plan"

## API Integration

### Create Plan (POST)
```json
{
  "subscription_type": "solo",
  "monthly_price": "29.00",
  "yearly_price": "290.00",
  "discount_percentage_yearly": 17,
  "max_users": "1",
  "max_clients": "50",
  "storage_gb": 10,
  "e_signatures_per_month": "10",
  "included_offices": 1,
  ...
}
```

### Update Plan (PATCH)
```json
{
  "included_offices": 3,
  "monthly_price": "149.00",
  ...
}
```

### API Endpoints Used
- `GET /api/user/subscription-plans/<type>/` - Fetch plan details (includes `included_offices`)
- `PATCH /api/user/subscription-plans/<type>/` - Update plan (includes `included_offices`)
- `POST /api/user/subscription-plans/` - Create plan (includes `included_offices`)
- `GET /api/user/subscriptions/plans/public/` - Public plans (includes `included_offices`)
- `GET /api/user/firm-admin/subscription/plans/` - Firm admin plans (includes `included_offices`)

## Testing Instructions

### Test 1: Super Admin - Create New Plan
1. Login as Super Admin
2. Navigate to Subscriptions page
3. Click "Add Subscription Plan"
4. Select a plan type (e.g., Solo)
5. Fill in all required fields
6. **Verify:** "Included Offices" field appears below "E-Signatures/month"
7. Enter a value (e.g., 2)
8. Click "Add Plan"
9. **Verify:** Plan is created successfully
10. **Verify:** API request includes `included_offices: 2`

### Test 2: Super Admin - Edit Existing Plan
1. Login as Super Admin
2. Navigate to Subscriptions page
3. Click on a plan card (e.g., Professional)
4. **Verify:** "Included Offices" field shows current value (e.g., 3)
5. Change the value to 5
6. Click "Save Changes"
7. **Verify:** Plan is updated successfully
8. **Verify:** API request uses PATCH method
9. **Verify:** API request includes `included_offices: 5`
10. Refresh page and verify value persists

### Test 3: Firm Admin - View Plans (Finalize Subscription)
1. Login as Firm Admin (without subscription)
2. Navigate to `/firmadmin/finalize-subscription`
3. **Verify:** All plan cards display "Included Offices" in features
4. **Verify:** Format: "{X} Office Location(s) Included"
5. **Verify:** Values match plan types:
   - Solo: 1 Office Location
   - Team: 1 Office Location
   - Professional: 3 Office Locations
   - Enterprise: 5 Office Locations

### Test 4: Firm Admin - View Plans (All Plans Tab)
1. Login as Firm Admin
2. Navigate to Subscription Management
3. Click "All Plan" tab
4. **Verify:** All plan cards display "Included Offices" in features
5. **Verify:** Format: "{X} Office Location(s) Included"
6. **Verify:** Values are correct for each plan type

### Test 5: Validation
1. Super Admin - Edit Plan
2. Try entering negative number (-1)
3. **Verify:** Field prevents negative values (onBlur validation)
4. Try entering 0
5. **Verify:** 0 is accepted (valid minimum)
6. Try leaving field empty
7. **Verify:** Defaults to 1 when saving

### Test 6: API Response Verification
1. Use cURL or Postman to call:
   ```bash
   GET /api/user/subscription-plans/professional/
   ```
2. **Verify:** Response includes `included_offices` field
3. **Verify:** Value matches what was set in the UI

## UI/UX Notes

### Design Consistency
- ✅ Matches existing form field styling
- ✅ Uses project color scheme (`#3B4A66` for text, `#E8F0FF` for borders)
- ✅ Consistent spacing and layout
- ✅ Help text provides context

### User Experience
- ✅ Clear label and description
- ✅ Default value prevents empty submissions
- ✅ Validation prevents invalid values
- ✅ Displays prominently in plan features
- ✅ Consistent formatting across all views

## Default Values by Plan Type

Based on API documentation:
- **Solo:** 1 office
- **Team:** 1 office
- **Professional:** 3 offices
- **Enterprise:** 5 offices

These defaults are:
1. Used when creating new plans
2. Displayed in default feature lists
3. Can be customized per plan

## Error Handling

- ✅ Field validation prevents negative values
- ✅ Defaults to 1 if empty on save
- ✅ API errors are displayed via toast notifications
- ✅ Form validation prevents submission with invalid data

## Backward Compatibility

- ✅ Existing plans without `included_offices` default to 1
- ✅ API calls handle missing field gracefully
- ✅ Display logic checks for field existence before showing
- ✅ Default feature lists include office information

## Files Modified

1. `src/SuperAdmin/Pages/EditSubscriptionPlan.jsx`
2. `src/SuperAdmin/Pages/AddSubscription.jsx`
3. `src/FirmAdmin/Pages/SubscriptionManagement/FinalizeSubscription.jsx`
4. `src/FirmAdmin/Pages/SubscriptionManagement/AllPlans.jsx`

## Next Steps

1. ✅ Test all create/update flows
2. ✅ Verify API responses include `included_offices`
3. ✅ Test with different plan types
4. ✅ Verify billing system integration (backend)
5. ✅ Test edge cases (0 offices, large numbers)

## Notes

- The field is now fully integrated into the subscription plan management system
- All API calls include `included_offices` in the payload
- The field is displayed in all relevant UI components
- Default values ensure backward compatibility
- Validation ensures data integrity

