import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  Search,
  ArrowLeft,
  Shield,
  Building2,
  Mail,
  FileText,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDoctors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.email === "kmatsebe41@gmail.com") {
        if (currentUser.user_type !== "admin" || !currentUser.onboarding_completed) {
          await base44.auth.updateMe({ 
            user_type: "admin", 
            onboarding_completed: true 
          });
        }
        setUser(currentUser);
        return;
      }
      
      if (currentUser.user_type !== "admin" && currentUser.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl("Home"));
    }
  };

  const { data: doctors = [] } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => base44.entities.Doctor.list('-created_date'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['all-clinics'],
    queryFn: () => base44.entities.Clinic.list(),
    initialData: [],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => base44.entities.Province.list(),
    initialData: [],
  });

  const verifyDoctorMutation = useMutation({
    mutationFn: async (doctorId) => {
      const doctor = doctors.find(d => d.id === doctorId);
      const doctorUser = users.find(u => u.id === doctor.user_id);
      
      // Update doctor status
      const updated = await base44.entities.Doctor.update(doctorId, {
        verification_status: 'verified',
        verified_by: user.id,
        verified_date: new Date().toISOString()
      });

      // Send verification email
      if (doctorUser) {
        try {
          await base44.integrations.Core.SendEmail({
            to: doctorUser.email,
            subject: "Doctor Verification Approved - National Clinic Booking System",
            body: `
Dear Dr. ${doctorUser.full_name},

Congratulations! Your doctor profile has been verified and approved.

VERIFICATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Status: VERIFIED
👤 Name: Dr. ${doctorUser.full_name}
🏥 Specialization: ${doctor.specialization}
🔢 HPCSA Number: ${doctor.hpcsa_number}
📅 Verified Date: ${format(new Date(), "PPP")}

You can now:
• Receive appointment requests from patients
• Manage your schedule
• Access your full doctor dashboard
• Start treating patients through our platform

Important Next Steps:
1. Log in to your dashboard
2. Complete your profile (add bio, consultation fee, etc.)
3. Set your availability schedule
4. Start accepting appointments!

Your profile is now visible to patients across South Africa. Thank you for joining the National Clinic Booking System.

If you have any questions, please contact us:
📧 karabomatsebe836@gmail.com
📞 +27 76 569 5733

Welcome to the team!

Best regards,
National Clinic Booking System
Admin Team
            `
          });
        } catch (error) {
          console.error("Error sending verification email:", error);
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-doctors'] });
      setSelectedDoctor(null);
    }
  });

  const rejectDoctorMutation = useMutation({
    mutationFn: async ({ doctorId, reason }) => {
      const doctor = doctors.find(d => d.id === doctorId);
      const doctorUser = users.find(u => u.id === doctor.user_id);
      
      // Update doctor status
      const updated = await base44.entities.Doctor.update(doctorId, {
        verification_status: 'rejected',
        rejection_reason: reason,
        verified_by: user.id,
        verified_date: new Date().toISOString()
      });

      // Send rejection email
      if (doctorUser) {
        try {
          await base44.integrations.Core.SendEmail({
            to: doctorUser.email,
            subject: "Doctor Verification Status Update - National Clinic Booking System",
            body: `
Dear Dr. ${doctorUser.full_name},

Thank you for your interest in joining the National Clinic Booking System.

VERIFICATION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━
❌ Status: NOT APPROVED
📅 Review Date: ${format(new Date(), "PPP")}

Unfortunately, we are unable to verify your application at this time.

Reason:
${reason}

NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━
If you believe this is an error or would like to resubmit your application with corrected information:

1. Review the rejection reason carefully
2. Gather the correct documentation
3. Contact our support team for guidance
4. Resubmit your application

We're here to help! Contact us:
📧 karabomatsebe836@gmail.com
📞 +27 76 569 5733

Our verification process ensures the highest standards of healthcare provision on our platform. We appreciate your understanding.

Best regards,
National Clinic Booking System
Admin Team
            `
          });
        } catch (error) {
          console.error("Error sending rejection email:", error);
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-doctors'] });
      setShowRejectDialog(false);
      setSelectedDoctor(null);
      setRejectionReason("");
    }
  });

  const handleVerifyClick = (doctor) => {
    setSelectedDoctor(doctor);
    verifyDoctorMutation.mutate(doctor.id);
  };

  const handleRejectClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (rejectionReason.trim()) {
      rejectDoctorMutation.mutate({
        doctorId: selectedDoctor.id,
        reason: rejectionReason
      });
    }
  };

  const filteredDoctors = doctors
    .filter(d => d.verification_status === activeTab)
    .filter(d => {
      if (!searchTerm) return true;
      const doctorUser = users.find(u => u.id === d.user_id);
      return doctorUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             doctorUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             d.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             d.hpcsa_number?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("AdminDashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Verification Management</h1>
          <p className="text-gray-600 mt-1">Review and verify doctor registrations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {doctors.filter(d => d.verification_status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Verified Doctors</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {doctors.filter(d => d.verification_status === 'verified').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {doctors.filter(d => d.verification_status === 'rejected').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, email, specialization, or HPCSA number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({doctors.filter(d => d.verification_status === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="verified">
                    Verified ({doctors.filter(d => d.verification_status === 'verified').length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({doctors.filter(d => d.verification_status === 'rejected').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doctors Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? "Try adjusting your search" : `No ${activeTab} doctors at the moment`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => {
              const doctorUser = users.find(u => u.id === doctor.user_id);
              const clinic = clinics.find(c => c.id === doctor.clinic_id);
              const province = clinic ? provinces.find(p => p.id === clinic.province_id) : null;
              
              return (
                <Card key={doctor.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      {/* Header Section */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                            {doctorUser?.full_name?.charAt(0) || "D"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-semibold text-gray-900">
                                Dr. {doctorUser?.full_name}
                              </h3>
                              <Badge className={`${getStatusColor(doctor.verification_status)} border`}>
                                {doctor.verification_status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-teal-600 font-medium mb-3">{doctor.specialization}</p>
                            
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{doctorUser?.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 flex-shrink-0" />
                                <span>HPCSA: {doctor.hpcsa_number}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{clinic?.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>Applied: {format(new Date(doctor.created_date), "PPP")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Professional Details
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {doctor.years_experience > 0 && (
                              <p>• {doctor.years_experience} years of experience</p>
                            )}
                            {doctor.consultation_fee > 0 && (
                              <p>• Consultation Fee: R{doctor.consultation_fee}</p>
                            )}
                            <p>• Province: {province?.name || 'N/A'}</p>
                            {doctor.license_url && (
                              <a
                                href={doctor.license_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Medical License
                              </a>
                            )}
                          </div>
                        </div>

                        {doctor.bio && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Biography</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{doctor.bio}</p>
                          </div>
                        )}
                      </div>

                      {/* Verification Status Details */}
                      {doctor.verified_date && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            <strong>Reviewed:</strong> {format(new Date(doctor.verified_date), "PPP 'at' p")}
                          </p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {doctor.verification_status === 'rejected' && doctor.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Rejection Reason
                          </h4>
                          <p className="text-sm text-red-700">{doctor.rejection_reason}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {doctor.verification_status === 'pending' && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => handleVerifyClick(doctor)}
                            disabled={verifyDoctorMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify & Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectClick(doctor)}
                            disabled={rejectDoctorMutation.isPending}
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Application
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Doctor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The doctor will receive an email notification with the rejection reason you provide below.
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Rejection *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for rejection (e.g., Invalid HPCSA number, Incomplete documentation, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                This will help the doctor understand what needs to be corrected if they wish to reapply.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedDoctor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || rejectDoctorMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectDoctorMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}