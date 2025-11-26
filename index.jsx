import Layout from "./Layout.jsx";

import Home from "./Home";

import Onboarding from "./Onboarding";

import About from "./About";

import Contact from "./Contact";

import PatientDashboard from "./PatientDashboard";

import BookAppointment from "./BookAppointment";

import DoctorDashboard from "./DoctorDashboard";

import AdminDashboard from "./AdminDashboard";

import AdminDoctors from "./AdminDoctors";

import AdminClinics from "./AdminClinics";

import Profile from "./Profile";

import AdminReports from "./AdminReports";

import MedicalHistory from "./MedicalHistory";

import FindClinics from "./FindClinics";

import HealthMetrics from "./HealthMetrics";

import DoctorAppointments from "./DoctorAppointments";

import ClinicAdminRegistration from "./ClinicAdminRegistration";

import ClinicAdminDashboard from "./ClinicAdminDashboard";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Onboarding: Onboarding,
    
    About: About,
    
    Contact: Contact,
    
    PatientDashboard: PatientDashboard,
    
    BookAppointment: BookAppointment,
    
    DoctorDashboard: DoctorDashboard,
    
    AdminDashboard: AdminDashboard,
    
    AdminDoctors: AdminDoctors,
    
    AdminClinics: AdminClinics,
    
    Profile: Profile,
    
    AdminReports: AdminReports,
    
    MedicalHistory: MedicalHistory,
    
    FindClinics: FindClinics,
    
    HealthMetrics: HealthMetrics,
    
    DoctorAppointments: DoctorAppointments,
    
    ClinicAdminRegistration: ClinicAdminRegistration,
    
    ClinicAdminDashboard: ClinicAdminDashboard,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/PatientDashboard" element={<PatientDashboard />} />
                
                <Route path="/BookAppointment" element={<BookAppointment />} />
                
                <Route path="/DoctorDashboard" element={<DoctorDashboard />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminDoctors" element={<AdminDoctors />} />
                
                <Route path="/AdminClinics" element={<AdminClinics />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/AdminReports" element={<AdminReports />} />
                
                <Route path="/MedicalHistory" element={<MedicalHistory />} />
                
                <Route path="/FindClinics" element={<FindClinics />} />
                
                <Route path="/HealthMetrics" element={<HealthMetrics />} />
                
                <Route path="/DoctorAppointments" element={<DoctorAppointments />} />
                
                <Route path="/ClinicAdminRegistration" element={<ClinicAdminRegistration />} />
                
                <Route path="/ClinicAdminDashboard" element={<ClinicAdminDashboard />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}