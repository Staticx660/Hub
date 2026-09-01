import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import DeptAdminRoute from '@/components/DeptAdminRoute';
import CADAdminRoute from '@/components/CADAdminRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import CADLayout from '@/components/layout/CADLayout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import CAD from '@/pages/CAD';
import CADDepartments from '@/pages/CADDepartments';
import CADDepartmentDetail from '@/pages/CADDepartmentDetail';
import CADMDT from '@/pages/CADMDT';
import CADCivilian from '@/pages/CADCivilian';
import CADReports from '@/pages/CADReports';
import CADAdmin from '@/pages/CADAdmin';
import CADSettings from '@/pages/CADSettings';
import CADPersonnel from '@/pages/CADPersonnel';
import KeybindConfig from '@/pages/KeybindConfig';
import DepartmentArchive from '@/pages/DepartmentArchive';
import DepartmentBoard from '@/pages/DepartmentBoard';
import EMSBoard from '@/pages/EMSBoard';
import FireBoard from '@/pages/FireBoard';
import Departments from '@/pages/Departments';
import DepartmentDetail from '@/pages/DepartmentDetail';
import Roster from '@/pages/Roster';
import Shifts from '@/pages/Shifts';
import LOACalendar from '@/pages/LOACalendar';
import OrgChart from '@/pages/OrgChart';
import Certifications from '@/pages/Certifications';
import Documents from '@/pages/Documents';
import Vehicles from '@/pages/Vehicles';
import Uniforms from '@/pages/Uniforms';
import Settings from '@/pages/Settings';
import CivilianDashboard from '@/pages/CivilianDashboard';
import MyRecords from '@/pages/MyRecords';
import SystemLogs from '@/pages/SystemLogs';
import Help from '@/pages/Help';
import MDTPreview from '@/pages/MDTPreview';
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { useUITheme } from "@/hooks/useUITheme";

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useCommunityBranding();
  useUITheme();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Landing - no sidebar */}
        <Route path="/" element={<Landing />} />

        {/* Roster section */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loa" element={<LOACalendar />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/org-chart" element={<OrgChart />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/uniforms" element={<Uniforms />} />
          {/* Department admins manage their own departments */}
          <Route element={<DeptAdminRoute />}>
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:id" element={<DepartmentDetail />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/roster" element={<Roster />} />
          </Route>
        </Route>

        {/* CAD section - with sidebar */}
        <Route element={<CADLayout />}>
          <Route path="/cad" element={<CADDepartments />} />
          <Route path="/cad/departments/:id" element={<CADDepartmentDetail />} />
          <Route path="/cad/reports" element={<CADReports />} />
          <Route path="/civilian-dashboard" element={<CivilianDashboard />} />
          <Route path="/my-records" element={<MyRecords />} />
          <Route path="/keybinds" element={<KeybindConfig />} />
          <Route path="/department-archive" element={<DepartmentArchive />} />
          <Route path="/cad-settings" element={<CADSettings />} />
          <Route element={<AdminRoute />}>
            <Route path="/cad-personnel" element={<CADPersonnel />} />
            <Route path="/system-logs" element={<SystemLogs />} />
          </Route>
        </Route>

        {/* Full-screen CAD apps - no sidebar, fills viewport */}
        <Route path="/cad/dispatch" element={<CAD />} />
        <Route path="/cad/mdt/:deptId" element={<CADMDT />} />
        <Route path="/cad/board/:deptId" element={<DepartmentBoard />} />
        <Route path="/cad/ems/:deptId" element={<EMSBoard />} />
        <Route path="/cad/fire/:deptId" element={<FireBoard />} />
        <Route path="/cad/civilian/:deptId" element={<CADCivilian />} />

        {/* New MDT design language preview */}
        <Route path="/mdt-preview" element={<MDTPreview />} />

        {/* Full-screen admin panel - dedicated sidebar */}
        <Route element={<CADAdminRoute />}>
          <Route path="/cad/admin" element={<CADAdmin />} />
        </Route>

        {/* Settings - accessible to all authenticated users */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App