import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Phone, Save, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    display_name: "",
    phone_number: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        display_name: currentUser.display_name || "",
        phone_number: currentUser.phone_number || ""
      });
    } catch (error) {
      navigate(createPageUrl("Home"));
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      setError("");
      
      const trimmedName = data.display_name.trim();
      
      if (!trimmedName || trimmedName.length < 2) {
        throw new Error("Full name must be at least 2 characters long");
      }
      
      // Update with display_name (custom field, not built-in full_name)
      await base44.auth.updateMe({
        display_name: trimmedName,
        phone_number: data.phone_number
      });
      
      return { 
        success: true, 
        display_name: trimmedName,
        phone_number: data.phone_number
      };
    },
    onSuccess: async (result) => {
      // Update local state
      setUser(prev => ({
        ...prev,
        display_name: result.display_name,
        phone_number: result.phone_number
      }));
      
      setFormData({
        display_name: result.display_name,
        phone_number: result.phone_number
      });
      
      setShowSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        if (user.user_type === "patient") {
          navigate(createPageUrl("PatientDashboard"));
        } else if (user.user_type === "doctor") {
          navigate(createPageUrl("DoctorDashboard"));
        } else {
          navigate(createPageUrl("Home"));
        }
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || "Failed to update profile. Please try again.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    const trimmedName = formData.display_name.trim();
    
    if (!trimmedName) {
      setError("Full name is required");
      return;
    }
    
    if (trimmedName.length < 2) {
      setError("Full name must be at least 2 characters long");
      return;
    }
    
    if (trimmedName === user?.display_name && formData.phone_number === user?.phone_number) {
      setError("No changes detected. Please modify your information before saving.");
      return;
    }
    
    updateMutation.mutate({
      display_name: trimmedName,
      phone_number: formData.phone_number
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  const displayName = user.display_name || user.full_name || "User";

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Update your personal information
            </p>
          </CardHeader>
          <CardContent>
            {showSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-700 ml-2">
                  <div>
                    <p className="font-medium">✅ Profile updated successfully!</p>
                    <p className="text-sm mt-1">Redirecting to dashboard...</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-5 h-5" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            {/* Current Info Display */}
            <div className="mb-6 p-4 bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-lg">
              <h4 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Current Information:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Display Name:</span>
                  <span className="font-semibold text-gray-900">{displayName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold text-gray-900">{user.phone_number || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-semibold text-teal-600 capitalize">{user.user_type}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="display_name">Full Name *</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    className="pl-10 text-base font-medium"
                    placeholder="Enter your full name"
                    required
                    disabled={updateMutation.isPending || showSuccess}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This name will be displayed to doctors and in appointments
                </p>
                {formData.display_name && formData.display_name.trim() !== displayName && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>⚠️ Pending Change:</strong><br/>
                      From: <span className="font-semibold">"{displayName}"</span><br/>
                      To: <span className="font-semibold">"{formData.display_name.trim()}"</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="pl-10 bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="pl-10"
                    placeholder="+27 XX XXX XXXX"
                    disabled={updateMutation.isPending || showSuccess}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(user.updated_date).toLocaleString()}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || showSuccess || !formData.display_name.trim()}
                  className="bg-gradient-to-r from-teal-500 to-blue-600"
                  size="lg"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Important Note */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">📝 How it works:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Your display name is saved separately from your email</li>
                <li>• Changes take effect immediately after saving</li>
                <li>• Your updated name will appear everywhere in the app</li>
                <li>• This fixes the email-based name issue</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}