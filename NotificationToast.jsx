import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationToast({ type = "success", message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      color: "bg-green-50 border-green-200 text-green-800",
      iconColor: "text-green-600"
    },
    error: {
      icon: XCircle,
      color: "bg-red-50 border-red-200 text-red-800",
      iconColor: "text-red-600"
    },
    warning: {
      icon: AlertCircle,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      iconColor: "text-yellow-600"
    },
    info: {
      icon: Info,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      iconColor: "text-blue-600"
    }
  };

  const { icon: Icon, color, iconColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`fixed top-20 right-6 z-50 max-w-md ${color} border-2 rounded-xl shadow-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}