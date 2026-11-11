import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Textarea } from "../../components/Textarea";
import { Alert } from "../../components/Alert";
import { ErrorState } from "../../components/ErrorState";
import { AppointmentStatusBadge, ReportStatusBadge } from "../../components/Badge";
import { ApiError, api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatCivilDateLong, formatPublishedAt } from "../../lib/format";
import type { ClinicAppointment, Report } from "../../types/api";

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const detail = useApiResource(
    () =>
      Promise.all([
        api.get<{ appointment: ClinicAppointment }>(`/api/appointments/${id}`),
        api
          .get<{ report: Report }>(`/api/appointments/${id}/report`)
          .then((data) => data.report)
          .catch((err) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
      ]).then(([appointmentResult, report]) => ({ appointment: appointmentResult.appointment, report })),
    [id],
  );

  async function handleCancel() {
    if (!id) return;
    setError(null);
    try {
      await api.delete(`/api/appointments/${id}`);
      setNotice("Agendamento cancelado.");
      detail.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar.");
    }
  }

  if (detail.status === "loading") {
    return <p className="text-sm text-muted">Carregando…</p>;
  }

  if (detail.status === "error") {
    return <ErrorState onRetry={detail.reload} />;
  }

  const { appointment, report } = detail.data;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/agenda" className="text-sm text-muted hover:text-ink">
        ← Voltar para a agenda
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{appointment.examType.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {appointment.patient.name} · {formatCivilDateLong(appointment.date)} às {appointment.time}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} reportStatus={report?.status} />
      </div>

      {notice ? (
        <div className="mt-4">
          <Alert variant="success" title={notice} />
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Alert variant="error" title={error} />
        </div>
      ) : null}

      {appointment.status === "SCHEDULED" && report?.status !== "PUBLISHED" ? (
        <div className="mt-6">
          <Button variant="danger" onClick={() => void handleCancel()}>
            Cancelar exame
          </Button>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="font-display text-xl text-ink">Laudo</h2>
        <div className="mt-3">
          {appointment.status === "CANCELLED" && !report ? (
            <Card className="text-sm text-muted">Agendamentos cancelados não podem receber laudo.</Card>
          ) : (
            <ReportSection appointmentId={appointment.id} report={report} onChanged={detail.reload} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  appointmentId,
  report,
  onChanged,
}: {
  appointmentId: string;
  report: Report | null;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(!report);
  const [title, setTitle] = useState(report?.title ?? "");
  const [content, setContent] = useState(report?.content ?? "");
  const [professionalName, setProfessionalName] = useState(report?.professionalName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (report?.status === "PUBLISHED") {
    return (
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">{report.title}</p>
          <ReportStatusBadge status={report.status} />
        </div>
        <p className="text-xs text-muted">Profissional responsável: {report.professionalName}</p>
        {report.publishedAt ? (
          <p className="text-xs text-muted">Publicado em {formatPublishedAt(report.publishedAt)}</p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{report.content}</p>
      </Card>
    );
  }

  if (report && !editing) {
    return (
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">{report.title}</p>
          <ReportStatusBadge status={report.status} />
        </div>
        <p className="text-xs text-muted">Profissional responsável: {report.professionalName}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{report.content}</p>
        <div className="mt-3 flex gap-3">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar rascunho
          </Button>
          <Button
            onClick={async () => {
              // Publicar é irreversível (o paciente passa a ver o laudo na
              // hora) — confirma antes de mandar pro ar.
              if (!window.confirm("Publicar este laudo? O paciente poderá vê-lo imediatamente.")) return;
              setSaving(true);
              setError(null);
              try {
                await api.post(`/api/reports/${report.id}/publish`);
                onChanged();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Não foi possível publicar.");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? "Publicando…" : "Publicar laudo"}
          </Button>
        </div>
        {error ? (
          <div className="mt-2">
            <Alert variant="error" title={error} />
          </div>
        ) : null}
      </Card>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (report) {
        await api.patch(`/api/reports/${report.id}`, { title, content, professionalName });
      } else {
        await api.post(`/api/appointments/${appointmentId}/report`, { title, content, professionalName });
      }
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o rascunho.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input
        label="Nome do profissional responsável"
        value={professionalName}
        onChange={(e) => setProfessionalName(e.target.value)}
        required
      />
      <Textarea
        label="Texto do laudo"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      {error ? <Alert variant="error" title={error} /> : null}
      <div className="flex gap-3">
        {report ? (
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancelar edição
          </Button>
        ) : null}
        <Button onClick={() => void handleSave()} disabled={saving || !title || !content || !professionalName}>
          {saving ? "Salvando…" : "Salvar rascunho"}
        </Button>
      </div>
    </Card>
  );
}
