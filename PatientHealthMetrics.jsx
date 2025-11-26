import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PatientHealthMetrics({ patientId }) {
  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['patient-health-metrics', patientId],
    queryFn: () => base44.entities.HealthMetric.filter({ 
      patient_id: patientId,
      shared_with_doctor: true 
    }, '-recorded_date'),
    initialData: [],
  });

  const getMetricsByType = (type) => {
    return healthMetrics
      .filter(m => m.metric_type === type)
      .slice(-10)
      .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
  };

  const getLatestMetric = (type) => {
    return healthMetrics.find(m => m.metric_type === type);
  };

  const getTrend = (type) => {
    const metrics = getMetricsByType(type);
    if (metrics.length < 2) return null;
    
    const recent = metrics[metrics.length - 1].value;
    const older = metrics[0].value;
    const change = ((recent - older) / older) * 100;
    
    if (Math.abs(change) < 2) return { icon: Minus, color: "text-gray-600" };
    if (change > 0) return { icon: TrendingUp, color: "text-green-600" };
    return { icon: TrendingDown, color: "text-red-600" };
  };

  const getChartData = (type) => {
    const metrics = getMetricsByType(type);
    return metrics.map(m => ({
      date: format(new Date(m.recorded_date), 'MMM d'),
      value: m.value,
      value2: m.value_secondary
    }));
  };

  const metricTypes = [
    { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", color: "#ef4444" },
    { value: "glucose", label: "Glucose", unit: "mg/dL", color: "#f59e0b" },
    { value: "weight", label: "Weight", unit: "kg", color: "#8b5cf6" },
    { value: "heart_rate", label: "Heart Rate", unit: "bpm", color: "#ec4899" }
  ];

  if (healthMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Metrics</h3>
          <p className="text-gray-600">
            Patient hasn't logged any health metrics yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        {metricTypes.map((type) => {
          const latest = getLatestMetric(type.value);
          const trend = getTrend(type.value);
          
          if (!latest) return null;

          return (
            <Card key={type.value}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-gray-600">{type.label}</h3>
                  {trend && <trend.icon className={`w-4 h-4 ${trend.color}`} />}
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {latest.value_secondary ? `${latest.value}/${latest.value_secondary}` : latest.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{type.unit}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(latest.recorded_date), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {metricTypes.map((type) => {
          const chartData = getChartData(type.value);
          if (chartData.length === 0) return null;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{type.label}</span>
                  <Badge variant="outline">{chartData.length} readings</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    {type.value === 'blood_pressure' ? (
                      <>
                        <Line type="monotone" dataKey="value" stroke={type.color} strokeWidth={2} name="Systolic" />
                        <Line type="monotone" dataKey="value2" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                        <Legend />
                      </>
                    ) : (
                      <Line type="monotone" dataKey="value" stroke={type.color} strokeWidth={2} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {healthMetrics.slice(0, 10).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {metric.metric_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {format(new Date(metric.recorded_date), 'MMM d, yyyy')}
                    </span>
                    <span className="font-semibold">
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}