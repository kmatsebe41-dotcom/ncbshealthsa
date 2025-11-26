
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  Smartphone,
  Users,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check if user is the system admin
      if (currentUser.email === "kmatsebe41@gmail.com") {
        // Auto-update to admin if not already
        if (currentUser.user_type !== "admin" || !currentUser.onboarding_completed) {
          await base44.auth.updateMe({ 
            user_type: "admin", 
            onboarding_completed: true 
          });
        }
        navigate(createPageUrl("AdminDashboard"));
        return;
      }
      
      // If user is logged in, redirect based on onboarding status
      if (currentUser.onboarding_completed) {
        if (currentUser.user_type === "patient") {
          navigate(createPageUrl("PatientDashboard"));
        } else if (currentUser.user_type === "doctor") {
          navigate(createPageUrl("DoctorDashboard"));
        } else if (currentUser.user_type === "clinic_admin") {
          navigate(createPageUrl("ClinicAdminDashboard"));
        }
      } else {
        // User logged in but hasn't completed onboarding
        navigate(createPageUrl("Onboarding"));
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    // Redirect to login with next URL as Onboarding
    base44.auth.redirectToLogin(createPageUrl("Onboarding"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  const features = [
    {
      icon: Calendar,
      title: "Easy Booking",
      description: "Book appointments in minutes with our simple 4-step process"
    },
    {
      icon: Stethoscope,
      title: "Verified Doctors",
      description: "All doctors are HPCSA verified for your safety and peace of mind"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications about your appointment status"
    },
    {
      icon: MapPin,
      title: "Nationwide Coverage",
      description: "Access clinics across all provinces in South Africa"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health information is protected with enterprise-grade security"
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Book and manage appointments from any device, anywhere"
    }
  ];

  const stats = [
    { number: "500+", label: "Verified Doctors" },
    { number: "200+", label: "Partner Clinics" },
    { number: "50K+", label: "Appointments" },
    { number: "9/9", label: "Provinces Covered" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/20 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-full mb-6">
                <Activity className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">Trusted Healthcare Partner</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Health,{" "}
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Book appointments with verified doctors across South Africa. Fast, secure, and designed for your convenience.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-8 py-6 text-lg group"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("About"))}
                  className="px-8 py-6 text-lg border-2 hover:bg-gray-50"
                >
                  Learn More
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="text-3xl font-bold text-teal-600">{stat.number}</div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Floating cards effect */}
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-teal-400 to-blue-500 rounded-3xl opacity-20 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl opacity-20 blur-3xl" />
                
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <HeartPulse className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Quick Booking</h3>
                      <p className="text-sm text-gray-500">Find your doctor in 4 steps</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {["Select Province", "Choose Clinic", "Pick Doctor", "Book Slot"].map((step, idx) => (
                      <div key={step} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience healthcare booking reimagined with modern technology and user-first design
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zz4PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-teal-50 mb-8 leading-relaxed">
              Join thousands of South Africans who trust us with their healthcare needs
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-6 text-lg group"
            >
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
