"use client";

import usePurchaseRequests from "../hooks/usePurchaseRequests";

import ItemsTable from "../components/ItemsTable";
import CategoriesTable from "../components/CategoriesTable";
import SuppliersTable from "../components/SuppliersTable";

import SupplierSearchModal from "../modal/SupplierSearchModal";
import SupplierQuotationModal from "../modal/SupplierQuotationModal";

export default function PurchaseRequestPage({ id }) {
  const {
    // remote data
    purchaseRequest,
    orderItems,
    suppliers,
    categories,
    categoryNames,
    loading,
    error,

    // quotation modal
    activeSupplier,
    handleOpenQuotation,
    handleCloseQuotation,
    handleSaveQuotation,
    handlePrint,

    // supplier modal
    isSupplierSearchOpen,
    handleOpenSupplierSearch,
    handleCloseSupplierSearch,
    searchAvailableSuppliers,
    handleAddSuppliers,

    // bulk actions
    allGenerated,
    hasPrintableSuppliers,
    handleGenerateOrPrintAll,

    // helpers
    isFinalStatus,
  } = usePurchaseRequests(id);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted">
        Cargando purchase request...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* LEFT */}
        <div className="col-span-7 flex flex-col gap-4 min-h-0">
          <ItemsTable items={orderItems} />

          <CategoriesTable categories={categories} />
        </div>

        {/* RIGHT */}
        <div className="col-span-5 min-h-0">
          <SuppliersTable
            suppliers={suppliers}
            allGenerated={allGenerated}
            hasPrintableSuppliers={hasPrintableSuppliers}
            onOpenQuotation={handleOpenQuotation}
            onGenerateOrPrintAll={handleGenerateOrPrintAll}
            onOpenSupplierSearch={handleOpenSupplierSearch}
          />
        </div>
      </div>

      {/* Supplier Search */}
      <SupplierSearchModal
        isOpen={isSupplierSearchOpen}
        categoryNames={categoryNames}
        onClose={handleCloseSupplierSearch}
        onSearchSuppliers={searchAvailableSuppliers}
        onConfirm={handleAddSuppliers}
      />

      {/* Supplier Quotation */}
      <SupplierQuotationModal
        supplier={activeSupplier}
        isOpen={Boolean(activeSupplier)}
        onClose={handleCloseQuotation}
        onSave={handleSaveQuotation}
        onPrint={handlePrint}
        readonly={
          activeSupplier
            ? isFinalStatus(activeSupplier.statusId)
            : false
        }
      />
    </>
  );
}