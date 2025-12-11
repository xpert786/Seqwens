import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn, getStorage, setTokens } from '../ClientOnboarding/utils/userUtils';

// Layouts
import FirmDashboardLayout from './Components/FirmDashboardLayout';
import { FirmPortalColorsProvider } from './Context/FirmPortalColorsContext';
import { FirmSettingsProvider } from './Context/FirmSettingsContext';

// Pages
import OverviewFirm from './Pages/OverView/OverviewFirm';
import StaffManagement from './Pages/Staff/StaffManagement';
import StaffDetails from './Pages/Staff/StaffDetails';
import ClientManage from './Pages/ClientManagement/ClientManage';
import ClientDetails from './Pages/ClientManagement/ClientDetails';
import Analytics from './Pages/Analytics/Analytics';
import DocumentManagement from './Pages/DocumentManagement';
import FolderContents from './Pages/DocumentManagement/FolderContents';
import PdfViewer from './Pages/DocumentManagement/PdfViewer';

import Messages from './Pages/messages/Message';
import ESignatureManagement from './Pages/ESignatureManagement';
import FirmSettings from './Pages/FirmSetting/FirmSetting';
import SupportCenter from './Pages/SupportCenter';
import AccountSettings from './Pages/AccountSettings';
import TaskManagementMain from './Pages/TaskManagement/TaskManagementMain';
import TaskDetails from './Pages/TaskManagement/TaskDetails';
import BillingManagement from './Pages/Billing/BillingManagement';
import InvoiceDetails from './Pages/Billing/InvoiceDetails';
import SchedulingCalendar from './Pages/Scheduling & calendar/SchedulingCalendar';
import Appointments from './Pages/Scheduling & calendar/Appointments';
import Staff from './Pages/Scheduling & calendar/Staff';
import Feature from './Pages/Scheduling & calendar/Feature';
import WorkflowTemp from './Pages/Workflow-temp/WorkflowTemp';
import WorkflowManagement from './Pages/Workflow/WorkflowManagement';
import WorkflowInstanceView from './Pages/Workflow/WorkflowInstanceView';
import SubscriptionManagement from './Pages/SubscriptionManagement/SubscriptionManagement';
import Offices from './Pages/Offices';
import OfficeOverview from './Pages/Offices/OfficeOverview';
import OfficeDashboardView from './Pages/Offices/OfficeDashboardView';
import OfficeComparison from './Pages/Offices/OfficeComparison';
import SecurityCompliance from './Pages/SecurityCompliance';
import EmailTemplate from './Pages/Email-templates/EmailTemplate';

// Protected Route Component for Firm Admin
function FirmAdminProtectedRoute({ children }) {
  const location = useLocation();
  
  // Check for superadmin-initiated login BEFORE checking authentication
  const params = new URLSearchParams(location.search);
  const isSuperadminLogin = params.get('superadmin_login') === 'true';
  
  if (isSuperadminLogin) {
    // Check for firm login data in localStorage
    const firmLoginDataStr = localStorage.getItem('firmLoginData');
    
    if (firmLoginDataStr) {
      try {
        const loginData = JSON.parse(firmLoginDataStr);
        const { access_token, refresh_token, user } = loginData;
        
        if (access_token && refresh_token && user) {
          // Store tokens and user data for this tab
          setTokens(access_token, refresh_token, true);
          localStorage.setItem('userData', JSON.stringify(user));
          localStorage.setItem('userType', user.user_type || 'admin');
          localStorage.setItem('isLoggedIn', 'true');
          
          // Also set in sessionStorage to ensure it's available
          sessionStorage.setItem('accessToken', access_token);
          sessionStorage.setItem('refreshToken', refresh_token);
          sessionStorage.setItem('userData', JSON.stringify(user));
          sessionStorage.setItem('userType', user.user_type || 'admin');
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('rememberMe', 'true');
          
          // Clear the temporary login data
          localStorage.removeItem('firmLoginData');
          
          // Remove query parameters from URL
          window.history.replaceState({}, '', location.pathname);
        }
      } catch (error) {
        console.error('Error processing firm login data:', error);
      }
    }
  }
  
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
    <FirmPortalColorsProvider>
      <FirmSettingsProvider>
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
        <Route path="staff/:id" element={<StaffDetails />} />
        <Route path="clients" element={<ClientManage />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="tasks" element={<TaskManagementMain />} />
        <Route path="tasks/:id" element={<TaskDetails />} />

        {/* Client Management routes */}
        <Route path="calendar" element={<SchedulingCalendar />} />
        <Route path="calendar/appointments" element={<Appointments />} />
        <Route path="calendar/features" element={<Feature />} />
        <Route path="calendar/staff" element={<Staff />} />
        <Route path="documents" element={<DocumentManagement />}>
          <Route path="folder/:folderId" element={<FolderContents />}>
            <Route path="document/:documentId" element={<PdfViewer />} />
          </Route>
        </Route>
        <Route path="esignature" element={<ESignatureManagement />} />
        <Route path="messages" element={<Messages />} />

        {/* Business Operations routes */}
        <Route path="billing" element={<BillingManagement />} />
        <Route path="billing/:invoiceId" element={<InvoiceDetails />} />
        <Route path="workflow" element={<WorkflowManagement />} />
        <Route path="workflow/instances/:instanceId" element={<WorkflowInstanceView />} />
        <Route path="subscription" element={<SubscriptionManagement />} />
        <Route path="email-templates" element={<EmailTemplate />} />
        
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
    </FirmSettingsProvider>
    </FirmPortalColorsProvider>
  );
}
