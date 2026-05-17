export function getStatusStyle(status) {
	switch(status) {
		case "paid":
			return {
				label: 	"Pagado",
				color: 	"text-[#00085D]",
				bg: 	"bg-[#E5EAFF]",
				dot: 	"bg-[#00085D]",
				border: "border-[#4A83FF]", 
			};
		case "payment_pending":
			return {
				label: 	"Pago Pendiente",
				color: 	"text-[#5D0000]",
				bg: 	"bg-[#FFE6E5]",
				dot: 	"bg-[#5D0000]",
				border: "border-[#91372B]",
			};
		default:
			return {
				label: 	status,
				color: 	"text-slate-600",
				bg: 	"bg-slate-100",
				dot: 	"bg-slate-400",
				border: "border-gray",
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