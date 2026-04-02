const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
 
/**
 * GET /products/:id
 */
export async function getProductByQuery(q) {
  const res = await fetch(`${BASE_URL}/products?q=${q}`);
  //const res = await fetch(`http://192.168.1.200:3000/0`);
  if (!res.ok) throw new Error("Error de Red");
  let result = await res.json();
  return result;
}
 
/**
 * POST /sales
 * Body: { clienteId, vendedor, items: [{ productoId, cantidad, precio }] }
 */
export async function createSale(payload) {
  const res = await fetch(`${BASE_URL}/sales`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear la venta");
  return res.json();
}
 
/**
 * POST /quotes
 * Body: { clienteId, vendedor, items: [{ productoId, cantidad, precio }] }
 */
export async function createQuote(payload) {
  const res = await fetch(`${BASE_URL}/quotes`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear el presupuesto");
  return res.json();
}
 
/**
 * POST /clients
 */
export async function createClient(payload) {
  const res = await fetch(`${BASE_URL}/clients`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear el cliente");
  return res.json();
}