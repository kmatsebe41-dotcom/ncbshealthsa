
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Activity,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Video,
  ExternalLink,
  MessageSquare, // New import for messaging icon
  FileText, // New import for files icon
  Download // New import for download icon
} from "lucide-react";
import { format, isPast, parseISO, differenceInHours } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppointmentReminder from "../components/AppointmentReminder";
import VirtualMeetingRoom from "../components/VirtualMeetingRoom";
import AppointmentMessaging from "../components/AppointmentMessaging"; // New import for messaging component

export default function PatientDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [joiningMeeting, setJoiningMeeting] = useState(null);
  const [viewingMessages, setViewingMessages] = useState(null); // New state for messaging dialog
  const [viewingFiles, setViewingFiles] = useState(null); // New state for files dialog
  const [editFormData, setEditFormData] = useState({
    appointment_date: "",
    appointment_time: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.user_type !== "patient") {
        navigate(createPageUrl("Home"));
        return;
      }

      if (!currentUser.onboarding_completed) {
        navigate(createPageUrl("Onboarding"));
        return;
      }

      const patients = await base44.entities.Patient.filter({ user_id: currentUser.id });
      if (patients.length > 0) {
        setPatient(patients[0]);
      }
    } catch (error) {
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['patient-appointments', patient?.id],
    queryFn: () => patient ? base44.entities.Appointment.filter({ patient_id: patient.id }, '-created_date') : [],
    enabled: !!patient,
    initialData: [],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Appointment.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      setEditingAppointment(null);
      setCancellingAppointment(null);
    }
  });

  const canEditAppointment = (appointment) => {
    if (appointment.status !== 'pending') return false;
    const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const hoursUntilAppointment = differenceInHours(appointmentDateTime, new Date());
    return hoursUntilAppointment >= 24;
  };

  const canCancelAppointment = (appointment) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed';
  };

  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment);
    setEditFormData({
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time
    });
  };

  const handleEditSubmit = () => {
    updateAppointmentMutation.mutate({
      id: editingAppointment.id,
      data: editFormData
    });
  };

  const handleCancelAppointment = () => {
    updateAppointmentMutation.mutate({
      id: cancellingAppointment.id,
      data: { status: 'cancelled' }
    });
  };

  const handleJoinMeeting = (appointment) => {
    setJoiningMeeting(appointment);
  };

  const handleEndVirtualSession = async () => {
    if (joiningMeeting) {
      await updateAppointmentMutation.mutateAsync({
        id: joiningMeeting.id,
        data: { 
          virtual_session_ended: true,
          session_end_time: new Date().toISOString()
        }
      });
      setJoiningMeeting(null);
    }
  };

  const timeSlots = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00"
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Video className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const upcomingAppointments = appointments.filter(
    a => a.status !== 'completed' && a.status !== 'cancelled'
  );

  const stats = [
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Upcoming",
      value: upcomingAppointments.length,
      icon: Clock,
      color: "from-teal-500 to-green-500"
    },
    {
      title: "Completed",
      value: appointments.filter(a => a.status === 'completed').length,
      icon: CheckCircle,
      color: "from-purple-500 to-pink-500"
    }
  ];

  // Query for unread messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-patient-messages', patient?.id],
    queryFn: async () => {
      if (!patient) return [];
      const patientAppointments = await base44.entities.Appointment.filter({ patient_id: patient.id });
      const appointmentIds = patientAppointments.map(a => a.id);
      
      const messages = [];
      for (const id of appointmentIds) {
        const msgs = await base44.entities.AppointmentMessage.filter({ appointment_id: id });
        messages.push(...msgs);
      }
      return messages;
    },
    enabled: !!patient,
    initialData: [],
  });

  const getUnreadCount = (appointmentId) => {
    return allMessages.filter(
      m => m.appointment_id === appointmentId && !m.read && m.sender_type === 'doctor'
    ).length;
  };

  // Query for shared files
  const { data: appointmentFiles = [] } = useQuery({
    queryKey: ['appointment-files', viewingFiles?.id],
    queryFn: () => viewingFiles ? base44.entities.AppointmentFile.filter({ appointment_id: viewingFiles.id }, '-created_date') : [],
    enabled: !!viewingFiles,
    initialData: [],
  });

  // Get display name
  const displayName = user ? (user.display_name || user.full_name || user.email?.split('@')[0]) : '';

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
          <p className="text-gray-600 mt-1">Manage your healthcare appointments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("BookAppointment"))}
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Book New Appointment
          </Button>
        </div>

        {/* Appointments List */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Your Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
                <p className="text-gray-600 mb-6">Book your first appointment to get started</p>
                <Button
                  onClick={() => navigate(createPageUrl("BookAppointment"))}
                  className="bg-gradient-to-r from-teal-500 to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const unreadCount = getUnreadCount(appointment.id);
                  const canJoinVirtualMeeting = appointment.appointment_type === "virtual" && 
                                                appointment.virtual_session_started && 
                                                !appointment.virtual_session_ended &&
                                                (appointment.status === "confirmed" || appointment.status === "in_progress");
                  const waitingForDoctor = appointment.appointment_type === "virtual" && 
                                          !appointment.virtual_session_started && 
                                          appointment.status === "confirmed";
                  
                  return (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Badge className={`${getStatusColor(appointment.status)} border flex items-center gap-1`}>
                              {getStatusIcon(appointment.status)}
                              {appointment.status.replace('_', ' ')}
                            </Badge>
                            {appointment.appointment_type === "virtual" && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Virtual
                              </Badge>
                            )}
                            {waitingForDoctor && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border animate-pulse flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Waiting for Doctor
                              </Badge>
                            )}
                            {canJoinVirtualMeeting && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 border animate-pulse flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Doctor is Ready!
                              </Badge>
                            )}
                            {unreadCount > 0 && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 border">
                                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Dr. {appointment.doctor_name}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{appointment.clinic_name}</span>
                            </div>
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
                            <p className="text-sm text-gray-600 mt-3">
                              <strong>Reason:</strong> {appointment.reason}
                            </p>
                          )}
                          
                          {/* Virtual Meeting Status Messages */}
                          {waitingForDoctor && (
                            <div className="mt-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                                    ⏳ Waiting for Doctor to Start Session
                                  </p>
                                  <p className="text-xs text-yellow-800">
                                    You'll receive an email and see a notification here when Dr. {appointment.doctor_name} starts the virtual consultation. Please stay nearby!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {canJoinVirtualMeeting && (
                            <div className="mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg animate-pulse">
                              <div className="flex items-start gap-3">
                                <Video className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-green-900 mb-1">
                                    🎥 Doctor is Ready! Join Now
                                  </p>
                                  <p className="text-xs text-green-800">
                                    Dr. {appointment.doctor_name} has started the session and is waiting for you. Click "Join Meeting" below to connect.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {appointment.virtual_session_ended && (
                            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-500" />
                                <span>Virtual session completed</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Messages Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingMessages(appointment)}
                            className="relative"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Messages
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </Button>

                          {/* Files Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingFiles(appointment)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Files
                          </Button>

                          {/* Virtual Meeting Controls - Only show when doctor has started */}
                          {canJoinVirtualMeeting && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinMeeting(appointment)}
                              className="bg-green-600 hover:bg-green-700 animate-pulse"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting Now
                            </Button>
                          )}
                          
                          {canEditAppointment(appointment) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(appointment)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          {canCancelAppointment(appointment) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setCancellingAppointment(appointment)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Reminders */}
      {patient && <AppointmentReminder patientId={patient.id} />}

      {/* Virtual Meeting Room */}
      {joiningMeeting && (
        <VirtualMeetingRoom
          appointment={joiningMeeting}
          userType="patient"
          currentUser={user}
          onEndSession={handleEndVirtualSession}
          onClose={() => setJoiningMeeting(null)}
        />
      )}

      {/* Messages Dialog */}
      <Dialog open={!!viewingMessages} onOpenChange={() => setViewingMessages(null)}>
        <DialogContent className="max-w-3xl h-[600px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              Messages - Dr. {viewingMessages?.doctor_name}
            </DialogTitle>
          </DialogHeader>
          {viewingMessages && (
            <AppointmentMessaging
              appointment={viewingMessages}
              currentUser={user}
              userType="patient"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={!!viewingFiles} onOpenChange={() => setViewingFiles(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shared Files - Dr. {viewingFiles?.doctor_name}</DialogTitle>
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
                      <p className="text-sm text-gray-500 capitalize">{file.file_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400 mt-1">Shared by {file.uploaded_by_name}</p>
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                      )}
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-date">New Date</Label>
              <input
                id="edit-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={editFormData.appointment_date}
                onChange={(e) => setEditFormData({...editFormData, appointment_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-time">New Time</Label>
              <Select
                value={editFormData.appointment_time}
                onValueChange={(value) => setEditFormData({...editFormData, appointment_time: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAppointment(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateAppointmentMutation.isPending}
              className="bg-gradient-to-r from-teal-500 to-blue-600"
            >
              {updateAppointmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancellingAppointment} onOpenChange={() => setCancellingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to cancel this appointment with Dr. {cancellingAppointment?.doctor_name}?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingAppointment(null)}>
              Keep Appointment
            </Button>
            <Button
              onClick={handleCancelAppointment}
              disabled={updateAppointmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateAppointmentMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
