import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2, HeartPulse } from "lucide-react";
import { apiFetch } from "@/api/client";
import type { PatientListItem as PatientRow } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx, txGender, txStatus } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const statusMap: Record<string, "active" | "inactive" | "pending"> = {
  Registered: "active",
  "In Progress": "pending",
  Discharged: "inactive",
};

export default function PatientsListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang } = useLang();
  const { canRegisterPatients, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["patients", search, statusFilter],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (search.trim()) q.set("q", search.trim());
      if (statusFilter !== "all") q.set("status", statusFilter);
      const qs = q.toString();
      return apiFetch<PatientRow[]>(`/patients${qs ? `?${qs}` : ""}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      setDeleteId(null);
      toast.success(tx("patientDeleted", lang));
    },
    onError: () => {
      toast.error(tx("failedLoadPatients", lang));
    }
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nationalId.includes(search) ||
        p.phone.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<PatientRow>[] = [
    { header: tx("fullName", lang), accessor: "name" },
    { header: tx("nationalId", lang), accessor: "nationalId" },
    { header: tx("gender", lang), accessor: (row) => txGender(row.gender, lang) },
    { header: tx("dateOfBirth", lang), accessor: "dob" },
    { header: tx("phone", lang), accessor: "phone" },
    {
      header: tx("status", lang),
      accessor: (row) => (
        <StatusBadge variant={statusMap[row.status] ?? "pending"}>{txStatus(row.status, lang)}</StatusBadge>
      ),
    },
    {
      header: tx("actions", lang),
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/patients/${row.id}`)}
            title={tx("view", lang)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-teal-600 hover:bg-teal-50"
            onClick={() => navigate(`/vitals/record?patientId=${row.id}`)}
            title={tx("vitalSigns", lang)}
          >
            <HeartPulse className="w-4 h-4" />
          </Button>
          {canRegisterPatients && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={() => navigate(`/patients/${row.id}/edit`)}
              title={tx("edit", lang)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteId(row.id)}
              title={tx("delete", lang)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("patients", lang)}
        description={tx("managePatientsDesc", lang)}
        actions={
          canRegisterPatients ? (
            <Button onClick={() => navigate("/patients/new")} className="gap-2">
              <Plus className="w-4 h-4" /> {tx("addPatient", lang)}
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {tx("failedLoadPatients", lang)}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchFilter
          placeholder={tx("searchPatientsPlaceholder", lang)}
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder={tx("allStatuses", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx("allStatuses", lang)}</SelectItem>
            <SelectItem value="Registered">{txStatus("Registered", lang)}</SelectItem>
            <SelectItem value="In Progress">{txStatus("In Progress", lang)}</SelectItem>
            <SelectItem value="Discharged">{txStatus("Discharged", lang)}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={paginated} emptyMessage={tx("noPatients", lang)} />
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tx("confirmDelete", lang)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tx("deletePatientConfirm", lang)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tx("cancel", lang)}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {tx("delete", lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
