import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';
import SuperDashboard from './Pages/SuperDashboard';
import SuperDashboardContent from './Pages/SuperDashboardContent';
import UserManagement from './Pages/UserManagement';
import UserDetail from './Pages/UserDetail';
import Subscriptions from './Pages/Subscriptions';
import Analytics from './Pages/Analytics';
import AccountSettings from './Pages/AccountSettings/AccountSettings';
import SupportCenter from './Pages/SupportCenter/SupportCenter';
import FirmManagement from './Pages/FirmManagement';
import FirmDetails from './Pages/FirmDetails';

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
  
  // Only allow super_admin access
  if (userType !== 'super_admin') {
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
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:userId" element={<UserDetail />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<AccountSettings />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="firms" element={<FirmManagement />} />
        <Route path="firms/:firmId" element={<FirmDetails />} />
        
        {/* Add more routes here as needed */}
        {/* <Route path="reports" element={<ReportsPage />} /> */}
        {/* <Route path="messages" element={<MessagesPage />} /> */}
        {/* <Route path="logs" element={<LogsPage />} /> */}
        {/* <Route path="admin-settings" element={<AdminSettingsPage />} /> */}
        {/* <Route path="help" element={<HelpPage />} /> */}
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/superadmin" replace />} />
      </Route>
    </Routes>
  );
}

