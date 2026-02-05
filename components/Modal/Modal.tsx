import { X } from "lucide-react";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="m-0 text-xl font-semibold text-blue-600">{title}</h3>
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer p-2 rounded hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={24} color="#2563eb" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-2 rounded hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X size={24} color="#2563eb" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
