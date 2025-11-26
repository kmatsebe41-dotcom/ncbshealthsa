import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function Chatbot({ onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your healthcare assistant. How can I help you today?",
      sender: "bot"
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const quickActions = [
    { text: "📅 How do I book an appointment?", action: "book" },
    { text: "👨‍⚕️ Find a doctor", action: "find_doctor" },
    { text: "📞 Contact support", action: "contact" },
    { text: "ℹ️ About the platform", action: "about" }
  ];

  const handleQuickAction = (action) => {
    let response = "";
    let navigation = null;

    switch (action) {
      case "book":
        response = "To book an appointment:\n\n1. Click 'Book Appointment' from your dashboard\n2. Select your Province\n3. Choose a Clinic\n4. Select a Doctor\n5. Pick a date and time\n\nWould you like me to take you to the booking page?";
        navigation = "BookAppointment";
        break;
      case "find_doctor":
        response = "You can find doctors by:\n\n• Province - Browse doctors in your area\n• Specialization - Filter by medical specialty\n• Clinic - See all doctors at a specific clinic\n\nAll our doctors are HPCSA verified for your safety!";
        navigation = "BookAppointment";
        break;
      case "contact":
        response = "You can reach us at:\n\n📧 Email: karabomatsebe836@gmail.com\n📞 Phone: +27 76 569 5733\n📍 Address: Kuruman 8460, Dithakong\n\nWould you like to visit our contact page?";
        navigation = "Contact";
        break;
      case "about":
        response = "The National Clinic Booking System makes healthcare accessible across South Africa. We connect patients with verified doctors through a simple, secure platform.\n\nLearn more on our About page!";
        navigation = "About";
        break;
      default:
        response = "How can I assist you further?";
    }

    setMessages([
      ...messages,
      { id: messages.length + 1, text: quickActions.find(a => a.action === action).text, sender: "user" },
      { id: messages.length + 2, text: response, sender: "bot", navigation }
    ]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { id: messages.length + 1, text: inputValue, sender: "user" };
    setMessages([...messages, userMessage]);

    // Simple keyword matching
    let response = "";
    let navigation = null;
    const input = inputValue.toLowerCase();

    if (input.includes("book") || input.includes("appointment")) {
      response = "To book an appointment, click 'Book Appointment' in your dashboard and follow the 4-step process. Would you like me to take you there?";
      navigation = "BookAppointment";
    } else if (input.includes("doctor") || input.includes("find")) {
      response = "You can browse all available doctors by starting the booking process. All our doctors are HPCSA verified!";
      navigation = "BookAppointment";
    } else if (input.includes("contact") || input.includes("help") || input.includes("support")) {
      response = "You can contact us via email at karabomatsebe836@gmail.com or call +27 76 569 5733. Visit our contact page for more details!";
      navigation = "Contact";
    } else if (input.includes("cancel") || input.includes("change")) {
      response = "You can edit appointments up to 24 hours before the scheduled time, or cancel them anytime from your dashboard.";
    } else if (input.includes("price") || input.includes("cost") || input.includes("fee")) {
      response = "Consultation fees vary by doctor and specialization. You can see each doctor's fee when booking your appointment.";
    } else {
      response = "I'm here to help! You can ask me about booking appointments, finding doctors, or contacting support. What would you like to know?";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { id: prev.length + 1, text: response, sender: "bot", navigation }]);
    }, 500);

    setInputValue("");
  };

  const handleNavigate = (page) => {
    navigate(createPageUrl(page));
    onClose();
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-teal-100 z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Healthcare Assistant</h3>
            <p className="text-xs text-teal-50">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
              </div>
            </div>
            {message.navigation && (
              <div className="flex justify-start mt-2">
                <Button
                  size="sm"
                  onClick={() => handleNavigate(message.navigation)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Go to page →
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className="w-full text-left p-3 bg-teal-50 hover:bg-teal-100 rounded-lg text-sm text-teal-700 transition-colors"
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}