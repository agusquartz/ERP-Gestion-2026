/**
 * --------------------------------------------------------------------------
 * SuppliersTable Component
 * --------------------------------------------------------------------------
 *
 * Displays all suppliers associated with the purchase request and
 * manages quotation-related actions.
 *
 * Responsibilities:
 * - Render suppliers in a structured table.
 * - Display quotation generation status.
 * - Allow quotation creation or visualization.
 * - Allow bulk quotation generation/printing.
 * - Open supplier search modal.
 * - Handle empty supplier states.
 *
 * Props:
 *
 * @param {Array<Object>} suppliers
 * List of suppliers assigned to the purchase request.
 *
 * Expected supplier structure:
 * [
 *   {
 *     id?: number | string,
 *     supplierId?: number | string,
 *     name: string,
 *     statusId: number | string
 *   }
 * ]
 *
 * @param {boolean} allGenerated
 * Indicates whether all quotations were already generated.
 *
 * @param {boolean} hasPrintableSuppliers
 * Indicates if there are suppliers with printable quotations.
 *
 * @param {(supplier: Object) => void} onOpenQuotation
 * Callback executed when the user wants to generate or view
 * a supplier quotation.
 *
 * @param {() => void} onGenerateOrPrintAll
 * Callback executed when the bulk action button is clicked.
 * This may:
 * - Generate all quotations.
 * - Print all quotations.
 *
 * @param {() => void} onOpenSupplierSearch
 * Callback executed when opening the supplier search modal.
 *
 * Behavior:
 * - If there are no suppliers, an empty-state message is shown.
 * - Suppliers are rendered as table rows.
 * - Status badges are dynamically styled depending on supplier status.
 * - The quotation button changes behavior depending on generation state.
 * - The table supports internal scrolling.
 *
 * Return:
 * - Suppliers section containing:
 *   - Section header
 *   - Action buttons
 *   - Scrollable table OR empty state
 * --------------------------------------------------------------------------
 */

"use client";

import { STATUS } from "../hooks/usePurchaseRequests";

/**
 * --------------------------------------------------------------------------
 * Status Configuration
 * --------------------------------------------------------------------------
 *
 * Maps each supplier status to its visual representation.
 *
 * Each status includes:
 * - label  -> visible text
 * - color  -> text color
 * - bg     -> background color
 * - border -> border color
 * - dot    -> status indicator dot color
 *
 * This configuration centralizes all status-related styles
 * for easier maintenance and scalability.
 * --------------------------------------------------------------------------
 */
