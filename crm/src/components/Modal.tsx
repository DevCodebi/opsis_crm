"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className = "" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-md modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content w-full max-w-md max-h-[min(92vh,880px)] rounded-t-2xl sm:rounded-2xl overflow-hidden my-0 sm:my-8 border border-[rgba(93,112,139,0.25)] shadow-2xl shadow-black/50 bg-[#161a22]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`overflow-y-auto max-h-[min(92vh,880px)] ${className}`}>{children}</div>
      </div>
    </div>
  );
}

export function ModalLarge({ open, onClose, children, className = "" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-md modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content w-full max-w-2xl max-h-[min(94vh,920px)] rounded-t-2xl sm:rounded-2xl overflow-hidden my-0 sm:my-8 border border-[rgba(93,112,139,0.25)] shadow-2xl shadow-black/50 bg-[#161a22]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`overflow-y-auto max-h-[min(94vh,920px)] ${className}`}>{children}</div>
      </div>
    </div>
  );
}
