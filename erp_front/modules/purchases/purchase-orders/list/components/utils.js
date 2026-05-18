export const formatDate = (dateString) => {
	if (!dateString) return "-";
	const [year, month, day] = dateString.split('-');
	const date = new Date(year, month - 1, day);

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date);
};



// Helper to format currency
export const formatCurrency = (value) => {
	return new Intl.NumberFormat('es-PY', {
		style: 'currency',
		currency: 'USD', 
	}).format(value);
};

// Helper to translate status names
export const translateOrderStatusName = (name) => {
	const s = name.toLowerCase();
	if (s === 'pending') return 'pendiente';
	if (s === 'cancelled') return 'cancelado';
	if (s === 'partial') return 'parcial';
	if (s === 'ok' || s === 'completed') return 'completado';
}
