"use client";

export function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10 animate-in fade-in zoom-in-95">
        {children}
      </div>
    </div>
  );
}
