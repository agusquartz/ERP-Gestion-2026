'use client';

import React from 'react';

/**
 * ActionButton - A clean, generalized button component.
 * 
 * @param {Function} onClick - Event handler for button clicks.
 * @param {string} variant - 'primary', 'secondary', 'tertiary', or 'danger'.
 * @param {string} text - The text to be displayed inside the button.
 * @param {string} className - Optional tailwind classes for layout tweaks.
 */
export function ActionButton({ 
  onClick, 
  variant = "secondary", 
  text = "Acción", 
  className = "" 
}) {
  
  const baseStyles = "px-4 py-1.5 rounded-[8px] font-bold text-[14px] transition-all active:scale-95 flex items-center justify-center whitespace-nowrap";
  
  const variants = {
    primary: "bg-[#2b6df5] text-white hover:bg-[#1e56c8] shadow-sm",
    secondary: "cursor-pointer border border-[#2b6df5] text-[#2b6df5] hover:bg-[#2b6df5]/5",
    tertiary: "cursor-pointer border border-[#64748b] text-[#64748b] hover:bg-[#64748b]/5",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-sm"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    > 
      {text}
    </button>
  );
}

export default ActionButton;
