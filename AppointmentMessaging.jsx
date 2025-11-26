import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";

export default function AppointmentMessaging({ appointment, currentUser, userType }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['appointment-messages', appointment.id],
    queryFn: () => base44.entities.AppointmentMessage.filter({ appointment_id: appointment.id }, 'created_date'),
    initialData: [],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await base44.entities.AppointmentMessage.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-messages'] });
      setMessage("");
    }
  });

  // Mark messages as read when viewing
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        m => !m.read && m.sender_id !== currentUser.id
      );
      
      for (const msg of unreadMessages) {
        try {
          await base44.entities.AppointmentMessage.update(msg.id, { read: true });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      }
    };

    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, currentUser.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      appointment_id: appointment.id,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      sender_type: userType,
      message: message.trim(),
      message_type: "text"
    });
  };

  const getMessageTypeLabel = (type) => {
    switch (type) {
      case 'follow_up': return 'Follow-up';
      case 'health_metric_request': return 'Health Metric Request';
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {msg.sender_name}
                    </p>
                  )}
                  
                  {msg.message_type !== 'text' && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {getMessageTypeLabel(msg.message_type)}
                    </Badge>
                  )}
                  
                  <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                    {msg.message}
                  </p>
                  
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-teal-100' : 'text-gray-400'}`}>
                    {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-teal-500 to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}