type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  info: "bg-info text-blue",
  success: "bg-sage text-forest",
  warning: "bg-warning text-amber",
  danger: "bg-rose text-red",
  neutral: "bg-disabled text-muted",
};

export function Badge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function AppointmentStatusBadge({
  status,
  reportStatus,
}: {
  status: "SCHEDULED" | "CANCELLED";
  reportStatus?: "DRAFT" | "PUBLISHED";
}) {
  if (status === "CANCELLED") return <Badge tone="danger">Cancelado</Badge>;
  if (reportStatus === "PUBLISHED") return <Badge tone="success">Laudo publicado</Badge>;
  if (reportStatus === "DRAFT") return <Badge tone="warning">Rascunho</Badge>;
  return <Badge tone="info">Agendado</Badge>;
}

/**
 * Pro paciente nunca sabemos (nem devemos saber) se existe um rascunho — só
 * se o exame já passou e ainda não tem laudo publicado, o que ele já
 * consegue ver pela própria data do agendamento.
 */
export function PatientAppointmentStatusBadge({
  status,
  hasPublishedReport,
  scheduledAt,
}: {
  status: "SCHEDULED" | "CANCELLED";
  hasPublishedReport: boolean;
  scheduledAt: string;
}) {
  if (status === "CANCELLED") return <Badge tone="danger">Cancelado</Badge>;
  if (hasPublishedReport) return <Badge tone="success">Laudo publicado</Badge>;
  if (new Date(scheduledAt) < new Date()) return <Badge tone="warning">Aguardando laudo</Badge>;
  return <Badge tone="info">Agendado</Badge>;
}

export function ReportStatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return status === "PUBLISHED" ? <Badge tone="success">Publicado</Badge> : <Badge tone="warning">Rascunho</Badge>;
}
