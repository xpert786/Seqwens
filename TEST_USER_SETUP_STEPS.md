# Steps to Create Test User with 2+ Firm Memberships

**Note:** In this system, "Team Member" = "Tax Preparer" (same role, different terminology). Staff members are automatically assigned the "tax_preparer" role when invited.

## Method 1: Using Firm Admin Panel (Recommended)

### Step 1: Create First Firm Membership
1. Log in as a **Firm Admin** for Firm 1
2. Navigate to **Staff Management** page (from Firm Admin dashboard)
3. Click **"Add Staff Member"** button (orange button in top-right)
4. The **"Invite New Staff Member"** modal opens
5. Fill in the form:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email** (required) - e.g., `testuser@example.com`
   - **Phone** (optional)
   - **Delivery Methods** (checkboxes):
     - Email (default: checked)
     - SMS (optional)
     - Shareable Link (optional)
6. Click **"Send Invite"**
7. The invite is sent via the selected delivery methods
8. User receives invite email/SMS/link
9. User clicks invite link and completes account setup:
   - Sets password
   - Optionally adds phone number
   - Accepts the invite
10. User now has membership in Firm 1 as a **Tax Preparer** (role is automatically assigned)

### Step 2: Create Second Firm
1. Log in as **Super Admin** (or use existing Firm 2)
2. Navigate to **Firm Management**
3. Create a new firm (or use existing Firm 2)
4. Note the Firm ID or name

### Step 3: Add Same User to Second Firm
1. Log in as **Firm Admin** of Firm 2 (or Super Admin)
2. Navigate to **Staff Management** page for Firm 2
3. Click **"Add Staff Member"** button
4. The **"Invite New Staff Member"** modal opens
5. Fill in the form with the **SAME email address** (`testuser@example.com`):
   - **First Name** (can be different or same)
   - **Last Name** (can be different or same)
   - **Email** (must match: `testuser@example.com`)
   - **Phone** (optional)
   - **Delivery Methods** (select as needed)
6. Click **"Send Invite"**
7. **Note:** Role is automatically set to "tax_preparer" - there is no role selection field

### Step 4: User Accepts Second Invite
1. User receives invite email/SMS/link for Firm 2
2. User clicks invite link
3. System detects existing email address
4. User sees **"Sign In"** and **"Forgot Password?"** buttons
5. User signs in with existing credentials
6. After sign-in, user is redirected to invite acceptance page
7. User completes invite acceptance:
   - May need to set/confirm password
   - May need to add/update phone number
8. User now has membership in both Firm 1 and Firm 2
9. Both memberships are as **Tax Preparer** (default role)

### Step 5: Verify Multi-Firm Access
1. User logs in
2. If user has 2+ active memberships, **Account Switcher** appears in top-right corner
3. Account Switcher shows:
   - Current firm name
   - Current role (Tax Preparer)
   - Status badge (Active/Pending/Disabled)
4. Click Account Switcher to see dropdown with all firms
5. Each firm in dropdown shows:
   - Firm name
   - Role (Tax Preparer)
   - Status badge
   - Office scope (if applicable)
6. User can switch between firms
7. Dashboard changes based on selected firm
8. Office scope applies correctly (if set)

---

## Method 2: Using API Endpoints (Programmatic)

### Step 1: Create User Account
1. Use registration API: `POST /api/user/register/`
2. Create user with email and password
3. Save user ID from response

### Step 2: Create First Firm Membership
1. Log in as Firm Admin for Firm 1
2. Use staff invite API: `POST /api/user/firm-admin/tax-preparers/create/`
3. Request body:
   ```json
   {
     "first_name": "John",
     "last_name": "Doe",
     "email": "testuser@example.com",
     "phone_number": "+1234567890",  // optional
     "delivery_methods": ["email", "sms", "link"]  // optional
   }
   ```
4. **Note:** Role is automatically set to "tax_preparer" - do not include in request
5. User receives invite via selected delivery methods
6. User accepts invite via invite link
7. Membership created with role "tax_preparer"

### Step 3: Create Second Firm Membership
1. Log in as Firm Admin for Firm 2 (or switch firm context)
2. Use same API: `POST /api/user/firm-admin/tax-preparers/create/`
3. Send invite to **SAME email** for Firm 2
4. Request body:
   ```json
   {
     "first_name": "John",
     "last_name": "Doe",
     "email": "testuser@example.com",  // Same email
     "phone_number": "+1234567890",  // optional
     "delivery_methods": ["email"]  // optional
   }
   ```
