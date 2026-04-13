import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";

interface Patient {
  id: number;
  nationalId: string;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  status: "Registered" | "In Progress" | "Discharged";
}

const mockPatients: Patient[] = [
  { id: 1, nationalId: "1098765432", name: "Ahmed Al-Rashid", gender: "Male", dob: "1985-03-12", phone: "+966 50 111 2233", status: "Registered" },
  { id: 2, nationalId: "1087654321", name: "Sara Al-Otaibi", gender: "Female", dob: "1990-07-22", phone: "+966 55 222 3344", status: "In Progress" },
  { id: 3, nationalId: "1076543210", name: "Mohammed Al-Harbi", gender: "Male", dob: "1978-11-05", phone: "+966 54 333 4455", status: "Registered" },
  { id: 4, nationalId: "1065432109", name: "Noura Al-Salem", gender: "Female", dob: "1995-02-18", phone: "+966 56 444 5566", status: "Discharged" },
  { id: 5, nationalId: "1054321098", name: "Khalid Al-Dosari", gender: "Male", dob: "1982-09-30", phone: "+966 50 555 6677", status: "Registered" },
];

const statusMap: Record<string, "active" | "inactive" | "pending"> = {
  Registered: "active",
  "In Progress": "pending",
  Discharged: "inactive",
};

export default function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = mockPatients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.nationalId.includes(q) || p.phone.includes(q);
  });

  const columns: Column<Patient>[] = [
    { header: "Full Name", accessor: "name" },
    { header: "National ID", accessor: "nationalId" },
    { header: "Gender", accessor: "gender" },
    { header: "Date of Birth", accessor: "dob" },
    { header: "Phone", accessor: "phone" },
    {
      header: "Status",
      accessor: (row) => (
        <StatusBadge variant={statusMap[row.status]}>{row.status}</StatusBadge>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/patients/${row.id}`)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "w-[100px]",
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Patients"
        description="Manage patient records and registration."
        actions={
          <Button onClick={() => navigate("/patients/new")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Patient
          </Button>
        }
      />

      <div className="mb-4">
        <SearchFilter placeholder="Search by name, National ID, or phone..." value={search} onChange={setSearch} />
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No patients found" />
    </DashboardLayout>
  );
}
