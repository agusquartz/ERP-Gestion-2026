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