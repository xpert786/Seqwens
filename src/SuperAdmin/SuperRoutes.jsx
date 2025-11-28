import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';
import SuperDashboard from './Pages/SuperDashboard';
import SuperDashboardContent from './Pages/SuperDashboardContent';
import UserManagement from './Pages/UserManagement';
import UserDetail from './Pages/UserDetail';
import UsersDetails from './Pages/UsersDetails';
import Subscriptions from './Pages/Subscriptions';
import Analytics from './Pages/Analytics';
import AccountSettings from './Pages/AccountSettings/AccountSettings';
import SupportCenter from './Pages/SupportCenter/SupportCenter';
import FirmManagement from './Pages/FirmManagement';
import FirmDetails from './Pages/FirmDetails';
import Notifications from './Pages/AccountSettings/Notifications';

// Protected Route Component for Super Admin
function SuperAdminProtectedRoute({ children }) {
  // Check if user is logged in
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check user type
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  console.log('SuperAdmin Protected Route - User type:', userType);
  
  // Allow super_admin, support_admin, and billing_admin access
  if (userType !== 'super_admin' && userType !== 'support_admin' && userType !== 'billing_admin') {
    console.warn('Unauthorized access attempt to Super Admin');
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/taxdashboard" replace />;
    } else if (userType === 'client' || !userType) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

// Protected Route Component for Support Admin - Only allows support_admin and super_admin
function SupportAdminProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  if (userType !== 'support_admin' && userType !== 'super_admin') {
    console.warn('Unauthorized access attempt to Support Center');
    // Redirect to appropriate page based on role
    if (userType === 'billing_admin') {
      return <Navigate to="/superadmin/subscriptions" replace />;
    } else if (userType === 'admin') {
      return <Navigate to="/taxdashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

// Protected Route Component for Billing Admin - Only allows billing_admin and super_admin
function BillingAdminProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  if (userType !== 'billing_admin' && userType !== 'super_admin') {
    console.warn('Unauthorized access attempt to Subscriptions');
    // Redirect to appropriate page based on role
    if (userType === 'support_admin') {
      return <Navigate to="/superadmin/support" replace />;
    } else if (userType === 'admin') {
      return <Navigate to="/taxdashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

// Protected Route Component for Super Admin Only - Restricts support_admin and billing_admin
function SuperAdminOnlyProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  if (userType !== 'super_admin') {
    console.warn('Unauthorized access attempt - Super Admin only');
    // Redirect to appropriate page based on role
    if (userType === 'support_admin') {
      return <Navigate to="/superadmin/support" replace />;
    } else if (userType === 'billing_admin') {
      return <Navigate to="/superadmin/subscriptions" replace />;
    } else if (userType === 'admin') {
      return <Navigate to="/taxdashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

// Role-based redirect component for 404 pages
function RoleBasedRedirect() {
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  if (userType === 'support_admin') {
    return <Navigate to="/superadmin/support" replace />;
  } else if (userType === 'billing_admin') {
    return <Navigate to="/superadmin/subscriptions" replace />;
  } else if (userType === 'super_admin') {
    return <Navigate to="/superadmin" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default function SuperRoutes() {
  return (
    <Routes>
      {/* Main super admin dashboard route with layout */}
      <Route path="/" element={
        <SuperAdminProtectedRoute>
          <SuperDashboard />
        </SuperAdminProtectedRoute>
      }>
        <Route index element={<SuperDashboardContent />} />
        <Route path="dashboard" element={<SuperDashboardContent />} />
        {/* Super Admin Only Routes */}
        <Route path="users" element={
          <SuperAdminOnlyProtectedRoute>
            <UserManagement />
          </SuperAdminOnlyProtectedRoute>
        } />
        <Route path="users/:userId" element={
          <SuperAdminOnlyProtectedRoute>
            <UserDetail />
          </SuperAdminOnlyProtectedRoute>
        } />
        <Route path="users-details/:userId" element={
          <SuperAdminOnlyProtectedRoute>
            <UsersDetails />
          </SuperAdminOnlyProtectedRoute>
        } />
        {/* Billing Admin and Super Admin Routes */}
        <Route path="subscriptions" element={
          <BillingAdminProtectedRoute>
            <Subscriptions />
          </BillingAdminProtectedRoute>
        } />
        {/* Super Admin Only Routes */}
        <Route path="analytics" element={
          <SuperAdminOnlyProtectedRoute>
            <Analytics />
          </SuperAdminOnlyProtectedRoute>
        } />
        <Route path="system-settings" element={
          <SuperAdminOnlyProtectedRoute>
            <AccountSettings />
          </SuperAdminOnlyProtectedRoute>
        } />
        <Route path="notifications" element={
          <SuperAdminOnlyProtectedRoute>
            <Notifications />
          </SuperAdminOnlyProtectedRoute>
        } />
        {/* Support Admin and Super Admin Routes */}
        <Route path="support" element={
          <SupportAdminProtectedRoute>
            <SupportCenter />
          </SupportAdminProtectedRoute>
        } />
        {/* Super Admin Only Routes */}
        <Route path="firms" element={
          <SuperAdminOnlyProtectedRoute>
            <FirmManagement />
          </SuperAdminOnlyProtectedRoute>
        } />
        <Route path="firms/:firmId" element={
          <SuperAdminOnlyProtectedRoute>
            <FirmDetails />
          </SuperAdminOnlyProtectedRoute>
        } />
        
        {/* Add more routes here as needed */}
        {/* <Route path="reports" element={<ReportsPage />} /> */}
        {/* <Route path="messages" element={<MessagesPage />} /> */}
        {/* <Route path="logs" element={<LogsPage />} /> */}
        {/* <Route path="admin-settings" element={<AdminSettingsPage />} /> */}
        {/* <Route path="help" element={<HelpPage />} /> */}
        
        {/* 404 - Not Found - Redirect based on role */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Route>
    </Routes>
  );
}

