import { NavLink, Outlet } from "react-router-dom";
import { AurenLogo } from "../components/AurenLogo";
import { useAuth } from "../lib/auth-context";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? "text-ink font-medium" : "text-muted hover:text-ink"}`;

export function PatientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white px-4 py-4 tablet:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <AurenLogo />
          <button type="button" onClick={() => void logout()} className="text-sm text-muted hover:text-ink">
            Sair
          </button>
        </div>
        <nav className="mx-auto mt-4 flex max-w-3xl gap-6">
          <NavLink to="/portal" className={navItemClass} end>
            Início
          </NavLink>
          <NavLink to="/meus-exames" className={navItemClass}>
            Exames
          </NavLink>
          <NavLink to="/meus-laudos" className={navItemClass}>
            Laudos
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 tablet:px-8 tablet:py-8">
        {user ? <Outlet /> : null}
      </main>
    </div>
  );
}
