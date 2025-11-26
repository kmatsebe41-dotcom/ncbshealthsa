
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
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Video,
  Play,
  Square,
  MessageSquare,
  FileText,
  Send,
  Download
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MedicalHistoryForm from "../components/MedicalHistoryForm";
import PatientHealthMetrics from "../components/PatientHealthMetrics";
import VirtualMeetingRoom from "../components/VirtualMeetingRoom";
import FollowUpForm from "../components/FollowUpForm";
import AppointmentMessaging from "../components/AppointmentMessaging";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingMedicalHistory, setAddingMedicalHistory] = useState(null);
  const [viewingPatientMetrics, setViewingPatientMetrics] = useState(null);
  const [startingMeeting, setStartingMeeting] = useState(null);
  const [sendingFollowUp, setSendingFollowUp] = useState(null);
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

      if (!currentUser.onboarding_completed) {
        navigate(createPageUrl("Onboarding"));
        return;
      }

      const doctors = await base44.entities.Doctor.filter({ user_id: currentUser.id });
      if (doctors.length > 0) {
        setDoctor(doctors[0]);
      }
    } catch (error) {
      console.error("Failed to load user or doctor data:", error);
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  // Updated query to show only pending and confirmed appointments on dashboard
  const { data: appointments = [] } = useQuery({
    queryKey: ['doctor-appointments', doctor?.id],
    queryFn: async () => {
      if (!doctor) return [];
      const allAppointments = await base44.entities.Appointment.filter({ doctor_id: doctor.id }, '-created_date');
      // Only show pending, confirmed, and in_progress on dashboard
      return allAppointments.filter(a =>
        a.status === 'pending' || a.status === 'confirmed' || a.status === 'in_progress'
      );
    },
    enabled: !!doctor,
    initialData: [],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status, data }) => {
      const appointment = await base44.entities.Appointment.update(id, status ? { status } : data);

      // Send email notification when status changes
      const appointmentData = appointments.find(a => a.id === id);

      if (appointmentData) {
        try {
          const patientData = await base44.entities.Patient.filter({ id: appointmentData.patient_id });

          if (patientData.length > 0) {
            const patientUser = await base44.entities.User.filter({ id: patientData[0].user_id });

            if (patientUser.length > 0) {
              // Send confirmation email
              if (status === 'confirmed') {
                await base44.integrations.Core.SendEmail({
                  to: patientUser[0].email,
                  subject: "Appointment Confirmed - National Clinic Booking System",
                  body: `
Dear ${appointmentData.patient_name},

Great news! Your appointment has been confirmed by Dr. ${user?.full_name}.

Appointment Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${format(new Date(appointmentData.appointment_date), "EEEE, MMMM d, yyyy")}
⏰ Time: ${appointmentData.appointment_time}
👨⚕️ Doctor: Dr. ${user?.full_name}
🏥 Clinic: ${appointmentData.clinic_name || 'N/A'}
✅ Status: Confirmed

Please arrive 10 minutes early for registration.

If you need to reschedule or cancel, please do so at least 24 hours in advance through your dashboard.

See you soon!

Best regards,
National Clinic Booking System Team
                  `
                });
              }

              // Send rejection email
              if (status === 'cancelled') {
                await base44.integrations.Core.SendEmail({
                  to: patientUser[0].email,
                  subject: "Appointment Update - National Clinic Booking System",
                  body: `
Dear ${appointmentData.patient_name},

We regret to inform you that your appointment has been declined by Dr. ${user?.full_name}.

Appointment Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${format(new Date(appointmentData.appointment_date), "EEEE, MMMM d, yyyy")}
⏰ Time: ${appointmentData.appointment_time}
👨⚕️ Doctor: Dr. ${user?.full_name}
🏥 Clinic: ${appointmentData.clinic_name || 'N/A'}
❌ Status: Declined

We apologize for any inconvenience. This may be due to scheduling conflicts or the doctor's availability.

You can book a new appointment with another doctor or different time slot through your dashboard.

Need help? Contact us at karabomatsebe836@gmail.com or +27 76 569 5733

Best regards,
National Clinic Booking System Team
                  `
                });
              }
            }
          }
        } catch (error) {
          console.error("Error sending email notification:", error);
        }
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['all-doctor-messages'] });
    }
  });

  const handleStartVirtualSession = async (appointment) => {
    // Update appointment status and start session
    await updateAppointmentMutation.mutate({
      id: appointment.id,
      data: {
        virtual_session_started: true,
        session_start_time: new Date().toISOString(),
        status: 'in_progress'
      }
    });

    // Send email notification to patient
    try {
      const patients = await base44.entities.Patient.filter({ id: appointment.patient_id });
      if (patients.length > 0) {
        const patient = patients[0];
        const patientUsers = await base44.entities.User.filter({ id: patient.user_id });
        if (patientUsers.length > 0) {
          const patientUser = patientUsers[0];
          
          await base44.integrations.Core.SendEmail({
            to: patientUser.email,
            subject: "🎥 Your Doctor is Ready - Join Virtual Consultation Now",
            body: `
Dear ${appointment.patient_name},

Dr. ${appointment.doctor_name} has started your virtual consultation session and is waiting for you!

📋 APPOINTMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")}
⏰ Time: ${appointment.appointment_time}
👨‍⚕️ Doctor: Dr. ${appointment.doctor_name}

🎥 JOIN NOW:
1. Log in to your dashboard at: ${window.location.origin}
2. Find your appointment with Dr. ${appointment.doctor_name}
3. Click the green "Join Meeting Now" button
4. Your browser will open a secure video consultation

⚠️ IMPORTANT:
• Your doctor is waiting for you online right now
• This is a secure, encrypted video session
• Make sure you're in a quiet, private location
• Check that your camera and microphone are working

Need help? Contact us at karabomatsebe836@gmail.com or +27 76 569 5733

Best regards,
National Clinic Booking System Team
            `
          });
        }
      }
    } catch (error) {
      console.error("Error sending patient notification:", error);
    }

    setStartingMeeting(appointment);
  };

  const handleEndVirtualSession = async () => {
    if (startingMeeting) {
      await updateAppointmentMutation.mutate({
        id: startingMeeting.id,
        data: {
          virtual_session_ended: true,
          session_end_time: new Date().toISOString(),
          status: 'completed'
        }
      });
      setStartingMeeting(null);
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

  const stats = [
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Pending",
      value: appointments.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Completed",
      value: appointments.filter(a => a.status === 'completed').length,
      icon: CheckCircle,
      color: "from-green-500 to-teal-500"
    }
  ];

  // Query for unread messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['all-doctor-messages', doctor?.id],
    queryFn: async () => {
      if (!doctor) return [];
      const doctorAppointments = await base44.entities.Appointment.filter({ doctor_id: doctor.id });
      const appointmentIds = doctorAppointments.map(a => a.id);

      const messages = [];
      for (const id of appointmentIds) {
        const msgs = await base44.entities.AppointmentMessage.filter({ appointment_id: id });
        messages.push(...msgs);
      }
      return messages;
    },
    enabled: !!doctor,
    initialData: [],
  });

  const getUnreadCount = (appointmentId) => {
    return allMessages.filter(
      m => m.appointment_id === appointmentId && !m.read && m.sender_type === 'patient'
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
        {/* Enhanced Header with Profile Information */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Profile Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
                {displayName?.charAt(0)?.toUpperCase() || "D"}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Dr. {displayName}</h1>
                <p className="text-lg text-teal-600 font-medium mt-1">{doctor?.specialization}</p>

                {/* Professional Details */}
                {doctor && (
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    {doctor.years_experience > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4" />
                        <span>{doctor.years_experience} years experience</span>
                      </div>
                    )}
                    {doctor.consultation_fee > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">R{doctor.consultation_fee}</span>
                        <span>consultation fee</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Verification Badge */}
            {doctor && (
              <Badge className={`${
                doctor.verification_status === 'verified'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : doctor.verification_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  : 'bg-red-100 text-red-700 border-red-200'
              } border flex items-center gap-2 px-4 py-2 text-sm`}>
                <Shield className="w-4 h-4" />
                {doctor.verification_status === 'verified' && 'Verified Doctor'}
                {doctor.verification_status === 'pending' && 'Verification Pending'}
                {doctor.verification_status === 'rejected' && 'Verification Rejected'}
              </Badge>
            )}
          </div>

          {/* Bio Section */}
          {doctor?.bio && (
            <Card className="border-none shadow-lg bg-gradient-to-br from-teal-50 to-blue-50 mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  About Me
                </h3>
                <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Verification Status Alerts */}
        {doctor?.verification_status === 'pending' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Verification in Progress</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your HPCSA credentials and medical license are being reviewed by our admin team.
                    You'll be able to receive appointments once verified. This typically takes 1-3 business days.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    <strong>Applied:</strong> {format(new Date(doctor.created_date), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {doctor?.verification_status === 'rejected' && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Verification Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Unfortunately, your doctor verification application was not approved.
                  </p>

                  {doctor.rejection_reason && (
                    <div className="mt-4 p-4 bg-white border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">Rejection Reason:</h4>
                      <p className="text-sm text-red-800">{doctor.rejection_reason}</p>
                    </div>
                  )}

                  {doctor.verified_date && (
                    <p className="text-sm text-red-600 mt-3">
                      <strong>Reviewed:</strong> {format(new Date(doctor.verified_date), "PPP 'at' p")}
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-white border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">What can I do?</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Review the rejection reason carefully</li>
                      <li>Correct any issues with your documentation</li>
                      <li>Contact our support team for assistance</li>
                      <li>Resubmit your application with correct information</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      <p><strong>Need help?</strong></p>
                      <p>📧 Email: karabomatsebe836@gmail.com</p>
                      <p>📞 Phone: +27 76 569 5733</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {doctor?.verification_status === 'verified' && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Account Verified</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your account is verified and active. You can now receive and manage patient appointments.
                  </p>
                  {doctor.verified_date && (
                    <p className="text-sm text-green-600 mt-2">
                      <strong>Verified:</strong> {format(new Date(doctor.verified_date), "PPP")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Appointments List */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Appointments
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("DoctorAppointments"))}
              >
                View Completed
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Appointments</h3>
                <p className="text-gray-600">New appointment requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const unreadCount = getUnreadCount(appointment.id);

                  return (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Badge className={`${getStatusColor(appointment.status)} border`}>
                              {appointment.status.replace('_', ' ')}
                            </Badge>
                            {appointment.appointment_type === "virtual" && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Virtual Consultation
                              </Badge>
                            )}
                            {unreadCount > 0 && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 border">
                                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
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
                          {appointment.appointment_type === "virtual" && (
                            <div className="mt-3 space-y-2">
                              {!appointment.virtual_session_started && appointment.status === "confirmed" && (
                                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800 flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    <span>Ready to start virtual consultation</span>
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Click "Start Virtual Session" below. The patient will be notified immediately to join.
                                  </p>
                                </div>
                              )}
                              {appointment.virtual_session_started && !appointment.virtual_session_ended && (
                                <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                                  <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                                    <Video className="w-4 h-4 animate-pulse" />
                                    <span>Virtual session in progress</span>
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Started at {new Date(appointment.session_start_time).toLocaleTimeString()}
                                  </p>
                                  <p className="text-xs text-green-700 mt-1">
                                    Patient has been notified and can join anytime.
                                  </p>
                                </div>
                              )}
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

                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: 'confirmed' })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: 'cancelled' })}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setViewingPatientMetrics(appointment)}
                                variant="outline"
                                className="text-teal-600 hover:text-teal-700"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Health Data
                              </Button>
                              {appointment.appointment_type === "virtual" && !appointment.virtual_session_started ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartVirtualSession(appointment)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Virtual Session
                                </Button>
                              ) : appointment.appointment_type === "in-person" ? (
                                <Button
                                  size="sm"
                                  onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: 'in_progress' })}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Start
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: 'completed' })}
                                variant="outline"
                              >
                                Complete
                              </Button>
                            </>
                          )}
                          {appointment.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setViewingPatientMetrics(appointment)}
                                variant="outline"
                                className="text-teal-600 hover:text-teal-700"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Health Data
                              </Button>
                              {appointment.appointment_type === "virtual" && appointment.virtual_session_started ? (
                                <Button
                                  size="sm"
                                  onClick={() => setStartingMeeting(appointment)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Video className="w-4 h-4 mr-2" />
                                  {startingMeeting?.id === appointment.id ? "Rejoin Meeting" : "Enter Meeting Room"}
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentMutation.mutate({ id: appointment.id, status: 'completed' })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete
                              </Button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setViewingPatientMetrics(appointment)}
                                variant="outline"
                                className="text-teal-600 hover:text-teal-700"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Health Data
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setSendingFollowUp(appointment)}
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Follow-up
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setAddingMedicalHistory(appointment)}
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                Add Medical Record
                              </Button>
                            </>
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

      {/* Virtual Meeting Room */}
      {startingMeeting && (
        <VirtualMeetingRoom
          appointment={startingMeeting}
          userType="doctor"
          currentUser={user}
          onEndSession={handleEndVirtualSession}
          onClose={() => setStartingMeeting(null)}
        />
      )}

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

      {/* Follow-up Dialog */}
      <Dialog open={!!sendingFollowUp} onOpenChange={() => setSendingFollowUp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Follow-up Instructions</DialogTitle>
          </DialogHeader>
          {sendingFollowUp && (
            <FollowUpForm
              appointment={sendingFollowUp}
              doctor={doctor}
              onSuccess={() => {
                setSendingFollowUp(null);
                queryClient.invalidateQueries({ queryKey: ['appointment-messages'] });
              }}
              onCancel={() => setSendingFollowUp(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Medical History Dialog */}
      <Dialog open={!!addingMedicalHistory} onOpenChange={() => setAddingMedicalHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Medical History Record</DialogTitle>
          </DialogHeader>
          {addingMedicalHistory && (
            <MedicalHistoryForm
              appointment={addingMedicalHistory}
              doctor={doctor}
              onSuccess={() => {
                setAddingMedicalHistory(null);
                queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
              }}
              onCancel={() => setAddingMedicalHistory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
