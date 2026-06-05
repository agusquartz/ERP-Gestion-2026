"use client";

import { clientRequest } from "./request";

/**
 * @typedef {Object} CreateQuoteDetail
 * @property {number} productId - Foreign key referencing the product (products.id).
 * @property {string} unitCost - Price per unit. Send as a decimal string (e.g., "200.00").
 * @property {string} tax - Tax percentage (e.g., "15" for 15%).
 * @property {number} quantity - Number of units. Must be a positive integer.
 */

/**
 * @typedef {Object} CreateQuotePayload
 * @property {number} clientId - Foreign key referencing the client.
 * @property {number} statusId - Initial workflow status ID (e.g., Draft).
 * @property {string} createdAt - Issue date in "YYYY-MM-DD" format.
 * @property {CreateQuoteDetail[]} details - Line items. MUST contain at least one item.
 */

/**
 * Sends a request to create a new quote.
 * * @param {CreateQuotePayload} payload - The data required to create a quote.
 * @returns {Promise<Object>} The fully populated QuoteResponseDto from the server.
 * @throws {Error} If the request fails (e.g., 400 Bad Request or 422 Unprocessable Entity).
 */
export async function createQuote(payload) {
  return clientRequest("/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getQuoteById(id) {
  if (!id) throw new Error("Quote ID is required");

  return clientRequest(`/quotes/${id}`, {
    method: "GET",
  });
}


/**
 * GET /quotes
 * GET /quotes?contains=xxx
 * Lists quotes, optionally filtered by client/name/document/id.
 */
export function listQuotes({ contains } = {}) {
  const params = new URLSearchParams();

  if (contains?.trim()) {
    params.set("search", contains.trim());
	params.set("limit", 10000);
  }

  const queryString = params.toString();

  return clientRequest(`/quotes${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}
