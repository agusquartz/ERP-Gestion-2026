"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "./utils.js";
import { ReturnNoteModal } from "../modal/ReturnNoteModal.jsx";
import { EyeIcon } from "@/shared/components/Icons";

// "Notas de Devolución" tab — shows existing return notes and the create button.
// Eye icon navigates to /purchases/return-notes/{noteId}.
// "Nueva Devolucion" opens the ReturnNoteModal.
//
// Columns: #, Nota Nro, Razon de la Devolucion, Fecha, Costo Total, Accion
export function ReturnNotesTab({ returnNotes, invoice, loading, error, onCreated }) {
    const router = useRouter();          // For navigation to individual return note detail
    const [showModal, setShowModal] = useState(false);  // Controls visibility of the creation modal

    // --- Loading state: show centered message while fetching return notes ---
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400 text-[14px]">
                Cargando notas de devolución...
            </div>
        );
    }

    // --- Error state: display error message if something went wrong ---
    if (error) {
        return (
            <div className="flex items-center justify-center py-20 text-red-400 text-[14px]">
                {error}
            </div>
        );
    }

    return (
        <>
            {/* Button to create a new return note - positioned top-right */}
            <div className="flex justify-end mb-3">
                <button
                    onClick={() => setShowModal(true)}
                    className="rounded-[5px] bg-[#2b6df5] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1a5ce0] transition-colors"
                >
                    Nueva Devolucion
                </button>
            </div>

            {/* Table container with fixed height, border, and rounded corners */}
            <div className="h-[54vh] flex flex-col rounded-[5px] border border-slate-200">
                <table className="w-full text-[14px] text-slate-700">
                    {/* Table header: styled similarly to other tabs for consistency */}
                    <thead>
                        <tr className="border-b border-slate-200 bg-background">
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota Nro</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Razon de la Devolucion</th>
                            <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Costo Total</th>
                            <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {returnNotes.length === 0 ? (
                            // Empty state: no return notes found
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-[14px]">
                                    No hay notas de devolución registradas.
                                </td>
                            </tr>
                        ) : returnNotes.map((note, i) => (
                            // Each row represents a single return note
                            <tr key={note.id} className="hover:bg-[#F2F3F7] transition-colors">
                                {/* Sequential row number */}
                                <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                                {/* Return note ID (identifier) */}
                                <td className="px-5 py-3.5 font-medium">{note.id}</td>
                                {/* Reason for return - truncate with max width */}
                                <td className="px-5 py-3.5 text-slate-600 max-w-[300px] truncate">{note.motive}</td>
                                {/* Formatted creation date */}
                                <td className="px-5 py-3.5 text-slate-600">{formatDate(note.createdAt)}</td>
                                {/* Total cost (or 0 if null) formatted as currency */}
                                <td className="px-5 py-3.5 text-right font-medium">
                                    $ {Number(note.total ?? 0).toLocaleString("es-PY")}
                                </td>
                                {/* Action column: eye icon to view details */}
                                <td className="px-5 py-3.5 text-center">
                                    <button
                                        onClick={() => router.push(`/return-notes/${note.id}`)}
                                        className="inline-flex items-center justify-center rounded-[5px] p-1.5 text-slate-500 hover:bg-primary/10 duration-200"
                                        title="Ver nota de devolución"
                                    >
                                        <EyeIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for creating a new return note - rendered conditionally */}
            {showModal && (
                <ReturnNoteModal
                    invoice={invoice}
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false);   // Close modal after successful save
                        onCreated();           // Notify parent to refresh the list
                    }}
                />
            )}
        </>
    );
}