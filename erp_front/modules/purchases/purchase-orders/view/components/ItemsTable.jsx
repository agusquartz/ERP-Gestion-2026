import React from 'react';
import GenericTable from './GenericTable';

const ItemsTable = ({ items }) => {
  const headers = ["#", "Codigo", "Producto", "Ordenados", "Recibidos"];
  
  return (
    <div className="mb-8">
      <h3 className="text-[13px] font-bold text-gray-600 mb-3 ml-1 uppercase tracking-wider">Items de la Orden</h3>
      <GenericTable headers={headers} maxHeight="250px">
        {items.map((item, idx) => (
          <tr key={item.product.id} className="hover:bg-[#F2F3F7] transition-colors">
            <td className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">{idx + 1}</td>
            <td className="px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-100">{item.product.code}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">{item.product.description}</td>
            <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{item.orderedQuantity}</td>
            <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{item.receivedQuantity}</td>
          </tr>
        ))}
      </GenericTable>
    </div>
  );
};

export default ItemsTable;
