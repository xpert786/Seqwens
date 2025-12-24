import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
// import Homepage from "./pages/Homepage";
import Home from "./pages/Home/Home";
import DashboardLayout from "./ClientOnboarding/components/DashboardLayout";
import ESignatureModal from './ClientOnboarding/components/ESignatureModal';
import NotificationPanel from './ClientOnboarding/components/Notifications/NotificationPanel';
import Dashboard from "./ClientOnboarding/pages/Dashboard";
import MyDocuments from "./ClientOnboarding/pages/MyDocuments";
import DataIntake from "./ClientOnboarding/pages/DataIntake";
import Invoices from "./ClientOnboarding/pages/Invoices";
import PaymentSuccess from "./ClientOnboarding/pages/PaymentSuccess";
import PaymentCancelled from "./ClientOnboarding/pages/PaymentCancelled";
import Messages from "./ClientOnboarding/pages/Messages";
import Appointments from "./ClientOnboarding/pages/Appointments";
import Accounts from "./ClientOnboarding/pages/Accounts";
import Helper from "./ClientOnboarding/pages/Helper";
import DashboardFirst from "./ClientOnboarding/pages/DashboardFirst";
import DashboardRouter from "./ClientOnboarding/components/DashboardRouter";
import CreateAccount from "./ClientOnboarding/create-accounts/CreateAccount";
import PersonalInfo from "./ClientOnboarding/create-accounts/PersonalInfo";
import Login from "./ClientOnboarding/Login-setup/Login";
import ForgotPassword from "./ClientOnboarding/Login-setup/ForgotPassword";
import OtpVerification from "./ClientOnboarding/Login-setup/OtpVerification";
import SetNewPassword from "./ClientOnboarding/Login-setup/SetNewPassword";
import TwoFactorAuth from "./ClientOnboarding/Login-setup/TwoFactorAuth";
import VerifyEmail from "./ClientOnboarding/Login-setup/VerifyEmail";
import VerifyPhone from "./ClientOnboarding/Login-setup/VerifyPhone";
import AcceptInvite from "./ClientOnboarding/Login-setup/AcceptInvite";
import ProtectedRoute from "./ClientOnboarding/components/ProtectedRoute";
import AuthRedirect from "./ClientOnboarding/components/AuthRedirect";
import RootAuthCheck from "./ClientOnboarding/components/RootAuthCheck";
import RoleSelectionScreen from "./ClientOnboarding/components/RoleSelectionScreen";
import TailwindTest from "./TailwindTest";
import FeedbackWrapper from "./ClientOnboarding/components/FeedbackWrapper";

// Lazy load large route components for code splitting
const TaxRoutes = lazy(() => import("./Taxpreparer/TaxRoutes"));
const SuperRoutes = lazy(() => import("./SuperAdmin/SuperRoutes"));
const FirmRoutes = lazy(() => import("./FirmAdmin/FirmRoutes"));

// Loading component for lazy routes
const RouteLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '16px',
    color: '#666'
  }}>
    Loading...
  </div>
);

export default function App() {
  return (
    <FeedbackWrapper>
      <Routes>
        {/* Old users login */}
        <Route path="/login" element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        <Route path="/two-auth" element={<TwoFactorAuth />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-phone" element={<VerifyPhone />} />
        <Route path="/invite" element={<AcceptInvite />} />
        <Route path="/select-role" element={<RoleSelectionScreen />} />
        {/* Tailwind test route */}
        <Route path="/tw-test" element={<TailwindTest />} />
        {/* Root path - Home page (public landing page) */}
        <Route path="/" element={<Home />} />
        
        {/* Authenticated users redirect route */}
        <Route path="/home-redirect" element={<RootAuthCheck />} />
        <Route path="/create-account" element={
          <AuthRedirect>
            <CreateAccount />
          </AuthRedirect>
        } />
        <Route path="/personal-info" element={<PersonalInfo />} />

        {/* Protected Routes - Top level dashboard routes */}
        <Route path="/dataintake" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DataIntake />} />
        </Route>

        <Route path="/documents" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<MyDocuments />} />
        </Route>

        <Route path="/invoices" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Invoices />} />
          <Route path=":invoiceId/payment-success" element={<PaymentSuccess />} />
          <Route path=":invoiceId/payment-cancelled" element={<PaymentCancelled />} />
        </Route>

        <Route path="/messages" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Messages />} />
        </Route>

        <Route path="/appointments" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Appointments />} />
        </Route>

        <Route path="/accounts" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Accounts />} />
        </Route>

        <Route path="/helpers" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Helper />} />
        </Route>

        {/* Protected Routes */}
        {/* Dashboard First Route - for new/incomplete users */}
        <Route
          path="/dashboard-first"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardFirst />} />
        </Route>

        {/* Client Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<DashboardRouter />}
          />
          <Route path="documents" element={<MyDocuments />} />
          <Route path="dataintake" element={<DataIntake />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="messages" element={<Messages />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="helpers" element={<Helper />} />
          <Route path="notifications" element={<NotificationPanel />} />
          <Route path="esignature" element={<ESignatureModal />} />
        </Route>

        {/* Tax Preparer Routes - No authentication required */}
        <Route path="/taxdashboard/*" element={
          <Suspense fallback={<RouteLoader />}>
            <TaxRoutes />
          </Suspense>
        } />

        {/* Super Admin Routes - No authentication required */}
        <Route path="/superadmin/*" element={
          <Suspense fallback={<RouteLoader />}>
            <SuperRoutes />
          </Suspense>
        } />

        {/* Firm Admin Routes - No authentication required */}
        <Route path="/firmadmin/*" element={
          <Suspense fallback={<RouteLoader />}>
            <FirmRoutes />
          </Suspense>
        } />
      </Routes>
    </FeedbackWrapper>
  );
}






