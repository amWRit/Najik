import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className="fixed top-6 right-6 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[9999] min-w-[250px] max-w-[400px] animate-slideIn"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <CheckCircle size={20} />
      <span className="flex-1 text-base font-medium">{message}</span>
      <button
        onClick={onClose}
        className="bg-transparent border-none text-white cursor-pointer p-1 flex items-center"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <style>{`
        @keyframes slideIn {
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
