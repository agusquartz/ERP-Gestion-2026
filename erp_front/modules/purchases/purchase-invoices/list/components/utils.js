export function getStatusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "ok" ||
    value === "paid" ||
    value === "pagado" ||
    value === "payment_paid"
  ) {
    return {
      label: "Pagado",
      border: "border-success",
      bg: "bg-success/10",
      color: "text-success",
      dot: "bg-success",
    };
  }

  if (
    value === "pending" ||
    value === "pendiente" ||
    value === "created" ||
    value === "payment_pending"
  ) {
    return {
      label: "Pendiente",
      border: "border-destructive",
      bg: "bg-destructive/10",
      color: "text-destructive",
      dot: "bg-destructive",
    };
  }

  if (
    value === "partial" ||
    value === "parcial" ||
    value === "payment_partial"
  ) {
    return {
      label: "Parcial",
      border: "border-warning",
      bg: "bg-warning/10",
      color: "text-warning",
      dot: "bg-warning",
    };
  }

  if (
    value === "cancelled" ||
    value === "canceled" ||
    value === "anulado" ||
    value === "cancelado"
  ) {
    return {
      label: "Anulado",
      border: "border-muted",
      bg: "bg-muted/10",
      color: "text-muted-foreground",
      dot: "bg-muted-foreground",
    };
  }

  return {
    label: status || "Pendiente",
    border: "border-muted",
    bg: "bg-muted/10",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  };
}

export function formatDate(dateStr) {
	if(!dateStr) return "-";

	const date = new Date(dateStr + "T00:00:00");
	return date.toLocaleDateString("en-US", {
		month: 	"short",
		day: 	"numeric",
		year: 	"numeric",
	});
}