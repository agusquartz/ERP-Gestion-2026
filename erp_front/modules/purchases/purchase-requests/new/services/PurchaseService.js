// services/purchaseService.js
import { mock_items } from "./mock"; // Reutilizamos datos de prueba

export const getProductByQuery = async (query) => {
  // Simulamos una latencia de red de 300ms
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!query) return [];

  const lowerQuery = query.toLowerCase();

  // Filtramos en los mock_items por código o descripción
  return mock_items.filter(
    (item) =>
      item.codigo.toLowerCase().includes(lowerQuery) ||
      item.descripcion.toLowerCase().includes(lowerQuery)
  );
};

export const createPurchaseRequest = async (purchaseData) => {
  // Simulamos la llamada a la API de Rust
  console.log("Enviando a Rust:", purchaseData);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Aquí iría el fetch real:
  // const response = await fetch('/api/purchases', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(purchaseData)
  // });
  // if (!response.ok) throw new Error('Error en el servidor');
  
  return { success: true };
};