
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Building2,
  Stethoscope,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Video,
  Users,
  Activity // Added Activity icon import
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);

  const [bookingData, setBookingData] = useState({
    province_id: "",
    clinic_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    appointment_type: "in-person", // Added new field
    reason: ""
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => base44.entities.Province.list(),
    initialData: [],
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => base44.entities.Clinic.list(),
    initialData: [],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  useEffect(() => {
    const loadInitialDataAndCheckUrl = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const patients = await base44.entities.Patient.filter({ user_id: currentUser.id });
        if (patients.length > 0) {
          setPatient(patients[0]);
        }
      } catch (error) {
        navigate(createPageUrl("Home"));
      }

      // Check for pre-selected clinic from URL
      const params = new URLSearchParams(location.search);
      const clinicId = params.get('clinic');
      if (clinicId && clinics.length > 0) { // Ensure clinics data is loaded
        const clinic = clinics.find(c => c.id === clinicId);
        if (clinic) {
          setBookingData(prev => ({
            ...prev,
            province_id: clinic.province_id,
            clinic_id: clinicId
          }));
          setStep(3); // Skip to doctor selection
        }
      }
    };

    loadInitialDataAndCheckUrl();
  }, [location.search, clinics, navigate]); // Add clinics and navigate as dependencies for useEffect

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData) => {
      // Generate unique meeting room ID for virtual appointments using 8x8.vc
      const meetingRoomId = appointmentData.appointment_type === "virtual"
        ? `ncbs-consult-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : null;

      const appointment = await base44.entities.Appointment.create({
        ...appointmentData,
        meeting_room_id: meetingRoomId,
        meeting_link: meetingRoomId ? `https://8x8.vc/ncbs/${meetingRoomId}` : null
      });

      // Send email notification to patient
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: "Appointment Confirmation - National Clinic Booking System",
          body: `
Dear ${user.full_name},

Your appointment has been booked successfully!

Appointment Details:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${appointmentData.appointment_date}
⏰ Time: ${appointmentData.appointment_time}
👨‍⚕️ Doctor: ${appointmentData.doctor_name}
🏥 Clinic: ${appointmentData.clinic_name}
${appointmentData.appointment_type === "virtual" ? `\n🎥 Type: Virtual Consultation\n\n⚠️ IMPORTANT: Your doctor will start the virtual session at the appointment time. You'll receive another email notification when they're ready. Please log in to your dashboard and click "Join Meeting" when notified.\n\n🔒 This will be a secure, encrypted video consultation.` : '📍 Type: In-Person Visit'}
📝 Status: Pending Confirmation

Your doctor will review and confirm your appointment shortly. You'll receive another email once confirmed.

Need to make changes? You can edit or cancel your appointment up to 24 hours before the scheduled time through your dashboard.

Thank you for choosing National Clinic Booking System!

Best regards,
National Clinic Booking System Team
          `
        });
      } catch (error) {
        console.error("Error sending email:", error);
      }

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      navigate(createPageUrl("PatientDashboard"));
    }
  });

  const filteredClinics = clinics.filter(c => c.province_id === bookingData.province_id);
  const filteredDoctors = doctors.filter(
    d => d.clinic_id === bookingData.clinic_id && d.verification_status === 'verified'
  );

  const selectedProvince = provinces.find(p => p.id === bookingData.province_id);
  const selectedClinic = clinics.find(c => c.id === bookingData.clinic_id);
  const selectedDoctor = doctors.find(d => d.id === bookingData.doctor_id);
  const selectedDoctorUser = selectedDoctor ? users.find(u => u.id === selectedDoctor.user_id) : null;
  const selectedDoctorDisplayName = selectedDoctorUser?.display_name || selectedDoctorUser?.full_name || selectedDoctorUser?.email?.split('@')[0] || "Doctor";

  const timeSlots = [
    "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
    "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const handleSubmit = async () => {
    const appointmentData = {
      patient_id: patient.id,
      doctor_id: bookingData.doctor_id,
      clinic_id: bookingData.clinic_id,
      appointment_date: bookingData.appointment_date,
      appointment_time: bookingData.appointment_time,
      appointment_type: bookingData.appointment_type,
      reason: bookingData.reason,
      status: "pending",
      patient_name: user.display_name || user.full_name || user.email?.split('@')[0],
      doctor_name: selectedDoctorDisplayName,
      clinic_name: selectedClinic?.name || "Clinic"
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("PatientDashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-600 mt-1">Follow the simple 4-step process</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Province" },
              { num: 2, label: "Clinic" },
              { num: 3, label: "Doctor" },
              { num: 4, label: "Time" }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num
                      ? "bg-gradient-to-br from-teal-500 to-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s.num ? "bg-teal-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Select Province */}
        {step === 1 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Your Province
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {provinces.map((province) => (
                  <button
                    key={province.id}
                    onClick={() => {
                      setBookingData({...bookingData, province_id: province.id, clinic_id: "", doctor_id: ""});
                      setStep(2);
                    }}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left"
                  >
                    <h3 className="font-semibold text-lg">{province.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{province.code}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Clinic */}
        {(step === 2 || (step === 3 && bookingData.clinic_id && !selectedClinic)) && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Select Clinic in {selectedProvince?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClinics.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No clinics available in this province yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClinics.map((clinic) => (
                    <button
                      key={clinic.id}
                      onClick={() => {
                        setBookingData({...bookingData, clinic_id: clinic.id, doctor_id: ""});
                        setStep(3);
                      }}
                      className={`w-full p-6 border-2 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left ${
                        bookingData.clinic_id === clinic.id ? 'border-teal-500 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex gap-4">
                        {clinic.image_url && (
                          <img
                            src={clinic.image_url}
                            alt={clinic.name}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{clinic.name}</h3>
                          <p className="text-sm text-gray-600 mb-1">{clinic.address}</p>
                          <p className="text-sm text-gray-500">{clinic.operating_hours}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setStep(1)} className="mt-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Doctor */}
        {step === 3 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Select Doctor at {selectedClinic?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDoctors.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No verified doctors available at this clinic yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDoctors.map((doctor) => {
                    const doctorUser = users.find(u => u.id === doctor.user_id);
                    const doctorDisplayName = doctorUser?.display_name || doctorUser?.full_name || doctorUser?.email?.split('@')[0] || "Doctor";
                    
                    return (
                      <button
                        key={doctor.id}
                        onClick={() => {
                          setBookingData({...bookingData, doctor_id: doctor.id});
                          setStep(4);
                        }}
                        className={`w-full p-6 border-2 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left ${
                          bookingData.doctor_id === doctor.id ? 'border-teal-500 shadow-md bg-teal-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                            {doctorDisplayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">Dr. {doctorDisplayName}</h3>
                                <p className="text-teal-600 text-sm font-medium">{doctor.specialization}</p>
                              </div>
                              {bookingData.doctor_id === doctor.id && (
                                <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
                              )}
                            </div>
                            
                            {/* Professional Details */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {doctor.years_experience > 0 && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5" />
                                  {doctor.years_experience} years
                                </span>
                              )}
                              {doctor.consultation_fee > 0 && (
                                <span className="font-semibold text-teal-600">
                                  R{doctor.consultation_fee}
                                </span>
                              )}
                            </div>
                            
                            {/* Bio */}
                            {doctor.bio && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2 bg-white p-3 rounded-lg">
                                {doctor.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" onClick={() => setStep(2)} className="mt-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Select Date & Time */}
        {step === 4 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date, Time & Appointment Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Appointment Type Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Appointment Type</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setBookingData({...bookingData, appointment_type: "in-person"})}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      bookingData.appointment_type === "in-person"
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bookingData.appointment_type === "in-person"
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">In-Person Visit</h3>
                        <p className="text-sm text-gray-600">
                          Visit the clinic for face-to-face consultation
                        </p>
                      </div>
                      {bookingData.appointment_type === "in-person" && (
                        <CheckCircle className="w-5 h-5 text-teal-500" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setBookingData({...bookingData, appointment_type: "virtual"})}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      bookingData.appointment_type === "virtual"
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bookingData.appointment_type === "virtual"
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Video className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Virtual Consultation</h3>
                        <p className="text-sm text-gray-600">
                          Secure video call from anywhere
                        </p>
                      </div>
                      {bookingData.appointment_type === "virtual" && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="date">Appointment Date *</Label>
                <input
                  id="date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.appointment_date}
                  onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="time">Appointment Time *</Label>
                <Select
                  value={bookingData.appointment_time}
                  onValueChange={(value) => setBookingData({...bookingData, appointment_time: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
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

              <div>
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe your symptoms or reason for visit..."
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                  rows={4}
                />
              </div>

              {bookingData.appointment_type === "virtual" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Virtual Consultation Requirements:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Stable internet connection</li>
                        <li>• Device with camera and microphone</li>
                        <li>• Quiet, private location</li>
                        <li>• You'll receive a meeting link after confirmation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!bookingData.appointment_date || !bookingData.appointment_time || createAppointmentMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
                >
                  {createAppointmentMutation.isPending ? "Booking..." : "Confirm Booking"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
