import PurchaseOrderPage from "@/modules/purchases/pages/PurchaseOrderPage";

export default function Page({ params }) {
  return (
    <div className="p-2 h-full">
      <PurchaseOrderPage orderId={params.id} />
    </div>
  );
}
