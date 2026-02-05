import React from 'react';
import Modal from '@/components/Modal/Modal';

interface SupportersModalProps {
  open: boolean;
  supporters: string[];
  onDelete: (email: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

const SupportersModal: React.FC<SupportersModalProps> = ({ open, supporters, onDelete, onAdd, onClose }) => {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Supporters</h2>
      <ul className="mb-4">
        {supporters.map(email => (
          <li key={email} className="flex items-center justify-between py-2 border-b">
            <span>{email}</span>
            <button className="text-red-500 ml-2" onClick={() => onDelete(email)}>Delete</button>
          </li>
        ))}
      </ul>
      <button className="w-full py-2 px-3 bg-blue-500 text-white rounded mb-2" onClick={onAdd}>
        Add Supporter
      </button>
      <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={onClose}>
        Close
      </button>
    </Modal>
  );
};

export default SupportersModal;
