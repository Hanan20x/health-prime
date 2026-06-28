import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { UserOut } from "@/api/types";

export function useAuth() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UserOut>("/auth/me"),
    staleTime: 60_000,
  });

  const role = me?.role ?? "";

  return {
    me,
    isLoading,
    role,
    isAdmin: role === "E-Health Admin",
    isDoctor: role === "Doctor",
    isNurse: role === "Nurse",
    /** Admin or Doctor can manage providers */
    canManageProviders: role === "E-Health Admin",
    /** Admin can add/edit/delete patients; Doctor & Nurse can view */
    canRegisterPatients: role === "E-Health Admin" || role === "Nurse",
    /** Only Nurse can record vitals (Doctors only diagnose) */
    canRecordVitals: role === "Nurse",
    /** Nurse and Admin can book appointments, Doctor cannot */
    canBookAppointments: role === "Nurse" || role === "E-Health Admin",
    /** All roles can view patients */
    canViewPatients: true,
    /** Doctor and Nurse can open EMR */
    canViewEMR: role === "Doctor" || role === "Nurse" || role === "E-Health Admin",
  };
}
