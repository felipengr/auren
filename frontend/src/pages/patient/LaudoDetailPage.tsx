import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { ErrorState } from "../../components/ErrorState";
import { ApiError, api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatInstantLong, formatPublishedAt } from "../../lib/format";
import type { Report } from "../../types/api";

export function LaudoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const result = useApiResource(
    () => api.get<{ report: Report }>(`/api/reports/${id}`).then((data) => data.report),
    [id],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/meus-laudos" className="text-sm text-muted hover:text-ink">
        ← Voltar para meus laudos
      </Link>

      {result.status === "loading" ? (
        <p className="mt-4 text-sm text-muted">Carregando…</p>
      ) : result.status === "error" ? (
        <div className="mt-4">
          {result.error instanceof ApiError && result.error.status === 404 ? (
            <Alert variant="error" title={result.error.message} />
          ) : (
            <ErrorState message="Não foi possível abrir o laudo." onRetry={result.reload} />
          )}
        </div>
      ) : (
        <Card className="mt-4 flex flex-col gap-2">
          <h1 className="font-display text-2xl text-ink">{result.data.title}</h1>
          <p className="text-sm text-muted">
            {result.data.appointment.examType.name} · {formatInstantLong(result.data.appointment.scheduledAt)}
          </p>
          <p className="text-xs text-muted">Profissional responsável: {result.data.professionalName}</p>
          {result.data.publishedAt ? (
            <p className="text-xs text-muted">Publicado em {formatPublishedAt(result.data.publishedAt)}</p>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{result.data.content}</p>
        </Card>
      )}
    </div>
  );
}
