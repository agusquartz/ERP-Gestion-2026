
"use client";
import { useState } from "react";
import { DocumentsHeader } from "../components/documents/DocumentsHeader";
import { DocumentsSearch } from "../components/documents/DocumentsSearch";
import { DocumentsTable } from "../components/documents/DocumentsTable";
import { ActionButton } from "../components/documents/ButtonActions";
import { NewCreditNoteTable } from "../modals/documents/NewCreditNoteModal";



const DOCUMENT_TYPES = {
    INVOICE: "Facturas",
    QUOTE: "Presupuesto",
    CREDIT_NOTE: "Notas de Credito"
}


export default function DocumentsPage() {
const [activeTab, setActiveTab] = useState(DOCUMENT_TYPES.INVOICE);
const [selectedId, setSelectedId] = useState(null);
const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);
//clients data examples: 
 const [documents, setDocuments] = useState([
    {
      id: 1,
      type: "Facturas",
      date: "2026-04-17",
      invoice_number: "F-001",
      client: "Juan Pérez",
      total: 150000,
    },
     {
      id: 2,
      type: "Facturas",
      date: "2026-04-17",
      invoice_number: "F-001",
      client: "Pablito Pérez",
      total: 150000,
    },
    {
      id: 3,
      type: "Presupuesto",
      date: "2026-04-16",
      invoice_number: "P-001",
      client: "María Gómez",
      status: "Pendiente",
      total: 250000,
    },
    {
      id: 4,
      type: "Notas de Credito",
      date: "2026-04-15",
      number_credite_note: "NC-001",
      invoice_number: "F-001",
      client: "Juan Pérez",
      total: 50000,
    },
  ]);

const handleRemove = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
};
const handleAction = () => {
    if (activeTab === DOCUMENT_TYPES.INVOICE && selectedId) {
      setIsCreatingCreditNote(true);
    }
  };


const filteredDocuments = documents.filter((doc) => doc.type === activeTab);

    
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
          {activeTab!== DOCUMENT_TYPES.CREDIT_NOTE && (
              <ActionButton 
                //if something is selected: blue, if nothing is selected: gray
                variant={selectedId  !== null ? "primary" : "tertiary"} 
                type= {activeTab}
                onClick={handleAction}
              />

          )}
      </div>  
    </div>
   
  );
}