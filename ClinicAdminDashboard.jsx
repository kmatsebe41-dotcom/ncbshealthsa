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
  Calendar,
  Activity,
  Building2,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ClinicAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkClinicAdmin();
  }, []);

  const checkClinicAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.user_type !== "clinic_admin") {
        navigate(createPageUrl("Home"));
        return;
      }

      if (!currentUser.clinic_id) {
        navigate(createPageUrl("Home"));
        return;
      }

      const clinics = await base44.entities.Clinic.filter({ id: currentUser.clinic_id });
      if (clinics.length > 0) {
        setClinic(clinics[0]);
      }
    } catch (error) {
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  const { data: doctors = [] } = useQuery({
    queryKey: ['clinic-doctors', clinic?.id],
    queryFn: () => clinic ? base44.entities.Doctor.filter({ clinic_id: clinic.id }) : [],
    enabled: !!clinic,
    initialData: [],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['clinic-appointments', clinic?.id],
    queryFn: () => clinic ? base44.entities.Appointment.filter({ clinic_id: clinic.id }) : [],
    enabled: !!clinic,
    initialData: [],
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => base44.entities.Province.list(),
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
      title: "Total Appointments",
      value: appointments.length,
      icon: Calendar,
      color: "from-orange-500 to-red-500",
      detail: `${appointments.filter(a => a.status === 'completed').length} completed`
    },
    {
      title: "Pending",
      value: appointments.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
      detail: "Awaiting confirmation"
    },
    {
      title: "Today's Appointments",
      value: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length,
      icon: Activity,
      color: "from-green-500 to-teal-500",
      detail: "Scheduled for today"
    }
  ];

  const appointmentsByStatus = [
    { name: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: '#f59e0b' },
    { name: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: '#3b82f6' },
    { name: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981' },
    { name: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  const province = provinces.find(p => p.id === clinic?.province_id);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinic Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage {clinic?.name}</p>
        </div>

        {/* Clinic Info Card */}
        <Card className="border-none shadow-lg mb-8 bg-gradient-to-br from-teal-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{clinic?.name}</h2>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{clinic?.address}</span>
                  </div>
                  {province && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{province.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{clinic?.contact_number}</span>
                  </div>
                  {clinic?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{clinic?.email}</span>
                    </div>
                  )}
                  {clinic?.operating_hours && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Clock className="w-4 h-4" />
                      <span>{clinic?.operating_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={() => navigate(createPageUrl("ClinicDoctors"))}
            variant="outline"
            className="h-auto py-6 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span className="font-semibold">Manage Doctors</span>
            </div>
            <span className="text-sm text-gray-600">
              View and manage doctors at your clinic
            </span>
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("ClinicAppointments"))}
            variant="outline"
            className="h-auto py-6 flex flex-col items-start gap-2"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">View Appointments</span>
            </div>
            <span className="text-sm text-gray-600">
              Monitor all clinic appointments
            </span>
          </Button>
        </div>

        {/* Appointments Chart */}
        {appointmentsByStatus.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Appointments Overview
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

        {/* Pending Verifications Alert */}
        {doctors.filter(d => d.verification_status === 'pending').length > 0 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {doctors.filter(d => d.verification_status === 'pending').length} Doctor{doctors.filter(d => d.verification_status === 'pending').length !== 1 ? 's' : ''} Pending Verification
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      These doctors are awaiting verification by the system administrator
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}