import React, { useState } from 'react';
import AddSupportedUserModal from './AddSupportedUserModal';

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

  const handleAddSupportedUser = async (email: string) => {
    // Fetch parent user by email to get parent_id
    const parentRes = await fetch(`/api/user/email?email=${encodeURIComponent(email)}`);
    const parentData = await parentRes.json();
    if (!parentRes.ok || !parentData.user || !parentData.user.id) {
      throw new Error(parentData.error ? parentData.error : 'Parent not found.');
    }
    const parent_id = parentData.user.id;
    // Send relationship add request with parent_id and helper_id
    const res = await fetch('/api/relationship/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id, helper_id: helperId }),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error ? result.error : 'Failed to add supported user.');
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
        <AddSupportedUserModal
          open={showAddModal}
          onAdd={handleAddSupportedUser}
          onClose={() => setShowAddModal(false)}
        />
      </div>
    </div>
  );
};

export default SupportedUsersModal;
