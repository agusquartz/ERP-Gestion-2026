export function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "activo":
    case "active":
      return {
        label: "Activo",
        color: "text-green-700",
        bg: "bg-green-50",
        dot: "bg-green-500",
        border: "border-green-200",
      };
    case "inactivo":
    case "inactive":
    default:
      return {
        label: "Inactivo",
        color: "text-slate-600",
        bg: "bg-slate-100",
        dot: "bg-slate-400",
        border: "border-slate-300",
      };
  }
}

export function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("es-PY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}