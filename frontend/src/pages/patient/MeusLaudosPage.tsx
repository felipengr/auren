import { Link } from "react-router-dom";
import { Card } from "../../components/Card";
import { ErrorState } from "../../components/ErrorState";
import { api } from "../../lib/api";
import { useApiResource } from "../../lib/useApiResource";
import { formatPublishedAt } from "../../lib/format";
import type { Report } from "../../types/api";

export function MeusLaudosPage() {
  const reports = useApiResource(() =>
    api.get<{ reports: Report[] }>("/api/reports/mine").then((data) => data.reports),
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Meus laudos</h1>
      <p className="mt-1 text-sm text-muted">Laudos publicados, disponíveis para leitura.</p>

      <div className="mt-6 flex flex-col gap-3">
        {reports.status === "loading" ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : reports.status === "error" ? (
          <ErrorState onRetry={reports.reload} />
        ) : reports.data.length === 0 ? (
          <Card className="text-sm text-muted">Nenhum laudo publicado até o momento.</Card>
        ) : (
          reports.data.map((report) => (
            <Link key={report.id} to={`/laudos/${report.id}`}>
              <Card className="transition-colors hover:border-forest">
                <p className="font-medium text-ink">{report.title}</p>
                <p className="text-sm text-muted">{report.appointment.examType.name}</p>
                {report.publishedAt ? (
                  <p className="mt-1 text-xs text-muted">Publicado em {formatPublishedAt(report.publishedAt)}</p>
                ) : null}
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
