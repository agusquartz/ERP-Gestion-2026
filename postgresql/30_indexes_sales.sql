-- Indice para acelerar consultas por supplier_id
CREATE INDEX idx_supplier_id_includes
ON category_suppliers(supplier_id)
INCLUDE (category_id);
