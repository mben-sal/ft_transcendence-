// components/settings/DeleteAccountModal.jsx
import React, { useState } from 'react';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }
    onConfirm(password);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Confirmer la suppression</h2>
        <p className="text-gray-600 mb-4">
          Cette action est irréversible. Pour confirmer, veuillez entrer votre mot de passe.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="w-full p-2 border rounded mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border rounded hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;