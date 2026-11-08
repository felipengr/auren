export type Role = "CLINIC" | "PATIENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ExamType = {
  id: string;
  name: string;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AppointmentStatus = "SCHEDULED" | "CANCELLED";
export type ReportStatus = "DRAFT" | "PUBLISHED";

export type ClinicAppointment = {
  id: string;
  patient: { id: string; name: string; email: string };
  examType: ExamType;
  date: string;
  time: string;
  scheduledAt: string;
  status: AppointmentStatus;
  report: { id: string; status: ReportStatus } | null;
  cancelledAt: string | null;
};

export type PatientAppointment = {
  id: string;
  examType: ExamType;
  date: string;
  time: string;
  scheduledAt: string;
  status: AppointmentStatus;
  hasPublishedReport: boolean;
};

export type Report = {
  id: string;
  appointmentId: string;
  title: string;
  content: string;
  professionalName: string;
  status: ReportStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: { id: string; examType: ExamType; scheduledAt: string; patient: { id: string; name: string } };
};

export type Slot = {
  time: string;
  scheduledAt: string;
  available: boolean;
  reason: "booked" | "past" | null;
};

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};
