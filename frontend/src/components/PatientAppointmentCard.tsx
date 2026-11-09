import { Link } from "react-router-dom";
import { Card } from "./Card";
import { PatientAppointmentStatusBadge } from "./Badge";
import { formatCivilDateLong } from "../lib/format";
import type { PatientAppointment } from "../types/api";

export function PatientAppointmentCard({ appointment }: { appointment: PatientAppointment }) {
  const content = (
    <Card
      className={`flex items-center justify-between gap-4 ${
        appointment.reportId ? "transition-colors hover:border-forest" : ""
      }`}
    >
      <div>
        <p className="font-medium text-ink">{appointment.examType.name}</p>
        <p className="text-sm text-muted">
          {formatCivilDateLong(appointment.date)} · {appointment.time}
        </p>
      </div>
      <PatientAppointmentStatusBadge
        status={appointment.status}
        hasPublishedReport={appointment.hasPublishedReport}
        scheduledAt={appointment.scheduledAt}
      />
    </Card>
  );

  return appointment.reportId ? <Link to={`/laudos/${appointment.reportId}`}>{content}</Link> : content;
}
