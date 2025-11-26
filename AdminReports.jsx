import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Building2,
  Stethoscope,
  MapPin
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export default function AdminReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
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

  const { data: appointments = [] } = useQuery({
    queryKey: ['all-appointments'],
    queryFn: () => base44.entities.Appointment.list(),
    initialData: [],
  });

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

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => base44.entities.Province.list(),
    initialData: [],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['all-patients'],
    queryFn: () => base44.entities.Patient.list(),
    initialData: [],
  });

  // Appointments by month (last 6 months)
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const appointmentsByMonth = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const count = appointments.filter(a => {
      const appointmentDate = new Date(a.created_date);
      return appointmentDate >= monthStart && appointmentDate <= monthEnd;
    }).length;

    return {
      month: format(month, 'MMM yyyy'),
      appointments: count
    };
  });

  // Appointments by clinic
  const appointmentsByClinic = clinics.map(clinic => ({
    name: clinic.name,
    appointments: appointments.filter(a => a.clinic_id === clinic.id).length
  })).filter(item => item.appointments > 0)
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 10);

  // Appointments by province
  const appointmentsByProvince = provinces.map(province => {
    const provinceClinics = clinics.filter(c => c.province_id === province.id);
    const count = appointments.filter(a => 
      provinceClinics.some(c => c.id === a.clinic_id)
    ).length;
    return {
      name: province.name,
      value: count,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
  }).filter(item => item.value > 0);

  // Doctor workload
  const doctorWorkload = doctors.map(doctor => ({
    name: doctor.user_id,
    appointments: appointments.filter(a => a.doctor_id === doctor.id).length
  })).filter(item => item.appointments > 0)
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 10);

  // Status breakdown
  const statusData = [
    { name: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: '#f59e0b' },
    { name: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, color: '#3b82f6' },
    { name: 'In Progress', value: appointments.filter(a => a.status === 'in_progress').length, color: '#8b5cf6' },
    { name: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: '#10b981' },
    { name: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const downloadCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Appointments', appointments.length],
      ['Total Doctors', doctors.length],
      ['Total Clinics', clinics.length],
      ['Total Patients', patients.length],
      ['Verified Doctors', doctors.filter(d => d.verification_status === 'verified').length],
      ['Pending Appointments', appointments.filter(a => a.status === 'pending').length],
      ['Completed Appointments', appointments.filter(a => a.status === 'completed').length],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
              <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
              <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
            </div>
            <Button onClick={downloadCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{appointments.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Active Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{patients.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Verified Doctors</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {doctors.filter(d => d.verification_status === 'verified').length}
                  </p>
                </div>
                <Stethoscope className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Clinics</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{clinics.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Appointments Trend */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Appointments Trend (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="appointments" stroke="#14b8a6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          {statusData.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Clinics */}
          {appointmentsByClinic.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Top Performing Clinics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={appointmentsByClinic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Province Distribution */}
          {appointmentsByProvince.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Appointments by Province
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentsByProvince}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentsByProvince.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">System Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-semibold">{patients.length + doctors.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">
                      {appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Cancellation Rate</span>
                    <span className="font-semibold">
                      {appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Verification Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Verified Doctors</span>
                    <span className="font-semibold text-green-700">
                      {doctors.filter(d => d.verification_status === 'verified').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-600">Pending Verification</span>
                    <span className="font-semibold text-yellow-700">
                      {doctors.filter(d => d.verification_status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-600">Rejected</span>
                    <span className="font-semibold text-red-700">
                      {doctors.filter(d => d.verification_status === 'rejected').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}