5. User accepts invite (will sign in first if email exists)
6. Membership created with role "tax_preparer"

### Step 4: Verify Memberships
1. Use memberships API: `GET /api/user/memberships/`
2. Should return array with 2 memberships
3. Each membership has:
   - Different `firm_id`
   - Same `role` ("tax_preparer")
   - `status` ("active", "pending", or "disabled")
   - `office_scope` (if applicable)

---

## Method 3: Using Database Directly (Advanced)

### Step 1: Create User Account
1. Access database (PostgreSQL/MySQL)
2. Insert user record in `users` table
3. Set email, password hash, and basic user info
4. Note the user ID

### Step 2: Create First Firm Membership
1. Find Firm 1 ID from `firms` table
2. Insert membership record in `firm_memberships` or `user_firms` table
3. Set:
   - `user_id` = User ID from Step 1
   - `firm_id` = Firm 1 ID
   - `role` = "tax_preparer" (default role for staff)
   - `status` = "active"
   - `office_scope` = Office IDs or "all" (if applicable)

### Step 3: Create Second Firm Membership
1. Find Firm 2 ID from `firms` table
2. Insert another membership record in same table
3. Set:
   - `user_id` = Same User ID
   - `firm_id` = Firm 2 ID
   - `role` = "tax_preparer" (default role for staff)
   - `status` = "active"
   - `office_scope` = Office IDs or "all" (if applicable)

### Step 4: Set Current Firm Context
1. Update user's `current_firm_id` to Firm 1 or Firm 2
2. Or leave null to let system determine

### Step 5: Test Login
1. User logs in with email and password
2. System should detect multiple memberships
3. Account Switcher should appear
4. User can switch between firms

---

## Method 4: Using Django Admin (If Available)

### Step 1: Access Django Admin
1. Navigate to `/admin/` URL
2. Log in as superuser

### Step 2: Create/Find User
1. Go to Users section
2. Find or create test user
3. Note user ID

### Step 3: Create First Membership
1. Go to Firm Memberships section
2. Click "Add Firm Membership"
3. Select user
4. Select Firm 1
5. Set role to "tax_preparer" (default for staff)
6. Set status to "Active"
7. Save

### Step 4: Create Second Membership
1. Click "Add Firm Membership" again
2. Select SAME user
3. Select Firm 2
4. Set role to "tax_preparer" (default for staff)
5. Set status to "Active"
6. Save

### Step 5: Test
1. User logs in
2. Account Switcher should show both firms
3. User can switch between them

---

## Quick Setup Checklist

### Prerequisites
- [ ] Two firms exist in system (Firm 1 and Firm 2)
- [ ] You have Firm Admin access for both firms (or Super Admin access)
- [ ] Test email address ready (e.g., `multifirm@test.com`)

### Steps
- [ ] Log in as Firm Admin for Firm 1
- [ ] Navigate to Staff Management page
- [ ] Click "Add Staff Member" button
- [ ] Fill form: First Name, Last Name, Email, Phone (optional), Delivery Methods
- [ ] Click "Send Invite"
- [ ] User receives invite and accepts it (creates account if new)
- [ ] User now has Firm 1 membership as Tax Preparer
- [ ] Log in as Firm Admin for Firm 2
- [ ] Navigate to Staff Management page
- [ ] Click "Add Staff Member" button
- [ ] Fill form with SAME email address
- [ ] Click "Send Invite"
- [ ] User receives invite, signs in (if existing), and accepts
- [ ] User now has Firm 2 membership as Tax Preparer
- [ ] Verify both memberships in Account Switcher

### Verification
- [ ] User can log in successfully
- [ ] Account Switcher visible in header (if 2+ memberships)
- [ ] Both firms listed in dropdown
- [ ] Each firm shows role as "Tax Preparer"
- [ ] Status badges display correctly (Active/Pending/Disabled)
- [ ] Can switch between firms
- [ ] Dashboard changes based on selected firm (Tax Preparer dashboard)
- [ ] Office scope applies correctly (if set)

---

## Important Notes

### Role Assignment
- **Staff members are automatically assigned the "tax_preparer" role**
- There is **NO role selection field** in the "Invite New Staff Member" form
- All staff invites create memberships with role "tax_preparer"
- The role is hardcoded in the API endpoint: `/user/firm-admin/tax-preparers/create/`

