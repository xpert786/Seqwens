import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';
import { hasPermissionGroup, isFeatureVisible, hasTaxPreparerPermission } from '../ClientOnboarding/utils/privilegeUtils';

// Layouts
import TaxDashboardLayout from './component/TaxDashboardLayout';

// Pages
import TaxDashboard from './pages/TaxDashboard';
import TaxDashboardFirst from './pages/TaxDashboardFirst';
import DocumentsPage from './pages/Documents/DocumentsPage';
import AllDocumentsPage from './pages/Documents/AllDocumentsPage';
import ArchivedFilesPage from './pages/Documents/ArchivedFilesPage';
import DocumentManager from './pages/Documents/DocumentManager';
import TasksPage from './pages/Tasks/TasksPage';
import MessagePage from './pages/Messages/Messages';
import MyClients from './pages/MyClients/MyClients';
import ClientDetails from './pages/MyClients/ClientDetails';
import ClientDocuments from './pages/MyClients/ClientDocuments';
import InvoicesPage from './pages/MyClients/InvoicesPage';
import SchedulePage from './pages/MyClients/SchedulePage';
import ClientESignLogs from './pages/MyClients/ClientESignLogs';
import CalendarPage from './pages/Calender/Calender';
import AccountSettings from './pages/AccountSettings/AccountSettings';
import ESignatureDashboard from './pages/ESignature/ESignatureDashboard';
import TaxPreparerBilling from './pages/Billing/TaxPreparerBilling';

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
  
  // Only allow admin, super_admin, and tax_preparer access
  if (userType !== 'admin' && userType !== 'super_admin' && userType !== 'tax_preparer') {
    console.warn('Unauthorized access attempt to Tax Dashboard');
    // Redirect based on user type
    if (userType === 'client' || !userType) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
}

// Permission-based route protection component
function PermissionProtectedRoute({ children, requiredGroup }) {
  // If no custom role, allow access (default behavior)
  const storage = getStorage();
  const userDataStr = storage?.getItem("userData");
  if (!userDataStr) {
    return children;
  }
  
  try {
    const userData = JSON.parse(userDataStr);
    const customRole = userData?.custom_role;
    
    // If no custom role, allow access
    if (!customRole || !customRole.permission_groups) {
      return children;
    }
    
    // full_control grants access to everything
    if (customRole.permission_groups.includes('full_control')) {
      return children;
    }
    
    // Check if user has the required permission group
    if (requiredGroup && !hasPermissionGroup(requiredGroup)) {
      return <Navigate to="/taxdashboard" replace />;
    }
    
    return children;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return children; // Allow access on error
  }
}

// Tax Preparer Permission-based route protection component
function TaxPreparerPermissionRoute({ children, requiredPermission }) {
  // Check if user has the specific tax preparer permission
  if (requiredPermission && !hasTaxPreparerPermission(requiredPermission)) {
    return <Navigate to="/taxdashboard" replace />;
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
        <Route path="documents" element={
          <PermissionProtectedRoute requiredGroup="document">
            <Outlet />
          </PermissionProtectedRoute>
        }>
          <Route index element={<DocumentsPage />} />
          <Route path="manager" element={<DocumentManager />} />
          <Route path="all" element={<AllDocumentsPage />}>
            <Route path=":documentId" element={<AllDocumentsPage />} />
          </Route>
          <Route path="archived" element={<ArchivedFilesPage />} />
        </Route>
         
        {/* Tasks */}
        <Route path="tasks" element={
          <PermissionProtectedRoute requiredGroup="todo">
            <TasksPage />
          </PermissionProtectedRoute>
        } />
        
        {/* Messages */}
        <Route path="messages" element={
          <PermissionProtectedRoute requiredGroup="messages">
            <MessagePage />
          </PermissionProtectedRoute>
        } />
        
        {/* Calendar */}
        <Route path="calendar" element={
          <PermissionProtectedRoute requiredGroup="appointment">
            <CalendarPage />
          </PermissionProtectedRoute>
        } />
        
        {/* E-Signature Dashboard */}
        <Route path="e-signatures" element={
          <PermissionProtectedRoute requiredGroup="esign">
            <ESignatureDashboard />
          </PermissionProtectedRoute>
        } />
        
        {/* Account Settings */}
        <Route path="account" element={<AccountSettings />} />
        <Route path="settings" element={<AccountSettings />} />
        
        {/* Invoices */}
        <Route path="invoices" element={<InvoicesPage />} />
        
        {/* Billing & Invoicing - Only accessible if user has create_invoices permission */}
        <Route 
          path="billing" 
          element={
            <TaxPreparerPermissionRoute requiredPermission="create_invoices">
              <TaxPreparerBilling />
            </TaxPreparerPermissionRoute>
          } 
        />
        
        {/* My Clients */}
        <Route path="clients" element={
          <PermissionProtectedRoute requiredGroup="client">
            <Outlet />
          </PermissionProtectedRoute>
        }>
          <Route index element={<MyClients />} />
          <Route path=":clientId" element={<ClientDetails />}>
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="esign-logs" element={<ClientESignLogs />} />
          </Route>
        </Route>
        
        {/* Add more routes here as needed */}
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/taxdashboard" replace />} />
      </Route>
    </Routes>
  );
}
