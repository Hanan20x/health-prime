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
import PatientAIDiagnosisPage from "./pages/PatientAIDiagnosisPage";
import VitalsRecordPage from "./pages/VitalsRecordPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MyProfilePage from "./pages/MyProfilePage";
import AiExplanationPage from "./pages/AiExplanationPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 0 },
  },
});

import React from "react";

class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, info: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    this.setState({ info });
    console.error("GlobalErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: 'red', background: '#fee' }}>
          <h1>Catastrophic React Crash</h1>
          <p>Please screenshot this exact error to the AI:</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'white', padding: 20 }}>
            {this.state.error?.toString()}
            <br/><br/>
            {this.state.error?.stack}
            <br/><br/>
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <GlobalErrorBoundary>
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
                <Route path="/patients/emr/:id/diagnosis" element={<PatientAIDiagnosisPage />} />
                <Route path="/patients/ai-diagnosis/:id" element={<PatientAIDiagnosisPage />} />
                <Route path="/vitals/record" element={<VitalsRecordPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/profile" element={<MyProfilePage />} />
                <Route path="/ai-agents-explained" element={<AiExplanationPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LangProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
