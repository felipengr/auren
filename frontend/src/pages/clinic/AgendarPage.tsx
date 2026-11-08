import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Alert } from "../../components/Alert";
import { TimeSlotGrid } from "../../components/TimeSlotGrid";
import { PatientForm } from "../../components/PatientForm";
import { ApiError, api } from "../../lib/api";
import type { ClinicAppointment, ExamType, Patient, Slot } from "../../types/api";

function todayCivilDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function AgendarPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [patientId, setPatientId] = useState("");
  const [examTypeId, setExamTypeId] = useState("");
  const [date, setDate] = useState(todayCivilDate());
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  useEffect(() => {
    api.get<{ patients: Patient[] }>("/api/patients").then((data) => setPatients(data.patients));
    api.get<{ examTypes: ExamType[] }>("/api/exam-types").then((data) => setExamTypes(data.examTypes));
  }, []);

  function handlePatientCreated(patient: Patient) {
    setPatients((current) => [...current, patient].sort((a, b) => a.name.localeCompare(b.name)));
    setPatientId(patient.id);
    setShowNewPatientForm(false);
  }

  useEffect(() => {
    setSlotsLoading(true);
    setTime(null);
    api
      .get<{ slots: Slot[] }>(`/api/appointments/available-slots?date=${date}`)
      .then((data) => setSlots(data.slots))
      .finally(() => setSlotsLoading(false));
  }, [date]);

  const canSubmit = patientId && examTypeId && date && time && !submitting;

  async function handleConfirm() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const { appointment } = await api.post<{ appointment: ClinicAppointment }>("/api/appointments", {
        patientId,
        examTypeId,
        date,
        time,
      });
      navigate(`/agendamentos/${appointment.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setError("Este horário acabou de ser ocupado. Escolha outro horário para continuar.");
        setTime(null);
        setSlotsLoading(true);
        api
          .get<{ slots: Slot[] }>(`/api/appointments/available-slots?date=${date}`)
          .then((data) => setSlots(data.slots))
          .finally(() => setSlotsLoading(false));
      } else {
        setError(err instanceof ApiError ? err.message : "Não foi possível agendar. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Novo agendamento</h1>
      <p className="mt-1 text-sm text-muted">Selecione o paciente, o exame e um horário livre.</p>

      {error ? (
        <div className="mt-4">
          <Alert variant="error" title={error} />
        </div>
      ) : null}

      <Card className="mt-6 flex flex-col gap-5">
        {showNewPatientForm ? (
          <div>
            <p className="mb-3 text-sm text-ink">Cadastrar paciente</p>
            <PatientForm
              submitLabel="Cadastrar e selecionar"
              onCreated={handlePatientCreated}
              onCancel={() => setShowNewPatientForm(false)}
            />
          </div>
        ) : (
          <div>
            <Select label="Paciente cadastrado" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Selecione um paciente</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => setShowNewPatientForm(true)}
              className="mt-2 text-sm font-medium text-forest hover:underline"
            >
              + Cadastrar novo paciente
            </button>
          </div>
        )}

        <Select label="Tipo de exame" value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)} required>
          <option value="">Selecione o exame</option>
          {examTypes.map((examType) => (
            <option key={examType.id} value={examType.id}>
              {examType.name}
            </option>
          ))}
        </Select>

        <Input
          label="Data do exame"
          type="date"
          value={date}
          min={todayCivilDate()}
          onChange={(e) => setDate(e.target.value)}
          hint="Sala única · duração de 30 minutos"
        />

        <div>
          <p className="mb-2 text-sm text-ink">Horários disponíveis</p>
          <p className="mb-3 text-xs text-muted">Horário de Brasília · America/Sao_Paulo (UTC−3)</p>
          {slotsLoading ? (
            <p className="text-sm text-muted">Carregando horários…</p>
          ) : (
            <TimeSlotGrid slots={slots} selected={time} onSelect={setTime} />
          )}
        </div>

        <Button onClick={() => void handleConfirm()} disabled={!canSubmit}>
          {submitting ? "Agendando…" : "Confirmar agendamento"}
        </Button>
      </Card>
    </div>
  );
}
