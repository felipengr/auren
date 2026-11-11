import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { PatientAppointmentCard } from "../../components/PatientAppointmentCard";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import type { PatientAppointment } from "../../types/api";

export function MeusExamesPage() {
  const appointments = useApiResource(() =>
    api.get<{ appointments: PatientAppointment[] }>("/api/appointments/mine").then((data) => data.appointments),
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meus exames</h1>
      <p className="mt-1 text-sm text-muted">Seus agendamentos, com tipo de exame, data e situação.</p>

      <div className="mt-6 flex flex-col gap-3">
        {appointments.status === "loading" ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : appointments.status === "error" ? (
          <ErrorState onRetry={appointments.reload} />
        ) : appointments.data.length === 0 ? (
          <Card className="text-sm text-muted">Você ainda não tem exames agendados.</Card>
        ) : (
          appointments.data.map((appointment) => (
            <PatientAppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>
    </div>
  );
}
