import { clientRequest } from "./request";


/**
 * Builds the query string used by the supplier listing endpoint.
 *
 * Supported filters:
 *
 * - contains:
 *   Searches suppliers by name, email, address, or similar backend-supported fields.
 *
 * - categories:
 *   Array of category IDs.
 *   The backend treats this as an AND filter.
 *   That means the supplier must have ALL selected categories.
 *
 * Examples:
 *
 * buildSupplierQueryParams()
 * // ""
 *
 * buildSupplierQueryParams({ contains: "michelin" })
 * // "?contains=michelin"
 *
 * buildSupplierQueryParams({ categories: [3] })
 * // "?categories=3"
 *
 * buildSupplierQueryParams({ categories: [3, 4] })
 * // "?categories=3&categories=4"
 *
 * buildSupplierQueryParams({
 *   contains: "neumaticos",
 *   categories: [3, 4],
 * })
 * // "?contains=neumaticos&categories=3&categories=4"
 *
 * @param {Object} filters
 * @param {string} [filters.contains=""] Text used to search suppliers.
 * @param {number[]} [filters.categories=[]] Category IDs used to filter suppliers.
 *
 * @returns {string} Query string starting with "?", or an empty string if no filters exist.
 */
function buildSupplierQueryParams({ contains = "", categories = [] } = {}) {
  const params = new URLSearchParams();

  const cleanContains = contains.trim();

  if (cleanContains) {
    params.set("contains", cleanContains);
  }

  for (const categoryId of categories) {
    if (categoryId !== null && categoryId !== undefined && categoryId !== "") {
      params.append("categories", String(categoryId));
    }
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

/**
 * Gets suppliers from the backend.
 *
 * Endpoint examples:
 *
 * GET /suppliers
 * Returns all suppliers.
 *
 * GET /suppliers?contains=michelin
 * Returns suppliers matching the text "michelin".
 *
 * GET /suppliers?categories=3
 * Returns suppliers that have category 3.
 *
 * GET /suppliers?categories=3&categories=4
 * Returns suppliers that have category 3 AND category 4.
 *
 * GET /suppliers?contains=neumaticos&categories=3&categories=4
 * Returns suppliers matching "neumaticos" that also have category 3 AND category 4.
 *
 * Frontend usage examples:
 *
 * const suppliers = await getSuppliers();
 *
 * const suppliers = await getSuppliers({
 *   contains: "michelin",
 * });
 *
 * const suppliers = await getSuppliers({
 *   categories: [3],
 * });
 *
 * const suppliers = await getSuppliers({
 *   categories: [3, 4],
 * });
 *
 * const suppliers = await getSuppliers({
 *   contains: "neumaticos",
 *   categories: [3, 4],
 * });
 *
 * Important:
 *
 * categories: [3, 4]
 *
 * means:
 *
 * supplier has category 3 AND category 4.
 *
 * It does not mean:
 *
 * supplier has category 3 OR category 4.
 *
 * @param {Object} filters Supplier filters.
 * @param {string} [filters.contains] Text used to search suppliers.
 * @param {number[]} [filters.categories] Category IDs used as AND filter.
 *
 * @returns {Promise<Array>} List of suppliers.
 */
export function getSuppliers(filters = {}) {
  const query = buildSupplierQueryParams(filters);

  return clientRequest(`/suppliers${query}`, {
    method: "GET",
  });
}

/**
 * Gets one supplier by ID.
 *
 * Endpoint:
 *
 * GET /suppliers/{id}
 *
 * Example request:
 *
 * GET /suppliers/3
 *
 * Frontend usage:
 *
 * const supplier = await getSupplierById(3);
 *
 * Example response:
 *
 * {
 *   id: 3,
 *   name: "Accesorios Total Auto",
 *   address: "Ruta 2 km 15",
 *   email: "info@accesoriosauto.com",
 *   isActive: true,
 *   creditLimit: 3000,
 *   currCredit: 0,
 *   categories: [
 *     {
 *       id: 5,
 *       name: "Accesorios",
 *     },
 *   ],
 * }
 *
 * @param {number|string} id Supplier ID.
 *
 * @returns {Promise<Object>} Supplier data.
 *
 * @throws {Error} If the ID is missing.
 */
export function getSupplierById(id) {
  if (!id) throw new Error("Supplier ID is required");

  return clientRequest(`/suppliers/${id}`, {
    method: "GET",
  });
}

/**
 * Gets the categories associated with one supplier.
 *
 * Endpoint:
 *
 * GET /suppliers/{id}/categories
 *
 * Example request:
 *
 * GET /suppliers/3/categories
 *
 * Frontend usage:
 *
 * const categories = await getSupplierCategories(3);
 *
 * Example response:
 *
 * [
 *   {
 *     id: 5,
 *     name: "Accesorios",
 *   },
 * ]
 *
 * Useful when:
 *
 * - You are editing a supplier.
 * - You need to preselect the supplier's categories in a form.
 * - You want to show only the categories assigned to a specific supplier.
 *
 * @param {number|string} id Supplier ID.
 *
 * @returns {Promise<Array>} Categories associated with the supplier.
 *
 * @throws {Error} If the ID is missing.
 */
export function getSupplierCategories(id) {
  if (!id) throw new Error("Supplier ID is required");

  return clientRequest(`/suppliers/${id}/categories`, {
    method: "GET",
  });
}

/**
 * Gets all available categories.
 *
 * Endpoint:
 *
 * GET /categories
 *
 * Frontend usage:
 *
 * const categories = await getCategories();
 *
 * Example response:
 *
 * [
 *   {
 *     id: 3,
 *     name: "Neumaticos",
 *   },
 *   {
 *     id: 4,
 *     name: "Llantas",
 *   },
 *   {
 *     id: 5,
 *     name: "Accesorios",
 *   },
 * ]
 *
 * Useful for:
 *
 * - Filter dropdowns.
 * - Multi-select category filters.
 * - Supplier creation forms.
 * - Supplier edit forms.
 *
 * Example with a filter select:
 *
 * const categories = await getCategories();
 *
 * // Then use them as options:
 * // categories.map(category => ({
 * //   label: category.name,
 * //   value: category.id,
 * // }))
 *
 * @returns {Promise<Array>} List of all categories.
 */
export function getCategories() {
  return clientRequest("/categories", {
    method: "GET",
  });
}