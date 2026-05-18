import React from 'react';

const GenericTable = ({ headers, children, maxHeight = "300px" }) => {
  return (
    <div className="w-full border border-gray-200 rounded-[5px] shadow-sm overflow-hidden flex flex-col bg-white">
      {/* 
          The wrapper controls the height. 
          'overflow-y-auto' makes it scrollable. 
      */}
      <div 
        style={{ maxHeight: maxHeight }} 
        className="overflow-y-auto overflow-x-auto"
      >
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#DBE3EE] sticky top-0 z-10">
              {headers.map((header, idx) => (
                <th 
                  key={idx} 
                  className="px-4 py-2 text-left text-[11px] font-bold text-[#374151] uppercase border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericTable;
