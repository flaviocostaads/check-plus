import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import VehicleManagement from "./pages/VehicleManagement";
import ChecklistManagement from "./pages/ChecklistManagement";
import InspectionHistory from "./pages/InspectionHistory";
import UserManagement from "./pages/UserManagement";
import UserManagementNew from "./pages/UserManagementNew";
import Settings from "./pages/Settings";
import { Reports } from "./pages/Reports";
import NewInspection from "./pages/NewInspection";
import InspectionInterface from "./pages/InspectionInterface";
import DriverManagement from "./pages/DriverManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleManagement />} />
            <Route path="/checklist" element={<ChecklistManagement />} />
            <Route path="/history" element={<InspectionHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/new-inspection" element={<NewInspection />} />
            <Route path="/inspection" element={<InspectionInterface />} />
            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/user-management" element={<UserManagementNew />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;