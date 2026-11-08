import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import type { Role } from "../types/api";

const HOME_BY_ROLE: Record<Role, string> = {
  CLINIC: "/agenda",
  PATIENT: "/portal",
};

export function ProtectedRoute({ allow }: { allow: Role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Carregando…</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allow) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Outlet />;
}
