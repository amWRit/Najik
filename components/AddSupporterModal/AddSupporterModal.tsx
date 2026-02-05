import React from 'react';
import Modal from '@/components/Modal/Modal';

interface AddSupporterModalProps {
  open: boolean;
  email: string;
  status: string | null;
  onEmailChange: (email: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

const AddSupporterModal: React.FC<AddSupporterModalProps> = ({ open, email, status, onEmailChange, onAdd, onClose }) => {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Add Supporter</h2>
      <input
        type="email"
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="Supporter email"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
      />
      <button
        className="w-full py-2 px-3 bg-blue-500 text-white rounded mb-2"
        onClick={onAdd}
        disabled={!email}
      >
        Add
      </button>
      {status && <p className="text-sm text-center mt-2">{status}</p>}
      <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={onClose}>
        Cancel
      </button>
    </Modal>
  );
};

export default AddSupporterModal;
