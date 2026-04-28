const BASE_URL = 'http://127.0.0.1:3000'; // Replace this later

export const purchaseService = {
	/**
	 * Fetches purchase orders from the backend
	 * @param {string} search - The debounced server-side search string
	 */
	getPurchaseOrders: async (search = '') => {
		try {
			const url = new URL(`${BASE_URL}/purchases/purchase-orders`);

			if (search) {
				url.searchParams.append('search', search);
			}

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					// 'Authorization': `Bearer ${localStorage.getItem('token')}` 
				},
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status} - ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error("Service Error [getPurchaseOrders]:", error);
			throw error; 
		}
	},
	getOrderDetail: async (orderId) => {
		// Placeholder for real API: return await fetch(...)
		console.warn(`Detail fetch triggered for ID: ${id}. Service ready for integration.`);
		return null;
	}
};
