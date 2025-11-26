

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Calendar, 
  Home, 
  Users, 
  Stethoscope, 
  Building2, 
  UserCircle,
  LogOut,
  Menu,
  X,
  HeartPulse,
  Phone,
  Info,
  MessageCircle,
  Activity // Added Activity icon for Health Metrics
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Chatbot from "./components/Chatbot";
import AutomatedReminders from "./components/AutomatedReminders";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getNavigationItems = () => {
    if (!user) {
      return [
        { name: "Home", path: createPageUrl("Home"), icon: Home },
        { name: "Find Clinics", path: createPageUrl("FindClinics"), icon: Building2 },
        { name: "About Us", path: createPageUrl("About"), icon: Info },
        { name: "Contact", path: createPageUrl("Contact"), icon: Phone },
      ];
    }

    const baseItems = [
      { name: "About Us", path: createPageUrl("About"), icon: Info },
      { name: "Contact", path: createPageUrl("Contact"), icon: Phone },
    ];

    if (user.user_type === "patient") {
      return [
        { name: "Dashboard", path: createPageUrl("PatientDashboard"), icon: Home },
        { name: "Book Appointment", path: createPageUrl("BookAppointment"), icon: Calendar },
        { name: "Health Metrics", path: createPageUrl("HealthMetrics"), icon: Activity },
        { name: "Medical History", path: createPageUrl("MedicalHistory"), icon: Users },
        { name: "Find Clinics", path: createPageUrl("FindClinics"), icon: Building2 },
        ...baseItems,
      ];
    }

    if (user.user_type === "doctor") {
      return [
        { name: "Dashboard", path: createPageUrl("DoctorDashboard"), icon: Home },
        { name: "Appointments", path: createPageUrl("DoctorAppointments"), icon: Calendar },
        ...baseItems,
      ];
    }

    if (user.user_type === "clinic_admin") {
      return [
        { name: "Dashboard", path: createPageUrl("ClinicAdminDashboard"), icon: Home },
        { name: "Doctors", path: createPageUrl("ClinicDoctors"), icon: Stethoscope },
        { name: "Appointments", path: createPageUrl("ClinicAppointments"), icon: Calendar },
        ...baseItems,
      ];
    }

    if (user.user_type === "admin") {
      return [
        { name: "Dashboard", path: createPageUrl("AdminDashboard"), icon: Home },
        { name: "Doctors", path: createPageUrl("AdminDoctors"), icon: Stethoscope },
        { name: "Clinics", path: createPageUrl("AdminClinics"), icon: Building2 },
        ...baseItems,
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  
  // Get display name (use display_name if available, otherwise fall back to full_name or email)
  const userName = user ? (user.display_name || user.full_name || user.email?.split('@')[0]) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <style>{`
        :root {
          --primary-50: #f0fdfa;
          --primary-100: #ccfbf1;
          --primary-500: #14b8a6;
          --primary-600: #0d9488;
          --primary-700: #0f766e;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-teal-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={user ? (user.user_type === "patient" ? createPageUrl("PatientDashboard") : user.user_type === "doctor" ? createPageUrl("DoctorDashboard") : createPageUrl("AdminDashboard")) : createPageUrl("Home")} className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900 leading-tight">National Clinic Booking System</h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu / Auth Buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {userName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">
                        {userName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">{userName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-teal-600 mt-1 capitalize">{user.user_type}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Onboarding"))}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                >
                  Login / Register
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    location.pathname === item.path
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Automated Reminders - runs in background */}
      {user && <AutomatedReminders />}

      {/* Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 z-50"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chatbot Component */}
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">National Clinic Booking System</h3>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Improving healthcare access through technology. Your health, our priority.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="hover:text-teal-400 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📧 karabomatsebe836@gmail.com</li>
                <li>📞 +27 76 569 5733</li>
                <li>📍 Kuruman 8460, Dithakong</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 National Clinic Booking System. Built with ❤️ for better healthcare.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

