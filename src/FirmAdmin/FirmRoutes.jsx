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
import FinalizeSubscription from './Pages/SubscriptionManagement/FinalizeSubscription';
import Offices from './Pages/Offices';
import OfficeOverview from './Pages/Offices/OfficeOverview';
import OfficeDashboardView from './Pages/Offices/OfficeDashboardView';
import OfficeComparison from './Pages/Offices/OfficeComparison';
import SecurityCompliance from './Pages/SecurityCompliance';
import EmailTemplate from './Pages/Email-templates/EmailTemplate';
import CustomRolesManagement from './Pages/CustomRoles/CustomRolesManagement';

// Protected Route Component for Firm Admin
function FirmAdminProtectedRoute({ children }) {
  const location = useLocation();
  
  // Check if user is logged in
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Check user type
  const storage = getStorage();
  const userType = storage?.getItem("userType");

  console.log('Firm Admin Protected Route - User type:', userType);

  // Only allow admin access - if super_admin, redirect back to superadmin
  if (userType === 'super_admin' || userType === 'support_admin' || userType === 'billing_admin') {
    console.warn('Super admin detected in firm admin route, redirecting to superadmin');
    return <Navigate to="/superadmin" replace />;
  }

  // Only allow admin access
  if (userType !== 'admin') {
    console.warn('Unauthorized access attempt to Firm Admin Dashboard');
    // Redirect based on user type
    if (userType === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Check if admin user has no subscription plan (except on finalize-subscription page)
  // Handle both with and without base path - use includes for better matching
  const pathname = location.pathname;
  const isFinalizeSubscription = pathname.includes('/finalize-subscription');
  
  if (!isFinalizeSubscription) {
    const userDataStr = storage?.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.subscription_plan === null || userData.subscription_plan === undefined) {
          // Redirect to subscription finalization page
          return <Navigate to="/firmadmin/finalize-subscription" replace />;
        }
      } catch (error) {
        console.error('Error checking subscription plan:', error);
      }
    }
  }

  return children;
}

export default function FirmRoutes() {
  // Debug logging for production issues
  if (process.env.NODE_ENV === 'production') {
    console.log('[FirmRoutes] Initializing...');
    console.log('[FirmRoutes] Current pathname:', window.location.pathname);
  }

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
        <Route path="finalize-subscription" element={<FinalizeSubscription />} />
        <Route path="email-templates" element={<EmailTemplate />} />
        
        {/* System Administration routes */}
        <Route path="security" element={<SecurityCompliance />} />
        <Route path="settings" element={<FirmSettings />} />
        <Route path="support" element={<SupportCenter />} />
        <Route path="account-settings" element={<AccountSettings />} />
        <Route path="custom-roles" element={<CustomRolesManagement />} />
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
