
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Search,
  Filter,
  Stethoscope,
  Users,
  X,
  ChevronDown,
  Mail,
  Navigation,
  Activity, // Added new icon import
  CheckCircle, // Added new icon import
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SheetTrigger } from "@/components/ui/sheet"; // Ensure SheetTrigger is imported

import { // Added new dialog imports
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FindClinics() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingClinicDoctors, setViewingClinicDoctors] = useState(null); // Added new state

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

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.filter({ verification_status: 'verified' }),
    initialData: [],
  });

  const { data: users = [] } = useQuery({ // Added new query for users
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  // Get clinic stats (doctor count, specializations)
  const getClinicStats = (clinicId) => {
    const clinicDoctors = doctors.filter(d => d.clinic_id === clinicId);
    const specializations = [...new Set(clinicDoctors.map(d => d.specialization))];
    return {
      doctorCount: clinicDoctors.length,
      specializations: specializations
    };
  };

  const getClinicDoctors = (clinicId) => { // Added new helper function
    return doctors.filter(d => d.clinic_id === clinicId);
  };

  // Get all unique specializations
  const allSpecializations = [...new Set(doctors.map(d => d.specialization))].sort();

  // Filter clinics
  const filteredClinics = clinics.filter(clinic => {
    const province = provinces.find(p => p.id === clinic.province_id);
    const stats = getClinicStats(clinic.id);

    // Search filter
    const matchesSearch = searchTerm === "" ||
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      province?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Province filter
    const matchesProvince = selectedProvince === "all" || clinic.province_id === selectedProvince;

    // Specialization filter
    const matchesSpecialization = selectedSpecializations.length === 0 ||
      selectedSpecializations.some(spec => stats.specializations.includes(spec));

    return matchesSearch && matchesProvince && matchesSpecialization;
  });

  // Sort clinics
  const sortedClinics = [...filteredClinics].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'doctors':
        return getClinicStats(b.id).doctorCount - getClinicStats(a.id).doctorCount;
      case 'province':
        const provinceA = provinces.find(p => p.id === a.province_id)?.name || '';
        const provinceB = provinces.find(p => p.id === b.province_id)?.name || '';
        return provinceA.localeCompare(provinceB);
      default:
        return 0;
    }
  });

  const handleSpecializationToggle = (spec) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== spec));
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProvince("all");
    setSelectedSpecializations([]);
    setSortBy("name");
  };

  const activeFilterCount =
    (selectedProvince !== "all" ? 1 : 0) +
    selectedSpecializations.length;

  const handleBookAppointment = (clinicId) => {
    // Navigate to booking page with clinic pre-selected
    navigate(createPageUrl("BookAppointment") + `?clinic=${clinicId}`);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Healthcare Clinics</h1>
          <p className="text-gray-600 mt-1">Search and filter clinics across South Africa</p>
        </div>

        {/* Stats Bar */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sortedClinics.length}</p>
                  <p className="text-xs text-gray-600">Clinics Found</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{new Set(clinics.map(c => c.province_id)).size}</p>
                  <p className="text-xs text-gray-600">Provinces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
                  <p className="text-xs text-gray-600">Verified Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{allSpecializations.length}</p>
                  <p className="text-xs text-gray-600">Specializations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="border-none shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search clinics by name, location, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Province Filter */}
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="doctors">Most Doctors</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Sheet */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                      Filter clinics by available specializations
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Specialization Filters */}
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Doctor Specializations
                      </Label>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {allSpecializations.map((spec) => {
                          const clinicsWithSpec = clinics.filter(clinic =>
                            getClinicStats(clinic.id).specializations.includes(spec)
                          ).length;

                          return (
                            <div key={spec} className="flex items-center space-x-2">
                              <Checkbox
                                id={spec}
                                checked={selectedSpecializations.includes(spec)}
                                onCheckedChange={() => handleSpecializationToggle(spec)}
                              />
                              <label
                                htmlFor={spec}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {spec}
                                <span className="text-xs text-gray-500 ml-2">
                                  ({clinicsWithSpec} clinic{clinicsWithSpec !== 1 ? 's' : ''})
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters Display */}
            {(selectedProvince !== "all" || selectedSpecializations.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedProvince !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {provinces.find(p => p.id === selectedProvince)?.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedProvince("all")}
                    />
                  </Badge>
                )}
                {selectedSpecializations.map((spec) => (
                  <Badge key={spec} variant="outline" className="flex items-center gap-1">
                    {spec}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleSpecializationToggle(spec)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing <strong>{sortedClinics.length}</strong> of <strong>{clinics.length}</strong> clinics
        </div>

        {/* Clinics Grid */}
        {sortedClinics.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clinics Found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedClinics.map((clinic) => {
              const province = provinces.find(p => p.id === clinic.province_id);
              const stats = getClinicStats(clinic.id);

              return (
                <Card key={clinic.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-0">
                    {clinic.image_url && (
                      <div className="relative h-48 overflow-hidden rounded-t-xl">
                        <img
                          src={clinic.image_url}
                          alt={clinic.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-gray-900 border-0">
                            {stats.doctorCount} {stats.doctorCount === 1 ? 'Doctor' : 'Doctors'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Clinic Name & Location */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                        {clinic.name}
                      </h3>

                      {province && (
                        <div className="flex items-center gap-2 text-sm text-teal-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{province.name}</span>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span className="line-clamp-2">{clinic.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{clinic.contact_number}</span>
                        </div>
                        {clinic.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{clinic.email}</span>
                          </div>
                        )}
                        {clinic.operating_hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{clinic.operating_hours}</span>
                          </div>
                        )}
                      </div>

                      {/* Specializations */}
                      {stats.specializations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Available Specializations:</h4>
                          <div className="flex flex-wrap gap-1">
                            {stats.specializations.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {stats.specializations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{stats.specializations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */} {/* Modified section */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBookAppointment(clinic.id)}
                          className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                        >
                          Book Appointment
                        </Button>
                        {stats.doctorCount > 0 && (
                          <Button
                            onClick={() => setViewingClinicDoctors(clinic)}
                            variant="outline"
                            className="border-teal-500 text-teal-600 hover:bg-teal-50"
                          >
                            View Doctors
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinic Doctors Dialog */}
      <Dialog open={!!viewingClinicDoctors} onOpenChange={() => setViewingClinicDoctors(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Doctors at {viewingClinicDoctors?.name}
            </DialogTitle>
          </DialogHeader>

          {viewingClinicDoctors && (
            <div className="space-y-4 mt-4">
              {getClinicDoctors(viewingClinicDoctors.id).length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No verified doctors available at this clinic</p>
                </div>
              ) : (
                getClinicDoctors(viewingClinicDoctors.id).map((doctor) => {
                  const doctorUser = users.find(u => u.id === doctor.user_id);
                  const doctorDisplayName = doctorUser?.display_name || doctorUser?.full_name || doctorUser?.email?.split('@')[0] || "Doctor";
                  
                  return (
                    <Card key={doctor.id} className="border-2 hover:border-teal-500 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Doctor Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                            {doctorDisplayName.charAt(0).toUpperCase()}
                          </div>

                          {/* Doctor Info */}
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              Dr. {doctorDisplayName}
                            </h3>
                            <p className="text-teal-600 font-medium mb-3">{doctor.specialization}</p>

                            {/* Professional Details */}
                            <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                              {doctor.years_experience > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Activity className="w-4 h-4" />
                                  <span>{doctor.years_experience} years experience</span>
                                </div>
                              )}
                              {doctor.consultation_fee > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-teal-600">R{doctor.consultation_fee}</span>
                                  <span>per consultation</span>
                                </div>
                              )}
                            </div>

                            {/* Bio */}
                            {doctor.bio && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                  {doctor.bio}
                                </p>
                              </div>
                            )}

                            {/* Verification Badge */}
                            <Badge className="bg-green-100 text-green-700 border-green-200 border">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              HPCSA Verified
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Book Appointment Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setViewingClinicDoctors(null);
                    handleBookAppointment(viewingClinicDoctors.id);
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                  size="lg"
                >
                  Book Appointment at {viewingClinicDoctors.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
