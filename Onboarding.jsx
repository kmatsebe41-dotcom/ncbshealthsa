import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Stethoscope, 
  UserCircle, 
  ArrowRight,
  CheckCircle,
  Upload,
  Shield
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [codeError, setCodeError] = useState("");
  
  const [patientData, setPatientData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone_number: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_number: ""
  });
  
  const [doctorData, setDoctorData] = useState({
    full_name: "",
    province_id: "",
    clinic_id: "",
    specialization: "",
    hpcsa_number: "",
    bio: "",
    years_experience: "",
    consultation_fee: "",
    license_url: ""
  });

  const [clinicAdminData, setClinicAdminData] = useState({
    full_name: "",
    clinic_id: "",
    registration_code: "",
    phone_number: ""
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check if user is the system admin
      if (currentUser.email === "kmatsebe41@gmail.com") {
        // Auto-update to admin if not already
        if (currentUser.user_type !== "admin" || !currentUser.onboarding_completed) {
          await base44.auth.updateMe({ 
            user_type: "admin", 
            onboarding_completed: true 
          });
        }
        navigate(createPageUrl("AdminDashboard"));
        return;
      }
      
      // If user already completed onboarding, redirect to dashboard
      if (currentUser.onboarding_completed) {
        redirectToDashboard(currentUser.user_type);
        return;
      }
    } catch (error) {
      // User not logged in, redirect to login
      base44.auth.redirectToLogin(createPageUrl("Onboarding"));
      return;
    } finally {
      setLoading(false);
    }
  };

  const redirectToDashboard = (type) => {
    if (type === "patient") navigate(createPageUrl("PatientDashboard"));
    else if (type === "doctor") navigate(createPageUrl("DoctorDashboard"));
    else if (type === "clinic_admin") navigate(createPageUrl("ClinicAdminDashboard"));
    else if (type === "admin") navigate(createPageUrl("AdminDashboard"));
  };

  const createPatientMutation = useMutation({
    mutationFn: async () => {
      // Update user with display_name and other details
      await base44.auth.updateMe({ 
        display_name: patientData.full_name,
        user_type: "patient", 
        phone_number: patientData.phone_number,
        onboarding_completed: true
      });
      
      // Create patient record
      const patient = await base44.entities.Patient.create({
        user_id: user.id,
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        phone_number: patientData.phone_number,
        address: patientData.address,
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_number: patientData.emergency_contact_number
      });
      
      return patient;
    },
    onSuccess: () => {
      window.location.href = createPageUrl("PatientDashboard");
    }
  });

  const createDoctorMutation = useMutation({
    mutationFn: async () => {
      // Update user with display_name and other details
      await base44.auth.updateMe({ 
        display_name: doctorData.full_name,
        user_type: "doctor",
        onboarding_completed: true
      });
      
      // Create doctor record
      const doctor = await base44.entities.Doctor.create({
        user_id: user.id,
        clinic_id: doctorData.clinic_id,
        specialization: doctorData.specialization,
        hpcsa_number: doctorData.hpcsa_number,
        bio: doctorData.bio,
        years_experience: parseInt(doctorData.years_experience) || 0,
        consultation_fee: parseFloat(doctorData.consultation_fee) || 0,
        license_url: doctorData.license_url,
        verification_status: "pending"
      });
      
      return doctor;
    },
    onSuccess: () => {
      window.location.href = createPageUrl("DoctorDashboard");
    }
  });

  const createClinicAdminMutation = useMutation({
    mutationFn: async () => {
      setCodeError("");
      
      // Validate registration code
      const clinic = clinics.find(c => c.id === clinicAdminData.clinic_id);
      
      if (!clinic) {
        throw new Error("Selected clinic not found");
      }

      if (!clinic.registration_code || clinic.registration_code !== clinicAdminData.registration_code) {
        throw new Error("Invalid registration code for this clinic");
      }

      if (clinic.code_used) {
        throw new Error("This registration code has already been used");
      }

      // Update user
      await base44.auth.updateMe({ 
        display_name: clinicAdminData.full_name,
        user_type: "clinic_admin",
        clinic_id: clinicAdminData.clinic_id,
        phone_number: clinicAdminData.phone_number,
        onboarding_completed: true
      });

      // Mark the code as used and link admin
      await base44.entities.Clinic.update(clinicAdminData.clinic_id, {
        code_used: true,
        admin_user_id: user.id
      });

      return { success: true };
    },
    onSuccess: () => {
      window.location.href = createPageUrl("ClinicAdminDashboard");
    },
    onError: (error) => {
      setCodeError(error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDoctorData({...doctorData, license_url: file_url});
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (userType === "patient") {
      createPatientMutation.mutate();
    } else if (userType === "doctor") {
      createDoctorMutation.mutate();
    } else if (userType === "clinic_admin") {
      createClinicAdminMutation.mutate();
    }
  };

  const filteredClinics = clinics.filter(c => c.province_id === doctorData.province_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {step === 1 && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, {user?.full_name}!</h1>
            <p className="text-xl text-gray-600">Choose how you'd like to use the platform</p>
          </div>
        )}

        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card
              onClick={() => {
                setUserType("patient");
                setStep(2);
              }}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-teal-500"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Patient</CardTitle>
                <CardDescription className="text-base mt-2">
                  Book appointments with verified doctors and manage your healthcare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Book appointments online
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Find doctors by specialty
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    Get appointment reminders
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              onClick={() => {
                setUserType("doctor");
                setStep(2);
              }}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-500"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Doctor</CardTitle>
                <CardDescription className="text-base mt-2">
                  Manage appointments and connect with patients nationwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Manage your schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    View patient appointments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    HPCSA verification
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              onClick={() => {
                setUserType("clinic_admin");
                setStep(2);
              }}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-500"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">Clinic Admin</CardTitle>
                <CardDescription className="text-base mt-2">
                  Manage your clinic operations and oversee doctors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Manage clinic doctors
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Monitor appointments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Requires registration code
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patient Form */}
        {step === 2 && userType === "patient" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCircle className="w-6 h-6" />
                Complete Your Patient Profile
              </CardTitle>
              <CardDescription>Help us provide you with the best healthcare experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={patientData.full_name}
                  onChange={(e) => setPatientData({...patientData, full_name: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={patientData.date_of_birth}
                    onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={patientData.gender} onValueChange={(value) => setPatientData({...patientData, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={patientData.phone_number}
                  onChange={(e) => setPatientData({...patientData, phone_number: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="address">Residential Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your address"
                  value={patientData.address}
                  onChange={(e) => setPatientData({...patientData, address: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="emergency_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_name"
                    placeholder="Full name"
                    value={patientData.emergency_contact_name}
                    onChange={(e) => setPatientData({...patientData, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    placeholder="+27 XX XXX XXXX"
                    value={patientData.emergency_contact_number}
                    onChange={(e) => setPatientData({...patientData, emergency_contact_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!patientData.full_name || !patientData.phone_number || createPatientMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
                >
                  {createPatientMutation.isPending ? "Creating..." : "Complete Setup"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Doctor Form */}
        {step === 2 && userType === "doctor" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Stethoscope className="w-6 h-6" />
                Complete Your Doctor Profile
              </CardTitle>
              <CardDescription>Your profile will be verified before appearing in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name_doctor">Full Name *</Label>
                <Input
                  id="full_name_doctor"
                  placeholder="Enter your full name"
                  value={doctorData.full_name}
                  onChange={(e) => setDoctorData({...doctorData, full_name: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select value={doctorData.province_id} onValueChange={(value) => setDoctorData({...doctorData, province_id: value, clinic_id: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clinic">Clinic *</Label>
                  <Select value={doctorData.clinic_id} onValueChange={(value) => setDoctorData({...doctorData, clinic_id: value})} disabled={!doctorData.province_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  placeholder="e.g., General Practitioner, Cardiologist"
                  value={doctorData.specialization}
                  onChange={(e) => setDoctorData({...doctorData, specialization: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="hpcsa">HPCSA Number *</Label>
                <Input
                  id="hpcsa"
                  placeholder="MP1234567"
                  value={doctorData.hpcsa_number}
                  onChange={(e) => setDoctorData({...doctorData, hpcsa_number: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="license">Medical License (Optional)</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                    <div className="text-center">
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      ) : doctorData.license_url ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">License uploaded</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600">Click to upload medical license</span>
                          <p className="text-xs text-gray-500 mt-1">PDF, PNG, or JPEG</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="5"
                    value={doctorData.years_experience}
                    onChange={(e) => setDoctorData({...doctorData, years_experience: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fee">Consultation Fee (ZAR)</Label>
                  <Input
                    id="fee"
                    type="number"
                    placeholder="500"
                    value={doctorData.consultation_fee}
                    onChange={(e) => setDoctorData({...doctorData, consultation_fee: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell patients about yourself, your experience, and approach to healthcare..."
                  value={doctorData.bio}
                  onChange={(e) => setDoctorData({...doctorData, bio: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!doctorData.full_name || !doctorData.clinic_id || !doctorData.specialization || !doctorData.hpcsa_number || createDoctorMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {createDoctorMutation.isPending ? "Creating..." : "Submit for Verification"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinic Admin Form */}
        {step === 2 && userType === "clinic_admin" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Register as Clinic Admin
              </CardTitle>
              <CardDescription>You need a special registration code from the system administrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {codeError && (
                <Alert variant="destructive">
                  <AlertDescription>{codeError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="full_name_admin">Full Name *</Label>
                <Input
                  id="full_name_admin"
                  placeholder="Enter your full name"
                  value={clinicAdminData.full_name}
                  onChange={(e) => setClinicAdminData({...clinicAdminData, full_name: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="phone_admin">Phone Number *</Label>
                <Input
                  id="phone_admin"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={clinicAdminData.phone_number}
                  onChange={(e) => setClinicAdminData({...clinicAdminData, phone_number: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="clinic_select">Select Your Clinic *</Label>
                <Select value={clinicAdminData.clinic_id} onValueChange={(value) => setClinicAdminData({...clinicAdminData, clinic_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reg_code">Registration Code *</Label>
                <Input
                  id="reg_code"
                  placeholder="Enter the code provided by your clinic manager"
                  value={clinicAdminData.registration_code}
                  onChange={(e) => setClinicAdminData({...clinicAdminData, registration_code: e.target.value})}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  🔒 This code was given to you by your clinic manager or the system administrator
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">⚠️ Important Notes:</h4>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Each registration code can only be used once</li>
                  <li>• Make sure you select the correct clinic</li>
                  <li>• Contact your clinic manager if you don't have a code</li>
                  <li>• The code is case-sensitive</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!clinicAdminData.full_name || !clinicAdminData.phone_number || !clinicAdminData.clinic_id || !clinicAdminData.registration_code || createClinicAdminMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {createClinicAdminMutation.isPending ? "Verifying..." : "Register as Admin"}
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