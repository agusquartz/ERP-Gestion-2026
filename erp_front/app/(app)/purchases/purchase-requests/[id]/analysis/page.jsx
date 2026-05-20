// app/(app)/purchases/purchase-requests/[id]/analysis/page.jsx
import AnalysisPage from "@/modules/purchases/purchase-requests/analysis/pages/AnalysisPage";
import { use } from "react";

export default function Page({ params }) {
  const { id } = use(params);
  return <AnalysisPage requestId={id} />;
}