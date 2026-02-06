import React from 'react';
import Modal from '@/components/Modal/Modal';

interface SupportersModalProps {
  open: boolean;
  supporters: string[];
  parentId?: string;
  onDelete: (email: string) => void;
  onClose: () => void;
  setHelpers?: ((helpers: string[] | ((prev: string[]) => string[])) => void);
}

const SupportersModal: React.FC<SupportersModalProps> = ({ open, supporters, parentId, onDelete, onClose, setHelpers }) => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<string | null>(null);

  if (!open) return null;

  const handleAdd = async () => {
    setStatus(null);
    if (!email) {
      setStatus('Please enter an email.');
      return;
    }
    if (!parentId) {
      setStatus('❌ User not found. Please log in again.');
      return;
    }
    try {
      // Fetch helper user by email to get helper_id
      const helperRes = await fetch(`/api/user/email?email=${encodeURIComponent(email)}`);
      const helperData = await helperRes.json();
      if (!helperRes.ok || !helperData.user || !helperData.user.id) {
        setStatus(helperData.error ? `❌ ${helperData.error}` : '❌ Helper not found.');
        return;
      }
      const helper_id = helperData.user.id;
      // Send relationship add request with parent_id and helper_id
      const res = await fetch('/api/relationship/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, helper_id }),
      });
      const result = await res.json();
      if (result.success) {
        if (setHelpers) setHelpers((prev: string[]) => [...prev, email]);
        setStatus('✅ Supporter added successfully!');
        setEmail('');
        setShowAddModal(false);
      } else {
        switch (res.status) {
          case 400:
            setStatus('❌ Missing parent ID or helper ID.');
            break;
          case 404:
            setStatus('❌ Helper not found or not a helper. Please check the email and role.');
            break;
          case 409:
            setStatus('⚠️ Relationship already exists.');
            break;
          default:
            setStatus(result.error ? `❌ ${result.error}` : '❌ Failed to add supporter.');
        }
      }
    } catch {
      setStatus('❌ Network or server error while adding supporter.');
    }
  };

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
      <button className="w-full py-2 px-3 bg-blue-500 text-white rounded mb-2" onClick={() => setShowAddModal(true)}>
        Add Supporter
      </button>
      <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={onClose}>
        Close
      </button>
      {/* Add Supporter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Add Supporter</h3>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Supporter email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {status && <div className="mb-2 text-sm text-red-600">{status}</div>}
            <button className="w-full py-2 px-3 bg-blue-600 text-white rounded mb-2" onClick={handleAdd}>
              Add
            </button>
            <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={() => { setShowAddModal(false); setStatus(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SupportersModal;
