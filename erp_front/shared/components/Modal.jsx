// // "use client";

// // import { useEffect } from "react";
// // import { CloseIcon } from "./Icons";

// // /**
// //  * Modal genérico reutilizable para todos los módulos.
// //  *
// //  * Props:
// //  *   open     - boolean
// //  *   onClose  - () => void
// //  *   width    - número (max-width en px, default 560)
// //  *   children - contenido
// //  */
// // export function Modal({ open, onClose, children, width = 560 }) {
// //   // Bloquear scroll del body mientras el modal está abierto
// //   useEffect(() => {
// //     document.body.style.overflow = open ? "hidden" : "";
// //     return () => { document.body.style.overflow = ""; };
// //   }, [open]);

// //   if (!open) return null;

// //   return (
// //     <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
// //       <div style={{ ...styles.modal, maxWidth: width }}>
// //         <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
// //           <CloseIcon />
// //         </button>
// //         {children}
// //       </div>
// //     </div>
// //   );
// // }

// // const styles = {
// //   overlay: {
// //     position:       "fixed",
// //     inset:          0,
// //     background:     "rgba(0,0,0,0.45)",
// //     display:        "flex",
// //     alignItems:     "center",
// //     justifyContent: "center",
// //     zIndex:         1000,
// //     padding:        20,
// //   },
// //   modal: {
// //     background:  "white",
// //     borderRadius: 12,
// //     padding:     "28px 32px",
// //     width:       "100%",
// //     position:    "relative",
// //     maxHeight:   "90vh",
// //     overflowY:   "auto",
// //     boxShadow:   "0 8px 32px rgba(0,0,0,0.18)",
// //   },
// //   closeBtn: {
// //     position:   "absolute",
// //     top:        14,
// //     right:      14,
// //     background: "none",
// //     border:     "none",
// //     cursor:     "pointer",
// //     color:      "#9CA3AF",
// //     display:    "flex",
// //     padding:    4,
// //     borderRadius: 4,
// //   },
// // };
// "use client";

// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { CloseIcon } from "./Icons";

// export function Modal({ open, onClose, children, width = 560 }) {
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (!mounted) return;
//     document.body.style.overflow = open ? "hidden" : "";
//     return () => (document.body.style.overflow = "");
//   }, [open, mounted]);

//   if (!open || !mounted) return null;

//   // return createPortal(
//   //   <div
//   //     onClick={(e) => e.target === e.currentTarget && onClose()}
//   //     className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
//   //   >
//   //     <div
//   //       style={{ maxWidth: width }}
//   //       className="relative w-full max-h-[90vh] overflow-y-auto rounded-[10px] bg-surface p-6 shadow-xl"
//   //     >
//   //       <button
//   //         onClick={onClose}
//   //         className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
//   //       >
//   //         <CloseIcon />
//   //       </button>

//   //       {children}
//   //     </div>
//   //   </div>,
//   //   document.body
//   // );
//   return (
//   <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-500">
//     <div className="bg-white p-10">
//       TEST MODAL
//     </div>
//   </div>
// );
// }

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

  // 🔥 obtener body seguro
  const portalTarget =
    typeof window !== "undefined" ? document.body : null;

  if (!open || !mounted || !portalTarget) return null;

  return createPortal(
    <div
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        style={{ maxWidth: width }}
        className="relative w-full max-h-[90vh] overflow-y-auto rounded-[10px] bg-surface p-6 shadow-xl"
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
        >
          <CloseIcon />
        </button>

        {children}
      </div>
    </div>,
    portalTarget
  );
}