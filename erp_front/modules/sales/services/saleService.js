// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
 

// /** ----------------- PRODUCTS ----------------- */
// /**
//  * GET /products/:id
//  */
// export async function getProductByQuery(q) {
//   const res = await fetch(`${BASE_URL}/products?q=${q}`);
//   //const res = await fetch(`http://192.168.1.200:3000/0`);
//   if (!res.ok) throw new Error("Error de Red");
//   let result = await res.json();
//   return result;
// }
 
// /** ----------------- SALES ----------------- */

// /**
//  * POST /sales
//  * Body: { clienteId, vendedor, items: [{ productoId, cantidad, precio }] }
//  */
// export async function createSale(payload) {
//   const res = await fetch(`${BASE_URL}/sales`, {
//     method:  "POST",
//     headers: { "Content-Type": "application/json" },
//     body:    JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error("Error al crear la venta");
//   return res.json();
// }
 
// /**
//  * POST /quotes
//  * Body: { clienteId, vendedor, items: [{ productoId, cantidad, precio }] }
//  */
// export async function createQuote(payload) {
//   const res = await fetch(`${BASE_URL}/quotes`, {
//     method:  "POST",
//     headers: { "Content-Type": "application/json" },
//     body:    JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error("Error al crear el presupuesto");
//   return res.json();
// }

// /** ----------------- CLIENTS ----------------- */

// /**
// * GET: /clients?q=...
// */
// export async function getClients(query = ""){
//     const url = query ?
//         `${BASE_URL}/clients?q=${encodeURIComponent(query)}` :
//         `${BASE_URL}/clients`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("Error al obtener la lsita de clientes");
//     let result = await res.json();
//     return result;
// }

// /**
// * GET /clients/{id}
// */

// export async function getClientById(id){
//     if (!id) throw new Error("ID de cliente requerido");
//     const res = await fetch(`${BASE_URL}/clients/${id}`);
//     if (!res.ok) throw new Error("Error al obtener los detalles del cliente");
//     let result = await res.json();
//     return result;
// }


// /**
//  * POST /clients
//  */
// export async function createClient(payload) {
//   const res = await fetch(`${BASE_URL}/clients`, {
//     method:  "POST",
//     headers: { "Content-Type": "application/json" },
//     body:    JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error("Error al crear el cliente");
//   let result = await res.json();
//   return result;
// }

// /**
// * PATCH /clients/{id}
// */

// export async function editClient(id, payload){
//     if(!id) throw new Error("ID de cliente requerido");

//     const res = await fetch(`${BASE_URL}/clients/${id}`, {
//             method:  "PATCH",
//             headers: { "Content-Type": "application/json"},
//             body:    JSON.stringify(payload), 
//         });

//     if (!res.ok) throw new Error("Error al editar el cliente");
//     let result = await res.json();
//     return result
// }


import { getProductByQuery, createSale, createQuote } from "@/lib/http/client/sales";
import { getClients, getClientById, createClient, editClient } from "@/lib/http/client/clients";

export {
  getProductByQuery,
  createSale,
  createQuote,
  getClients,
  getClientById,
  createClient,
  editClient,
};