import PurchaseRequestPage from "@/modules/purchases/purchase-requests/view/pages/PurchaseRequestPage";
import { use } from "react";

export default function Page({ params }) {
  const { id } = use(params);
  return <PurchaseRequestPage orderId={id} />;
}
