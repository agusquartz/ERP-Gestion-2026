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

