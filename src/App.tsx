import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MapScreen from "./pages/MapScreen";
import SOSScreen from "./pages/SOSScreen";
import HelpdeskScreen from "./pages/EnhancedHelpdeskScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SettingsScreen from "./pages/SettingsScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import NotFound from "./pages/NotFound";
import AddMembers from "./pages/AddMembers";
import QRScanResult from "./pages/QRScanResult";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

import { IonicLayout } from "./components/layout/ionic-layout";
import { TranslationProvider } from "./context/TranslationContext";
import { GroupProvider } from "./context/GroupContext";
import QRHandlerWrapper from "./components/QRHandlerWrapper";
import ExternalQRHandler from "./components/ExternalQRHandler";
import { requestAppPermissions } from "@/utils/permissions";

const queryClient = new QueryClient();

/* ✅ Route Guard Component (token-based) */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return token ? <>{children}</> : <Navigate to="/" replace />;
};

/* ✅ Admin Route Guard Component */
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const adminAuth = localStorage.getItem("adminAuth");
  const isAdminAuthenticated =
    adminAuth && JSON.parse(adminAuth).isAuthenticated;
  return isAdminAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin/login" replace />
  );
};

/* ✅ Main App */
const App = () => {
  useEffect(() => {
    requestAppPermissions().then(({ locationGranted, cameraGranted }) => {
      console.log("Permissions", { locationGranted, cameraGranted });
      // show UI hint if not granted
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TranslationProvider>
          <GroupProvider>
            <BrowserRouter>
              <QRHandlerWrapper />
              <ExternalQRHandler />
              <Routes>
                {/* 🔹 User Routes with Ionic Layout */}
                <Route element={<IonicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/map"
                    element={
                      <ProtectedRoute>
                        <MapScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sos"
                    element={
                      <ProtectedRoute>
                        <SOSScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/helpdesk"
                    element={
                      <ProtectedRoute>
                        <HelpdeskScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfileScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members/add"
                    element={
                      <ProtectedRoute>
                        <AddMembers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/qr-result"
                    element={
                      <ProtectedRoute>
                        <QRScanResult />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 🔹 Admin Routes without Ionic Layout */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />

                {/* 🔹 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </GroupProvider>
        </TranslationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
