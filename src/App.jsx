import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import React from "react";
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
import FirmSignup from "./ClientOnboarding/create-accounts/FirmSignup";
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
// Import FirmRoutes directly (not lazy) to avoid React initialization issues with Context providers
// The Context providers use createContext which needs React to be available when the module loads
import FirmRoutes from "./FirmAdmin/FirmRoutes";

// Error Boundary Component for lazy-loaded routes
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#EF4444', marginBottom: '10px' }}>Error Loading Page</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {this.state.error?.message || 'An error occurred while loading this page.'}
          </p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load large route components for code splitting with error handling
const TaxRoutes = lazy(() => {
  console.log('Loading TaxRoutes...');
  return import("./Taxpreparer/TaxRoutes").catch(err => {
    console.error('Error loading TaxRoutes:', err);
    throw err;
  });
});
const SuperRoutes = lazy(() => {
  console.log('Loading SuperRoutes...');
  return import("./SuperAdmin/SuperRoutes").catch(err => {
    console.error('Error loading SuperRoutes:', err);
    throw err;
  });
});
// Temporarily disabled lazy loading for FirmRoutes to debug
// const FirmRoutes = lazy(() => {
//   console.log('Loading FirmRoutes...');
//   return import("./FirmAdmin/FirmRoutes")
//     .then(module => {
//       console.log('FirmRoutes loaded successfully:', module);
//       return module;
//     })
//     .catch(err => {
//       console.error('Error loading FirmRoutes:', err);
//       console.error('Error stack:', err.stack);
//       throw err;
//     });
// });

// Loading component for lazy routes with timeout detection
const RouteLoader = () => {
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      console.warn('Route loading is taking longer than expected. This might indicate a problem.');
    }, 10000); // Show warning after 10 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '16px',
      color: '#666'
    }}>
      <div>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px'
        }}></div>
        <p>Loading...</p>
        {showTimeout && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '10px' }}>
              Loading is taking longer than expected.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
        <Route path="/firm-signup" element={
          <AuthRedirect>
            <FirmSignup />
          </AuthRedirect>
        } />

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
          <RouteErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <TaxRoutes />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* Super Admin Routes - No authentication required */}
        <Route path="/superadmin/*" element={
          <RouteErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <SuperRoutes />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* Firm Admin Routes - No authentication required */}
        {/* FirmRoutes is imported directly (not lazy) to avoid React initialization issues */}
        <Route path="/firmadmin/*" element={
          <RouteErrorBoundary>
            <FirmRoutes />
          </RouteErrorBoundary>
        } />
      </Routes>
    </FeedbackWrapper>
  );
}






