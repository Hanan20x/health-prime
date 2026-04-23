import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/hooks/useLang";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProvidersListPage from "./pages/ProvidersListPage";
import ProviderFormPage from "./pages/ProviderFormPage";
import PatientsListPage from "./pages/PatientsListPage";
import PatientFormPage from "./pages/PatientFormPage";
import PatientDetailsPage from "./pages/PatientDetailsPage";
import PatientEMRPage from "./pages/PatientEMRPage";
import VitalsRecordPage from "./pages/VitalsRecordPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MyProfilePage from "./pages/MyProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LangProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/providers" element={<ProvidersListPage />} />
              <Route path="/providers/new" element={<ProviderFormPage />} />
              <Route path="/providers/:id/edit" element={<ProviderFormPage />} />
              <Route path="/patients" element={<PatientsListPage />} />
              <Route path="/patients/new" element={<PatientFormPage />} />
              <Route path="/patients/:id" element={<PatientDetailsPage />} />
              <Route path="/patients/:id/edit" element={<PatientFormPage />} />
              <Route path="/patients/emr" element={<PatientEMRPage />} />
              <Route path="/patients/emr/:id" element={<PatientEMRPage />} />
              <Route path="/vitals/record" element={<VitalsRecordPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/profile" element={<MyProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LangProvider>
  </QueryClientProvider>
);

export default App;
