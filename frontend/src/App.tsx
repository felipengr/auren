import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ClinicLayout } from "./layouts/ClinicLayout";
import { PatientLayout } from "./layouts/PatientLayout";
import { LoginPage } from "./pages/LoginPage";
import { AgendaPage } from "./pages/clinic/AgendaPage";
import { AgendarPage } from "./pages/clinic/AgendarPage";
import { AppointmentDetailPage } from "./pages/clinic/AppointmentDetailPage";
import { PortalPage } from "./pages/patient/PortalPage";
import { MeusExamesPage } from "./pages/patient/MeusExamesPage";
import { MeusLaudosPage } from "./pages/patient/MeusLaudosPage";
import { LaudoDetailPage } from "./pages/patient/LaudoDetailPage";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "CLINIC" ? "/agenda" : "/portal"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allow="CLINIC" />}>
          <Route element={<ClinicLayout />}>
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/novo" element={<AgendarPage />} />
            <Route path="/agendamentos/:id" element={<AppointmentDetailPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow="PATIENT" />}>
          <Route element={<PatientLayout />}>
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/meus-exames" element={<MeusExamesPage />} />
            <Route path="/meus-laudos" element={<MeusLaudosPage />} />
            <Route path="/laudos/:id" element={<LaudoDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
