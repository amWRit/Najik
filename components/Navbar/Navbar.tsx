import React from 'react';
import { Settings } from 'lucide-react';
import IconButton from '../Button/IconButton';
import SupportersModal from '@/components/SupportersModal/SupportersModal';
import SupportedUsersModal from '@/components/SupportedUsersModal/SupportedUsersModal';
import AddSupporterModal from '@/components/AddSupporterModal/AddSupporterModal';

interface NavbarProps {
  title?: string;
  userRole?: 'parent' | 'helper';
  onSettingsClick?: () => void;
  userName?: string;
  userId?: string;
  supporters?: string[];
  onDeleteSupporter?: (email: string) => void;
  onAddSupporter?: (email: string) => void;
  onSignOut: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  userRole,
  userName,
  userId,
  supporters = [],
  onDeleteSupporter,
  onAddSupporter,
  onSignOut,
  onSettingsClick,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = React.useState(false);
  const [showSupportersModal, setShowSupportersModal] = React.useState(false);
  const [showAddSupporterModal, setShowAddSupporterModal] = React.useState(false);
  const [addSupporterEmail, setAddSupporterEmail] = React.useState('');
  const [addSupporterStatus, setAddSupporterStatus] = React.useState<string | null>(null);
  // For helper: supported users list
  const [supportedUsers, setSupportedUsers] = React.useState<{ name: string; email: string }[]>([]);

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      setShowSettingsMenu(true);
    }
  };
  const handleCloseSettingsMenu = () => setShowSettingsMenu(false);

  const handleOpenSupportersModal = async () => {
    setShowSettingsMenu(false);
    if (userRole === 'helper' && userId) {
      // Fetch supported users for helper
      try {
        const res = await fetch(`/api/relationship/parents?helper_id=${userId}`);
        const data = await res.json();
        if (Array.isArray(data.parents)) {
          setSupportedUsers(data.parents.map((p: any) => ({ name: p.name, email: p.email })));
        } else {
          setSupportedUsers([]);
        }
      } catch {
        setSupportedUsers([]);
      }
    }
    setShowSupportersModal(true);
  };
  const handleCloseSupportersModal = () => setShowSupportersModal(false);

  const handleOpenAddSupporterModal = () => setShowAddSupporterModal(true);
  const handleCloseAddSupporterModal = () => setShowAddSupporterModal(false);

  const handleAddSupporter = () => {
    if (!addSupporterEmail) {
      setAddSupporterStatus('Please enter an email.');
      return;
    }
    if (onAddSupporter) {
      onAddSupporter(addSupporterEmail);
      setAddSupporterEmail('');
      setAddSupporterStatus(null);
      setShowAddSupporterModal(false);
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="text-lg font-semibold">{title || 'Najik'}</div>
      <IconButton onClick={handleSettingsClick}>
        <Settings size={24} />
      </IconButton>
      {/* Settings Menu Modal */}
      {showSettingsMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            {userRole === 'parent' && (
              <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded" onClick={handleOpenSupportersModal}>
                Supporters
              </button>
            )}
            {userRole === 'helper' && (
              <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded" onClick={handleOpenSupportersModal}>
                Supported Users
              </button>
            )}
            <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mt-2" onClick={onSignOut}>
              Sign Out
            </button>
            <button className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mt-2" onClick={handleCloseSettingsMenu}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* Supporters Modal for parent, SupportedUsersModal for helper */}
      {userRole === 'parent' && (
        <SupportersModal
          open={showSupportersModal}
          supporters={supporters}
          onDelete={onDeleteSupporter || (() => {})}
          onClose={handleCloseSupportersModal}
        />
      )}
      {userRole === 'helper' && (
        <SupportedUsersModal
          open={showSupportersModal}
          supportedUsers={supportedUsers}
          helperId={userId}
          helperName={userName}
          onClose={handleCloseSupportersModal}
        />
      )}
      {/* Add Supporter Modal for parent */}
      {userRole === 'parent' && (
        <AddSupporterModal
          open={showAddSupporterModal}
          email={addSupporterEmail}
          status={addSupporterStatus}
          onEmailChange={setAddSupporterEmail}
          onAdd={handleAddSupporter}
          onClose={handleCloseAddSupporterModal}
        />
      )}
    </nav>
  );
};

export default Navbar;