const statusConfig = {
  [STATUS.CREATED]: {
    label: "Sin generar",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },

  [STATUS.UNSENT]: {
    label: "Pendiente",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },

  [STATUS.PENDING]: {
    label: "Pendiente",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },

  [STATUS.OK]: {
    label: "OK",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },

  [STATUS.CANCELLED]: {
    label: "Cancelado",
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

export default function SuppliersTable({
  suppliers = [],
  allGenerated = false,
  hasPrintableSuppliers = false,
  onOpenQuotation,
  onGenerateOrPrintAll,
  onOpenSupplierSearch,
}) {

  /**
   * Indicates whether at least one supplier exists.
   *
   * Used to:
   * - Enable/disable bulk action button.
   * - Control empty-state rendering.
   */
  const hasSuppliers = suppliers.length > 0;

  return (
    <section className="flex flex-col min-h-0">

      {/* ------------------------------------------------------------------ */}
      {/* Section Header                                                      */}
      {/* ------------------------------------------------------------------ */}
      {/* 
        Contains:
        - Section title
        - Supplier management actions
      */}
      <div className="shrink-0 flex items-center justify-between mb-2">

        {/* Section title */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Proveedores &amp; Cotizaciones
        </p>

        {/* Header actions */}
        <div className="flex gap-2">

          {/* -------------------------------------------------------------- */}
          {/* Add Supplier Button                                            */}
          {/* -------------------------------------------------------------- */}
          {/* 
            Opens supplier search modal or supplier assignment flow.
          */}
          <button
            onClick={onOpenSupplierSearch}
            className="px-3 py-1 text-xs font-medium rounded-[5px] border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            + Agregar Proveedor
          </button>

          {/* -------------------------------------------------------------- */}
          {/* Generate / Print All Button                                    */}
          {/* -------------------------------------------------------------- */}
          {/* 
            Dynamic behavior:
            - If all quotations are generated and printable:
              -> displays "Imprimir Todos"
            - Otherwise:
              -> displays "Generar Todos"
              
            Disabled when no suppliers exist.
          */}
          <button
            onClick={onGenerateOrPrintAll}
            disabled={!hasSuppliers}
            className="px-3 py-1 text-xs font-medium rounded-[5px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allGenerated && hasPrintableSuppliers
              ? "Imprimir Todos"
              : "Generar Todos"}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Scrollable Table Container                                         */}
      {/* ------------------------------------------------------------------ */}
      {/* 
        Creates an internal scroll area for large supplier lists.
        
        Structure:
        - Empty state OR
        - Suppliers table
      */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-[5px] border border-slate-200">

        {/* -------------------------------------------------------------- */}
        {/* Empty State                                                   */}
        {/* -------------------------------------------------------------- */}
        {suppliers.length === 0 ? (

          <div className="flex items-center justify-center h-full py-10 text-slate-400 text-[14px]">
            No hay proveedores asignados aún.
          </div>

        ) : (

          /* ------------------------------------------------------------ */
          /* Suppliers Table                                              */
          /* ------------------------------------------------------------ */
          <table className="w-full text-[14px] text-slate-700">

            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-slate-200 bg-background">

                {/* Row index */}
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                  #
                </th>

                {/* Supplier name */}
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Proveedor
                </th>

                {/* Quotation action */}
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cotización
                </th>

                {/* Supplier status */}
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">

              {suppliers.map((supplier, index) => {

                /**
                 * Resolves visual status configuration.
                 *
                 * Falls back to CREATED status if no valid status exists.
                 */
                const status =
                  statusConfig[supplier.statusId] ??
                  statusConfig[STATUS.CREATED];

                /**
                 * Determines whether the quotation already exists.
                 *
                 * Used to:
                 * - Change button style
                 * - Change button label
                 */
                const isGenerated =
                  supplier.statusId !== STATUS.CREATED;

                return (

                  /**
                   * Supplier row
                   */
                  <tr
                    key={supplier.id ?? supplier.supplierId}
                    className="hover:bg-[#F2F3F7] transition-colors"
                  >

                    {/* Row number */}
                    <td className="px-5 py-3.5 text-slate-400 text-[13px]">
                      {index + 1}
                    </td>

                    {/* Supplier name */}
                    <td className="px-5 py-3.5 font-medium">
                      {supplier.name}
                    </td>

                    {/* -------------------------------------------------- */}
                    {/* Quotation Action Button                            */}
                    {/* -------------------------------------------------- */}
                    {/* 
                      Dynamic behavior:
                      
                      If quotation exists:
                      - Button label = "Ver"
                      - Neutral styling
                      
                      Otherwise:
                      - Button label = "Generar"
                      - Primary styling
                    */}
                    <td className="px-5 py-3.5 text-center">

                      <button
                        onClick={() => onOpenQuotation(supplier)}
                        className={
                          isGenerated
                            ? "inline-flex items-center justify-center rounded-[5px] border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600 hover:bg-[#F2F3F7] transition-colors"
                            : "inline-flex items-center justify-center rounded-[5px] border border-primary bg-primary px-3 py-1 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
                        }
                      >
                        {isGenerated ? "Ver" : "Generar"}
                      </button>

                    </td>

                    {/* -------------------------------------------------- */}
                    {/* Supplier Status Badge                              */}
                    {/* -------------------------------------------------- */}
                    {/* 
                      Dynamically styled status indicator.
                      
                      Includes:
                      - Colored border
                      - Background color
                      - Status dot
                      - Status label
                    */}
                    <td className="px-5 py-3.5 text-center">

                      <span
                        className={`
                          border
                          ${status.border}
                          inline-flex
                          items-center
                          justify-center
                          gap-1.5
                          rounded-[5px]
                          px-3
                          py-1
                          text-[12px]
                          font-semibold
                          ${status.bg}
                          ${status.color}
                          min-w-[100px]
                          text-center
                        `}
                      >

                        {/* Status dot */}
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />

                        {/* Status label */}
                        {status.label}

                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}