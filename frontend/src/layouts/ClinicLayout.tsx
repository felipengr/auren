import { NavLink, Outlet } from "react-router-dom";
import { AurenLogo } from "../components/AurenLogo";
import { useAuth } from "../lib/auth-context";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-control px-4 py-2.5 text-sm transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
  }`;

export function ClinicLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper tablet:flex">
      <aside className="flex flex-col justify-between bg-forest px-4 py-6 tablet:w-56 tablet:px-5 desktop:w-64">
        <div>
          <div className="px-2">
            <AurenLogo tone="light" />
          </div>
          <p className="mt-8 px-2 text-[11px] font-medium tracking-wide text-white/50">ESPAÇO DA CLÍNICA</p>
          <nav className="mt-2 flex gap-1 tablet:flex-col">
            <NavLink to="/agenda" className={navItemClass} end>
              Agenda
            </NavLink>
            <NavLink to="/pacientes" className={navItemClass}>
              Pacientes
            </NavLink>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 px-2 pt-4">
          <p className="text-sm text-white">{user?.name}</p>
          <p className="text-xs text-white/60">Equipe da clínica</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 tablet:px-8 tablet:py-8">
        <Outlet />
      </main>
    </div>
  );
}
