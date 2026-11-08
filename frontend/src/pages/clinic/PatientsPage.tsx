import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { PatientForm } from "../../components/PatientForm";
import { api } from "../../lib/api";
import { formatPublishedAt } from "../../lib/format";
import type { Patient } from "../../types/api";

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get<{ patients: Patient[] }>("/api/patients").then((data) => setPatients(data.patients));
  }

  useEffect(load, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Pacientes</h1>
          <p className="mt-1 text-sm text-muted">Cadastre e consulte os pacientes da clínica.</p>
        </div>
        {!showForm ? <Button onClick={() => setShowForm(true)}>+ Novo paciente</Button> : null}
      </div>

      {showForm ? (
        <Card className="mt-6">
          <PatientForm
            onCreated={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {!patients ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : patients.length === 0 ? (
          <Card className="text-sm text-muted">Nenhum paciente cadastrado ainda.</Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{patient.name}</p>
                <p className="text-sm text-muted">{patient.email}</p>
              </div>
              <p className="shrink-0 text-xs text-muted">Desde {formatPublishedAt(patient.createdAt)}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
