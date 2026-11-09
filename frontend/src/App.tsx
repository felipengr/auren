import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ClinicLayout } from "./layouts/ClinicLayout";
import { PatientLayout } from "./layouts/PatientLayout";
import { LoginPage } from "./pages/LoginPage";

// Cada página autenticada vira o próprio chunk: quem abre /agenda não baixa
// o código de /laudos (e vice-versa) — reduz o JS não usado na carga de
// qualquer rota. LoginPage fica fora do code-splitting de propósito: é a
// primeira coisa que praticamente todo mundo vê, então carregar o chunk dela
// sob demanda só adicionaria um round-trip extra bem na LCP da porta de
// entrada do site, sem ganho real (o componente já é pequeno).
const AgendaPage = lazy(() => import("./pages/clinic/AgendaPage").then((m) => ({ default: m.AgendaPage })));
const AgendarPage = lazy(() => import("./pages/clinic/AgendarPage").then((m) => ({ default: m.AgendarPage })));
const AppointmentDetailPage = lazy(() =>
  import("./pages/clinic/AppointmentDetailPage").then((m) => ({ default: m.AppointmentDetailPage })),
);
const PatientsPage = lazy(() => import("./pages/clinic/PatientsPage").then((m) => ({ default: m.PatientsPage })));
const ReportsPage = lazy(() => import("./pages/clinic/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const PortalPage = lazy(() => import("./pages/patient/PortalPage").then((m) => ({ default: m.PortalPage })));
const MeusExamesPage = lazy(() =>
  import("./pages/patient/MeusExamesPage").then((m) => ({ default: m.MeusExamesPage })),
);
const MeusLaudosPage = lazy(() =>
  import("./pages/patient/MeusLaudosPage").then((m) => ({ default: m.MeusLaudosPage })),
);
const LaudoDetailPage = lazy(() =>
  import("./pages/patient/LaudoDetailPage").then((m) => ({ default: m.LaudoDetailPage })),
);

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "CLINIC" ? "/agenda" : "/portal"} replace />;
}

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Carregando…</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute allow="CLINIC" />}>
            <Route element={<ClinicLayout />}>
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/agenda/novo" element={<AgendarPage />} />
              <Route path="/agendamentos/:id" element={<AppointmentDetailPage />} />
              <Route path="/pacientes" element={<PatientsPage />} />
              <Route path="/laudos" element={<ReportsPage />} />
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
      </Suspense>
    </AuthProvider>
  );
}
