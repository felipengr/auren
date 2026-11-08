import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { ApiError, api } from "../lib/api";
import type { Patient } from "../types/api";

export function PatientForm({
  onCreated,
  onCancel,
  submitLabel = "Cadastrar paciente",
}: {
  onCreated: (patient: Patient) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { patient } = await api.post<{ patient: Patient }>("/api/patients", { name, email, password });
      onCreated(patient);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar o paciente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="paciente@exemplo.com"
      />
      <Input
        label="Senha provisória"
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        hint="Compartilhe esta senha com o paciente — é o que ele vai usar pra entrar no portal."
      />
      {error ? <Alert variant="error" title={error} /> : null}
      <div className="flex gap-3">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting || !name || !email || password.length < 6}>
          {submitting ? "Cadastrando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
