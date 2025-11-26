import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Pill,
  Activity,
  User,
  Building2,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";

export default function MedicalHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState(null);

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

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['medical-history', patient?.id],
    queryFn: () => patient ? base44.entities.MedicalHistory.filter({ patient_id: patient.id }, '-visit_date') : [],
    enabled: !!patient,
    initialData: [],
  });

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'improved': return 'bg-green-100 text-green-700 border-green-200';
      case 'stable': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'worsened': return 'bg-red-100 text-red-700 border-red-200';
      case 'follow_up_required': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const downloadRecord = (record) => {
    const recordData = `
MEDICAL HISTORY RECORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${user?.full_name}
Date: ${format(new Date(record.visit_date), 'PPP')}
Doctor: Dr. ${record.doctor_name}
Clinic: ${record.clinic_name}

DIAGNOSIS
${record.diagnosis}

SYMPTOMS
${record.symptoms || 'N/A'}

PRESCRIBED MEDICATIONS
${record.prescribed_medications?.map(med => 
  `- ${med.name} (${med.dosage}) - ${med.frequency} for ${med.duration}`
).join('\n') || 'None'}

TREATMENT PLAN
${record.treatment_plan || 'N/A'}

OUTCOME
${record.outcome?.replace('_', ' ').toUpperCase() || 'N/A'}

FOLLOW-UP
${record.follow_up_date ? format(new Date(record.follow_up_date), 'PPP') : 'Not required'}

NOTES
${record.notes || 'None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated from National Clinic Booking System
    `.trim();

    const blob = new Blob([recordData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${format(new Date(record.visit_date), 'yyyy-MM-dd')}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Medical History</h1>
              <p className="text-gray-600 mt-1">View your complete medical records</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-teal-600">{medicalRecords.length}</p>
            </div>
          </div>
        </div>

        {/* Medical Records */}
        {medicalRecords.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Records Yet</h3>
              <p className="text-gray-600">
                Your medical history will appear here after your appointments are completed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medicalRecords.map((record) => (
              <Card key={record.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="cursor-pointer" onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {format(new Date(record.visit_date), 'MMMM d, yyyy')}
                        </CardTitle>
                        <Badge className={`${getOutcomeColor(record.outcome)} border`}>
                          {record.outcome?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Dr. {record.doctor_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{record.clinic_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadRecord(record);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {expandedRecord === record.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedRecord === record.id && (
                  <CardContent className="border-t">
                    <div className="grid md:grid-cols-2 gap-6 pt-6">
                      {/* Diagnosis */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-600" />
                          Diagnosis
                        </h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {record.diagnosis}
                        </p>
                      </div>

                      {/* Symptoms */}
                      {record.symptoms && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Symptoms</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {record.symptoms}
                          </p>
                        </div>
                      )}

                      {/* Medications */}
                      {record.prescribed_medications && record.prescribed_medications.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-teal-600" />
                            Prescribed Medications
                          </h4>
                          <div className="space-y-2">
                            {record.prescribed_medications.map((med, idx) => (
                              <div key={idx} className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <p className="font-medium text-gray-900">{med.name}</p>
                                <div className="grid grid-cols-3 gap-2 mt-1 text-sm text-gray-600">
                                  <span>Dosage: {med.dosage}</span>
                                  <span>Frequency: {med.frequency}</span>
                                  <span>Duration: {med.duration}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Treatment Plan */}
                      {record.treatment_plan && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-gray-900 mb-2">Treatment Plan</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {record.treatment_plan}
                          </p>
                        </div>
                      )}

                      {/* Follow-up */}
                      {record.follow_up_date && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            Follow-up Required
                          </h4>
                          <p className="text-gray-700 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            {format(new Date(record.follow_up_date), 'PPP')}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {record.notes && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {record.notes}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {record.attachments && record.attachments.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                          <div className="flex flex-wrap gap-2">
                            {record.attachments.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                              >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}