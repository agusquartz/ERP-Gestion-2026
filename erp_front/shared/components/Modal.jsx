"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

export function Modal({ open, onClose, children, width = 560 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const portalTarget =
    typeof window !== "undefined" ? document.body : null;

  if (!open || !mounted || !portalTarget) return null;

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
    >
      <div
        style={{
          "--modal-width":
            typeof width === "number" ? `${width}px` : width,
        }}
        className="relative max-h-[90vh] w-full max-w-[var(--modal-width)] overflow-y-auto rounded-[5px] border border-border bg-surface p-6 shadow-panel"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="cursor-pointer absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[5px] text-muted transition hover:bg-background hover:text-foreground"
        >
          <CloseIcon />
        </button>

        <div className="pr-6">{children}</div>
      </div>
    </div>,
    portalTarget
  );
}