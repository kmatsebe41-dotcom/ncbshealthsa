
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Calendar,
  TrendingUp,
  Activity,
  MapPin,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is the system admin by email
      if (currentUser.email === "kmatsebe41@gmail.com") {
        // Auto-update to admin if not already
        if (currentUser.user_type !== "admin" || !currentUser.onboarding_completed) {
          await base44.auth.updateMe({ 
            user_type: "admin", 
            onboarding_completed: true 
          });
          // Re-fetch user to get updated data if needed for display, or just proceed
          // For now, we'll just proceed as access is granted.
        }
        // Allow access
        setLoading(false);
        return;
      }

      // Check other admin criteria
      if (currentUser.user_type !== "admin" && currentUser.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
    } catch (error) {
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  const { data: doctors = [] } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => base44.entities.Doctor.list(),
    initialData: [],
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['all-clinics'],
    queryFn: () => base44.entities.Clinic.list(),
    initialData: [],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['all-appointments'],
    queryFn: () => base44.entities.Appointment.list(),
    initialData: [],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['all-patients'],
    queryFn: () => base44.entities.Patient.list(),
    initialData: [],
  });

  const stats = [
    {
      title: "Total Doctors",
      value: doctors.length,
      icon: Stethoscope,
      color: "from-blue-500 to-cyan-500",
      detail: `${doctors.filter(d => d.verification_status === 'verified').length} verified`
    },
    {
      title: "Total Clinics",
      value: clinics.length,
      icon: Building2,
      color: "from-purple-500 to-pink-500",
      detail: "Across 9 provinces"
    },
    {
      title: "Total Patients",
      value: patients.length,
      icon: Users,
      color: "from-green-500 to-teal-500",
      detail: "Registered users"
    },
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: Calendar,
      color: "from-orange-500 to-red-500",
      detail: `${appointments.filter(a => a.status === 'completed').length} completed`
    }
  ];

  // Chart data
  const appointmentsByStatus = [
    { name: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: '#f59e0b' },
    { name: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: '#3b82f6' },
    { name: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981' },
    { name: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const verificationData = [
    { name: 'Verified', value: doctors.filter(d => d.verification_status === 'verified').length, color: '#10b981' },
    { name: 'Pending', value: doctors.filter(d => d.verification_status === 'pending').length, color: '#f59e0b' },
    { name: 'Rejected', value: doctors.filter(d => d.verification_status === 'rejected').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-lg overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Button
            onClick={() => navigate(createPageUrl("AdminDoctors"))}
            variant="outline"
            className="h-auto py-6 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span className="font-semibold">Manage Doctors</span>
            </div>
            <span className="text-sm text-gray-600">
              Verify and manage doctor registrations
            </span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("AdminClinics"))}
            variant="outline"
            className="h-auto py-6 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Manage Clinics</span>
            </div>
            <span className="text-sm text-gray-600">
              Add and update clinic information
            </span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("AdminReports"))}
            variant="outline"
            className="h-auto py-6 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">View Reports</span>
            </div>
            <span className="text-sm text-gray-600">
              Detailed analytics and insights
            </span>
          </Button>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Appointments by Status */}
          {appointmentsByStatus.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Appointments by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={appointmentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Doctor Verification Status */}
          {verificationData.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Doctor Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={verificationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Verifications Alert */}
        {doctors.filter(d => d.verification_status === 'pending').length > 0 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {doctors.filter(d => d.verification_status === 'pending').length} Doctor{doctors.filter(d => d.verification_status === 'pending').length !== 1 ? 's' : ''} Awaiting Verification
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Review and verify pending doctor registrations to enable them in the system
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl("AdminDoctors"))}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Review Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
