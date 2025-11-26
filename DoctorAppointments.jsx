import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowLeft, Activity, MessageSquare, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PatientHealthMetrics from "../components/PatientHealthMetrics";
import AppointmentMessaging from "../components/AppointmentMessaging";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingPatientMetrics, setViewingPatientMetrics] = useState(null);
  const [viewingMessages, setViewingMessages] = useState(null);
  const [viewingFiles, setViewingFiles] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.user_type !== "doctor") {
        navigate(createPageUrl("Home"));
        return;
      }

      const doctors = await base44.entities.Doctor.filter({ user_id: currentUser.id });
      if (doctors.length > 0) {
        setDoctor(doctors[0]);
      }
    } catch (error) {
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-completed-appointments', doctor?.id],
    queryFn: () => doctor ? base44.entities.Appointment.filter({ 
      doctor_id: doctor.id,
      status: 'completed'
    }, '-appointment_date') : [],
    enabled: !!doctor,
    initialData: [],
  });

  const { data: appointmentFiles = [] } = useQuery({
    queryKey: ['appointment-files', viewingFiles?.id],
    queryFn: () => viewingFiles ? base44.entities.AppointmentFile.filter({ appointment_id: viewingFiles.id }, '-created_date') : [],
    enabled: !!viewingFiles,
    initialData: [],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("DoctorDashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Completed Appointments</h1>
          <p className="text-gray-600 mt-1">View all your past consultations</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointment History ({appointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Appointments</h3>
                <p className="text-gray-600">Completed appointments will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-green-100 text-green-700 border-green-200 border">
                            Completed
                          </Badge>
                          {appointment.appointment_type === "virtual" && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                              Virtual Consultation
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.patient_name}
                            </h3>
                            <p className="text-sm text-gray-500">Patient</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                        </div>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingMessages(appointment)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Messages
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingFiles(appointment)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Files
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setViewingPatientMetrics(appointment)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Health Data
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Health Metrics Dialog */}
      <Dialog open={!!viewingPatientMetrics} onOpenChange={() => setViewingPatientMetrics(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Health Metrics - {viewingPatientMetrics?.patient_name}
            </DialogTitle>
          </DialogHeader>
          {viewingPatientMetrics && (
            <PatientHealthMetrics patientId={viewingPatientMetrics.patient_id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Messages Dialog */}
      <Dialog open={!!viewingMessages} onOpenChange={() => setViewingMessages(null)}>
        <DialogContent className="max-w-3xl h-[600px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              Messages - {viewingMessages?.patient_name}
            </DialogTitle>
          </DialogHeader>
          {viewingMessages && (
            <AppointmentMessaging
              appointment={viewingMessages}
              currentUser={user}
              userType="doctor"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={!!viewingFiles} onOpenChange={() => setViewingFiles(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shared Files - {viewingFiles?.patient_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {appointmentFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No files shared yet</p>
              </div>
            ) : (
              appointmentFiles.map((file) => (
                <div key={file.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{file.file_name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{file.file_type?.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400 mt-1">Shared by {file.uploaded_by_name}</p>
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}