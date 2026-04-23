import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import type { ProviderListItem as Row } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx, txRole, txStatus, txSpecialty } from "@/lib/i18n";

const PAGE_SIZE = 10;

const statusMap: Record<string, "active" | "inactive" | "pending"> = {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
};

export default function ProvidersListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang } = useLang();
  const { canManageProviders, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["providers", search, roleFilter, statusFilter],
    queryFn: () => {
      const q = new URLSearchParams();
      if (search.trim()) q.set("q", search.trim());
      if (roleFilter !== "all") q.set("role", roleFilter);
      if (statusFilter !== "all") q.set("status", statusFilter);
      const qs = q.toString();
      return apiFetch<Row[]>(`/providers${qs ? `?${qs}` : ""}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/providers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      setDeleteId(null);
      toast.success(tx("providerDeleted", lang));
    },
    onError: () => {
      toast.error(tx("failedLoadProviders", lang));
    }
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Role guard: only admins can see the providers list
  if (!authLoading && !canManageProviders) {
    return <AccessDenied />;
  }

  const columns: Column<Row>[] = [
    { header: tx("name", lang), accessor: "name" },
    { header: tx("role", lang), accessor: (r) => txRole(r.role, lang) },
    { header: tx("specialty", lang), accessor: (r) => txSpecialty(r.specialty, lang) },
    { header: tx("phone", lang), accessor: (r) => r.phone || "—" },
    { header: tx("license", lang), accessor: "license" },
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
            onClick={() => navigate(`/providers/${row.id}`)}
            title={tx("view", lang)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={() => navigate(`/providers/${row.id}/edit`)}
            title={tx("edit", lang)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteId(row.id)}
            title={tx("delete", lang)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("healthcareProviders", lang)}
        description={tx("manageProvidersDesc", lang)}
        actions={
          <Button onClick={() => navigate("/providers/new")} className="gap-2">
            <Plus className="w-4 h-4" /> {tx("addProvider", lang)}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {tx("failedLoadProviders", lang)}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchFilter
          placeholder={tx("searchProvidersPlaceholder", lang)}
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
        />
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder={tx("allRoles", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx("allRoles", lang)}</SelectItem>
            <SelectItem value="Doctor">{txRole("Doctor", lang)}</SelectItem>
            <SelectItem value="Nurse">{txRole("Nurse", lang)}</SelectItem>
            <SelectItem value="E-Health Admin">{txRole("E-Health Admin", lang)}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder={tx("allStatuses", lang)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx("allStatuses", lang)}</SelectItem>
            <SelectItem value="Active">{txStatus("Active", lang)}</SelectItem>
            <SelectItem value="Inactive">{txStatus("Inactive", lang)}</SelectItem>
            <SelectItem value="Pending">{txStatus("Pending", lang)}</SelectItem>
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
          <DataTable columns={columns} data={paginated} emptyMessage={tx("noProviders", lang)} />
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
              {tx("deleteProviderConfirm", lang)}
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
