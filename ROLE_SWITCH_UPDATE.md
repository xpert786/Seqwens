# Role Switch Update Instructions

## Problem
When selecting a role in RoleSelectionScreen, the frontend doesn't call the backend API to switch roles. This causes 401 errors because the tokens are still for the old role.

## Solution
Update the `handleRoleSelection` function in `/home/deepak/Deepak/Projects/seqwens/seqwens_frontend/Seqwens/src/ClientOnboarding/components/RoleSelectionScreen.jsx`

Replace the function starting at line 121 with:

```javascript
const handleRoleSelection = async (role) => {
  if (isNavigating) return;

  setSelectedRole(role);
  setIsNavigating(true);

  const storage = getStorage();
  const user = userData;

  try {
    // Call backend API to switch role
    const { apiRequest } = await import('../utils/apiUtils');
    
    const response = await apiRequest('/user/switch-role/', 'POST', {
      role: role
    });

    if (!response.success) {
      console.error('Failed to switch role:', response.message);
      alert(`Failed to switch role: ${response.message}`);
      setIsNavigating(false);
      return;
    }

    // Update tokens if provided
    if (response.access_token && response.refresh_token) {
      const { setTokens } = await import('../utils/userUtils');
      setTokens(response.access_token, response.refresh_token, true);
    }

    // Update user data in storage
    if (response.user && storage) {
      storage.setItem("userData", JSON.stringify(response.user));
    }

    // Rest of the existing code for routing...
    let userType = role;
    let route = "";

    if (role === 'staff') {
      userType = 'tax_preparer';
    }

    if (role === 'firm') {
      userType = 'admin';
    }

    const customRole = user?.custom_role;
    if (customRole && (role === 'staff' || role === 'tax_preparer')) {
      if (storage) {
        storage.setItem("customRole", JSON.stringify(customRole));
      }
    }

    if (role === 'super_admin' || role === 'support_admin' || role === 'billing_admin') {
      route = "/superadmin";
    } else if (role === 'admin' || role === 'firm') {
      route = "/firmadmin";
    } else if (role === 'staff' || role === 'tax_preparer') {
      userType = 'tax_preparer';
      route = "/taxdashboard";
    } else if (role === 'client') {
      const isEmailVerified = user.is_email_verified;
      const isPhoneVerified = user.is_phone_verified;
      const isCompleted = user.is_completed;

      if (!isEmailVerified && !isPhoneVerified) {
        route = "/two-auth";
      } else {
        if (isCompleted) {
          route = "/dashboard";
        } else {
          route = "/dashboard-first";
        }
      }
    } else {
      route = "/dashboard";
    }

    if (storage) {
      storage.setItem("userType", userType);
    }

    setTimeout(() => {
      navigate(route, { replace: true });
    }, 300);
  } catch (error) {
    console.error('Error switching role:', error);
    alert(`Error switching role: ${error.message}`);
    setIsNavigating(false);
  }
};
```

## Key Changes
1. Made the function `async`
2. Added API call to `/user/switch-role/` endpoint
3. Updates tokens after successful role switch
4. Updates user data in storage
5. Handles errors gracefully
