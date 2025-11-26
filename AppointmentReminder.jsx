import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { format, differenceInHours, parseISO } from "date-fns";

export default function AppointmentReminder({ patientId }) {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!patientId) return;
    loadUpcoming();
  }, [patientId]);

  const loadUpcoming = async () => {
    try {
      const appointments = await base44.entities.Appointment.filter({
        patient_id: patientId,
        status: "confirmed"
      });

      const upcoming = appointments.filter(apt => {
        const appointmentDateTime = parseISO(`${apt.appointment_date}T${apt.appointment_time}`);
        const hoursUntil = differenceInHours(appointmentDateTime, new Date());
        return hoursUntil > 0 && hoursUntil <= 48 && !dismissed.includes(apt.id);
      });

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error("Error loading appointments:", error);
    }
  };

  const handleDismiss = (id) => {
    setDismissed([...dismissed, id]);
  };

  if (upcomingAppointments.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 space-y-3 z-40 max-w-md">
      {upcomingAppointments.map((appointment) => {
        const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const hoursUntil = differenceInHours(appointmentDateTime, new Date());

        return (
          <Card key={appointment.id} className="border-l-4 border-l-teal-500 shadow-xl animate-slide-in">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Upcoming Appointment Reminder
                  </h4>
                  <p className="text-sm text-gray-600">
                    Dr. {appointment.doctor_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(appointmentDateTime, "PPP")} at {appointment.appointment_time}
                  </p>
                  <p className="text-xs text-teal-600 mt-1 font-medium">
                    {hoursUntil < 24 ? `In ${hoursUntil} hours` : "Tomorrow"}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(appointment.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}