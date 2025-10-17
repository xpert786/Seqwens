import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuperDashboard from './Pages/SuperDashboard';
import SuperDashboardContent from './Pages/SuperDashboardContent';
import UserManagement from './Pages/UserManagement';
import UserDetail from './Pages/UserDetail';
import Subscriptions from './Pages/Subscriptions';
import Analytics from './Pages/Analytics';

export default function SuperRoutes() {
  return (
    <Routes>
      {/* Main super admin dashboard route with layout */}
      <Route path="/" element={<SuperDashboard />}>
        <Route index element={<SuperDashboardContent />} />
        <Route path="dashboard" element={<SuperDashboardContent />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:userId" element={<UserDetail />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="analytics" element={<Analytics />} />
        
        {/* Add more routes here as needed */}
        {/* <Route path="settings" element={<SettingsPage />} /> */}
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

