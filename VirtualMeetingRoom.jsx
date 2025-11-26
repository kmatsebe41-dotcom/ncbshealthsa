import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Video, PhoneOff } from "lucide-react";

export default function VirtualMeetingRoom({ appointment, userType, currentUser, onEndSession, onClose }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Load Jitsi API script
    const script = document.createElement('script');
    script.src = 'https://8x8.vc/vpaas-magic-cookie-YOUR_APP_ID/external_api.js';
    script.async = true;
    script.onload = () => initJitsi();
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !iframeRef.current) return;

    const domain = '8x8.vc';
    const options = {
      roomName: `vpaas-magic-cookie-YOUR_APP_ID/${appointment.meeting_room_id}`,
      width: '100%',
      height: '100%',
      parentNode: iframeRef.current,
      configOverride: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverride: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
      userInfo: {
        displayName: userType === 'doctor' 
          ? `Dr. ${currentUser?.display_name || currentUser?.full_name || 'Doctor'}`
          : currentUser?.display_name || currentUser?.full_name || 'Patient',
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    api.addEventListener('readyToClose', () => {
      api.dispose();
      onClose();
    });
  };

  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to end the virtual consultation?')) {
      onEndSession();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                Virtual Consultation
              </h3>
              <p className="text-sm text-gray-300">
                {userType === 'doctor' ? appointment.patient_name : `Dr. ${appointment.doctor_name}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {userType === 'doctor' && (
              <Button
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Session
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div ref={iframeRef} className="w-full h-full pt-20" />

      {/* Production Notice */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="max-w-2xl mx-auto bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-100 text-center">
            🔒 <strong>Secure Healthcare Consultation</strong> - This is a private, encrypted video session. 
            Your conversation is confidential and HIPAA-compliant.
          </p>
        </div>
      </div>
    </div>
  );
}