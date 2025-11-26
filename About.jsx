import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, Target, Users, Lightbulb } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: HeartPulse,
      title: "Patient-Centered Care",
      description: "Making healthcare accessible to everyone, especially those in rural and underserved communities"
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Using technology to bridge the gap between patients and healthcare providers"
    },
    {
      icon: Users,
      title: "Reliability",
      description: "A dependable platform that clinics and patients can trust for managing healthcare services"
    },
    {
      icon: Lightbulb,
      title: "User-Friendly Design",
      description: "Simple, intuitive interface that anyone can use, regardless of technical expertise"
    }
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About National Clinic Booking System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simplifying healthcare access across South Africa through technology
          </p>
        </div>

        {/* Main Content */}
        <Card className="mb-12 border-none shadow-xl bg-gradient-to-br from-teal-50 to-blue-50">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                The National Clinic Booking System (NCBS) is a digital platform designed to simplify 
                the process of booking appointments at public clinics across South Africa.
              </p>
              <p>
                Developed by <strong>Karabo Matsebe</strong>, this system was created to reduce long 
                waiting times, improve patient management, and make healthcare services more accessible 
                to everyone — especially those in rural and underserved communities.
              </p>
              <p>
                As the sole developer, I built NCBS with the goal of using technology to make a positive 
                social impact. The platform allows patients to book appointments online, doctors to manage 
                their schedules, and clinics to operate more efficiently.
              </p>
              <p>
                My vision is to help bridge the gap between patients and healthcare providers through 
                innovation, reliability, and user-friendly design.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Developer Section */}
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About the Developer</h2>
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                <strong>Karabo Matsebe</strong> is a passionate software developer committed to 
                leveraging technology for social good. Through the National Clinic Booking System, 
                Karabo aims to transform how South Africans access healthcare services.
              </p>
              <p>
                The project represents a dedication to innovation, community service, and the belief 
                that technology can solve real-world problems and improve lives.
              </p>
            </div>
            <div className="bg-teal-50 border-l-4 border-teal-500 p-6 mt-6 rounded-r-lg">
              <p className="text-gray-700 italic">
                "My goal is to use technology to make a positive social impact and help bridge 
                the gap between patients and healthcare providers."
              </p>
              <p className="text-sm text-gray-600 mt-2">— Karabo Matsebe, Developer</p>
            </div>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">The Vision</h2>
          <p className="text-lg text-teal-50 max-w-3xl mx-auto leading-relaxed">
            To create a South Africa where every person, regardless of location or economic status, 
            can easily access quality healthcare. Through NCBS, we're working towards a future where 
            technology removes barriers and connects communities with the care they need.
          </p>
        </div>
      </div>
    </div>
  );
}