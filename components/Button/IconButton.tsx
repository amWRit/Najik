import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ children, className = '', ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center p-0 h-8 w-8 min-h-0 rounded-full bg-transparent hover:bg-gray-100 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
