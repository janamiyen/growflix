import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Checkout from "./pages/Checkout";
import PaymentClaim from "./pages/PaymentClaim";
import Login from "./pages/Login";
import AppPage from "./pages/App";
import CourseView from "./pages/CourseView";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminUsers from "./pages/admin/AdminUsers";

// Guards
import PaywallGate from "./components/guards/PaywallGate";
import AdminGate from "./components/guards/AdminGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/cursos" element={<Courses />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pago" element={<PaymentClaim />} />
            <Route path="/acceso" element={<Login />} />

            {/* Protected Routes (Subscriber) */}
            <Route
              path="/app"
              element={
                <PaywallGate>
                  <AppPage />
                </PaywallGate>
              }
            />
            <Route
              path="/app/curso/:slug"
              element={
                <PaywallGate>
                  <CourseView />
                </PaywallGate>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminLayout />
                </AdminGate>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="cursos" element={<AdminCourses />} />
              <Route path="cursos/:id" element={<AdminCourseEdit />} />
              <Route path="pagos" element={<AdminPayments />} />
              <Route path="usuarios" element={<AdminUsers />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
