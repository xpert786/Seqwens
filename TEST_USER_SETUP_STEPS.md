# Steps to Create Test User with 2+ Firm Memberships

**Note:** In this system, "Team Member" = "Tax Preparer" (same role, different terminology)

## Method 1: Using Admin Panel (Recommended)

### Step 1: Create First Firm Membership
1. Log in as a Super Admin or Firm Admin
2. Navigate to Staff/Team Member Management page
3. Click "Add Team Member" or "Invite User"
4. Enter test user's email address (e.g., `testuser@example.com`)
5. Select role for Firm 1 (e.g., "Firm Admin" or "Tax Preparer" / "Team Member")
6. Set office scope if needed
7. Send the invite
8. User accepts the invite and completes account setup
9. User now has membership in Firm 1

### Step 2: Create Second Firm
1. Log in as Super Admin
2. Navigate to Firm Management
3. Create a new firm (or use existing Firm 2)
4. Note the Firm ID or name

### Step 3: Add Same User to Second Firm
1. Log in as Firm Admin of Firm 2 (or Super Admin)
2. Navigate to Staff/Team Member Management for Firm 2
3. Click "Add Team Member" or "Invite User"
4. Enter the SAME email address (`testuser@example.com`)
5. Select a DIFFERENT role (e.g., if Firm 1 was "Firm Admin", use "Tax Preparer" for Firm 2)
6. Set office scope if needed
7. Send the invite

### Step 4: User Accepts Second Invite
1. User receives invite email for Firm 2
2. User clicks invite link
3. Since email already exists, user sees "Sign In" option
4. User signs in with existing credentials
5. Data sharing modal appears (if accepting from second firm)
6. User selects data sharing option
7. User completes invite acceptance
8. User now has membership in both Firm 1 and Firm 2

### Step 5: Verify Multi-Firm Access
1. User logs in
2. User should see Account Switcher in top-right (if 2+ memberships)
3. Account Switcher shows both firms
4. User can switch between firms
5. Each firm shows correct role and status

---

## Method 2: Using Database Directly (Advanced)

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
   - `role` = First role (e.g., "firm_admin")
   - `status` = "active"
   - `office_scope` = Office IDs or "all" (if applicable)

### Step 3: Create Second Firm Membership
1. Find Firm 2 ID from `firms` table
2. Insert another membership record in same table
3. Set:
   - `user_id` = Same User ID
   - `firm_id` = Firm 2 ID
   - `role` = Different role (e.g., "tax_preparer" or "team_member" - both are the same)
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

## Method 3: Using API Endpoints (Programmatic)

### Step 1: Create User Account
1. Use registration API: `POST /api/user/register/`
2. Create user with email and password
3. Save user ID from response

### Step 2: Create First Firm Membership
1. Use invite API: `POST /api/firm-admin/staff/invite/`
2. Send invite to user's email for Firm 1
3. User accepts invite via invite link
4. Membership created with first role

### Step 3: Create Second Firm Membership
1. Switch to Firm 2 context (if needed)
2. Use invite API again: `POST /api/firm-admin/staff/invite/`
3. Send invite to SAME email for Firm 2
4. User accepts invite (will trigger data sharing flow)
5. Membership created with second role (e.g., "tax_preparer" if first was "firm_admin")

### Step 4: Verify Memberships
1. Use memberships API: `GET /api/user/memberships/`
2. Should return array with 2 memberships
3. Each membership has different firm_id and role

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
5. Set role (e.g., "Firm Admin")
6. Set status to "Active"
7. Save

### Step 4: Create Second Membership
1. Click "Add Firm Membership" again
2. Select SAME user
3. Select Firm 2
4. Set DIFFERENT role (e.g., "Tax Preparer" or "Team Member" - both are the same)
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
- [ ] You have admin access (Super Admin or Firm Admin)
- [ ] Test email address ready (e.g., `multifirm@test.com`)

### Steps
- [ ] Create user account OR use existing user
- [ ] Add user to Firm 1 with Role A (e.g., Firm Admin)
- [ ] User accepts Firm 1 invite
- [ ] Add same user to Firm 2 with Role B (e.g., Tax Preparer / Team Member)
- [ ] User accepts Firm 2 invite (data sharing modal appears)
- [ ] Verify both memberships in Account Switcher
- [ ] Test switching between firms

### Verification
- [ ] User can log in successfully
- [ ] Account Switcher visible in header
- [ ] Both firms listed in dropdown
- [ ] Each firm shows correct role
- [ ] Status badges display correctly
- [ ] Can switch between firms
- [ ] Dashboard changes based on selected firm
- [ ] Office scope applies correctly (if set)

---

## Common Issues & Solutions

### Issue: Account Switcher Not Showing
**Solution:**
- Verify user has 2+ active memberships
- Check API endpoint `/api/user/memberships/` returns data
- Check browser console for errors
- Verify memberships have `status = "active"`

### Issue: User Can't Accept Second Invite
**Solution:**
- Ensure user signs in first (existing email detected)
- Check invite token is valid
- Verify data sharing modal appears
- Complete data sharing selection

### Issue: Wrong Role After Switch
**Solution:**
- Verify membership records have correct roles
- Check API response includes role information
- Clear browser cache and retry
- Verify tokens are updated after switch

### Issue: Office Scope Not Working
**Solution:**
- Verify office scope set in membership record
- Check office IDs are valid
- Test office scope API endpoint
- Verify office scope display in Account Switcher

---

## Test User Examples

### Example 1: Firm Admin + Tax Preparer
- **Email:** `admin-taxpreparer@test.com`
- **Firm 1:** Role = "Firm Admin", Status = "Active"
- **Firm 2:** Role = "Tax Preparer" (or "Team Member"), Status = "Active"

### Example 2: Tax Preparer + Taxpayer
- **Email:** `taxpreparer-taxpayer@test.com`
- **Firm 1:** Role = "Tax Preparer" (or "Team Member"), Status = "Active"
- **Firm 2:** Role = "Taxpayer", Status = "Active"

### Example 3: Firm Admin + Firm Admin (Different Firms)
- **Email:** `admin-admin@test.com`
- **Firm 1:** Role = "Firm Admin", Status = "Active"
- **Firm 2:** Role = "Firm Admin", Status = "Active"

### Example 4: With Pending Status
- **Email:** `pending-active@test.com`
- **Firm 1:** Role = "Firm Admin", Status = "Active"
- **Firm 2:** Role = "Tax Preparer" (or "Team Member"), Status = "Pending"

---

## Notes

- **Email Must Match:** Same email address must be used for all memberships
- **Status Matters:** Only "active" memberships are fully functional
- **Role Permissions:** Each role has different dashboard routes and permissions
  - `firm_admin` → `/firmadmin` dashboard
  - `tax_preparer` / `team_member` → `/taxdashboard` dashboard
  - `taxpayer` / `client` → `/dashboard` dashboard
- **Terminology:** "Team Member" and "Tax Preparer" refer to the same role in the system
- **Office Scope:** Can be different for each firm membership
- **Data Sharing:** Only applies when accepting invite from second firm

