import React, { useState } from 'react';
import DeleteAccountModal from './DeleteAccountModal';

const ActionButtons = ({ onSave, onDelete, loading }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteConfirm = (password) => {
    onDelete(password);
    setShowDeleteModal(false);
  };

  return (
    // <>
      <div className="mt-8 space-y-4">
        <button
          onClick={onSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        
        {/* <button 
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
        >
          Delete Account
        </button> */}
      </div>

    //   <DeleteAccountModal
    //     isOpen={showDeleteModal}
    //     onClose={() => setShowDeleteModal(false)}
    //     onConfirm={handleDeleteConfirm}
    //   />
    // </>
  );
};

export default ActionButtons;