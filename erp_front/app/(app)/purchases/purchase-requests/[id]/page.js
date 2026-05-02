import PurchaseRequestsPage from "@/modules/purchases/purchase-requests/id/pages/PurchaseRequestsPage";
import { use } from "react";

export default function Page({ params }) {
  const { id } = use(params);
  return <PurchaseRequestsPage orderId={id} />;
}
