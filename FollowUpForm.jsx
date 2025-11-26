import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Activity } from "lucide-react";

export default function FollowUpForm({ appointment, doctor, onSuccess, onCancel }) {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = useState("");
  const [requestHealthMetrics, setRequestHealthMetrics] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  const metricTypes = [
    { value: "blood_pressure", label: "Blood Pressure" },
    { value: "glucose", label: "Blood Glucose" },
    { value: "weight", label: "Weight" },
    { value: "heart_rate", label: "Heart Rate" },
    { value: "temperature", label: "Body Temperature" }
  ];

  const sendFollowUpMutation = useMutation({
    mutationFn: async () => {
      // Create follow-up message
      let message = `📋 Post-Appointment Follow-up\n\n${instructions}`;
      
      if (requestHealthMetrics && selectedMetrics.length > 0) {
        message += `\n\n📊 Please track and log the following health metrics:\n`;
        selectedMetrics.forEach(metric => {
          const metricLabel = metricTypes.find(m => m.value === metric)?.label;
          message += `• ${metricLabel}\n`;
        });
      }

      await base44.entities.AppointmentMessage.create({
        appointment_id: appointment.id,
        sender_id: doctor.user_id,
        sender_name: `Dr. ${doctor.user_id}`,
        sender_type: "doctor",
        message: message,
        message_type: requestHealthMetrics ? "health_metric_request" : "follow_up"
      });

      // Send email notification
      const patientData = await base44.entities.Patient.filter({ id: appointment.patient_id });
      if (patientData.length > 0) {
        const patientUser = await base44.entities.User.filter({ id: patientData[0].user_id });
        if (patientUser.length > 0) {
          await base44.integrations.Core.SendEmail({
            to: patientUser[0].email,
            subject: "Follow-up Instructions from Your Doctor",
            body: `
Dear ${appointment.patient_name},

Dr. ${doctor.user_id} has sent you post-appointment follow-up instructions.

${message}

You can view and respond to this message in your dashboard under your appointment details.

Best regards,
National Clinic Booking System
            `
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-messages'] });
      onSuccess();
    }
  });

  const handleMetricToggle = (metric) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Follow-up Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Patient:</strong> {appointment.patient_name}<br />
            <strong>Appointment:</strong> {appointment.appointment_date} at {appointment.appointment_time}
          </p>
        </div>

        <div>
          <Label htmlFor="instructions">Follow-up Instructions *</Label>
          <Textarea
            id="instructions"
            placeholder="Enter post-appointment instructions, medication reminders, lifestyle recommendations, etc..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="mt-2"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="request-metrics"
              checked={requestHealthMetrics}
              onCheckedChange={setRequestHealthMetrics}
            />
            <label
              htmlFor="request-metrics"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Request patient to track health metrics
            </label>
          </div>

          {requestHealthMetrics && (
            <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
              <Label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Select Metrics to Track
              </Label>
              {metricTypes.map((metric) => (
                <div key={metric.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.value}
                    checked={selectedMetrics.includes(metric.value)}
                    onCheckedChange={() => handleMetricToggle(metric.value)}
                  />
                  <label
                    htmlFor={metric.value}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {metric.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => sendFollowUpMutation.mutate()}
            disabled={!instructions.trim() || sendFollowUpMutation.isPending}
            className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
          >
            {sendFollowUpMutation.isPending ? "Sending..." : "Send Follow-up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}