"use client";
import { useState } from "react";
// Si tus componentes están en esa carpeta de módulos, usa la ruta completa desde la raíz:
import { OrderSearch } from "@/modules/purchases/purchase-requests/list/components/OrderSearch";
import { OrderTable } from "@/modules/purchases/purchase-requests/list/components/OrderTable";
import {getPurchaseRequestsByQuery} from "@/lib/http/client/purchuse-request";
export default function ListPage() {
  const [selectedId, setSelectedId] = useState(null);
  //getPurchaseRequestsByQuery()

  // Datos de prueba para visualizar la tabla
  const [orders] = useState([
    {
      id: 1,
      request_number: "PED-001",
      order_number: "15",
      date: "28/04/2026",
      status: "Recibido",
      provider: "Cubiertas Itapúa S.A."
    },
    {
      id: 2,
      request_number: "PED-002",
      order_number: "16",
      date: "27/04/2026",
      status: "Pendiente",
      provider: "Distribuidora Michelin"
    },
    {
      id: 3,
      request_number: "PED-003",
      order_number: null, // Caso sin orden todavía
      date: "26/04/2026",
      status: "Pendiente",
      provider: "Gomería Central"
    },
    {
      id: 4,
      request_number: "PED-2026-004",
      order_number: "OC-8901",
      date: "25/04/2026",
      status: "Recibido",
      provider: "Pirelli Paraguay"
    }
  ]);

  const handleView = (id) => {
    const order = orders.find(o => o.id === id);
    console.log("Visualizando pedido:", order.request_number);
    // Aquí abrirías el modal de detalles
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Pedidos de Compra
        </h1>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>

      {/* Search Component */}
      <OrderSearch onSearch={(filters) => console.log("Filtros aplicados:", filters)} />

      {/* Table Component con los datos inyectados */}
      <OrderTable 
        orders={orders}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        onView={handleView}
      />

      {/* Resumen visual opcional al final */}
      <div className="mt-4 flex justify-between items-center px-2">
       
      </div>
    </div>
  );
}