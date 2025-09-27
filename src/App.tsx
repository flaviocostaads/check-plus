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
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";

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
            <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
            <Route path="/vehicles" element={<AuthenticatedLayout><VehicleManagement /></AuthenticatedLayout>} />
            <Route path="/checklist" element={<AuthenticatedLayout><ChecklistManagement /></AuthenticatedLayout>} />
            <Route path="/history" element={<AuthenticatedLayout><InspectionHistory /></AuthenticatedLayout>} />
            <Route path="/reports" element={<AuthenticatedLayout><Reports /></AuthenticatedLayout>} />
            <Route path="/new-inspection" element={<AuthenticatedLayout><NewInspection /></AuthenticatedLayout>} />
            <Route path="/inspection" element={<AuthenticatedLayout><InspectionInterface /></AuthenticatedLayout>} />
            <Route path="/drivers" element={<AuthenticatedLayout><DriverManagement /></AuthenticatedLayout>} />
            <Route path="/users" element={<AuthenticatedLayout><UserManagement /></AuthenticatedLayout>} />
            <Route path="/user-management" element={<AuthenticatedLayout><UserManagementNew /></AuthenticatedLayout>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;