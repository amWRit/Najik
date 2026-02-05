import React, { useState } from 'react';

interface SupportedUsersModalProps {
  open: boolean;
  supportedUsers: { name: string; email: string }[];
  helperId?: string;
  helperName?: string;
  onClose: () => void;
  onDelete?: (email: string) => void;
}

const SupportedUsersModal: React.FC<SupportedUsersModalProps> = ({ open, supportedUsers, helperId, helperName, onClose, onDelete }) => {
  const [showAddModal, setShowAddModal] = useState(false);
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
      const res = await fetch('/api/relationship/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helper_id: helperId || helperName, parent_email: email }),
      });
      const result = await res.json();
      if (result.success) {
        setStatus('✅ Supported user added successfully!');
        setEmail('');
        setShowAddModal(false);
      } else {
        setStatus(result.error ? `❌ ${result.error}` : '❌ Failed to add supported user.');
      }
    } catch {
      setStatus('❌ Network or server error while adding supported user.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-4">Supported Users</h2>
        <ul className="mb-4">
          {supportedUsers.length === 0 ? (
            <li className="text-gray-500 py-2">No supported users yet.</li>
          ) : (
            supportedUsers.map(user => (
              <li key={user.email} className="flex items-center justify-between py-2 border-b">
                <span>{user.name} <span className="text-gray-500">({user.email})</span></span>
                {onDelete && (
                  <button className="text-red-500 ml-2" onClick={() => onDelete(user.email)}>Delete</button>
                )}
              </li>
            ))
          )}
        </ul>
        <button className="w-full py-2 px-3 bg-blue-500 text-white rounded mb-2" onClick={() => setShowAddModal(true)}>
          Add Supported User
        </button>
        <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={onClose}>
          Close
        </button>
        {/* Add Supported User Modal */}
        {showAddModal && (
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
              <button className="w-full py-2 px-3 bg-gray-200 rounded" onClick={() => { setShowAddModal(false); setStatus(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportedUsersModal;
