import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { ApiError, api } from "../../lib/api";
import { formatInstantLong, formatPublishedAt } from "../../lib/format";
import type { Report } from "../../types/api";

export function LaudoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ report: Report }>(`/api/reports/${id}`)
      .then((data) => setReport(data.report))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não foi possível abrir o laudo."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/meus-laudos" className="text-sm text-muted hover:text-ink">
        ← Voltar para meus laudos
      </Link>

      {loading ? (
        <p className="mt-4 text-sm text-muted">Carregando…</p>
      ) : error || !report ? (
        <div className="mt-4">
          <Alert variant="error" title={error ?? "Laudo não encontrado."} />
        </div>
      ) : (
        <Card className="mt-4 flex flex-col gap-2">
          <h1 className="font-display text-2xl text-ink">{report.title}</h1>
          <p className="text-sm text-muted">
            {report.appointment.examType.name} · {formatInstantLong(report.appointment.scheduledAt)}
          </p>
          <p className="text-xs text-muted">Profissional responsável: {report.professionalName}</p>
          {report.publishedAt ? (
            <p className="text-xs text-muted">Publicado em {formatPublishedAt(report.publishedAt)}</p>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{report.content}</p>
        </Card>
      )}
    </div>
  );
}
