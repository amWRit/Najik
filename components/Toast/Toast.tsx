import { useEffect } from "react";
import { CheckCircle, X, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: "success" | "error" | "info";
}

export default function Toast({ message, onClose, duration = 3000, type = "success" }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  let bgColor = "#10b981"; // emerald-500
  let Icon = CheckCircle;
  if (type === "error") {
    bgColor = "#ef4444"; // red-500
    Icon = AlertCircle;
  } else if (type === "info") {
    bgColor = "#3b82f6"; // blue-500
    Icon = Info;
  }
  return (
    <div
      className={"fixed top-6 right-6 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[250px] max-w-[400px] animate-slideIn z-[11000]"}
      style={{ backgroundColor: bgColor, border: '2px solid #fff', animation: "slideInRight 0.3s ease-out" }}
    >
      <Icon size={20} />
      <span className="flex-1 text-base font-medium">{message}</span>
      <button
        onClick={onClose}
        className="bg-transparent border-none text-white cursor-pointer p-1 flex items-center"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
