import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Pencil, Ban } from "lucide-react";

interface Provider {
  id: number;
  name: string;
  role: string;
  specialty: string;
  phone: string;
  license: string;
  status: "Active" | "Inactive" | "Pending";
}

const mockProviders: Provider[] = [
  { id: 1, name: "Dr. Khalid Al-Rashid", role: "Doctor", specialty: "Family Medicine", phone: "+966 50 123 4567", license: "SM-20456", status: "Active" },
  { id: 2, name: "Dr. Fatima Al-Zahrani", role: "Doctor", specialty: "Pediatrics", phone: "+966 55 234 5678", license: "SM-20789", status: "Active" },
  { id: 3, name: "Nurse Hala Al-Otaibi", role: "Nurse", specialty: "General", phone: "+966 54 345 6789", license: "NR-10234", status: "Active" },
  { id: 4, name: "Dr. Omar Al-Qahtani", role: "Doctor", specialty: "Internal Medicine", phone: "+966 56 456 7890", license: "SM-21012", status: "Inactive" },
  { id: 5, name: "Nurse Amal Al-Harbi", role: "Nurse", specialty: "Emergency", phone: "+966 50 567 8901", license: "NR-10567", status: "Pending" },
];

const statusMap: Record<string, "active" | "inactive" | "pending"> = {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
};

export default function ProvidersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockProviders.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Provider>[] = [
    { header: "Name", accessor: "name" },
    { header: "Role", accessor: "role" },
    { header: "Specialty", accessor: "specialty" },
    { header: "Phone", accessor: "phone" },
    { header: "License #", accessor: "license" },
    {
      header: "Status",
      accessor: (row) => (
        <StatusBadge variant={statusMap[row.status]}>{row.status}</StatusBadge>
      ),
    },
    {
      header: "Actions",
      accessor: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Ban className="w-4 h-4" /></Button>
        </div>
      ),
      className: "w-[120px]",
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Healthcare Providers"
        description="Manage Healthcare Provider Information"
        actions={
          <Button onClick={() => navigate("/providers/new")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Healthcare Provider
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchFilter placeholder="Search by name..." value={search} onChange={setSearch} />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Doctor">Doctor</SelectItem>
            <SelectItem value="Nurse">Nurse</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No healthcare providers found" />
    </DashboardLayout>
  );
}
