import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card";
import { AppointmentStatusBadge } from "../../components/Badge";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatCivilDateLong } from "../../lib/format";
import type { PatientAppointment } from "../../types/api";

export function PortalPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PatientAppointment[] | null>(null);

  useEffect(() => {
    api
      .get<{ appointments: PatientAppointment[] }>("/api/appointments/mine")
      .then((data) => setAppointments(data.appointments));
  }, []);

  const now = new Date();
  const nextAppointment = appointments?.find(
    (appointment) => appointment.status === "SCHEDULED" && new Date(appointment.scheduledAt) >= now,
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Olá, {user?.name.split(" ")[0]}.</h1>
      <p className="mt-1 text-sm text-muted">É bom ter você por aqui.</p>

      {nextAppointment ? (
        <div className="mt-6 rounded-feature bg-forest p-6 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Seu próximo exame</p>
          <p className="mt-1 font-display text-2xl">{nextAppointment.examType.name}</p>
          <p className="mt-1 text-sm text-white/80">
            {formatCivilDateLong(nextAppointment.date)} · {nextAppointment.time}
          </p>
          <Link to="/meus-exames" className="mt-3 inline-block text-sm underline underline-offset-2">
            Ver meus exames →
          </Link>
        </div>
      ) : null}

      <h2 className="mt-8 font-display text-xl text-ink">Sua jornada de cuidado</h2>
      <div className="mt-3 flex flex-col gap-3">
        {!appointments ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : appointments.length === 0 ? (
          <Card className="text-sm text-muted">Você ainda não tem exames agendados.</Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{appointment.examType.name}</p>
                <p className="text-sm text-muted">
                  {formatCivilDateLong(appointment.date)} · {appointment.time}
                </p>
              </div>
              <AppointmentStatusBadge status={appointment.status} hasPublishedReport={appointment.hasPublishedReport} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
