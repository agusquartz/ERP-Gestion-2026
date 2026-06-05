"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPurchaseOrderById, cancelPurchaseOrder } from '@/lib/http/client/purchase-orders';
import { createPurchaseInvoice, getPurchaseInvoicesByOrderId } from "@/lib/http/client/purchase-invoices";

import ItemsTable from '../components/ItemsTable';
import InvoicesTable from '../components/InvoicesTable';
import { ActionButton } from '../components/ActionButton';
import { CancelOrderModal } from "../components/CancelOrderModal";
import { AddInvoiceModal } from '../components/AddNewInvoiceModal';
import { translateOrderStatusName } from "../../list/components/utils.js";

const ViewPurchaseOrderPage = () => {
	const params = useParams();
	const router = useRouter();
	const [order, setOrder] = useState(null);
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isCancelling, setIsCancelling] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showInvoiceModal, setShowInvoiceModal] = useState(false);

	// Defined outside useEffect so it can be called after mutation
	const fetchOrder = useCallback(async () => {
		try {
			const data = await getPurchaseOrderById(params.id);
			setOrder(data);
			const inv = await getPurchaseInvoicesByOrderId(params.id);
			setInvoices(inv);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [params.id]);

	useEffect(() => {
		if (params.id) fetchOrder();
	}, [fetchOrder]);

	const handleConfirmCancel = async () => {
		setIsCancelling(true);
		try {
			const payload = {
				orderId: parseInt(params.id), 
				statusId: 5,  //CANCELLED status id                 
				details: null                
			};

			await cancelPurchaseOrder(params.id, payload);
			setShowCancelModal(false);

			// Refresh data to show the new status badge
			await fetchOrder(); 
		} catch (error) {
			console.error("Failed to cancel order:", error);
			alert(error.message);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleConfirmInvoice = async (modalPayload) => {
		setLoading(true);
		try {
			//TODO: Franco, here you would call the service that POSTs a new PurchaseInvoice in your backend 
			//probably written in @/lib/http/client/purchase-invoices.js

			await createPurchaseInvoice(modalPayload);
			setShowInvoiceModal(false);
			await fetchOrder(); // Refresh UI
		} catch (error) {
			alert(error.message);
		} finally {
			setLoading(false);
		}
	};
	if (loading) return <div className="p-4 text-gray-500">Cargando...</div>;
	if (!order) return <div className="p-4 text-red-500">Orden no encontrada.</div>;

    return (
        <>
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
				{/* HEADER SECTION */}
				<div className="flex-none p-8 pb-0">
				  <div className="flex items-center gap-4 mb-4">
					<h1 className="text-[28px] font-bold text-[#1a1a1a]">
					  Orden de Compra Nº {order.id}
					</h1>
					
					{/* Dynamic Status Badge */}
					<span className={`px-3 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1.5 ${getStatusStyles(order.status.name)}`}>
					  <span className="h-1.5 w-1.5 rounded-full bg-current" />
					  {translateOrderStatusName(order.status.name)}
					</span>
				  </div>

				  <div className="flex gap-8 mb-6 text-[13px] border-b border-gray-100 pb-4">
					<p><span className="font-bold text-gray-800">Proveedor:</span> <span className="text-gray-600">{order.supplier.name}</span></p>
					<p><span className="font-bold text-gray-800">Creado:</span> <span className="text-gray-600">{order.createdAt}</span></p>
				  </div>
				</div>
                {/* TABLE AREA */}
                <div className="flex-1 overflow-y-auto px-8 pb-4 custom-scrollbar">
                    <div className="flex flex-col gap-8">
                        <ItemsTable items={order.details} />
                        <InvoicesTable invoices={invoices} />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex-none p-6 border-t border-gray-100 flex justify-between items-center">
                    <ActionButton
                        variant="secondary"
                        text="Cancelar Orden"
                        onClick={() => setShowCancelModal(true)}
                        className="!text-[#2b6df5] !border-[#2b6df5] hover:bg-blue-50 py-1.5 text-[12px]"
                    />

                    <div className="flex gap-3">
                        <ActionButton
                            variant="secondary"
                            text="Atrás"
                            onClick={() => router.back()}
                            className="!text-[#2b6df5] !border-[#2b6df5] min-w-[100px] py-1.5 text-[12px]"
                        />
                        <ActionButton
                            variant="primary"
                            text="Añadir Factura"
                            onClick={() => setShowInvoiceModal(true)}
                            className="min-w-[140px] py-1.5 text-[12px]"
                        />
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            <CancelOrderModal
                open={showCancelModal}
                onClose={() => !isCancelling && setShowCancelModal(false)}
                onConfirm={handleConfirmCancel} // Now calling the correct API function
                orderId={order?.id}
                loading={isCancelling} 
            />

			<AddInvoiceModal
				open={showInvoiceModal}
				onClose={() => setShowInvoiceModal(false)}
				order={order}
				onConfirm={handleConfirmInvoice}
			/>
        </>
    );
};


export default ViewPurchaseOrderPage;

const getStatusStyles = (status) => {
	const s = status?.toLowerCase();
	if (s === 'pending') return "bg-[#FFE6E5] text-[#5D0000] border-[#91372B]";
	if (s === 'partial') return "bg-[#FFFDE5] text-[#5D5200] border-[#FFE44A]";
	if (s === 'ok' || s === 'completed') return "bg-[#E5EAFF] text-[#00085D] border-[#4A83FF]";

	// Default for 'cancelado' or any other state
	return "bg-[#DADADA] text-[#374151] border-[#476559]";
};
