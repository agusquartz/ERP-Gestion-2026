
"use client";
import { useState } from "react";
import { DocumentsHeader } from "../components/documents/DocumentsHeader";
import { DocumentsSearch } from "../components/documents/DocumentsSearch";
import { DocumentsTable } from "../components/documents/DocumentsTable";
import { ActionButton } from "../components/documents/ButtonActions";


const DOCUMENT_TYPES = {
    FACTURAS: "Facturas",
    PRESUPUESTO: "Presupuesto",
    NOTA_CREDITO: "Notas de Credito"
}


export default function DocumentsPage() {
const [activeTab, setActiveTab] = useState(DOCUMENT_TYPES.FACTURAS);
const [selectedId, setSelectedId] = useState(null);
//clients data examples: 
 const [documents, setDocuments] = useState([
    {
      id: 1,
      tipo: "Facturas",
      fecha: "2026-04-17",
      numeroFactura: "F-001",
      cliente: "Juan Pérez",
      total: 150000,
    },
     {
      id: 2,
      tipo: "Facturas",
      fecha: "2026-04-17",
      numeroFactura: "F-001",
      cliente: "Juan Pérez",
      total: 150000,
    },
    {
      id: 3,
      tipo: "Presupuesto",
      fecha: "2026-04-16",
      numeroFactura: "P-001",
      cliente: "María Gómez",
      estado: "Pendiente",
      total: 250000,
    },
    {
      id: 4,
      tipo: "Notas de Credito",
      fecha: "2026-04-15",
      numeroNotaCredito: "NC-001",
      numeroFactura: "F-001",
      categoria: "Devolución",
      cliente: "Juan Pérez",
      total: 50000,
    },
  ]);

const handleRemove = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
};
const filteredDocuments = documents.filter((doc) => doc.tipo === activeTab);

    
  return (
    
     <div className="flex h-full min-h-0 flex-col bg-surface p-4 md:p-6 rounded-[5px]">
      <div className="mb-5">
        <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-foreground md:text-[42px]">
          Buscar Documentos
        </h1>
        <div className="mt-2 h-px w-full bg-foreground/80" />
      </div>
      <DocumentsHeader 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedId(null); // Resetea la selección al cambiar de pestaña
        }}
/>

      <DocumentsSearch activeTab={activeTab} setActiveTab={setActiveTab}/>
      <DocumentsTable
        type= {activeTab}
        documents={filteredDocuments}
        onRemove={handleRemove}
        //selectedId= {selectedId}
        onSelect={(id) => setSelectedId(id ==selectedId ? null : id) }
      />
      <div className= "flex justify-end items-center h-20">
          {activeTab!== DOCUMENT_TYPES.NOTA_CREDITO && (
              <ActionButton 
                //if something is selected: blue, if nothing is selected: gray
                variant={selectedId  !== null ? "primary" : "tertiary"} 
                type= {activeTab}
              />

          )}
      </div>  
    </div>
   
  );
}