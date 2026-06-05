"use client";

import { useParams, useRouter } from "next/navigation";
import PayrollHistoryDetailPage from "@/modules/hr/payroll-process/page/PayrollHistoryDetailPage"; 

export default function HistoricalPayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const processId = params?.id ? Number(params.id) : null;

  if (!processId || isNaN(processId)) {
    return <div className="p-6 text-red-500 font-bold"> ID de proceso inválido.</div>;
  }

  return (
    <PayrollHistoryDetailPage 
      viewProcessId={processId} 
      onBackToList={() => router.push("/hr/payrolls")} // Te regresa limpio a la lista del historial
    />
  );
}