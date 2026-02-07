import React, { useState } from 'react';


export interface AddSupportedUserModalProps {
  open: boolean;
  onAdd: (email: string) => Promise<void>;
  onClose: () => void;
}


const AddSupportedUserModal: React.FC<AddSupportedUserModalProps> = ({ open, onAdd, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  if (!open) return null;

  const handleAdd = async () => {
    setStatus(null);
    if (!email) {
      setStatus('Please enter an email.');
      return;
    }
    try {
      await onAdd(email);
      setStatus('✅ Supported user added successfully!');
      setEmail('');
      setTimeout(() => {
        setStatus(null);
        onClose();
        // Optionally reload or update parent list here
      }, 1000);
    } catch (err: any) {
      setStatus(err?.message ? `❌ ${err.message}` : '❌ Failed to add supported user.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Supported User</h3>
        <input
          type="email"
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Parent's email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {status && <div className="mb-2 text-sm text-red-600">{status}</div>}
        <button className="w-full py-2 px-3 bg-blue-500 text-white rounded mb-2" onClick={handleAdd}>
          Add
        </button>
        <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={() => { setStatus(null); onClose(); }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddSupportedUserModal;
