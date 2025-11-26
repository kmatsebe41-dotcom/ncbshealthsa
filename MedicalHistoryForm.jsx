import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MedicalHistoryForm({ appointment, doctor, onSuccess, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: appointment.patient_id,
    doctor_id: doctor.id,
    appointment_id: appointment.id,
    visit_date: appointment.appointment_date,
    diagnosis: "",
    symptoms: appointment.reason || "",
    prescribed_medications: [],
    treatment_plan: "",
    outcome: "",
    follow_up_date: "",
    notes: "",
    attachments: [],
    doctor_name: appointment.doctor_name,
    clinic_name: appointment.clinic_name
  });

  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: ""
  });

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setFormData({
        ...formData,
        prescribed_medications: [...formData.prescribed_medications, newMedication]
      });
      setNewMedication({ name: "", dosage: "", frequency: "", duration: "" });
    }
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      prescribed_medications: formData.prescribed_medications.filter((_, i) => i !== index)
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        attachments: [...formData.attachments, file_url]
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.MedicalHistory.create(formData);
      onSuccess();
    } catch (error) {
      console.error("Error creating medical history:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient: {appointment.patient_name}</CardTitle>
          <p className="text-sm text-gray-600">
            Appointment: {appointment.appointment_date} at {appointment.appointment_time}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnosis */}
          <div>
            <Label htmlFor="diagnosis">Diagnosis *</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              placeholder="Enter medical diagnosis..."
              rows={3}
              required
            />
          </div>

          {/* Symptoms */}
          <div>
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
              placeholder="Patient symptoms..."
              rows={3}
            />
          </div>

          {/* Medications */}
          <div>
            <Label>Prescribed Medications</Label>
            <div className="space-y-2 mb-3">
              {formData.prescribed_medications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-gray-600">
                      {med.dosage} - {med.frequency} for {med.duration}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <Input
                placeholder="Medication name"
                value={newMedication.name}
                onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
              />
              <Input
                placeholder="Dosage"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
              />
              <Input
                placeholder="Frequency"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
              />
              <Input
                placeholder="Duration"
                value={newMedication.duration}
                onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {/* Treatment Plan */}
          <div>
            <Label htmlFor="treatment">Treatment Plan</Label>
            <Textarea
              id="treatment"
              value={formData.treatment_plan}
              onChange={(e) => setFormData({...formData, treatment_plan: e.target.value})}
              placeholder="Recommended treatment plan..."
              rows={3}
            />
          </div>

          {/* Outcome */}
          <div>
            <Label htmlFor="outcome">Treatment Outcome</Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({...formData, outcome: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improved">Improved</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="worsened">Worsened</SelectItem>
                <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up Date */}
          <div>
            <Label htmlFor="followup">Follow-up Date (if needed)</Label>
            <Input
              id="followup"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData.follow_up_date}
              onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional medical notes..."
              rows={3}
            />
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments (Test Results, Reports, etc.)</Label>
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors mt-2">
              <div className="text-center">
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Click to upload files</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.attachments.map((url, idx) => (
                  <div key={idx} className="text-sm text-teal-600">
                    ✓ Attachment {idx + 1} uploaded
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.diagnosis}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
            >
              Save Medical Record
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}