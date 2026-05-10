export function getStatusStyle(status) {
	switch(status) {
		case "paid":
			return {
				label: 	"Pagado",
				color: 	"text-[#1a7f4b]",
				bg: 	"bg-[#e6f9ef]",
				dot: 	"bg-[#1a7f4b]",
			};
		case "partial_payment":
			return {
				label: 	"Pago Parcial",
				color: 	"text-[#b45309]",
				bg: 	"bg-[#fff7ed]",
				dot: 	"bg-[#b45309]",
			};
		case "payment_pending":
			return {
				label: 	"Pago Pendiente",
				color: 	"text-[#b91c1c]",
				bg: 	"bg-[#fef2f2]",
				dot: 	"bg-[#b91c1c]",
			};
		default:
			return {
				label: 	status,
				color: 	"text-slate-600",
				bg: 	"bg-slate-100",
				dot: 	"bg-slate-400",
			};
	}
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