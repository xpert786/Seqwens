import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';

// Layouts
import TaxDashboardLayout from './component/TaxDashboardLayout';

// Pages
import TaxDashboard from './pages/TaxDashboard';
import TaxDashboardFirst from './pages/TaxDashboardFirst';
import DocumentsPage from './pages/Documents/DocumentsPage';
import AllDocumentsPage from './pages/Documents/AllDocumentsPage';
import ArchivedFilesPage from './pages/Documents/ArchivedFilesPage';
import TasksPage from './pages/Tasks/TasksPage';
import MessagePage from './pages/Messages/Messages';
import MyClients from './pages/MyClients/MyClients';
import ClientDetails from './pages/MyClients/ClientDetails';
import ClientDocuments from './pages/MyClients/ClientDocuments';
import InvoicesPage from './pages/MyClients/InvoicesPage';
import SchedulePage from './pages/MyClients/SchedulePage';
import CalendarPage from './pages/Calender/Calender';
import AccountSettings from './pages/AccountSettings/AccountSettings';

// Protected Route Component for Admin/Tax Preparer
function AdminProtectedRoute({ children }) {
  // Check if user is logged in
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  // Check user type
  const storage = getStorage();
  const userType = storage?.getItem("userType");
  
  console.log('Admin Protected Route - User type:', userType);
  
  // Only allow admin and super_admin access
  if (userType !== 'admin' && userType !== 'super_admin') {
    console.warn('Unauthorized access attempt to Admin Dashboard');
    // Redirect based on user type
    if (userType === 'client' || !userType) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

export default function TaxRoutes() {
  return (
    <Routes>
      {/* Main tax dashboard route with layout */}
      <Route path="/" element={
        <AdminProtectedRoute>
          <TaxDashboardLayout />
        </AdminProtectedRoute>
      }>
        <Route index element={<TaxDashboard />} />
        <Route path="dashboard" element={<TaxDashboard />} />
        <Route path="dashboard-first" element={<TaxDashboardFirst />} />
        
        {/* Documents routes */}
        <Route path="documents">
          <Route index element={<DocumentsPage />} />
          <Route path="all" element={<AllDocumentsPage />}>
            <Route path=":documentId" element={<AllDocumentsPage />} />
          </Route>
          <Route path="archived" element={<ArchivedFilesPage />} />
        </Route>
         
        {/* Tasks */}
        <Route path="tasks" element={<TasksPage />} />
        
        {/* Messages */}
        <Route path="messages" element={<MessagePage />} />
        
        {/* Calendar */}
        <Route path="calendar" element={<CalendarPage />} />
        
        {/* Account Settings */}
        <Route path="account" element={<AccountSettings />} />
        <Route path="settings" element={<AccountSettings />} />
        
        {/* Invoices */}
        <Route path="invoices" element={<InvoicesPage />} />
        
        {/* My Clients */}
        <Route path="clients">
          <Route index element={<MyClients />} />
          <Route path=":clientId" element={<ClientDetails />}>
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="schedule" element={<SchedulePage />} />
          </Route>
        </Route>
        
        {/* Add more routes here as needed */}
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/taxdashboard" replace />} />
      </Route>
    </Routes>
  );
}
