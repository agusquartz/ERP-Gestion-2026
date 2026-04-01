"use client";

import { useEffect } from "react";
import { CloseIcon } from "./Icons";

/**
 * Modal genérico reutilizable para todos los módulos.
 *
 * Props:
 *   open     - boolean
 *   onClose  - () => void
 *   width    - número (max-width en px, default 560)
 *   children - contenido
 */
export function Modal({ open, onClose, children, width = 560 }) {
  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxWidth: width }}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:       "fixed",
    inset:          0,
    background:     "rgba(0,0,0,0.45)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         1000,
    padding:        20,
  },
  modal: {
    background:  "white",
    borderRadius: 12,
    padding:     "28px 32px",
    width:       "100%",
    position:    "relative",
    maxHeight:   "90vh",
    overflowY:   "auto",
    boxShadow:   "0 8px 32px rgba(0,0,0,0.18)",
  },
  closeBtn: {
    position:   "absolute",
    top:        14,
    right:      14,
    background: "none",
    border:     "none",
    cursor:     "pointer",
    color:      "#9CA3AF",
    display:    "flex",
    padding:    4,
    borderRadius: 4,
  },
};
