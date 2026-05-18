import React from 'react';
import GenericTable from './GenericTable';

const InvoicesTable = ({ invoices = [] }) => {
  const headers = ["Factura N°", "Fecha", "Total", "Status"];

  return (
    <div className="mb-8">
      <h3 className="text-[13px] font-bold text-gray-600 mb-3 ml-1 uppercase tracking-wider">Facturas Asociadas</h3>
      <GenericTable headers={headers} maxHeight="200px">
        {invoices.length === 0 ? (
          <tr>
            <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic text-sm border-b border-gray-100">
              No hay facturas vinculadas a esta orden.
            </td>
          </tr>
        ) : (
          invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-[#F2F3F7]">
              {/* Future columns here */}
            </tr>
          ))
        )}
      </GenericTable>
    </div>
  );
};

export default InvoicesTable;
