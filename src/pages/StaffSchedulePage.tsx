import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Setup Localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function StaffSchedulePage() {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch<any[]>("/appointments"),
  });

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["providers"],
    queryFn: () => apiFetch<any[]>("/providers"),
  });

  // Filter appointments by selected provider
  const filteredAppointments = selectedProviderId === "all" 
    ? appointments 
    : appointments.filter(a => a.providerId?.toString() === selectedProviderId);

  // Map to react-big-calendar event format
  const events = filteredAppointments.map(appt => {
    // Safely create Date objects. Fallback to current date if missing or invalid.
    let startDate = new Date();
    let endDate = new Date();
    
    if (appt.appointmentDate) {
      const parsedDate = new Date(appt.appointmentDate);
      if (!isNaN(parsedDate.getTime())) {
        startDate = parsedDate;
        endDate = parsedDate;
      }
    }
    
    let isAllDay = true;
    
    return {
      id: appt.id,
      title: `${appt.patientName || "Unknown"} (${appt.visitType || "Routine"})`,
      start: startDate,
      end: endDate,
      allDay: isAllDay,
      resource: appt,
    };
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Healthcare Providers Schedule</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="col-span-1 md:col-span-4">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Filter by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-full md:w-[350px]">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} ({p.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div style={{ height: 650 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={["month", "week", "day"]}
              onSelectEvent={(event) => setSelectedEvent(event.resource)}
              popup
              className="font-sans"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Patient</p>
                <p className="text-lg font-semibold">{selectedEvent.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Provider</p>
                <p className="text-base">{selectedEvent.providerName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Date</p>
                  <p>{selectedEvent.appointmentDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Priority</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedEvent.priorityLevel === 'Urgent' ? 'bg-red-100 text-red-800' :
                    selectedEvent.priorityLevel === 'Soon' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedEvent.priorityLevel}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Visit Type</p>
                  <p>{selectedEvent.visitType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p>{selectedEvent.status}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Reason / Notes</p>
                <p className="text-sm bg-slate-50 p-3 rounded-md mt-1 border border-slate-100">
                  {selectedEvent.reason || "No reason provided"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
