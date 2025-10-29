import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';

// Layouts
import FirmDashboardLayout from './Components/FirmDashboardLayout';

// Pages
import FirmDashboard from './Pages/FirmDashboard';
import StaffManagement from './Pages/StaffManagement';
import ClientManage from './Pages/ClientManagement/ClientManage';
import Analytics from './Pages/Analytics';
import Appointments from './Pages/Appointments';
import DocumentManagement from './Pages/DocumentManagement';
import Messages from './Pages/Messages';
import FirmSettings from './Pages/FirmSettings';
import SupportCenter from './Pages/SupportCenter';
import AccountSettings from './Pages/AccountSettings';

// Protected Route Component for Firm Admin
function FirmAdminProtectedRoute({ children }) {
  // Check if user is logged in
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check user type
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  console.log('Firm Admin Protected Route - User type:', userType);
  
  // Only allow admin access
  if (userType !== 'admin') {
    console.warn('Unauthorized access attempt to Firm Admin Dashboard');
    // Redirect based on user type
    if (userType === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else if (userType === 'super_admin') {
      return <Navigate to="/superadmin" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

export default function FirmRoutes() {
  return (
    <Routes>
      {/* Main firm admin dashboard route with layout */}
      <Route path="/" element={
        <FirmAdminProtectedRoute>
          <FirmDashboardLayout />
        </FirmAdminProtectedRoute>
      }>
        <Route index element={<FirmDashboard />} />
        <Route path="dashboard" element={<FirmDashboard />} />
        
        {/* Firm Management routes */}
        <Route path="staff" element={<StaffManagement />} />
        <Route path="clients" element={<ClientManage />} />
        <Route path="analytics" element={<Analytics />} />
        
        {/* Client Management routes */}
        <Route path="appointments" element={<Appointments />} />
        <Route path="documents" element={<DocumentManagement />} />
        <Route path="messages" element={<Messages />} />
        
        {/* System Administration routes */}
        <Route path="settings" element={<FirmSettings />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="account-settings" element={<AccountSettings />} />
        
        {/* Add more routes here as needed */}
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/firmadmin" replace />} />
      </Route>
    </Routes>
  );
}
