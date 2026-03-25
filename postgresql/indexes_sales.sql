-- Indice para acelerar consultas por supplier_id
CREATE NONCLUSTERED INDEX idx_supplier_id_includes
ON product_suppliers(supplier_id)
INCLUDE (product_id);