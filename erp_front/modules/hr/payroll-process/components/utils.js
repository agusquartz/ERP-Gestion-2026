export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === "--") return "$ --";
  const num = parseFloat(amount);
  if (isNaN(num)) return "$ --";
  return `$ ${num.toFixed(2)}`;
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
 
