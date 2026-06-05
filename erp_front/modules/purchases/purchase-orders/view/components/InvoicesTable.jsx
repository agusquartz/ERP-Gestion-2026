import React from 'react';
import GenericTable from './GenericTable';
import { getStatusStyle } from '../../../purchase-invoices/list/components/utils.js';

const InvoicesTable = ({ invoices = [] }) => {
  const headers = ["Factura N°", "Fecha", "Total", "Status"];

  return (
    <div className="mb-8">
      <h3 className="text-[13px] font-bold text-gray-600 mb-3 ml-1 uppercase tracking-wider">
        Facturas Asociadas
      </h3>
      <GenericTable headers={headers} maxHeight="200px">
        {invoices.length === 0 ? (
          <tr>
            <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic text-sm border-b border-gray-100">
              No hay facturas vinculadas a esta orden.
            </td>
          </tr>
        ) : (
          invoices.map((inv) => {
            // 1. Add an explicit function body block {} here to safely run your utility function
            const { label, color, bg, dot, border } = getStatusStyle(inv.paymentStatus);

            // 2. Explicitly return the JSX row
            return (
              <tr key={inv.id} className="hover:bg-[#F2F3F7]">
                {/* 1. Factura N° */}
                <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 font-medium">
                  {inv.invoiceNr}
                </td>
                
                {/* 2. Fecha */}
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                  {inv.createdAt}
                </td>
                
                {/* 3. Total */}
                <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 font-semibold">
                  ${inv.total}
                </td>
                
                {/* 4. Status (Using your imported getStatusStyle properties) */}
                <td className="px-4 py-3 text-sm border-b border-gray-100">
                  <div className="flex justify-start">
                    <span
                      className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold ${border} ${bg} ${color}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                      {label || inv.paymentStatus}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </GenericTable>
    </div>
  );
};

export default InvoicesTable;
