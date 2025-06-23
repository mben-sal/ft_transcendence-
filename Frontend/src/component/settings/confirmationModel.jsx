

// ConfirmationModal.jsx
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, type }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter the confirmation code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(code);
      setCode('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid confirmation code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">Security Confirmation</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Please enter the confirmation code sent to your email address
        </p>

        <div className="space-y-4">
          <input
            type="text"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter confirmation code"
            maxLength={6}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ConfirmationModal;