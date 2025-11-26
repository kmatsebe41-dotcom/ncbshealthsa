import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Activity,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import HealthMetricForm from "../components/HealthMetricForm";

export default function HealthMetrics() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30"); // days

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

  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['health-metrics', patient?.id],
    queryFn: () => patient ? base44.entities.HealthMetric.filter({ patient_id: patient.id }, '-recorded_date') : [],
    enabled: !!patient,
    initialData: [],
  });

  const createMetricMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HealthMetric.create({
        ...data,
        patient_id: patient.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-metrics'] });
      setShowAddForm(false);
    }
  });

  const toggleShareMutation = useMutation({
    mutationFn: async ({ id, shared }) => {
      return await base44.entities.HealthMetric.update(id, { shared_with_doctor: shared });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-metrics'] });
    }
  });

  const getMetricsByType = (type) => {
    const now = new Date();
    const cutoffDate = timeRange === "7" ? subDays(now, 7) :
                       timeRange === "30" ? subDays(now, 30) :
                       timeRange === "90" ? subMonths(now, 3) :
                       subMonths(now, 12);

    return healthMetrics
      .filter(m => m.metric_type === type && new Date(m.recorded_date) >= cutoffDate)
      .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
  };

  const getChartData = (type) => {
    const metrics = getMetricsByType(type);
    return metrics.map(m => ({
      date: format(new Date(m.recorded_date), 'MMM d'),
      value: m.value,
      value2: m.value_secondary,
      fullDate: format(new Date(m.recorded_date), 'PPP')
    }));
  };

  const getLatestMetric = (type) => {
    return healthMetrics.find(m => m.metric_type === type);
  };

  const getTrend = (type) => {
    const metrics = getMetricsByType(type).slice(-5);
    if (metrics.length < 2) return null;
    
    const recent = metrics[metrics.length - 1].value;
    const older = metrics[0].value;
    const change = ((recent - older) / older) * 100;
    
    if (Math.abs(change) < 2) return { icon: Minus, text: "Stable", color: "text-gray-600" };
    if (change > 0) return { icon: TrendingUp, text: `+${change.toFixed(1)}%`, color: "text-green-600" };
    return { icon: TrendingDown, text: `${change.toFixed(1)}%`, color: "text-red-600" };
  };

  const metricTypes = [
    { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", color: "#ef4444" },
    { value: "glucose", label: "Blood Glucose", unit: "mg/dL", color: "#f59e0b" },
    { value: "weight", label: "Weight", unit: "kg", color: "#8b5cf6" },
    { value: "heart_rate", label: "Heart Rate", unit: "bpm", color: "#ec4899" },
    { value: "temperature", label: "Temperature", unit: "°C", color: "#3b82f6" },
    { value: "oxygen_saturation", label: "O2 Saturation", unit: "%", color: "#10b981" },
    { value: "bmi", label: "BMI", unit: "kg/m²", color: "#6366f1" }
  ];

  const downloadData = () => {
    const csv = [
      ['Date', 'Time', 'Metric Type', 'Value', 'Unit', 'Notes'],
      ...healthMetrics.map(m => [
        m.recorded_date,
        m.recorded_time || '',
        m.metric_type.replace('_', ' '),
        m.value_secondary ? `${m.value}/${m.value_secondary}` : m.value,
        m.unit,
        m.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            onClick={() => navigate(createPageUrl("PatientDashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Metrics Tracker</h1>
              <p className="text-gray-600 mt-1">Monitor your health over time</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-teal-500 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Metric
              </Button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30">Last 30 Days</TabsTrigger>
              <TabsTrigger value="90">Last 3 Months</TabsTrigger>
              <TabsTrigger value="365">Last Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {metricTypes.slice(0, 4).map((type) => {
            const latest = getLatestMetric(type.value);
            const trend = getTrend(type.value);
            return (
              <Card key={type.value} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-600">{type.label}</h3>
                    {trend && <trend.icon className={`w-4 h-4 ${trend.color}`} />}
                  </div>
                  {latest ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {latest.value_secondary ? `${latest.value}/${latest.value_secondary}` : latest.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{type.unit}</p>
                      {trend && (
                        <p className={`text-xs mt-2 ${trend.color}`}>{trend.text}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No data yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
            {metricTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {metricTypes.map((type) => {
            const chartData = getChartData(type.value);
            const metrics = getMetricsByType(type.value);

            return (
              <TabsContent key={type.value} value={type.value}>
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{type.label} Trend</span>
                      <Badge variant="outline">
                        {metrics.length} reading{metrics.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                      <p className="text-sm font-semibold">{payload[0].payload.fullDate}</p>
                                      <p className="text-sm text-gray-600">
                                        {type.value === 'blood_pressure' && payload[1] ? 
                                          `${payload[0].value}/${payload[1].value} ${type.unit}` :
                                          `${payload[0].value} ${type.unit}`
                                        }
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={type.color}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              name={type.value === 'blood_pressure' ? 'Systolic' : type.label}
                            />
                            {type.value === 'blood_pressure' && (
                              <Line 
                                type="monotone" 
                                dataKey="value2" 
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name="Diastolic"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>

                        {/* Recent Readings Table */}
                        <div className="mt-8">
                          <h4 className="font-semibold text-gray-900 mb-4">Recent Readings</h4>
                          <div className="space-y-2">
                            {metrics.slice(-10).reverse().map((metric) => (
                              <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                      {format(new Date(metric.recorded_date), 'MMM d, yyyy')}
                                      {metric.recorded_time && ` at ${metric.recorded_time}`}
                                    </span>
                                    <span className="text-lg font-semibold">
                                      {metric.value_secondary ? 
                                        `${metric.value}/${metric.value_secondary}` : 
                                        metric.value
                                      } {metric.unit}
                                    </span>
                                  </div>
                                  {metric.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{metric.notes}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleShareMutation.mutate({
                                    id: metric.id,
                                    shared: !metric.shared_with_doctor
                                  })}
                                >
                                  {metric.shared_with_doctor ? (
                                    <Eye className="w-4 h-4 text-teal-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start tracking your {type.label.toLowerCase()} to see trends
                        </p>
                        <Button
                          onClick={() => setShowAddForm(true)}
                          className="bg-gradient-to-r from-teal-500 to-blue-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Log First Reading
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Info Card */}
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-teal-900 mb-2">Sharing with Doctors</h3>
                <p className="text-sm text-teal-700">
                  All metrics are shared with your doctors by default. Use the eye icon to toggle visibility for specific readings.
                  Your doctors can view this data during appointments to provide better care.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Metric Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Health Metric</DialogTitle>
          </DialogHeader>
          <HealthMetricForm
            onSubmit={(data) => createMetricMutation.mutate(data)}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}