### Form Fields
The "Invite New Staff Member" form includes:
- **First Name** (required)
- **Last Name** (required)
- **Email** (required)
- **Phone** (optional)
- **Delivery Methods** (checkboxes):
  - Email (default: checked)
  - SMS (optional)
  - Shareable Link (optional)

### API Endpoints
- **Create Staff Invite:** `POST /api/user/firm-admin/tax-preparers/create/`
- **Validate Invite:** `GET /api/user/staff-invite/validate/?token={token}`
- **Accept Invite:** `POST /api/user/staff-invite/accept/`
- **Get Memberships:** `GET /api/user/memberships/`
- **Switch Firm:** `POST /api/user/switch-firm/`

### Invite Acceptance Flow
1. User clicks invite link
2. System validates invite token
3. If email exists:
   - User sees "Sign In" and "Forgot Password?" buttons
   - User signs in
   - Redirected to invite acceptance page
4. If email is new:
   - User sets password
   - Optionally adds phone number
   - Accepts invite
5. After acceptance:
   - If multiple roles: User goes to role selection screen
   - If single role: User goes directly to appropriate dashboard
   - Tax Preparer → `/taxdashboard`

### Data Sharing
- **Data sharing modal only appears for CLIENT invites** (not staff invites)
- When a taxpayer accepts an invite from a second firm, they see data sharing options
- Staff invites do NOT trigger data sharing modal

### Dashboard Routes
- `tax_preparer` / `team_member` → `/taxdashboard` (Tax Preparer Dashboard)
- `firm_admin` / `admin` / `firm` → `/firmadmin` (Firm Admin Dashboard)
- `taxpayer` / `client` → `/dashboard` (Client Dashboard)

### Terminology
- **"Team Member"** and **"Tax Preparer"** refer to the same role in the system
- **"Staff Member"** = any user invited via Staff Management (automatically "tax_preparer")
- **"Tax Preparer"** = the role assigned to all staff members

---

## Common Issues & Solutions

### Issue: Account Switcher Not Showing
**Solution:**
- Verify user has 2+ active memberships
- Check API endpoint `/api/user/memberships/` returns data
- Check browser console for errors (should be silent now)
- Verify memberships have `status = "active"`
- Clear browser cache and retry

### Issue: User Can't Accept Second Invite
**Solution:**
- Ensure user signs in first (existing email detected)
- Check invite token is valid
- Verify user completes sign-in process
- Check that invite hasn't expired

### Issue: Wrong Role After Switch
**Solution:**
- Verify membership records have correct roles (should be "tax_preparer" for staff)
- Check API response includes role information
- Clear browser cache and retry
- Verify tokens are updated after switch

### Issue: Office Scope Not Working
**Solution:**
- Verify office scope set in membership record
- Check office IDs are valid
- Test office scope API endpoint
- Verify office scope display in Account Switcher

### Issue: Role Selection Screen Appears
**Solution:**
- This is expected if user has multiple roles across different firms
- User should select the role they want to use for this session
- After selection, user is redirected to appropriate dashboard

---

## Test User Examples

### Example 1: Tax Preparer in Two Firms
- **Email:** `taxpreparer-multifirm@test.com`
- **Firm 1:** Role = "tax_preparer", Status = "active"
- **Firm 2:** Role = "tax_preparer", Status = "active"
- **Dashboard:** `/taxdashboard` (Tax Preparer Dashboard)

### Example 2: Tax Preparer + Taxpayer (Different Roles)
- **Email:** `taxpreparer-taxpayer@test.com`
- **Firm 1:** Role = "tax_preparer" (from staff invite), Status = "active"
- **Firm 2:** Role = "taxpayer" (from client invite), Status = "active"
- **Dashboards:** `/taxdashboard` or `/dashboard` (depending on selected firm)

### Example 3: Tax Preparer with Pending Status
- **Email:** `pending-active@test.com`
- **Firm 1:** Role = "tax_preparer", Status = "active"
- **Firm 2:** Role = "tax_preparer", Status = "pending"
- **Note:** Pending memberships may have limited functionality

---

## Summary

**Key Points:**
1. All staff invites create "tax_preparer" role memberships (no role selection)
2. Form fields: First Name, Last Name, Email, Phone (optional), Delivery Methods
3. API endpoint: `/user/firm-admin/tax-preparers/create/`
4. Same email can be invited to multiple firms
5. Existing users sign in first, then accept invite
6. Account Switcher appears when user has 2+ active memberships
7. Data sharing modal only for client invites, not staff invites
8. All staff members use Tax Preparer dashboard (`/taxdashboard`)




