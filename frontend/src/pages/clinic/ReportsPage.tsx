import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { Badge } from "../../components/Badge";
import { buttonClasses } from "../../components/Button";
import { api } from "../../lib/api";
import { formatInstantShort } from "../../lib/format";
import type { ClinicAppointment, Patient } from "../../types/api";

function reportBadge(appointment: ClinicAppointment) {
  if (!appointment.report) return <Badge tone="neutral">Sem laudo</Badge>;
  return appointment.report.status === "PUBLISHED" ? (
    <Badge tone="success">Publicado</Badge>
  ) : (
    <Badge tone="warning">Rascunho</Badge>
  );
}

function reportActionLabel(appointment: ClinicAppointment) {
  if (!appointment.report) return "Cadastrar";
  return appointment.report.status === "PUBLISHED" ? "Ler laudo" : "Editar laudo";
}

export function ReportsPage() {
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<ClinicAppointment[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ patients: Patient[] }>("/api/patients").then((data) => setPatients(data.patients));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = patientId ? `?patientId=${patientId}` : "";
    api
      .get<{ appointments: ClinicAppointment[] }>(`/api/appointments${query}`)
      .then((data) => {
        const now = new Date();
        // Só exames que já aconteceram fazem sentido aqui — um exame futuro
        // "sem laudo" é só prematuro, não uma pendência real (e o paciente
        // pode nem ter comparecido ainda). Um relatório já existente conta
        // como relevante mesmo que a data, por algum motivo, ainda não tenha
        // passado.
        const relevant = data.appointments.filter(
          (a) => a.status !== "CANCELLED" && (a.report !== null || new Date(a.scheduledAt) <= now),
        );
        setAppointments(relevant);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Central de laudos</h1>
      <p className="mt-1 text-sm text-muted">Rascunhos e publicações, com clareza.</p>

      <Card className="mt-6">
        <Select label="Buscar paciente" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Todos os pacientes</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </Select>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : !appointments || appointments.length === 0 ? (
          <Card className="text-sm text-muted">Nenhum exame encontrado para esse filtro.</Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">
                  {appointment.examType.name} · {appointment.patient.name}
                </p>
                <p className="text-sm text-muted">{formatInstantShort(appointment.scheduledAt)}</p>
                <div className="mt-2">{reportBadge(appointment)}</div>
              </div>
              <Link to={`/agendamentos/${appointment.id}`} className={buttonClasses("secondary", "shrink-0")}>
                {reportActionLabel(appointment)}
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
