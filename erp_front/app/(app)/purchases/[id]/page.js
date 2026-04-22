import PurchaseOrderPage from "@/modules/purchases/pages/PurchaseOrderPage";

export default function Page({ params }) {
  return <PurchaseOrderPage orderId={params.id} />;
}
