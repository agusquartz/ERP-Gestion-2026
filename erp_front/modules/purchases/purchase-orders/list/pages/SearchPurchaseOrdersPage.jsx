"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce.js'; 
import { getPurchaseOrdersByQuery } from '../../../../../lib/http/client/purchase-orders.js';
import PurchaseFilters from '../components/PurchaseFilters.jsx';
import PurchaseTable from '../components/PurchaseTable.jsx';

import {formatDate, formatCurrency} from '../components/utils.js';

const SearchPurchaseOrdersPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [serverSearch, setServerSearch] = useState(''); // Raw input for Input 1
  const [clientFilter, setClientFilter] = useState(''); // Raw input for Input 2
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Use the hook for the server-side search
  const debouncedServerSearch = useDebounce(serverSearch, 600);

  // EFFECT 1: Fetch from backend only when the DEBOUNCED value changes
  useEffect(() => {
    const loadData = async () => {
	  setIsLoading(true);
	  try {
		const data = getPurchaseOrdersByQuery(debouncedServerSearch);
		setOrders(data);

	  } catch (err) {
		console.error("Failed to load orders: ", err);
	  } finally {
		  setIsLoading(false);
	  }
      
    };

    loadData();
  }, [debouncedServerSearch]); 

  // LOGIC: Client-side filtering on the results we already have
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchTerm = clientFilter.toLowerCase();
      const matchesClient = 
        String(order.id).includes(searchTerm) ||
        order.supplier.name.toLowerCase().includes(searchTerm) ||
        order.request_number.toLowerCase().includes(searchTerm);
      
      const matchesStatus = status === 'all' || order.status === status;
	  const matchesDate = !selectedDate || order.date === selectedDate;	
      
      return matchesClient && matchesStatus && matchesDate;
    });
  }, [orders, clientFilter, status, selectedDate]);

  const handleClear = () => {
    setServerSearch('');
    setClientFilter('');
    setStatus('all');
	setSelectedDate('');
  };
/** * HANDOVER NOTE: 
 * This function is triggered by the 'Eye' icon in PurchaseTable.
 * Partners should replace the console.log with:
 * 1. Navigation logic (navigate(`/route/${id}`))
 * 2. Or opening a Side-Drawer/Modal
 */
  const handleViewDetail = async (orderId) => {
	  console.log("View Detail requested for Order ID:", orderId);

  // Example for future routing:
  // navigate(`/purchases/view/${orderId}`);
  };

  return (
    <div className="flex-1 flex min-h-[calc(100vh-32px] mx-auto">

        <div className="flex-1 bg-white rounded-[5px] shadow-sm border border-gray-200 overflow-hidden">

          <h1 className="text-3xl font-bold text-[#1E293B] mt-8 mb-6 ml-5 tracking-tight">Órdenes de Compra</h1>
        
		  <div className="mx-8">
			  <PurchaseFilters 
				serverSearch={serverSearch}
				setServerSearch={setServerSearch}
				clientFilter={clientFilter}
				setClientFilter={setClientFilter}
				status={status}
				setStatus={setStatus}
	  			selectedDate={selectedDate}
	  			setSelectedDate={setSelectedDate}
				resultsCount={filteredOrders.length}
				totalCount={orders.length}
				onClear={handleClear}
			  />
			  
			  <PurchaseTable data={filteredOrders} totalResults={orders.length} onView={handleViewDetail}/>
		  </div>

      </div>

    </div>
  );
};

export default SearchPurchaseOrdersPage;
