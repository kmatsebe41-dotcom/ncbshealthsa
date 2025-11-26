import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInHours, parseISO, format } from "date-fns";

// This component runs in the background and sends reminders for appointments
export default function AutomatedReminders() {
  useEffect(() => {
    // Check for appointments needing reminders every 5 minutes
    const interval = setInterval(() => {
      checkAndSendReminders();
    }, 5 * 60 * 1000); // 5 minutes

    // Run immediately on mount
    checkAndSendReminders();

    return () => clearInterval(interval);
  }, []);

  const checkAndSendReminders = async () => {
    try {
      // Get all confirmed appointments
      const appointments = await base44.entities.Appointment.filter({
        status: "confirmed"
      });

      for (const appointment of appointments) {
        try {
          const appointmentDateTime = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
          const hoursUntil = differenceInHours(appointmentDateTime, new Date());

          // Send reminder if appointment is in 23-25 hours (to account for check intervals)
          if (hoursUntil >= 23 && hoursUntil <= 25) {
            await sendReminders(appointment);
          }
        } catch (error) {
          console.error("Error processing appointment:", error);
        }
      }
    } catch (error) {
      console.error("Error checking reminders:", error);
    }
  };

  const sendReminders = async (appointment) => {
    try {
      // Get patient details
      const patients = await base44.entities.Patient.filter({ id: appointment.patient_id });
      if (patients.length === 0) return;

      const patient = patients[0];
      const patientUsers = await base44.entities.User.filter({ id: patient.user_id });
      if (patientUsers.length === 0) return;

      const patientUser = patientUsers[0];

      // Get doctor details
      const doctors = await base44.entities.Doctor.filter({ id: appointment.doctor_id });
      if (doctors.length === 0) return;

      const doctor = doctors[0];
      const doctorUsers = await base44.entities.User.filter({ id: doctor.user_id });
      if (doctorUsers.length === 0) return;

      const doctorUser = doctorUsers[0];

      const appointmentDate = format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy");
      const rescheduleLink = `${window.location.origin}#/patient-dashboard`;

      // Send email to patient
      await base44.integrations.Core.SendEmail({
        to: patientUser.email,
        subject: "Reminder: Appointment Tomorrow - National Clinic Booking System",
        body: `
Dear ${appointment.patient_name},

This is a friendly reminder about your upcoming appointment.

📅 APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
📆 Date: ${appointmentDate}
⏰ Time: ${appointment.appointment_time}
👨‍⚕️ Doctor: Dr. ${appointment.doctor_name}
🏥 Clinic: ${appointment.clinic_name}

⚠️ IMPORTANT REMINDERS:
• Please arrive 10 minutes early for check-in
• Bring your ID and medical aid card (if applicable)
• Wear a mask if you have any symptoms
• Contact us if you need to reschedule

Need to make changes?
If you need to reschedule or cancel, please do so at least 24 hours before your appointment:
${rescheduleLink}

Questions?
📧 Email: karabomatsebe836@gmail.com
📞 Phone: +27 76 569 5733

We look forward to seeing you!

Best regards,
National Clinic Booking System Team
        `
      });

      // Send email to doctor
      await base44.integrations.Core.SendEmail({
        to: doctorUser.email,
        subject: "Reminder: Patient Appointment Tomorrow",
        body: `
Dear Dr. ${appointment.doctor_name},

Reminder of your confirmed appointment tomorrow:

📅 APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
📆 Date: ${appointmentDate}
⏰ Time: ${appointment.appointment_time}
👤 Patient: ${appointment.patient_name}
🏥 Clinic: ${appointment.clinic_name}

${appointment.reason ? `📝 Reason for Visit:\n${appointment.reason}\n\n` : ''}

The patient has been notified and reminded to arrive 10 minutes early.

Best regards,
National Clinic Booking System
        `
      });

      console.log(`Reminders sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error("Error sending reminders:", error);
    }
  };

  return null; // This is a background component
}