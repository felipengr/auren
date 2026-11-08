import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../../components/Button";
import { Input } from "../../components/Input";
import { AppointmentStatusBadge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { api } from "../../lib/api";
import { formatCivilDateLong } from "../../lib/format";
import type { ClinicAppointment, Slot } from "../../types/api";

function todayCivilDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function addDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

export function AgendaPage() {
  const [date, setDate] = useState(todayCivilDate());
  const [nameQuery, setNameQuery] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayAppointments, setDayAppointments] = useState<ClinicAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ slots: Slot[] }>(`/api/appointments/available-slots?date=${date}`),
      api.get<{ appointments: ClinicAppointment[] }>(`/api/appointments?date=${date}`),
    ])
      .then(([slotsData, appointmentsData]) => {
        setSlots(slotsData.slots);
        setDayAppointments(appointmentsData.appointments);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const scheduledCount = dayAppointments.filter((a) => a.status === "SCHEDULED").length;
  const freeSlots = slots.filter((s) => s.available);

  const query = nameQuery.trim().toLowerCase();
  const visibleAppointments = query
    ? dayAppointments.filter((a) => a.patient.name.toLowerCase().includes(query))
    : dayAppointments;
  const searching = query.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Agenda de exames</h1>
          <p className="mt-1 text-sm text-muted">Uma visão clara de cada atendimento.</p>
        </div>
        <Link to="/agenda/novo" className={buttonClasses("primary", "shrink-0")}>
          + Novo agendamento
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Exames agendados</p>
          <p className="mt-1 font-display text-3xl text-ink">{String(scheduledCount).padStart(2, "0")}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Horários livres</p>
          <p className="mt-1 font-display text-3xl text-ink">{String(freeSlots.length).padStart(2, "0")}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Sala de exames</p>
          <p className="mt-1 font-display text-3xl text-ink">01</p>
        </Card>
      </div>

      <Card className="mt-6 flex flex-wrap items-end gap-4">
        <div className="w-44">
          <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Dia anterior"
            onClick={() => setDate((d) => addDays(d, -1))}
            className={buttonClasses("secondary", "w-12 !px-0 text-lg")}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setDate(todayCivilDate())}
            className={buttonClasses("secondary", "whitespace-nowrap")}
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo dia"
            onClick={() => setDate((d) => addDays(d, 1))}
            className={buttonClasses("secondary", "w-12 !px-0 text-lg")}
          >
            ›
          </button>
        </div>
        <div className="w-64">
          <Input
            label="Paciente"
            placeholder="Buscar por nome"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>
      </Card>

      <p className="mt-6 mb-3 text-sm font-medium text-ink">
        {formatCivilDateLong(date)} <span className="font-normal text-muted">· Sala única · intervalos de 30 min</span>
      </p>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : (
        <>
          {visibleAppointments.length === 0 ? (
            <Card className="text-sm text-muted">
              {searching ? "Nenhum agendamento encontrado para esse filtro." : "Nenhum agendamento para este dia."}
            </Card>
          ) : (
            <AppointmentsTable appointments={visibleAppointments} />
          )}

          {!searching ? (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-ink">Horários livres</p>
              {freeSlots.length === 0 ? (
                <p className="text-sm text-muted">Nenhum horário livre neste dia.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 tablet:grid-cols-6">
                  {freeSlots.map((slot) => (
                    <Link
                      key={slot.time}
                      to={`/agenda/novo?date=${date}&time=${slot.time}`}
                      className="flex h-12 items-center justify-center rounded-control border border-line bg-white text-sm font-medium text-ink transition-colors hover:border-forest"
                    >
                      {slot.time}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function AppointmentsTable({ appointments }: { appointments: ClinicAppointment[] }) {
  return (
    <>
      {/* Mobile: cards empilhados — a tabela não cabe numa tela estreita */}
      <div className="flex flex-col gap-2 tablet:hidden">
        {appointments.map((appointment) => (
          <Link key={appointment.id} to={`/agendamentos/${appointment.id}`}>
            <Card className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">
                  {appointment.time} · {appointment.patient.name}
                </p>
                <p className="text-sm text-muted">{appointment.examType.name}</p>
              </div>
              <AppointmentStatusBadge status={appointment.status} reportStatus={appointment.report?.status} />
            </Card>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-card border border-line bg-white tablet:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">Horário</th>
              <th className="px-5 py-3 font-medium">Paciente / Exame</th>
              <th className="px-5 py-3 font-medium">Situação</th>
              <th className="px-5 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="border-b border-line last:border-0">
                <td className="px-5 py-4 font-medium text-ink">{appointment.time}</td>
                <td className="px-5 py-4">
                  <p className="text-ink">{appointment.patient.name}</p>
                  <p className="text-muted">{appointment.examType.name}</p>
                </td>
                <td className="px-5 py-4">
                  <AppointmentStatusBadge status={appointment.status} reportStatus={appointment.report?.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <Link to={`/agendamentos/${appointment.id}`} className="font-medium text-forest hover:underline">
                    Abrir →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
