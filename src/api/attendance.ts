import { api } from "@/lib/api";
import { normAttendance } from "./normalize";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

export interface AttendanceSummary {
  trend: { date: string; present: number; absent: number; leave: number; holiday: number }[];
  totals: { present: number; absent: number; leave: number; holiday: number };
  attendancePct: number;
  leavePct: number;
}

export const attendanceApi = {
  async list(params?: { employee?: string; from?: string; to?: string }): Promise<AttendanceRecord[]> {
    const { data } = await api.get("/attendance", { params });
    return (data.attendance ?? []).map(normAttendance);
  },
  async mark(employee: string, date: string, status: AttendanceStatus): Promise<AttendanceRecord> {
    const { data } = await api.post("/attendance", { employee, date, status });
    return normAttendance(data.attendance);
  },
  async summary(days = 14): Promise<AttendanceSummary> {
    const { data } = await api.get("/attendance/summary", { params: { days } });
    return data as AttendanceSummary;
  },
};
