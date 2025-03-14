
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Verification from "./pages/Verification";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import GoogleCallback from "./pages/GoogleCallback";
import DiscordCallback from "./pages/DiscordCallback";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import AuthGuard from "./components/AuthGuard";
import WebsiteEditor from "./pages/WebsiteEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <>
              <Navbar />
              <Index />
            </>
          } />
          
          {/* Authentifizierungsrouten */}
          <Route path="/sign-in" element={
            <AuthGuard requireAuth={false} redirectTo="/">
              <SignIn />
            </AuthGuard>
          } />
          <Route path="/sign-up" element={
            <AuthGuard requireAuth={false} redirectTo="/">
              <SignUp />
            </AuthGuard>
          } />
          <Route path="/forgot-password" element={
            <AuthGuard requireAuth={false} redirectTo="/">
              <ForgotPassword />
            </AuthGuard>
          } />
          <Route path="/verification" element={<Verification />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route path="/auth/discord-callback" element={<DiscordCallback />} />
          <Route path="/two-factor-setup" element={
            <AuthGuard requireAuth={true}>
              <TwoFactorSetup />
            </AuthGuard>
          } />
          
          {/* Checkout Route */}
          <Route path="/checkout" element={
            <AuthGuard requireAuth={true}>
              <Checkout />
            </AuthGuard>
          } />
          
          {/* Profile Route */}
          <Route path="/profile" element={
            <AuthGuard requireAuth={true}>
              <>
                <Navbar />
                <Profile />
              </>
            </AuthGuard>
          } />
          
          {/* Website Editor */}
          <Route path="/dashboard/website-editor/:websiteId" element={
            <AuthGuard requireAuth={true}>
              <WebsiteEditor />
            </AuthGuard>
          } />
          
          {/* Geschützte Routen */}
          <Route path="/dashboard" element={
            <AuthGuard requireAuth={true}>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="/dashboard/:tab" element={
            <AuthGuard requireAuth={true}>
              <Dashboard />
            </AuthGuard>
          } />
          
          {/* Redirect from old dashboard path to new dashboard path */}
          <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
