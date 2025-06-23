import PropTypes from 'prop-types';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  children: PropTypes.node
};

export const DialogContent = ({ children, className = "" }) => (
  <div className={`relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 z-50 ${className}`}>
    {children}
  </div>
);

DialogContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export const DialogHeader = ({ className = "", ...props }) => (
  <div className={`mb-4 space-y-2 text-center sm:text-left ${className}`} {...props} />
);

DialogHeader.propTypes = {
  className: PropTypes.string,
};

export const DialogTitle = ({ className = "", ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
);

DialogTitle.propTypes = {
  className: PropTypes.string,
};