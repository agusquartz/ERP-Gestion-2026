import ViewPurchaseInvoicePage from "@/modules/purchases/purchase-invoices/view/pages/ViewPurchaseInvoicePage";
import { use } from "react";

export default function Page({ params }) {
  const { id } = use(params); 
  return <ViewPurchaseInvoicePage id={id} />;
}