
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Correct the import paths
import Dashboard from './pages/Dashboard';
import Signin from './pages/SignIn';
import Signup from './pages/SignUp';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import UpdateProfile from './pages/Profile';
import TwoFactorAuth from './pages/TwoFactorSetup';
import AdminDashboard from './pages/Dashboard';
import WebsiteBuilderDashboard from './pages/Dashboard';
import WebsiteEditor from './pages/WebsiteEditor';
import ProductManagement from './pages/Dashboard';
import ProductEditor from './pages/Dashboard';
import OrdersPage from './pages/Dashboard';
import MediaManager from './pages/MediaManager';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin } = useAuth();
  
  if (!currentUser || !isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function App() {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />
        <Route
          path="/update-profile"
          element={
            <AuthGuard>
              <UpdateProfile />
            </AuthGuard>
          }
        />
        <Route
          path="/two-factor-auth"
          element={
            <AuthGuard>
              <TwoFactorAuth />
            </AuthGuard>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
        
        <Route
          path="/dashboard/website-builder"
          element={
            <AuthGuard>
              <WebsiteBuilderDashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/website-editor/:websiteId"
          element={
            <AuthGuard>
              <WebsiteEditor />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/product-management"
          element={
            <AuthGuard>
              <ProductManagement />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/product-editor/:productId?"
          element={
            <AuthGuard>
              <ProductEditor />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            <AuthGuard>
              <OrdersPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/media"
          element={
            <AuthGuard>
              <MediaManager />
            </AuthGuard>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
