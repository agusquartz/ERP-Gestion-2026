import React from 'react';
import { Eye } from 'lucide-react';

import {formatDate, formatCurrency} from '../components/utils.js';

const PurchaseTable = ({ data, totalResults, onView }) => {
  const filteredResults = data.length;
  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pendiente') return "bg-[#FFE6E5] text-[#5D0000] border-[#91372B]";
    if (s === 'parcial') return "bg-[#FFFDE5] text-[#5D5200] border-[#FFE44A]";
	if (s === 'completado') return "bg-[#E5EAFF] text-[#00085D] border-[#4A83FF]";
    return "bg-[#DADADA] text-[#374151] border-[#476559]";
  };


  return (
	  <>

      {/* Dynamic Counter */}
      <div className="mb-1 px-4">
        <p className="text-[11px] text-[#6B6B6B] font-bold">
          Mostrando {filteredResults} de {totalResults} resultados
        </p>
      </div>

    <div className="w-full overflow-hidden rounded-t-[5px]">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#DBE3EE]"> 
            <th className="px-4 py-1.5 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200 first:rounded-tl-lg">Orden N°</th>
            <th className="px-4 py-1.5 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200">Proveedor</th>
            <th className="px-4 py-1.5 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200">Fecha</th>
            <th className="px-4 py-1.5 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200">Pedido N°</th>
            <th className="px-4 py-1.5 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200">Total Estimado</th>
            <th className="px-4 py-1.5 text-center text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200">Estado</th>
            <th className="px-4 py-1.5 text-center text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200 last:rounded-tr-lg">Accion</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-[#F2F3F7] transition-colors group">
              <td className="px-4 py-1.5 text-sm font-bold text-[#111827] border-b border-gray-100">{item.order_number}</td>
              <td className="px-4 py-1.5 text-sm text-[#111827] border-b border-gray-100">{item.supplier?.name}</td>
              <td className="px-4 py-1.5 text-sm text-[#111827] border-b border-gray-100">{formatDate(item.date)}</td>
              <td className="px-4 py-1.5 text-sm text-[#111827] border-b border-gray-100">{item.request_number}</td>
              <td className="px-4 py-1.5 text-sm font-bold text-[#111827] border-b border-gray-100 text-right">{formatCurrency(item.total_estimation)}</td>
              <td className="px-4 py-1.5 border-b border-gray-100">
                <div className="flex justify-center">
                  <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[10px] font-bold w-[90px] justify-center ${getStatusStyles(item.status)}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                    {item.status}
                  </span>
                </div>
              </td>
              <td className="px-4 py-1.5 text-center border-b border-gray-100">
                <button 
			  	onClick={() => onView(item.id)}
			    className="text-center text-[#000000] hover:text-blue-600 transition-opacity opacity-0 group-hover:opacity-100"
			  >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
	  </>
  );
};
export default PurchaseTable;
