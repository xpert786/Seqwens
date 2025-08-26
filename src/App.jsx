import { Routes, Route } from "react-router-dom";
// import Homepage from "./pages/Homepage";
import DashboardLayout from "./components/DashboardLayout";
import ESignatureModal from './components/ESignatureModal';
import NotificationPanel from './components/Notifications/NotificationPanel';
import Dashboard from "./pages/Dashboard";
import MyDocuments from "./pages/MyDocuments";
import DataIntake from "./pages/DataIntake";
import Invoices from "./pages/Invoices";
import Messages from "./pages/Messages";
import Appointments from "./pages/Appointments";
import Accounts from "./pages/Accounts";
import Helper from "./pages/Helper";
import DashboardFirst from "./pages/DashboardFirst";
import CreateAccount from "./create-accounts/CreateAccount";
import PersonalInfo from "./create-accounts/PersonalInfo";
import Login from "./Login-setup/Login";
import ForgotPassword from "./Login-setup/ForgotPassword";
import OtpVerification from "./Login-setup/OtpVerification";
import SetNewPassword from "./Login-setup/SetNewPassword";
import TwoFactorAuth from "./Login-setup/TwoFactorAuth";
import VerifyEmail from "./Login-setup/VerifyEmail";
import VerifyPhone from "./Login-setup/VerifyPhone";
import ProtectedRoute from "./components/ProtectedRoute";
import { isNewUser } from "../src/utils/userUtils";



export default function App() {
  return (
    <Routes>
    
      {/* <Route path="/" element={<Homepage />} /> */}


      {/* Old users login */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
      <Route path="/set-new-password" element={<SetNewPassword />} />
      <Route path="/two-auth" element={<  TwoFactorAuth />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-phone" element={<VerifyPhone />} />
   



      {/* New users */}
      <Route path="/" element={<CreateAccount />} />
      <Route path="/personal-info" element={<PersonalInfo />} />
      
      

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Clients dashboard */}
        <Route
          path="dashboard"
          element={
            isNewUser()
              ? <DashboardFirst />
              : <Dashboard />
          }
        />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard-first" element={<DashboardFirst />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="dataintake" element={<DataIntake />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="messages" element={<Messages />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="helpers" element={<Helper />} />


        {/* iconbell click notifications */}
        <Route path="/notifications" element={<NotificationPanel />} />
        <Route path="/esignature" element={<ESignatureModal />} />
        
         </Route>

    </Routes>
  );
}






