"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useDebounce } from "../hooks/useDebounce.js";
//import { getPurchaseOrdersByQuery } from "../../../../../lib/http/client/purchase-orders.js";
import { getPurchaseOrdersByQuery } from "@/lib/http/client/purchase-orders.js";

import PurchaseFilters from "../components/PurchaseFilters.jsx";
import PurchaseTable from "../components/PurchaseTable.jsx";

const PAGE_SIZE = 10;

const INITIAL_FILTERS = {
  search: "",
  filter: "",
  status: "",
  since: "",
  to: "",
};

const SearchPurchaseOrdersPage = () => {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);

  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce only the search field
  const debouncedSearch = useDebounce(filters.search, 600);
  const debouncedFilter = useDebounce(filters.filter, 600);

  useEffect(() => {
	setCursor(null);
	setCursorStack([]);
  }, [
    debouncedSearch,
	debouncedFilter,
    filters.status,
    filters.since,
    filters.to,
  ]);

	  

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        const response = await getPurchaseOrdersByQuery({
          search: debouncedSearch,
		  filter: debouncedFilter,
          status: filters.status,
          since: filters.since,
          to: filters.to,
		  
	      cursor,
		  limit: PAGE_SIZE,
        });

        setOrders(response.orders);
		setHasMore(response.hasMore);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
	cursor,
    debouncedSearch,
	debouncedFilter,
    filters.status,
    filters.since,
    filters.to,
  ]);

  const handleNextPage = () => {
	  if(!orders.length) return;

	  const lastOrder = orders[orders.length - 1];

	  setCursorStack((prev) => [...prev,cursor]);

	  setCursor(lastOrder.id);
  };

  const handlePreviousPage = () => {
	  if(!orders.length) return;

	  const previousCursor = cursorStack[cursorStack.length - 1];

	  setCursorStack((prev) => prev.slice(0, -1));

	  setCursor(previousCursor);
  };

  const handleViewDetail = (orderId) => {
    router.push(`/purchases/purchase-orders/${orderId}`);
  };

  return (
    <div className="flex-1 flex min-h-[calc(100vh-32px)] mx-auto">
      <div className="flex-1 bg-white rounded-[5px] shadow-sm border border-gray-200 overflow-hidden">
        
        <h1 className="text-3xl font-bold text-[#1E293B] mt-8 mb-6 ml-5 tracking-tight">
          Órdenes de Compra
        </h1>

        <div className="mx-8">
          <PurchaseFilters onSearch={setFilters} />

          <PurchaseTable
            data={orders}
            totalResults={orders.length}
            isLoading={isLoading}
            onView={handleViewDetail}
          />

		  <div className="flex gap-4 my-6">

            <button
              onClick={handlePreviousPage}
              disabled={!cursorStack.length}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPurchaseOrdersPage;

