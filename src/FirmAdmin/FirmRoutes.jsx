import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getStorage } from '../ClientOnboarding/utils/userUtils';

// Layouts
import FirmDashboardLayout from './Components/FirmDashboardLayout';

// Pages
import OverviewFirm from './Pages/OverView/OverviewFirm';
import StaffManagement from './Pages/Staff/StaffManagement';
import ClientManage from './Pages/ClientManagement/ClientManage';
import Analytics from './Pages/Analytics';
import Appointments from './Pages/Appointments';
import DocumentManagement from './Pages/DocumentManagement';
import FolderContents from './Pages/DocumentManagement/FolderContents';
import PdfViewer from './Pages/DocumentManagement/PdfViewer';
import ESignatureManagement from './Pages/ESignatureManagement';
import Messages from './Pages/Messages';
import FirmSettings from './Pages/FirmSettings';
import SupportCenter from './Pages/SupportCenter';
import AccountSettings from './Pages/AccountSettings';
import TaskManagementMain from './Pages/TaskManagement/TaskManagementMain';
import Offices from './Pages/Offices';
import OfficeOverview from './Pages/Offices/OfficeOverview';
import OfficeDashboardView from './Pages/Offices/OfficeDashboardView';
import OfficeComparison from './Pages/Offices/OfficeComparison';
import SecurityCompliance from './Pages/SecurityCompliance';

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
        <Route index element={<OverviewFirm />} />
        <Route path="dashboard" element={<OverviewFirm />} />
        
        {/* Overview routes */}
        <Route path="overview" element={<OverviewFirm />} />
        
        {/* Firm Management routes */}
        <Route path="staff" element={<StaffManagement />} />
        <Route path="clients" element={<ClientManage />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="tasks" element={<TaskManagementMain />} />
        
        {/* Client Management routes */}
        <Route path="appointments" element={<Appointments />} />
        <Route path="documents" element={<DocumentManagement />}>
          <Route path="folder/:folderId" element={<FolderContents />}>
            <Route path="document/:documentId" element={<PdfViewer />} />
          </Route>
        </Route>
        <Route path="esignature" element={<ESignatureManagement />} />
        <Route path="messages" element={<Messages />} />
        
        {/* System Administration routes */}
        <Route path="security" element={<SecurityCompliance />} />
        <Route path="settings" element={<FirmSettings />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="account-settings" element={<AccountSettings />} />
        <Route path="offices" element={<Offices />} />
        <Route path="offices/:officeId" element={<OfficeOverview />} />
        <Route path="offices/:officeId/dashboard-view" element={<OfficeDashboardView />} />
        <Route path="offices/:officeId/compare" element={<OfficeComparison />} />
        
        {/* Add more routes here as needed */}
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/firmadmin" replace />} />
      </Route>
    </Routes>
  );
}
