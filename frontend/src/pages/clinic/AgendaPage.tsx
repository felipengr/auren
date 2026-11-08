import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "../../components/Button";
import { Select } from "../../components/Select";
import { Input } from "../../components/Input";
import { AppointmentStatusBadge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { api } from "../../lib/api";
import { formatCivilDateLong } from "../../lib/format";
import type { ClinicAppointment, User } from "../../types/api";

export function AgendaPage() {
  const [date, setDate] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<ClinicAppointment[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ patients: User[] }>("/api/patients").then((data) => setPatients(data.patients));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (patientId) params.set("patientId", patientId);

    api
      .get<{ appointments: ClinicAppointment[] }>(`/api/appointments?${params.toString()}`)
      .then((data) => setAppointments(data.appointments))
      .finally(() => setLoading(false));
  }, [date, patientId]);

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

      <Card className="mt-6 flex flex-wrap gap-4">
        <div className="w-44">
          <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="w-64">
          <Select label="Paciente" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Todos os pacientes</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mt-6">
        {date ? <p className="mb-3 text-sm font-medium text-ink">{formatCivilDateLong(date)}</p> : null}

        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : !appointments || appointments.length === 0 ? (
          <Card className="text-sm text-muted">Nenhum agendamento encontrado para esse filtro.</Card>
        ) : (
          <>
            {/* Mobile: cards empilhados — a tabela não cabe numa tela estreita */}
            <div className="flex flex-col gap-3 tablet:hidden">
              {appointments.map((appointment) => (
                <Link key={appointment.id} to={`/agendamentos/${appointment.id}`}>
                  <Card className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">
                        {appointment.time} · {appointment.patient.name}
                      </p>
                      <p className="text-sm text-muted">{appointment.examType.name}</p>
                    </div>
                    <AppointmentStatusBadge
                      status={appointment.status}
                      hasPublishedReport={appointment.report?.status === "PUBLISHED"}
                    />
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
                        <AppointmentStatusBadge
                          status={appointment.status}
                          hasPublishedReport={appointment.report?.status === "PUBLISHED"}
                        />
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
        )}
      </div>
    </div>
  );
}
