import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function HealthMetricForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    metric_type: "",
    recorded_date: new Date().toISOString().split('T')[0],
    recorded_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    value: "",
    value_secondary: "",
    unit: "",
    notes: "",
    shared_with_doctor: true
  });

  const metricTypes = [
    { 
      value: "blood_pressure", 
      label: "Blood Pressure",
      unit: "mmHg",
      placeholder: "Systolic (e.g., 120)",
      secondaryPlaceholder: "Diastolic (e.g., 80)",
      hasSecondary: true
    },
    { 
      value: "glucose", 
      label: "Blood Glucose",
      unit: "mg/dL",
      placeholder: "e.g., 95"
    },
    { 
      value: "weight", 
      label: "Weight",
      unit: "kg",
      placeholder: "e.g., 70"
    },
    { 
      value: "heart_rate", 
      label: "Heart Rate",
      unit: "bpm",
      placeholder: "e.g., 72"
    },
    { 
      value: "temperature", 
      label: "Body Temperature",
      unit: "°C",
      placeholder: "e.g., 36.5"
    },
    { 
      value: "oxygen_saturation", 
      label: "Oxygen Saturation",
      unit: "%",
      placeholder: "e.g., 98"
    },
    { 
      value: "bmi", 
      label: "BMI",
      unit: "kg/m²",
      placeholder: "e.g., 23.5"
    }
  ];

  const selectedMetric = metricTypes.find(m => m.value === formData.metric_type);

  const handleMetricTypeChange = (value) => {
    const metric = metricTypes.find(m => m.value === value);
    setFormData({
      ...formData,
      metric_type: value,
      unit: metric?.unit || "",
      value_secondary: metric?.hasSecondary ? formData.value_secondary : ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      value: parseFloat(formData.value),
      value_secondary: formData.value_secondary ? parseFloat(formData.value_secondary) : null
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {initialData ? "Edit Health Metric" : "Log Health Metric"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="metric_type">Metric Type *</Label>
            <Select value={formData.metric_type} onValueChange={handleMetricTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric type" />
              </SelectTrigger>
              <SelectContent>
                {metricTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={formData.recorded_date}
                onChange={(e) => setFormData({...formData, recorded_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.recorded_time}
                onChange={(e) => setFormData({...formData, recorded_time: e.target.value})}
              />
            </div>
          </div>

          {selectedMetric && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">
                  {selectedMetric.hasSecondary ? "Systolic" : "Value"} *
                </Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="number"
                    step="0.1"
                    placeholder={selectedMetric.placeholder}
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {selectedMetric.unit}
                  </span>
                </div>
              </div>
              {selectedMetric.hasSecondary && (
                <div>
                  <Label htmlFor="value_secondary">Diastolic *</Label>
                  <div className="relative">
                    <Input
                      id="value_secondary"
                      type="number"
                      step="0.1"
                      placeholder={selectedMetric.secondaryPlaceholder}
                      value={formData.value_secondary}
                      onChange={(e) => setFormData({...formData, value_secondary: e.target.value})}
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {selectedMetric.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context or notes..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="share"
              checked={formData.shared_with_doctor}
              onCheckedChange={(checked) => setFormData({...formData, shared_with_doctor: checked})}
            />
            <label
              htmlFor="share"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share with my doctors
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.metric_type || !formData.value}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600"
            >
              Save Metric
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}