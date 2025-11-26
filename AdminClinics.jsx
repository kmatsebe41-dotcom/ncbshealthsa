
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Plus,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Shield // Added Shield import
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge"; // Added Badge import

export default function AdminClinics() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [viewingCode, setViewingCode] = useState(null); // Added new state
  const [currentUser, setCurrentUser] = useState(null); // Added to track current user
  const [formData, setFormData] = useState({
    name: "",
    province_id: "",
    address: "",
    contact_number: "",
    email: "",
    operating_hours: "",
    image_url: ""
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user); // Store current user
      if (user.user_type !== "admin" && user.role !== "admin") {
        navigate(createPageUrl("Home"));
      }
    } catch (error) {
      navigate(createPageUrl("Home"));
    }
  };

  // Check if current user is the super admin
  const isSuperAdmin = currentUser?.email === "kmatsebe41@gmail.com";

  const { data: clinics = [] } = useQuery({
    queryKey: ['all-clinics'],
    queryFn: () => base44.entities.Clinic.list('-created_date'),
    initialData: [],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => base44.entities.Province.list(),
    initialData: [],
  });

  const createClinicMutation = useMutation({
    mutationFn: async (clinicData) => {
      // Generate unique registration code
      const code = `CLINIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return await base44.entities.Clinic.create({
        ...clinicData,
        registration_code: code,
        code_used: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      setShowDialog(false);
      setFormData({
        name: "",
        province_id: "",
        address: "",
        contact_number: "",
        email: "",
        operating_hours: "",
        image_url: ""
      });
    }
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (clinicId) => {
      // Generate new unique registration code
      const code = `CLINIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return await base44.entities.Clinic.update(clinicId, {
        registration_code: code,
        code_used: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clinics'] });
      alert("Registration code generated successfully!");
    }
  });

  const copyToClipboard = (text) => {
    if (!text) {
      alert("No registration code available. Please generate one first.");
      return;
    }
    navigator.clipboard.writeText(text);
    alert("Registration code copied to clipboard!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createClinicMutation.mutate(formData);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Clinics</h1>
              <p className="text-gray-600 mt-1">Add and manage clinic locations</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clinic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Clinic</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Clinic Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province_id}
                      onValueChange={(value) => setFormData({...formData, province_id: value})}
                      required
                    >
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
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact">Contact Number *</Label>
                      <Input
                        id="contact"
                        type="tel"
                        value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hours">Operating Hours</Label>
                    <Input
                      id="hours"
                      placeholder="e.g., Mon-Fri 8:00-17:00"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createClinicMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
                    >
                      {createClinicMutation.isPending ? "Creating..." : "Create Clinic"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Super Admin Notice */}
        {isSuperAdmin && (
          <Card className="mb-6 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    🔐 Super Admin Access
                  </h3>
                  <p className="text-purple-800 mb-3">
                    You are logged in as the System Administrator. Registration codes are visible only to you.
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">📋 How to Create a Clinic Admin:</h4>
                    <ol className="text-sm text-purple-800 space-y-1">
                      <li>1. Click "Add Clinic" to create a new clinic (a code is auto-generated)</li>
                      <li>2. For existing clinics without codes, click "Generate Code" button</li>
                      <li>3. Click the 👁️ "Show Code" button to reveal the registration code</li>
                      <li>4. Click the 📋 "Copy Code" button to copy it to your clipboard</li>
                      <li>5. Share the code securely with the clinic manager</li>
                      <li>6. The admin uses it during registration on the Onboarding page</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Clinics</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{clinics.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Provinces Covered</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {new Set(clinics.map(c => c.province_id)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Avg per Province</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {provinces.length > 0 ? Math.round(clinics.length / provinces.length) : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.length === 0 ? (
            <Card className="col-span-full border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clinics Yet</h3>
                <p className="text-gray-600 mb-6">Add your first clinic to get started</p>
                <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-teal-500 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clinic
                </Button>
              </CardContent>
            </Card>
          ) : (
            clinics.map((clinic) => {
              const province = provinces.find(p => p.id === clinic.province_id);
              const hasCode = clinic.registration_code && clinic.registration_code.trim() !== "";
              
              return (
                <Card key={clinic.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    {clinic.image_url && (
                      <img
                        src={clinic.image_url}
                        alt={clinic.name}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{clinic.name}</h3>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{clinic.address}</span>
                        </div>
                        {province && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{province.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{clinic.contact_number}</span>
                        </div>
                        {clinic.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{clinic.email}</span>
                          </div>
                        )}
                        {clinic.operating_hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{clinic.operating_hours}</span>
                          </div>
                        )}
                      </div>

                      {/* Registration Code Section - Only visible to Super Admin */}
                      {isSuperAdmin && (
                        <div className="mt-4 pt-4 border-t-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-600" />
                              <Label className="text-sm font-bold text-purple-900">Admin Registration Code</Label>
                            </div>
                            {!hasCode ? (
                              <Badge className="bg-red-100 text-red-700 text-xs border-red-300">❌ No Code</Badge>
                            ) : clinic.code_used ? (
                              <Badge className="bg-green-100 text-green-700 text-xs border-green-300">✅ Used</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs border-yellow-300 animate-pulse">⚠️ Unused</Badge>
                            )}
                          </div>
                          
                          {!hasCode ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                                <p className="text-xs text-red-900 mb-2">
                                  <strong>⚠️ No Registration Code:</strong> This clinic was created before the admin registration feature was added.
                                </p>
                              </div>
                              <Button
                                onClick={() => generateCodeMutation.mutate(clinic.id)}
                                disabled={generateCodeMutation.isPending}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                size="sm"
                              >
                                {generateCodeMutation.isPending ? "Generating..." : "Generate Registration Code"}
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2 mb-3">
                                <div className="flex-1 bg-white rounded-lg px-4 py-3 font-mono text-sm break-all border-2 border-purple-300 shadow-inner">
                                  {viewingCode === clinic.id ? (
                                    <span className="text-purple-900 font-bold">{clinic.registration_code}</span>
                                  ) : (
                                    <span className="text-gray-400">•••••••••••• (Click eye to reveal)</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-purple-300 hover:bg-purple-100"
                                  onClick={() => setViewingCode(viewingCode === clinic.id ? null : clinic.id)}
                                >
                                  {viewingCode === clinic.id ? (
                                    <>
                                      <EyeOff className="w-4 h-4 mr-2" />
                                      Hide Code
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Show Code
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-purple-300 hover:bg-purple-100"
                                  onClick={() => copyToClipboard(clinic.registration_code)}
                                  disabled={clinic.code_used}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Code
                                </Button>
                              </div>
                              
                              <div className="mt-3 p-3 bg-white border-2 border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-800">
                                  <strong>🔐 Security Notice:</strong> This code is visible only to you (Super Admin). 
                                  Share it securely with the clinic manager to create their admin account.
                                </p>
                              </div>
                              
                              {!clinic.code_used && (
                                <div className="mt-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                  <p className="text-xs text-yellow-900">
                                    <strong>⚠️ Important:</strong> This code has not been used yet. Give it to your clinic manager.
                                  </p>
                                </div>
                              )}

                              {clinic.code_used && clinic.admin_user_id && (
                                <div className="mt-2 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                                  <p className="text-xs text-green-900">
                                    <strong>✅ Admin Registered:</strong> This code has been used. Admin is active.
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* For non-super admins, show message */}
                      {!isSuperAdmin && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <p className="text-xs text-gray-600">
                              🔒 Registration codes are only visible to the System Administrator
                            </p>
                          </div>
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
    </div>
  );
}
