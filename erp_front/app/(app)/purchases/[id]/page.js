import PurchaseOrderPage from "@/modules/purchases/pages/PurchaseOrderPage";
import { use } from "react";

export default function Page({ params }) {
  const { id } = use(params);
  return <PurchaseOrderPage orderId={id} />;
}
