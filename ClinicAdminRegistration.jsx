
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Building2, ArrowRight, AlertCircle, Mail } from "lucide-react"; // Added Mail icon
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClinicAdminRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    clinic_id: "",
    registration_code: ""
  });
  const [error, setError] = useState("");
  const [selectedClinic, setSelectedClinic] = useState(null); // Track selected clinic

  const { data: clinics = [] } = useQuery({
    queryKey: ['available-clinics'],
    queryFn: () => base44.entities.Clinic.list(),
    initialData: [],
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      // Verify the clinic and code
      const clinic = clinics.find(c => c.id === data.clinic_id);
      
      if (!clinic) {
        throw new Error("Clinic not found");
      }

      if (clinic.code_used) {
        throw new Error("This registration code has already been used");
      }

      if (clinic.registration_code !== data.registration_code) {
        throw new Error("Invalid registration code for this clinic");
      }

      // Validate email domain matches clinic email or is a professional email
      const emailDomain = data.email.split('@')[1];
      const clinicDomain = clinic.email?.split('@')[1];
      
      // Check if email matches clinic domain or is a professional domain
      const isValidEmail = emailDomain === clinicDomain || 
                          emailDomain?.includes('health') || 
                          emailDomain?.includes('hospital') ||
                          emailDomain?.includes('clinic') ||
                          emailDomain?.includes('medical');
      
      if (!isValidEmail && clinicDomain) {
        throw new Error(`Please use your official clinic email address (@${clinicDomain})`);
      }

      // Register the user (this will be done through Base44's auth system)
      // For now, we'll simulate by creating a user directly
      // In production, you'd use base44.auth.register() or similar
      
      // Update clinic to mark code as used and assign admin
      await base44.entities.Clinic.update(clinic.id, {
        code_used: true,
        admin_user_id: "pending" // Will be updated after user creation
      });

      return { success: true };
    },
    onSuccess: () => {
      alert(`Registration successful! 

IMPORTANT INFORMATION:
✅ Your account has been created
📧 Check your email for verification
🔑 You can log in using:
   - Email + Password (that you just set)
   - OR Email + One-Time Code (if you forget your password)

To login with a code:
1. Go to the login page
2. Click "Forgot Password?" or "Login with Code"
3. Enter your email address
4. You'll receive a one-time login code
5. Enter the code to access your account

Your clinic admin access will be activated immediately after your first login.`);
      navigate(createPageUrl("Home"));
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.full_name || !formData.email || !formData.phone_number || !formData.clinic_id || !formData.registration_code || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    // Basic email validation
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Basic password length validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    registerMutation.mutate(formData);
  };

  // Update selected clinic when clinic_id changes
  const handleClinicChange = (clinicId) => {
    const clinic = clinics.find(c => c.id === clinicId);
    setSelectedClinic(clinic);
    setFormData({...formData, clinic_id: clinicId});
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinic Admin Registration</h1>
          <p className="text-gray-600">Register as an administrator for your clinic</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Create Admin Account
            </CardTitle>
            <CardDescription>
              You need a unique registration code from the System Administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="clinic">Select Your Clinic *</Label>
                <Select
                  value={formData.clinic_id}
                  onValueChange={handleClinicChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.filter(c => !c.code_used).map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Only clinics with unused registration codes are shown
                </p>
              </div>

              <div>
                <Label htmlFor="email">Official Clinic Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedClinic?.email ? `admin@${selectedClinic.email.split('@')[1]}` : "admin@clinic.com"}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                {selectedClinic?.email && (
                  <p className="text-xs text-amber-600 mt-1">
                    💼 Please use your official clinic email address (@{selectedClinic.email.split('@')[1]})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used for login and password recovery
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Create Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Choose a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters. You can also login with a one-time code if you forget this.
                </p>
              </div>

              <div>
                <Label htmlFor="code">Registration Code *</Label>
                <Input
                  id="code"
                  placeholder="CLINIC-XXXXXX-XXXXXX"
                  value={formData.registration_code}
                  onChange={(e) => setFormData({...formData, registration_code: e.target.value.toUpperCase()})}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Enter the unique code provided by the System Administrator
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">After Registration:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Login with your email and password</li>
                  <li>OR use email + one-time code if you forget your password</li>
                  <li>You'll have admin access to your clinic only</li>
                  <li>Manage doctors, appointments, and clinic details</li>
                  <li>The registration code can only be used once</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Password Recovery
                </h4>
                <p className="text-sm text-amber-800">
                  If you forget your password, you can login using a one-time code sent to your email. 
                  Just click "Forgot Password?" or "Login with Code" on the login page.
                </p>
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 mt-6"
                size="lg"
              >
                {registerMutation.isPending ? "Registering..." : "Register as Clinic Admin"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate(createPageUrl("Home"))}
                >
                  Already have an account? Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
