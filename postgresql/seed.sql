BEGIN;
--================================
--         Accounting
--================================
INSERT INTO accounting_processes (
    fiscal_year,
    description,
    account_levels_count,
    digits_per_level
)
SELECT
    2026,
    'Proceso contable 2026',
    4,
    2
WHERE NOT EXISTS (
    SELECT 1
    FROM accounting_processes
    WHERE fiscal_year = 2026
);

DROP TABLE IF EXISTS tmp_accounting_process;

CREATE TEMP TABLE tmp_accounting_process AS
SELECT id AS accounting_process_id
FROM accounting_processes
WHERE fiscal_year = 2026
ORDER BY id
LIMIT 1;


-- =========================================================
-- MODULES
-- =========================================================

INSERT INTO modules (name)
SELECT x.name
FROM (VALUES
    ('Purchases'),
    ('Sales'),
    ('Payroll'),
    ('Treasury'),
    ('Manual Accounting')
) AS x(name)
WHERE NOT EXISTS (
    SELECT 1
    FROM modules m
    WHERE m.name = x.name
);


-- =========================================================
-- CHART OF ACCOUNTS SEED
-- account_number format: 01.01.01.01
-- 4 levels, 2 digits per level
-- =========================================================

DROP TABLE IF EXISTS tmp_account_seed;

CREATE TEMP TABLE tmp_account_seed (
    account_number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_number TEXT,
    is_postable BOOLEAN NOT NULL
);

INSERT INTO tmp_account_seed (
    account_number,
    name,
    parent_number,
    is_postable
)
VALUES
-- =========================================================
-- 01 ASSETS
-- =========================================================
('01', 'Activo', NULL, FALSE),
('01.01', 'Activo Corriente', '01', FALSE),
('01.02', 'Activo No Corriente', '01', FALSE),

('01.01.01', 'Disponibilidades', '01.01', FALSE),
('01.01.01.01', 'Caja General', '01.01.01', TRUE),
('01.01.01.02', 'Banco Cuenta Principal', '01.01.01', TRUE),
('01.01.01.03', 'Banco Cuenta Nómina', '01.01.01', TRUE),

('01.01.02', 'Cuentas por Cobrar', '01.01', FALSE),
('01.01.02.01', 'Clientes', '01.01.02', TRUE),
('01.01.02.02', 'Documentos a Cobrar', '01.01.02', TRUE),
('01.01.02.03', 'Anticipos a Proveedores', '01.01.02', TRUE),
('01.01.02.04', 'Anticipos a Empleados', '01.01.02', TRUE),

('01.01.03', 'Inventarios', '01.01', FALSE),
('01.01.03.01', 'Mercaderías para la Venta', '01.01.03', TRUE),
('01.01.03.02', 'Productos en Tránsito', '01.01.03', TRUE),
('01.01.03.03', 'Ajustes de Inventario', '01.01.03', TRUE),

('01.01.04', 'Créditos Fiscales', '01.01', FALSE),
('01.01.04.01', 'IVA Crédito Fiscal', '01.01.04', TRUE),
('01.01.04.02', 'Retenciones a Favor', '01.01.04', TRUE),

('01.01.05', 'Créditos con Proveedores', '01.01', FALSE),
('01.01.05.01', 'Notas de Crédito de Proveedores a Aplicar', '01.01.05', TRUE),

('01.02.01', 'Propiedad, Planta y Equipo', '01.02', FALSE),
('01.02.01.01', 'Equipos Informáticos', '01.02.01', TRUE),
('01.02.01.02', 'Muebles y Útiles', '01.02.01', TRUE),
('01.02.01.03', 'Maquinarias y Herramientas', '01.02.01', TRUE),

-- =========================================================
-- 02 LIABILITIES
-- =========================================================
('02', 'Pasivo', NULL, FALSE),
('02.01', 'Pasivo Corriente', '02', FALSE),
('02.02', 'Pasivo No Corriente', '02', FALSE),

('02.01.01', 'Proveedores y Compras', '02.01', FALSE),
('02.01.01.01', 'Proveedores Locales', '02.01.01', TRUE),
('02.01.01.02', 'Facturas de Compra Pendientes de Pago', '02.01.01', TRUE),

('02.01.02', 'Obligaciones Laborales', '02.01', FALSE),
('02.01.02.01', 'Sueldos y Salarios a Pagar', '02.01.02', TRUE),
('02.01.02.02', 'IPS a Pagar', '02.01.02', TRUE),
('02.01.02.03', 'Deducciones por Daños o Roturas a Compensar', '02.01.02', TRUE),
('02.01.02.04', 'Bonificaciones a Pagar', '02.01.02', TRUE),

('02.01.03', 'Impuestos por Pagar', '02.01', FALSE),
('02.01.03.01', 'IVA Débito Fiscal', '02.01.03', TRUE),
('02.01.03.02', 'Retenciones a Pagar', '02.01.03', TRUE),

('02.01.04', 'Anticipos Recibidos', '02.01', FALSE),
('02.01.04.01', 'Anticipos de Clientes', '02.01.04', TRUE),

('02.02.01', 'Deudas a Largo Plazo', '02.02', FALSE),
('02.02.01.01', 'Préstamos Bancarios a Largo Plazo', '02.02.01', TRUE),

-- =========================================================
-- 03 EQUITY
-- =========================================================
('03', 'Patrimonio Neto', NULL, FALSE),
('03.01', 'Capital y Resultados', '03', FALSE),

('03.01.01', 'Capital', '03.01', FALSE),
('03.01.01.01', 'Capital Social', '03.01.01', TRUE),

('03.01.02', 'Resultados', '03.01', FALSE),
('03.01.02.01', 'Resultados Acumulados', '03.01.02', TRUE),
('03.01.02.02', 'Resultado del Ejercicio', '03.01.02', TRUE),

-- =========================================================
-- 04 INCOME
-- =========================================================
('04', 'Ingresos', NULL, FALSE),
('04.01', 'Ingresos Operativos', '04', FALSE),
('04.02', 'Otros Ingresos', '04', FALSE),

('04.01.01', 'Ventas', '04.01', FALSE),
('04.01.01.01', 'Ventas de Mercaderías', '04.01.01', TRUE),
('04.01.01.02', 'Ventas de Servicios', '04.01.01', TRUE),

('04.01.02', 'Devoluciones y Descuentos sobre Ventas', '04.01', FALSE),
('04.01.02.01', 'Devoluciones sobre Ventas', '04.01.02', TRUE),
('04.01.02.02', 'Descuentos Concedidos', '04.01.02', TRUE),

('04.02.01', 'Recuperos', '04.02', FALSE),
('04.02.01.01', 'Recupero por Daños o Roturas a Empleados', '04.02.01', TRUE),

-- =========================================================
-- 05 COSTS AND EXPENSES
-- =========================================================
('05', 'Costos y Gastos', NULL, FALSE),
('05.01', 'Costo de Ventas', '05', FALSE),
('05.02', 'Gastos Operativos', '05', FALSE),
('05.03', 'Gastos de Personal', '05', FALSE),
('05.04', 'Gastos Financieros', '05', FALSE),
('05.05', 'Ajustes y Otros Gastos', '05', FALSE),

('05.01.01', 'Costo de Mercaderías Vendidas', '05.01', FALSE),
('05.01.01.01', 'Costo de Mercaderías Vendidas', '05.01.01', TRUE),

('05.02.01', 'Gastos Administrativos', '05.02', FALSE),
('05.02.01.01', 'Alquileres', '05.02.01', TRUE),
('05.02.01.02', 'Servicios Básicos', '05.02.01', TRUE),
('05.02.01.03', 'Reparaciones y Mantenimiento', '05.02.01', TRUE),
('05.02.01.04', 'Útiles e Insumos de Oficina', '05.02.01', TRUE),

('05.03.01', 'Remuneraciones', '05.03', FALSE),
('05.03.01.01', 'Sueldos y Jornales', '05.03.01', TRUE),
('05.03.01.02', 'Horas Extras', '05.03.01', TRUE),
('05.03.01.03', 'Bonificaciones y Gratificaciones', '05.03.01', TRUE),
('05.03.01.04', 'Aporte Patronal IPS', '05.03.01', TRUE),

('05.03.02', 'Beneficios Laborales', '05.03', FALSE),
('05.03.02.01', 'Aguinaldo', '05.03.02', TRUE),
('05.03.02.02', 'Vacaciones Pagadas', '05.03.02', TRUE),

('05.04.01', 'Gastos Bancarios', '05.04', FALSE),
('05.04.01.01', 'Comisiones Bancarias', '05.04.01', TRUE),
('05.04.01.02', 'Intereses Pagados', '05.04.01', TRUE),

('05.05.01', 'Ajustes y Pérdidas', '05.05', FALSE),
('05.05.01.01', 'Pérdidas por Roturas o Daños', '05.05.01', TRUE),
('05.05.01.02', 'Ajustes Manuales Contables', '05.05.01', TRUE);


-- Insert chart of accounts respecting hierarchy
DO $$
DECLARE
    v_process_id INT;
    v_parent_id INT;
    rec RECORD;
BEGIN
    SELECT accounting_process_id
    INTO v_process_id
    FROM tmp_accounting_process
    LIMIT 1;

    FOR rec IN
        SELECT *
        FROM tmp_account_seed
        ORDER BY
            array_length(string_to_array(account_number, '.'), 1),
            account_number
    LOOP
        IF rec.parent_number IS NULL THEN
            v_parent_id := NULL;
        ELSE
            SELECT id
            INTO v_parent_id
            FROM chart_of_accounts
            WHERE accounting_process_id = v_process_id
              AND account_number = rec.parent_number
            ORDER BY id
            LIMIT 1;

            IF v_parent_id IS NULL THEN
                RAISE EXCEPTION
                    'Parent account % not found for account %',
                    rec.parent_number,
                    rec.account_number;
            END IF;
        END IF;

        INSERT INTO chart_of_accounts (
            accounting_process_id,
            name,
            is_postable,
            parent_account_id,
            account_number
        )
        SELECT
            v_process_id,
            rec.name,
            rec.is_postable,
            v_parent_id,
            rec.account_number
        WHERE NOT EXISTS (
            SELECT 1
            FROM chart_of_accounts coa
            WHERE coa.accounting_process_id = v_process_id
              AND coa.account_number = rec.account_number
        );
    END LOOP;
END $$;


-- =========================================================
-- PAYROLL NOVELTIES
-- Basic salary, IPS discount, damage/rotura discount, overtime and bonus
-- =========================================================

INSERT INTO novelties (
    code,
    name,
    sign,
    class,
    formula,
    deductible_ips,
    taxable_for_aguinaldo,
    description
)
VALUES
(
    'SALARIO_BASE',
    'Salario base mensual',
    'C',
    'C',
    'contract.salary prorated by payroll period',
    TRUE,
    TRUE,
    'Ingreso principal del empleado según contrato activo.'
),
(
    'HORAS_EXTRA',
    'Horas extras',
    'C',
    'C',
    'timesheet.overtime_hours * hourly_rate * overtime_rule.multiplier',
    TRUE,
    TRUE,
    'Pago adicional por horas extras calculadas desde timesheets.'
),
(
    'BONIFICACION',
    'Bonificación manual',
    'C',
    'F',
    NULL,
    TRUE,
    TRUE,
    'Bonificación o gratificación cargada manualmente.'
),
(
    'DESC_IPS',
    'Descuento IPS empleado',
    'D',
    'C',
    'payroll_engine.calculate_employee_ips(gross_ips_base)',
    FALSE,
    FALSE,
    'Descuento de IPS del empleado calculado automáticamente por nómina.'
),
(
    'DESC_ROTURA',
    'Descuento por daño o rotura',
    'D',
    'F',
    NULL,
    FALSE,
    FALSE,
    'Descuento manual por productos, herramientas o bienes dañados.'
),
(
    'DESC_ADELANTO',
    'Descuento por adelanto salarial',
    'D',
    'F',
    NULL,
    FALSE,
    FALSE,
    'Descuento por adelantos otorgados al empleado.'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    sign = EXCLUDED.sign,
    class = EXCLUDED.class,
    formula = EXCLUDED.formula,
    deductible_ips = EXCLUDED.deductible_ips,
    taxable_for_aguinaldo = EXCLUDED.taxable_for_aguinaldo,
    description = EXCLUDED.description;


-- =========================================================
-- ENTRY MODELS
-- These are templates. They do not store amounts.
-- Your backend later calculates amounts and creates journal_entries.
-- =========================================================

DROP TABLE IF EXISTS tmp_modules;

CREATE TEMP TABLE tmp_modules AS
SELECT
    name,
    MIN(id) AS module_id
FROM modules
GROUP BY name;


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'purchase_invoice',
    'Automatic entry for purchase invoice: debit inventory and VAT credit, credit supplier payable.'
FROM tmp_modules m
WHERE m.name = 'Purchases'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'purchase_invoice'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'purchase_payment',
    'Automatic entry for supplier payment: debit supplier payable, credit bank.'
FROM tmp_modules m
WHERE m.name = 'Purchases'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'purchase_payment'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'purchase_return_credit_note',
    'Automatic entry for supplier return credit note: reduce supplier payable, inventory and VAT credit.'
FROM tmp_modules m
WHERE m.name = 'Purchases'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'purchase_return_credit_note'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'sales_invoice',
    'Automatic entry for sales invoice: debit customer, credit sales and VAT debit; also records cost of goods sold.'
FROM tmp_modules m
WHERE m.name = 'Sales'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'sales_invoice'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'sales_collection',
    'Automatic entry for customer collection: debit cash or bank, credit accounts receivable.'
FROM tmp_modules m
WHERE m.name = 'Sales'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'sales_collection'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'detail',
    'sales_credit_note',
    'Automatic entry for sales credit note: reduce customer receivable, sales revenue and VAT debit.'
FROM tmp_modules m
WHERE m.name = 'Sales'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'sales_credit_note'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'summary',
    'payroll_salary',
    'Automatic summary payroll entry: salary expenses, IPS, deductions and net salary payable.'
FROM tmp_modules m
WHERE m.name = 'Payroll'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'payroll_salary'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    TRUE,
    'summary',
    'payroll_payment',
    'Automatic payroll payment entry: debit salaries payable, credit payroll bank account.'
FROM tmp_modules m
WHERE m.name = 'Payroll'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'payroll_payment'
  );


INSERT INTO entry_models (
    module_id,
    auto_generate,
    entry_type,
    operation_type,
    description
)
SELECT
    m.module_id,
    FALSE,
    'detail',
    'manual_general_entry',
    'Manual accounting entry. No fixed lines because the user chooses accounts manually.'
FROM tmp_modules m
WHERE m.name = 'Manual Accounting'
  AND NOT EXISTS (
      SELECT 1
      FROM entry_models em
      WHERE em.operation_type = 'manual_general_entry'
  );


-- =========================================================
-- ENTRY MODEL DETAILS
-- The line_description explains the amount source/formula.
-- =========================================================

DROP TABLE IF EXISTS tmp_entry_model_seed;

CREATE TEMP TABLE tmp_entry_model_seed (
    operation_type TEXT NOT NULL,
    line_number INT NOT NULL,
    account_number TEXT NOT NULL,
    is_debit BOOLEAN NOT NULL,
    line_description TEXT
);

INSERT INTO tmp_entry_model_seed (
    operation_type,
    line_number,
    account_number,
    is_debit,
    line_description
)
VALUES
-- =========================================================
-- PURCHASE INVOICE
-- Dr Inventory
-- Dr VAT Credit
-- Cr Supplier Payable
-- =========================================================
(
    'purchase_invoice',
    1,
    '01.01.03.01',
    TRUE,
    'Inventory amount = SUM(purchase_invoice_details.quantity * purchase_invoice_details.unit_cost)'
),
(
    'purchase_invoice',
    2,
    '01.01.04.01',
    TRUE,
    'VAT credit = SUM(purchase_invoice_details.tax)'
),
(
    'purchase_invoice',
    3,
    '02.01.01.01',
    FALSE,
    'Supplier payable = purchase_invoices.total'
),

-- =========================================================
-- PURCHASE PAYMENT
-- Dr Supplier Payable
-- Cr Bank
-- =========================================================
(
    'purchase_payment',
    1,
    '02.01.01.01',
    TRUE,
    'Amount paid to supplier = purchase_payment_order_details.amount_to_pay'
),
(
    'purchase_payment',
    2,
    '01.01.01.02',
    FALSE,
    'Bank outflow = purchase_payment_order_details.amount_to_pay'
),

-- =========================================================
-- PURCHASE RETURN CREDIT NOTE
-- Dr Supplier Payable
-- Cr Inventory
-- Cr VAT Credit
-- =========================================================
(
    'purchase_return_credit_note',
    1,
    '02.01.01.01',
    TRUE,
    'Supplier payable reduction = return_credit_notes.total'
),
(
    'purchase_return_credit_note',
    2,
    '01.01.03.01',
    FALSE,
    'Inventory reduction = SUM(return_credit_note_details.subtotal excluding tax if separated by backend)'
),
(
    'purchase_return_credit_note',
    3,
    '01.01.04.01',
    FALSE,
    'VAT credit reversal calculated by backend if applicable'
),

-- =========================================================
-- SALES INVOICE
-- Dr Customer
-- Cr Sales
-- Cr VAT Debit
-- Dr COGS
-- Cr Inventory
-- =========================================================
(
    'sales_invoice',
    1,
    '01.01.02.01',
    TRUE,
    'Customer receivable = sales_invoices.total'
),
(
    'sales_invoice',
    2,
    '04.01.01.01',
    FALSE,
    'Sales revenue = SUM(sale_invoice_details.unit_cost * sale_invoice_details.quantity)'
),
(
    'sales_invoice',
    3,
    '02.01.03.01',
    FALSE,
    'VAT debit = SUM(sale_invoice_details.tax)'
),
(
    'sales_invoice',
    4,
    '05.01.01.01',
    TRUE,
    'Cost of goods sold = SUM(product.last_acquisition_cost or cost * quantity)'
),
(
    'sales_invoice',
    5,
    '01.01.03.01',
    FALSE,
    'Inventory reduction = SUM(product.last_acquisition_cost or cost * quantity)'
),

-- =========================================================
-- SALES COLLECTION
-- Dr Bank
-- Cr Customer
-- =========================================================
(
    'sales_collection',
    1,
    '01.01.01.02',
    TRUE,
    'Cash or bank received from customer'
),
(
    'sales_collection',
    2,
    '01.01.02.01',
    FALSE,
    'Customer receivable reduction'
),

-- =========================================================
-- SALES CREDIT NOTE
-- Dr Sales Returns
-- Dr VAT Debit
-- Cr Customer
-- =========================================================
(
    'sales_credit_note',
    1,
    '04.01.02.01',
    TRUE,
    'Sales return amount excluding tax'
),
(
    'sales_credit_note',
    2,
    '02.01.03.01',
    TRUE,
    'VAT debit reduction'
),
(
    'sales_credit_note',
    3,
    '01.01.02.01',
    FALSE,
    'Customer receivable reduction = credit_notes.total'
),

-- =========================================================
-- PAYROLL SALARY
-- Dr Salary Expenses
-- Dr Overtime Expenses
-- Dr Employer IPS Expense
-- Cr Net Salary Payable
-- Cr IPS Payable
-- Cr Damage Deductions
-- =========================================================
(
    'payroll_salary',
    1,
    '05.03.01.01',
    TRUE,
    'Gross base salary from payroll_items novelty SALARIO_BASE'
),
(
    'payroll_salary',
    2,
    '05.03.01.02',
    TRUE,
    'Overtime amount from payroll_items novelty HORAS_EXTRA'
),
(
    'payroll_salary',
    3,
    '05.03.01.03',
    TRUE,
    'Bonuses from payroll_items novelty BONIFICACION'
),
(
    'payroll_salary',
    4,
    '05.03.01.04',
    TRUE,
    'Employer IPS contribution calculated by payroll engine if applicable'
),
(
    'payroll_salary',
    5,
    '02.01.02.01',
    FALSE,
    'Net salary payable = payroll_employee_summary.net_amount'
),
(
    'payroll_salary',
    6,
    '02.01.02.02',
    FALSE,
    'IPS payable = employee IPS discount plus employer contribution'
),
(
    'payroll_salary',
    7,
    '02.01.02.03',
    FALSE,
    'Damage or broken item deductions from novelty DESC_ROTURA'
),

-- =========================================================
-- PAYROLL PAYMENT
-- Dr Salaries Payable
-- Cr Payroll Bank
-- =========================================================
(
    'payroll_payment',
    1,
    '02.01.02.01',
    TRUE,
    'Salary payable amount paid to employees'
),
(
    'payroll_payment',
    2,
    '01.01.01.03',
    FALSE,
    'Bank payroll outflow'
);


DROP TABLE IF EXISTS tmp_entry_models;

CREATE TEMP TABLE tmp_entry_models AS
SELECT
    operation_type,
    MIN(id) AS entry_model_id
FROM entry_models
GROUP BY operation_type;


INSERT INTO entry_model_details (
    entry_model_id,
    account_id,
    is_debit,
    line_number,
    line_description
)
SELECT
    em.entry_model_id,
    coa.id AS account_id,
    s.is_debit,
    s.line_number,
    s.line_description
FROM tmp_entry_model_seed s
JOIN tmp_entry_models em
    ON em.operation_type = s.operation_type
JOIN tmp_accounting_process ap
    ON TRUE
JOIN chart_of_accounts coa
    ON coa.accounting_process_id = ap.accounting_process_id
   AND coa.account_number = s.account_number
WHERE NOT EXISTS (
    SELECT 1
    FROM entry_model_details emd
    WHERE emd.entry_model_id = em.entry_model_id
      AND emd.line_number = s.line_number
);



















--================================
--           Salary
--================================

-- EMPLOYEES (no foreign keys)
INSERT INTO employees
(document, name, surname, birth_date, hire_date, termination_date, job_title, is_active)
VALUES
('10000001', 'Ana',    'Lopez',      '1990-03-12', '2023-01-10', NULL, 'Purchasing Specialist',      TRUE),
('10000002', 'Bruno',  'Martinez',   '1988-07-22', '2023-02-15', NULL, 'Sales Executive',            TRUE),
('10000003', 'Carla',  'Benitez',    '1992-11-05', '2023-03-01', NULL, 'Treasury Analyst',           TRUE),
('10000004', 'Diego',  'Fernandez',  '1987-09-18', '2023-04-12', NULL, 'Payroll Analyst',            TRUE),
('10000005', 'Elena',  'Ruiz',       '1991-01-30', '2023-05-08', NULL, 'Senior Accountant',          TRUE),
('10000006', 'Fabian', 'Gomez',      '1989-06-14', '2023-05-22', NULL, 'Purchasing Assistant',       TRUE),
('10000007', 'Gabriela','Ortega',    '1993-04-09', '2023-06-01', NULL, 'Sales Assistant',            TRUE),
('10000008', 'Hector', 'Vargas',     '1986-12-03', '2023-06-19', NULL, 'Cashier',                    TRUE),
('10000009', 'Irene',  'Sosa',       '1994-08-27', '2023-07-03', NULL, 'HR Assistant',               TRUE),
('10000010', 'Javier', 'Mendoza',    '1985-10-11', '2023-07-17', NULL, 'Accounting Assistant',       TRUE),
('10000011', 'Karen',  'Aguirre',    '1990-02-25', '2023-08-02', NULL, 'Supplier Coordinator',       TRUE),
('10000012', 'Luis',   'Paredes',    '1984-05-16', '2023-08-14', NULL, 'Sales Coordinator',          TRUE),
('10000013', 'Marta',  'Cabrera',    '1995-09-21', '2023-09-05', NULL, 'Bank Reconciliation Clerk',  TRUE),
('10000014', 'Nicolas','Dominguez',  '1988-01-07', '2023-09-18', NULL, 'Payroll Clerk',              TRUE),
('10000015', 'Olivia', 'Acosta',     '1992-05-29', '2023-10-02', NULL, 'General Ledger Clerk',       TRUE),
('10000016', 'Pablo',  'Rojas',      '1987-03-15', '2023-10-16', NULL, 'Purchasing Clerk',           TRUE),
('10000017', 'Quinta', 'Flores',     '1991-12-08', '2023-11-01', NULL, 'Sales Representative',       TRUE),
('10000018', 'Raul',   'Silva',      '1989-04-19', '2023-11-13', NULL, 'Treasury Clerk',             TRUE),
('10000019', 'Sofia',  'Castillo',   '1993-07-31', '2023-12-04', NULL, 'HR Generalist',              TRUE),
('10000020', 'Tomas',  'Vera',       '1986-11-26', '2023-12-18', NULL, 'Accountant',                 TRUE);



-- RELATIVES
WITH relative_seed AS (

    SELECT *
    FROM (
        VALUES
        -- =================================================
        -- Ana Lopez - 6 relatives
        -- =================================================
        ('10000001', 'Marco',    'Romero',    '20000001', 'spouse', '1989-04-18'::date, FALSE),
        ('10000001', 'Mateo',    'Lopez',     '20000002', 'child',  '2012-06-10'::date, FALSE),
        ('10000001', 'Valentina','Lopez',     '20000003', 'child',  '2014-09-22'::date, FALSE),
        ('10000001', 'Lucas',    'Lopez',     '20000004', 'child',  '2017-01-15'::date, FALSE),
        ('10000001', 'Emma',     'Lopez',     '20000005', 'child',  '2020-03-08'::date, FALSE),
        ('10000001', 'Teresa',   'Lopez',     '20000006', 'other',  '1963-11-20'::date, FALSE),

        -- =================================================
        -- Bruno Martinez - 6 relatives
        -- =================================================
        ('10000002', 'Laura',    'Caceres',   '20000007', 'spouse', '1990-08-11'::date, FALSE),
        ('10000002', 'Thiago',   'Martinez',  '20000008', 'child',  '2011-05-19'::date, FALSE),
        ('10000002', 'Camila',   'Martinez',  '20000009', 'child',  '2013-10-04'::date, FALSE),
        ('10000002', 'Benjamin', 'Martinez',  '20000010', 'child',  '2016-12-14'::date, FALSE),
        ('10000002', 'Julieta',  'Martinez',  '20000011', 'child',  '2019-07-27'::date, FALSE),
        ('10000002', 'Ramon',    'Martinez',  '20000012', 'other',  '1958-02-02'::date, FALSE),

        -- =================================================
        -- Carla Benitez - 6 relatives
        -- =================================================
        ('10000003', 'Andres',   'Gimenez',   '20000013', 'spouse', '1991-01-30'::date, FALSE),
        ('10000003', 'Renata',   'Benitez',   '20000014', 'child',  '2014-04-09'::date, FALSE),
        ('10000003', 'Joaquin',  'Benitez',   '20000015', 'child',  '2016-08-16'::date, FALSE),
        ('10000003', 'Martina',  'Benitez',   '20000016', 'child',  '2019-02-25'::date, FALSE),
        ('10000003', 'Delfina',  'Benitez',   '20000017', 'child',  '2021-06-13'::date, FALSE),
        ('10000003', 'Norma',    'Benitez',   '20000018', 'other',  '1966-09-03'::date, TRUE),

        -- =================================================
        -- Diego Fernandez - 6 relatives
        -- =================================================
        ('10000004', 'Patricia', 'Vera',      '20000019', 'spouse', '1988-03-21'::date, FALSE),
        ('10000004', 'Agustin',  'Fernandez', '20000020', 'child',  '2010-11-05'::date, FALSE),
        ('10000004', 'Micaela',  'Fernandez', '20000021', 'child',  '2013-01-12'::date, FALSE),
        ('10000004', 'Santiago', 'Fernandez', '20000022', 'child',  '2015-07-29'::date, FALSE),
        ('10000004', 'Catalina', 'Fernandez', '20000023', 'child',  '2018-10-18'::date, FALSE),
        ('10000004', 'Victor',   'Fernandez', '20000024', 'other',  '1960-05-07'::date, FALSE),

        -- =================================================
        -- Elena Ruiz - 4 relatives
        -- =================================================
        ('10000005', 'Hugo',     'Ayala',     '20000025', 'spouse', '1989-12-01'::date, FALSE),
        ('10000005', 'Isabella', 'Ruiz',      '20000026', 'child',  '2015-03-17'::date, FALSE),
        ('10000005', 'Daniel',   'Ruiz',      '20000027', 'child',  '2017-09-09'::date, FALSE),
        ('10000005', 'Luciana',  'Ruiz',      '20000028', 'child',  '2020-12-23'::date, FALSE),

        -- =================================================
        -- Fabian Gomez - 4 relatives
        -- =================================================
        ('10000006', 'Natalia',  'Sosa',      '20000029', 'spouse', '1992-06-14'::date, FALSE),
        ('10000006', 'Tomas',    'Gomez',     '20000030', 'child',  '2013-02-08'::date, FALSE),
        ('10000006', 'Maia',     'Gomez',     '20000031', 'child',  '2016-05-30'::date, FALSE),
        ('10000006', 'Brenda',   'Gomez',     '20000032', 'child',  '2019-11-11'::date, FALSE),

        -- =================================================
        -- Gabriela Ortega - 4 relatives
        -- =================================================
        ('10000007', 'Rodrigo',  'Mendoza',   '20000033', 'spouse', '1990-10-25'::date, FALSE),
        ('10000007', 'Alma',     'Ortega',    '20000034', 'child',  '2016-01-19'::date, FALSE),
        ('10000007', 'Franco',   'Ortega',    '20000035', 'child',  '2018-04-07'::date, FALSE),
        ('10000007', 'Pilar',    'Ortega',    '20000036', 'child',  '2022-08-16'::date, FALSE),

        -- =================================================
        -- Hector Vargas - 4 relatives
        -- =================================================
        ('10000008', 'Silvia',   'Rojas',     '20000037', 'spouse', '1987-07-02'::date, FALSE),
        ('10000008', 'Ignacio',  'Vargas',    '20000038', 'child',  '2012-09-14'::date, FALSE),
        ('10000008', 'Abril',    'Vargas',    '20000039', 'child',  '2015-11-28'::date, FALSE),
        ('10000008', 'Samuel',   'Vargas',    '20000040', 'child',  '2019-06-06'::date, FALSE),

        -- =================================================
        -- Irene Sosa - 4 relatives
        -- =================================================
        ('10000009', 'Matias',   'Torres',    '20000041', 'spouse', '1991-05-20'::date, FALSE),
        ('10000009', 'Lara',     'Sosa',      '20000042', 'child',  '2017-03-03'::date, FALSE),
        ('10000009', 'Gael',     'Sosa',      '20000043', 'child',  '2019-09-12'::date, FALSE),
        ('10000009', 'Ana',      'Sosa',      '20000044', 'other',  '1969-12-30'::date, FALSE),

        -- =================================================
        -- Javier Mendoza - 4 relatives
        -- =================================================
        ('10000010', 'Paola',    'Benitez',   '20000045', 'spouse', '1988-08-08'::date, FALSE),
        ('10000010', 'Noah',     'Mendoza',   '20000046', 'child',  '2014-07-21'::date, FALSE),
        ('10000010', 'Emma',     'Mendoza',   '20000047', 'child',  '2018-02-02'::date, FALSE),
        ('10000010', 'Clara',    'Mendoza',   '20000048', 'child',  '2021-10-10'::date, FALSE),

        -- =================================================
        -- Karen Aguirre - pocos relatives
        -- =================================================
        ('10000011', 'Sebastian','Cabrera',   '20000049', 'spouse', '1989-03-16'::date, FALSE),
        ('10000011', 'Mia',      'Aguirre',   '20000050', 'child',  '2018-06-01'::date, FALSE),
        ('10000011', 'Jose',     'Aguirre',   '20000051', 'other',  '1964-04-12'::date, FALSE),

        -- =================================================
        -- Luis Paredes - pocos relatives
        -- =================================================
        ('10000012', 'Daniela',  'Ortiz',     '20000052', 'spouse', '1986-09-29'::date, FALSE),
        ('10000012', 'Bruno',    'Paredes',   '20000053', 'child',  '2016-12-05'::date, FALSE),

        -- =================================================
        -- Marta Cabrera - pocos relatives
        -- =================================================
        ('10000013', 'Enzo',     'Cabrera',   '20000054', 'child',  '2019-01-25'::date, FALSE),
        ('10000013', 'Rosa',     'Cabrera',   '20000055', 'other',  '1961-07-07'::date, TRUE),

        -- =================================================
        -- Nicolas Dominguez - pocos relatives
        -- =================================================
        ('10000014', 'Florencia','Vega',      '20000056', 'spouse', '1990-11-18'::date, FALSE),

        -- =================================================
        -- Olivia Acosta - pocos relatives
        -- =================================================
        ('10000015', 'Leon',     'Acosta',    '20000057', 'child',  '2020-05-13'::date, FALSE)

        -- Empleados 10000016 al 10000020 quedan sin relatives
    ) AS x(
        employee_document,
        name,
        surname,
        document,
        relation_type,
        birth_date,
        disability
    )

)

INSERT INTO relatives (
    employee_id,
    name,
    surname,
    document,
    relation_type,
    birth_date,
    disability
)

SELECT
    e.id,
    rs.name,
    rs.surname,
    rs.document,
    rs.relation_type,
    rs.birth_date,
    rs.disability
FROM relative_seed rs
JOIN employees e ON e.document = rs.employee_document
WHERE NOT EXISTS (
    SELECT 1
    FROM relatives r
    WHERE r.employee_id = e.id
      AND r.document = rs.document
);








--================================
--            users
--================================

-- ROLES (no foreign keys)
INSERT INTO roles (name, description) VALUES
('Procurement Manager',      'Responsible for purchasing operations, suppliers and procurement workflow'),
('Sales Manager',            'Responsible for sales operations, customers and commercial workflow'),
('Treasury Manager',         'Responsible for cash, banks, payments and reconciliations'),
('HR and Payroll Manager',   'Responsible for employee administration and payroll processing'),
('Accounting Manager',       'Responsible for accounting records, closing and financial reporting');

-- USERS (FK -> employees, roles)
INSERT INTO users
(employee_id, username, email, pass_hash, is_active, last_login_at, created_at, updated_at, role_id)
VALUES
(
  (SELECT id FROM employees WHERE document = '10000001'),
  'juan-compras',
  'procurement.admin@erp.local',
  '$argon2id$v=19$m=32768,t=3,p=1$sX44qr2FkjfuxAkphYmM8w$o6kPzwqCE/eKXXcVxBIg7H9JMACehKJs9vj/VezlQX8',
  TRUE,
  NULL,
  NOW(),
  NULL,
  (SELECT id FROM roles WHERE name = 'Procurement Manager')
),
(
  (SELECT id FROM employees WHERE document = '10000002'),
  'juan-ventas',
  'sales.admin@erp.local',
  '$argon2id$v=19$m=32768,t=3,p=1$sX44qr2FkjfuxAkphYmM8w$o6kPzwqCE/eKXXcVxBIg7H9JMACehKJs9vj/VezlQX8',
  TRUE,
  NULL,
  NOW(),
  NULL,
  (SELECT id FROM roles WHERE name = 'Sales Manager')
),
(
  (SELECT id FROM employees WHERE document = '10000003'),
  'juan-tesoreria',
  'treasury.admin@erp.local',
  '$argon2id$v=19$m=32768,t=3,p=1$sX44qr2FkjfuxAkphYmM8w$o6kPzwqCE/eKXXcVxBIg7H9JMACehKJs9vj/VezlQX8',
  TRUE,
  NULL,
  NOW(),
  NULL,
  (SELECT id FROM roles WHERE name = 'Treasury Manager')
),
(
  (SELECT id FROM employees WHERE document = '10000004'),
  'juan-recursoshumanos',
  'hr.payroll.admin@erp.local',
  '$argon2id$v=19$m=32768,t=3,p=1$sX44qr2FkjfuxAkphYmM8w$o6kPzwqCE/eKXXcVxBIg7H9JMACehKJs9vj/VezlQX8',
  TRUE,
  NULL,
  NOW(),
  NULL,
  (SELECT id FROM roles WHERE name = 'HR and Payroll Manager')
),
(
  (SELECT id FROM employees WHERE document = '10000005'),
  'juan-contabilidad',
  'accounting.admin@erp.local',
  '$argon2id$v=19$m=32768,t=3,p=1$sX44qr2FkjfuxAkphYmM8w$o6kPzwqCE/eKXXcVxBIg7H9JMACehKJs9vj/VezlQX8',
  TRUE,
  NULL,
  NOW(),
  NULL,
  (SELECT id FROM roles WHERE name = 'Accounting Manager')
);

-- PERMISSIONS (no foreign keys)
INSERT INTO permissions (code, description) VALUES
('sales.all',                       'Full access to sales module'),
('sales.dashboard.view',            'View sales dashboard'),
('sales.clients.manage',            'Create, edit and delete clients'),
('sales.quotes.manage',             'Manage sales quotations'),
('sales.invoices.manage',           'Manage sales invoices'),
('sales.returns.manage',            'Manage sales returns'),
('sales.reports.view',              'View sales reports'),
('purchases.all',                   'Full access to purchases module'),
('treasury.all',                    'Full access to treasury module'),
('hr.all',                          'Full access to HR module'),
('payroll.all',                     'Full access to payroll module'),
('accounting.all',                  'Full access to accounting module');

-- ROLES_PERMISSIONS (FK -> roles, permissions)
-- Procurement Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code LIKE 'purchases.%'
WHERE r.name = 'Procurement Manager'
ON CONFLICT DO NOTHING;

-- Sales Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code LIKE 'sales.%'
ON CONFLICT DO NOTHING;

-- Treasury Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code LIKE 'treasury.%'
WHERE r.name = 'Treasury Manager'
ON CONFLICT DO NOTHING;

-- HR and Payroll Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p 
  ON p.code LIKE 'hr.%'
  OR p.code LIKE 'payroll.%'
WHERE r.name = 'HR and Payroll Manager'
ON CONFLICT DO NOTHING;

-- Accounting Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code LIKE 'accounting.%'
WHERE r.name = 'Accounting Manager'
ON CONFLICT DO NOTHING;













--================================
--            Sales
--================================

-- BRANDS
INSERT INTO brands (name)
SELECT unnest(ARRAY[
    -- Neumáticos
    'Michelin',
    'Bridgestone',
    'Goodyear',
    'Pirelli',
    'Continental',
    'Hankook',
    'Yokohama',
    'Kumho',
    'BFGoodrich',
    'Firestone',
    'Dunlop',
    'Toyo',
    'Nexen',
    'Falken',
    'Sailun',
    'Triangle',
    'Linglong',
    'Westlake',

    -- Lubricantes y fluidos
    'Castrol',
    'Mobil',
    'Shell',
    'Valvoline',
    'Motul',
    'Liqui Moly',
    'TotalEnergies',
    'Petronas',
    'Elf',
    'Repsol',
    'Gulf',
    'Texaco',
    'Quaker State',
    'Pennzoil',
    'Ravenol',
    'Mannol',
    'Red Line',
    'STP',
    'Bardahl',
    'Wynn''s',

    -- Filtros
    'Mann-Filter',
    'Mahle',
    'WIX',
    'Fram',
    'Fleetguard',
    'Donaldson',
    'Baldwin',
    'Tecfil',
    'Purflux',
    'Sakura',

    -- Frenos
    'Brembo',
    'Ferodo',
    'TRW',
    'ATE',
    'Textar',
    'Bendix',
    'Bosch',
    'Jurid',
    'Fric-Rot',
    'Cobreq',

    -- Suspensión y dirección
    'Monroe',
    'KYB',
    'Sachs',
    'Cofap',
    'Gabriel',
    'Lemförder',
    'Febi Bilstein',
    'Meyle',
    'Moog',
    'Nakayama',

    -- Encendido, sensores y eléctrico
    'NGK',
    'Denso',
    'Delphi',
    'Magneti Marelli',
    'Valeo',
    'Hella',
    'Osram',
    'Philips',
    'Lucas',
    'Hitachi',

    -- Baterías
    'Varta',
    'ACDelco',
    'Exide',
    'Moura',
    'Heliar',
    'Willard',
    'Yuasa',
    'Bosch Batteries',
    'Energizer',
    'PowerKing',

    -- Correas, transmisión y rodamientos
    'Gates',
    'Dayco',
    'Contitech',
    'SKF',
    'NSK',
    'NTN',
    'Timken',
    'INA',
    'LuK',
    'Schaeffler',
    'GMB',
    'Koyo',

    -- Refrigeración
    'Denso Cooling',
    'Valeo Cooling',
    'Behr',
    'Nissens',
    'NRF',
    'VDO',
    'Wahler',

    -- Genérico
    'Genérico',

    -- Marcas ficticias / internas
    'AutoMax',
    'PowerDrive',
    'LubriTech',
    'RoadStar',
    'UltraOil',
    'NitroX',
    'PrimeAuto',
    'GearForce',
    'MotorLine',
    'TurboMax',
    'Apex Parts',
    'Velocity',
    'Dynatek',
    'BlueMotion',
    'RedLine',
    'SilverOil',
    'BlackHorse',
    'ProLube',
    'MaxTorque',
    'EcoDrive',
    'IronGear',
    'RapidFlow',
    'DriveTech',
    'MotoPlus',
    'SpeedLine',
    'MasterOil',
    'NovaParts',
    'TitanForce',
    'Quantum',
    'Polar',
    'HelixPro',
    'SparkTech',
    'BrakeOne',
    'CoolFlow',
    'TopGear',
    'AutoPrime',
    'Infinity Parts',
    'AutoNova',
    'ElectroCar',
    'MegaDrive',
    'FastTrack',
    'GrandPrix',
    'UrbanMotion',
    'RacerX',
    'Motron',
    'AutoLux',
    'MotoElite',
    'FusionParts',
    'Vortex',
    'NeoDrive',
    'HyperLube',
    'GT Performance',
    'TurboLine',
    'SmartParts',
    'DriveMax',
    'PeakAuto',
    'RoadTech',
    'EverMotion',
    'StrongBrake',
    'NitroParts',
    'ExtremeOil',
    'TrueDrive',
    'Vertex',
    'EcoMotion',
    'MaxSpeed',
    'AlphaParts',
    'BetaOil',
    'GammaDrive',
    'DeltaForce',
    'OmegaParts',
    'CoreAuto',
    'MotionPro',
    'DrivePro',
    'FlexMotor',
    'RoyalParts',
    'DynamicOil',
    'GreenMotion',
    'BlueDrive',
    'FastOil',
    'ProBrake',
    'TopMotion',
    'XDrive',
    'ZoomAuto',
    'FireRoad',
    'SteelForce',
    'RoadMaster',
    'NextGear',
    'AutoCore',
    'PowerMotion',
    'MotoDrive',
    'UltraParts',
    'HyperDrive',
    'NorthRoad',
    'SouthMotor',
    'EastGear',
    'WestDrive',
    'PrecisionAuto',
    'VelocityX',
    'AutoWorld',
    'PrimeMotion'
])
ON CONFLICT (name) DO NOTHING;

-- Categories
INSERT INTO categories (name)
SELECT unnest(ARRAY[
    -- Lubricantes y fluidos
    'Aceites de Motor',
    'Aceites de Transmisión',
    'Aceites Hidráulicos',
    'Aceites Diferenciales',
    'Grasas Lubricantes',
    'Refrigerantes',
    'Líquidos de Freno',
    'Líquidos Hidráulicos',
    'Aditivos',
    'Limpiadores Automotrices',

    -- Filtros
    'Filtros de Aceite',
    'Filtros de Aire',
    'Filtros de Combustible',
    'Filtros de Cabina',
    'Kits de Filtros',

    -- Sistema eléctrico
    'Baterías',
    'Alternadores',
    'Motores de Arranque',
    'Bujías',
    'Cables de Bujía',
    'Bobinas de Encendido',
    'Fusibles',
    'Relés',
    'Sensores',

    -- Frenos
    'Pastillas de Freno',
    'Discos de Freno',
    'Zapatas de Freno',
    'Campanas de Freno',
    'Cilindros de Freno',
    'Bombas de Freno',
    'Mangueras de Freno',
    'Kits de Freno',

    -- Suspensión y dirección
    'Amortiguadores',
    'Espirales',
    'Bujes',
    'Rótulas',
    'Extremos de Dirección',
    'Barras Estabilizadoras',
    'Cremalleras de Dirección',
    'Bombas de Dirección',

    -- Motor
    'Correas',
    'Kits de Distribución',
    'Tensores',
    'Bombas de Agua',
    'Bombas de Aceite',
    'Juntas',
    'Retenes',
    'Soportes de Motor',

    -- Refrigeración
    'Radiadores',
    'Electroventiladores',
    'Termostatos',
    'Mangueras de Radiador',
    'Depósitos de Agua',

    -- Transmisión y embrague
    'Embragues',
    'Kits de Embrague',
    'Rulemanes',
    'Homocinéticas',
    'Semiejes',
    'Crucetas',

    -- Neumáticos y ruedas
    'Neumáticos',
    'Llantas',
    'Válvulas',
    'Tuercas de Rueda',
    'Tazas de Rueda',

    -- Iluminación
    'Luces LED',
    'Faros',
    'Ópticas',
    'Lámparas',
    'Balizas',
    'Guiños',

    -- Limpieza y accesorios
    'Limpiaparabrisas',
    'Escobillas',
    'Alfombras',
    'Fundas',
    'Accesorios',
    'Herramientas',
    'Cuidado Exterior',
    'Cuidado Interior'
])
ON CONFLICT (name) DO NOTHING;

-- TAXES
INSERT INTO taxes (name, percentage) VALUES
('IVA 10%', 10.00),
('IVA 5%', 5.00),
('ISC', 12.00)
ON CONFLICT (name) DO NOTHING;

-- PRODUCTS [2000 APROX]
WITH product_base AS (

    SELECT
        gs,
        c.id AS category_id,
        c.name AS category_name
    FROM generate_series(1, 2000) gs
    CROSS JOIN LATERAL (
        SELECT id, name
        FROM categories
        ORDER BY random()
        LIMIT 1
    ) c

),

brand_candidates AS (

    SELECT
        pb.*,

        CASE
            -- Neumáticos
            WHEN category_name = 'Neumáticos' THEN ARRAY[
                'Michelin','Bridgestone','Goodyear','Pirelli','Continental',
                'Hankook','Yokohama','Kumho','BFGoodrich','Firestone',
                'Dunlop','Toyo','Nexen','Falken'
            ]

            -- Lubricantes y fluidos
            WHEN category_name IN (
                'Aceites de Motor',
                'Aceites de Transmisión',
                'Aceites Hidráulicos',
                'Aceites Diferenciales',
                'Grasas Lubricantes',
                'Refrigerantes',
                'Líquidos de Freno',
                'Líquidos Hidráulicos',
                'Aditivos',
                'Limpiadores Automotrices'
            ) THEN ARRAY[
                'Castrol','Mobil','Shell','Valvoline','Motul',
                'Liqui Moly','TotalEnergies','Petronas','Elf',
                'Repsol','Gulf','Texaco','Quaker State','Pennzoil',
                'Ravenol','Mannol','Red Line','STP','Bardahl','Wynn''s'
            ]

            -- Filtros
            WHEN category_name ILIKE '%Filtro%' THEN ARRAY[
                'Mann-Filter','Mahle','WIX','Fram','Fleetguard',
                'Donaldson','Baldwin','Tecfil','Purflux','Sakura','Bosch'
            ]

            -- Frenos
            WHEN category_name ILIKE '%Freno%' 
              OR category_name IN ('Pastillas de Freno','Discos de Freno','Zapatas de Freno','Campanas de Freno','Kits de Freno') THEN ARRAY[
                'Brembo','Ferodo','TRW','ATE','Textar',
                'Bendix','Bosch','Jurid','Fric-Rot','Cobreq'
            ]

            -- Suspensión y dirección
            WHEN category_name IN (
                'Amortiguadores',
                'Espirales',
                'Bujes',
                'Rótulas',
                'Extremos de Dirección',
                'Barras Estabilizadoras',
                'Cremalleras de Dirección',
                'Bombas de Dirección'
            ) THEN ARRAY[
                'Monroe','KYB','Sachs','Cofap','Gabriel',
                'Lemförder','Febi Bilstein','Meyle','Moog','Nakayama'
            ]

            -- Motor, correas y distribución
            WHEN category_name IN (
                'Correas',
                'Kits de Distribución',
                'Tensores',
                'Bombas de Agua',
                'Bombas de Aceite',
                'Juntas',
                'Retenes',
                'Soportes de Motor'
            ) THEN ARRAY[
                'Gates','Dayco','Contitech','SKF','INA',
                'LuK','Schaeffler','GMB','Koyo','Bosch','Mahle'
            ]

            -- Refrigeración
            WHEN category_name IN (
                'Radiadores',
                'Electroventiladores',
                'Termostatos',
                'Mangueras de Radiador',
                'Depósitos de Agua'
            ) THEN ARRAY[
                'Denso','Valeo','Behr','Nissens','NRF','Wahler','GMB','Bosch'
            ]

            -- Transmisión, embrague y rodamientos
            WHEN category_name IN (
                'Embragues',
                'Kits de Embrague',
                'Rulemanes',
                'Homocinéticas',
                'Semiejes',
                'Crucetas'
            ) THEN ARRAY[
                'LuK','Sachs','SKF','NSK','NTN','Timken',
                'INA','Schaeffler','GMB','Koyo'
            ]

            -- Eléctrico, encendido, sensores e iluminación
            WHEN category_name IN (
                'Baterías',
                'Alternadores',
                'Motores de Arranque',
                'Bujías',
                'Cables de Bujía',
                'Bobinas de Encendido',
                'Fusibles',
                'Relés',
                'Sensores',
                'Luces LED',
                'Faros',
                'Ópticas',
                'Lámparas',
                'Balizas',
                'Guiños'
            ) THEN ARRAY[
                'Bosch','NGK','Denso','Delphi','Magneti Marelli',
                'Valeo','Hella','Osram','Philips','Lucas','Hitachi',
                'Varta','ACDelco','Exide','Moura','Heliar','Yuasa'
            ]

            -- Accesorios, limpieza y varios
            ELSE ARRAY[
                'Bosch','Valeo','Hella','Philips','STP',
                'Wynn''s','Bardahl','Genérico','AutoMax','DriveTech'
            ]
        END AS candidate_brand_names

    FROM product_base pb

),

product_brand AS (

    SELECT
        bc.*,
        b.id AS brand_id,
        b.name AS brand_name
    FROM brand_candidates bc
    CROSS JOIN LATERAL (
        SELECT id, name
        FROM brands b
        ORDER BY
            CASE 
                WHEN b.name = ANY(bc.candidate_brand_names) THEN 0
                ELSE 1
            END,
            random()
        LIMIT 1
    ) b

),

product_specs AS (

    SELECT
        pb.*,

        CASE
            -- Lubricantes
            WHEN category_name = 'Aceites de Motor' THEN
                brand_name || ' Aceite de Motor ' ||
                (ARRAY['5W-30','10W-40','15W-40','20W-50','0W-20','5W-40'])[1 + floor(random() * 6)::int] ||
                ' ' ||
                (ARRAY['Sintético','Semisintético','Mineral'])[1 + floor(random() * 3)::int] ||
                ' ' ||
                (ARRAY['1L','4L','5L','20L'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Aceites de Transmisión' THEN
                brand_name || ' Aceite de Transmisión ' ||
                (ARRAY['ATF Dexron III','ATF Dexron VI','CVT','75W-90 GL-5','80W-90 GL-4','MTF 75W-80'])[1 + floor(random() * 6)::int] ||
                ' ' ||
                (ARRAY['1L','4L','20L'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Aceites Hidráulicos' THEN
                brand_name || ' Aceite Hidráulico ISO ' ||
                (ARRAY['32','46','68','100'])[1 + floor(random() * 4)::int] ||
                ' ' ||
                (ARRAY['1L','4L','20L'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Aceites Diferenciales' THEN
                brand_name || ' Aceite Diferencial ' ||
                (ARRAY['75W-90','80W-90','85W-140'])[1 + floor(random() * 3)::int] ||
                ' GL-5 ' ||
                (ARRAY['1L','4L'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Grasas Lubricantes' THEN
                brand_name || ' Grasa Multipropósito NLGI ' ||
                (ARRAY['1','2','3'])[1 + floor(random() * 3)::int] ||
                ' ' ||
                (ARRAY['500g','1kg','5kg'])[1 + floor(random() * 3)::int]

            -- Filtros
            WHEN category_name = 'Filtros de Aceite' THEN
                brand_name || ' Filtro de Aceite ' ||
                (ARRAY['roscado','cartucho','blindado'])[1 + floor(random() * 3)::int] ||
                ' M' || (ARRAY['20x1.5','18x1.5','22x1.5'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Filtros de Aire' THEN
                brand_name || ' Filtro de Aire ' ||
                (ARRAY['rectangular','panel','cilíndrico','alto flujo'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Filtros de Combustible' THEN
                brand_name || ' Filtro de Combustible ' ||
                (ARRAY['diésel','nafta','con separador de agua','en línea'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Filtros de Cabina' THEN
                brand_name || ' Filtro de Cabina ' ||
                (ARRAY['antipolen','carbón activado','premium'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Kits de Filtros' THEN
                brand_name || ' Kit de Filtros ' ||
                (ARRAY['aceite + aire','aceite + aire + combustible','servicio completo'])[1 + floor(random() * 3)::int]

            -- Baterías
            WHEN category_name = 'Baterías' THEN
                brand_name || ' Batería ' ||
                (ARRAY['45Ah','55Ah','60Ah','65Ah','75Ah','90Ah','100Ah'])[1 + floor(random() * 7)::int] ||
                ' 12V ' ||
                (ARRAY['libre mantenimiento','AGM','EFB'])[1 + floor(random() * 3)::int]

            -- Frenos
            WHEN category_name = 'Pastillas de Freno' THEN
                brand_name || ' Juego de Pastillas de Freno ' ||
                (ARRAY['delanteras','traseras'])[1 + floor(random() * 2)::int] ||
                ' ' ||
                (ARRAY['cerámicas','semimetálicas','orgánicas'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Discos de Freno' THEN
                brand_name || ' Disco de Freno ' ||
                (ARRAY['ventilado','sólido','ranurado'])[1 + floor(random() * 3)::int] ||
                ' ' ||
                (ARRAY['240mm','256mm','280mm','300mm','320mm'])[1 + floor(random() * 5)::int]

            WHEN category_name = 'Zapatas de Freno' THEN
                brand_name || ' Juego de Zapatas de Freno Traseras'

            WHEN category_name = 'Campanas de Freno' THEN
                brand_name || ' Campana de Freno Trasera ' ||
                (ARRAY['180mm','200mm','220mm'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Bombas de Freno' THEN
                brand_name || ' Bomba de Freno Cilindro Maestro'

            WHEN category_name = 'Mangueras de Freno' THEN
                brand_name || ' Manguera de Freno Flexible ' ||
                (ARRAY['delantera','trasera'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Kits de Freno' THEN
                brand_name || ' Kit de Freno ' ||
                (ARRAY['delantero','trasero','completo'])[1 + floor(random() * 3)::int]

            -- Suspensión y dirección
            WHEN category_name = 'Amortiguadores' THEN
                brand_name || ' Amortiguador ' ||
                (ARRAY['delantero izquierdo','delantero derecho','trasero izquierdo','trasero derecho'])[1 + floor(random() * 4)::int] ||
                ' gas presurizado'

            WHEN category_name = 'Espirales' THEN
                brand_name || ' Espiral de Suspensión ' ||
                (ARRAY['delantero','trasero'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Bujes' THEN
                brand_name || ' Buje de Suspensión ' ||
                (ARRAY['parrilla','barra estabilizadora','tren delantero'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Rótulas' THEN
                brand_name || ' Rótula de Suspensión ' ||
                (ARRAY['inferior','superior'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Extremos de Dirección' THEN
                brand_name || ' Extremo de Dirección ' ||
                (ARRAY['izquierdo','derecho'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Barras Estabilizadoras' THEN
                brand_name || ' Barra Estabilizadora Delantera'

            WHEN category_name = 'Cremalleras de Dirección' THEN
                brand_name || ' Cremallera de Dirección Hidráulica'

            WHEN category_name = 'Bombas de Dirección' THEN
                brand_name || ' Bomba de Dirección Hidráulica'

            -- Motor
            WHEN category_name = 'Correas' THEN
                brand_name || ' Correa ' ||
                (ARRAY['dentada','poly-v','alternador','accesorios'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Kits de Distribución' THEN
                brand_name || ' Kit de Distribución con Tensor y Correa'

            WHEN category_name = 'Tensores' THEN
                brand_name || ' Tensor de Correa ' ||
                (ARRAY['distribución','alternador','accesorios'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Bombas de Agua' THEN
                brand_name || ' Bomba de Agua con Junta'

            WHEN category_name = 'Bombas de Aceite' THEN
                brand_name || ' Bomba de Aceite de Motor'

            WHEN category_name = 'Juntas' THEN
                brand_name || ' Junta ' ||
                (ARRAY['tapa de válvulas','culata','cárter','múltiple'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Retenes' THEN
                brand_name || ' Retén ' ||
                (ARRAY['cigüeñal','árbol de levas','semieje','caja'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Soportes de Motor' THEN
                brand_name || ' Soporte de Motor ' ||
                (ARRAY['delantero','trasero','lateral derecho','lateral izquierdo'])[1 + floor(random() * 4)::int]

            -- Refrigeración
            WHEN category_name = 'Radiadores' THEN
                brand_name || ' Radiador de Aluminio ' ||
                (ARRAY['con depósito','sin depósito','doble panel'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Refrigerantes' THEN
                brand_name || ' Refrigerante ' ||
                (ARRAY['rojo','verde','azul','orgánico OAT'])[1 + floor(random() * 4)::int] ||
                ' ' ||
                (ARRAY['1L','4L','5L'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Electroventiladores' THEN
                brand_name || ' Electroventilador de Radiador ' ||
                (ARRAY['10 pulgadas','12 pulgadas','14 pulgadas'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Termostatos' THEN
                brand_name || ' Termostato ' ||
                (ARRAY['82°C','87°C','92°C'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Mangueras de Radiador' THEN
                brand_name || ' Manguera de Radiador ' ||
                (ARRAY['superior','inferior','bypass'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Depósitos de Agua' THEN
                brand_name || ' Depósito de Agua de Radiador'

            -- Transmisión
            WHEN category_name = 'Embragues' THEN
                brand_name || ' Disco de Embrague ' ||
                (ARRAY['200mm','215mm','225mm','240mm'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Kits de Embrague' THEN
                brand_name || ' Kit de Embrague Plato Disco y Rulemán'

            WHEN category_name = 'Rulemanes' THEN
                brand_name || ' Rulemán ' ||
                (ARRAY['rueda delantera','rueda trasera','embrague','alternador'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Homocinéticas' THEN
                brand_name || ' Junta Homocinética ' ||
                (ARRAY['lado rueda','lado caja'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Semiejes' THEN
                brand_name || ' Semieje Completo ' ||
                (ARRAY['izquierdo','derecho'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Crucetas' THEN
                brand_name || ' Cruceta de Cardán Reforzada'

            -- Eléctrico e iluminación
            WHEN category_name = 'Bujías' THEN
                brand_name || ' Bujía ' ||
                (ARRAY['iridium','platino','níquel','resistiva'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Cables de Bujía' THEN
                brand_name || ' Juego de Cables de Bujía'

            WHEN category_name = 'Bobinas de Encendido' THEN
                brand_name || ' Bobina de Encendido ' ||
                (ARRAY['individual','doble salida','tipo lápiz'])[1 + floor(random() * 3)::int]

            WHEN category_name = 'Alternadores' THEN
                brand_name || ' Alternador ' ||
                (ARRAY['70A','90A','120A','150A'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Motores de Arranque' THEN
                brand_name || ' Motor de Arranque 12V'

            WHEN category_name = 'Sensores' THEN
                brand_name || ' Sensor ' ||
                (ARRAY['oxígeno','MAP','MAF','temperatura','cigüeñal','ABS'])[1 + floor(random() * 6)::int]

            WHEN category_name = 'Luces LED' THEN
                brand_name || ' Kit LED ' ||
                (ARRAY['H1','H4','H7','H11','9005','9006'])[1 + floor(random() * 6)::int] ||
                ' 6000K'

            WHEN category_name = 'Faros' THEN
                brand_name || ' Faro Delantero ' ||
                (ARRAY['izquierdo','derecho'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Ópticas' THEN
                brand_name || ' Óptica Delantera ' ||
                (ARRAY['izquierda','derecha'])[1 + floor(random() * 2)::int]

            WHEN category_name = 'Lámparas' THEN
                brand_name || ' Lámpara Halógena ' ||
                (ARRAY['H1','H4','H7','H11','T10'])[1 + floor(random() * 5)::int]

            WHEN category_name = 'Balizas' THEN
                brand_name || ' Baliza LED Universal'

            WHEN category_name = 'Guiños' THEN
                brand_name || ' Guiño Lateral ' ||
                (ARRAY['ámbar','cristal','LED'])[1 + floor(random() * 3)::int]

            -- Neumáticos y ruedas
            WHEN category_name = 'Neumáticos' THEN
                brand_name || ' Neumático ' ||
                (ARRAY['175/70R13','185/65R14','195/65R15','205/55R16','215/60R16','225/45R17','235/55R18'])[1 + floor(random() * 7)::int] ||
                ' ' ||
                (ARRAY['82T','88H','91V','94W','98V'])[1 + floor(random() * 5)::int]

            WHEN category_name = 'Llantas' THEN
                brand_name || ' Llanta de Aleación ' ||
                (ARRAY['13','14','15','16','17','18'])[1 + floor(random() * 6)::int] ||
                ' pulgadas'

            WHEN category_name = 'Válvulas' THEN
                brand_name || ' Válvula para Neumático Tubeless'

            WHEN category_name = 'Tuercas de Rueda' THEN
                brand_name || ' Juego de Tuercas de Rueda Cromadas'

            WHEN category_name = 'Tazas de Rueda' THEN
                brand_name || ' Juego de Tazas de Rueda ' ||
                (ARRAY['13','14','15','16'])[1 + floor(random() * 4)::int] ||
                ' pulgadas'

            -- Limpieza y accesorios
            WHEN category_name IN ('Limpiaparabrisas','Escobillas') THEN
                brand_name || ' Escobilla Limpiaparabrisas ' ||
                (ARRAY['14','16','18','20','22','24','26'])[1 + floor(random() * 7)::int] ||
                ' pulgadas'

            WHEN category_name = 'Aditivos' THEN
                brand_name || ' Aditivo para ' ||
                (ARRAY['limpieza de inyectores','tratamiento de combustible','limpieza de motor','sistema de refrigeración'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Limpiadores Automotrices' THEN
                brand_name || ' Limpiador Automotriz ' ||
                (ARRAY['carburador','inyectores','tapizados','llantas','motor'])[1 + floor(random() * 5)::int]

            WHEN category_name = 'Alfombras' THEN
                brand_name || ' Juego de Alfombras Universales de Goma'

            WHEN category_name = 'Fundas' THEN
                brand_name || ' Funda Cubre Asiento Universal'

            WHEN category_name = 'Herramientas' THEN
                brand_name || ' Herramienta Automotriz ' ||
                (ARRAY['llave cruz','gato hidráulico','torquímetro','kit emergencia'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Cuidado Exterior' THEN
                brand_name || ' Producto de Cuidado Exterior ' ||
                (ARRAY['cera líquida','shampoo siliconado','renovador de plásticos','limpia llantas'])[1 + floor(random() * 4)::int]

            WHEN category_name = 'Cuidado Interior' THEN
                brand_name || ' Producto de Cuidado Interior ' ||
                (ARRAY['silicona','limpia tapizados','aromatizante','protector de tablero'])[1 + floor(random() * 4)::int]

            ELSE
                brand_name || ' Accesorio Automotriz Universal'

        END AS product_description,

        ROUND(
            (
                CASE
                    WHEN category_name IN ('Aceites de Motor','Aceites de Transmisión','Aceites Hidráulicos','Aceites Diferenciales') THEN
                        15 + random() * 120

                    WHEN category_name IN ('Baterías') THEN
                        55 + random() * 320

                    WHEN category_name IN ('Neumáticos') THEN
                        45 + random() * 500

                    WHEN category_name IN ('Llantas') THEN
                        60 + random() * 420

                    WHEN category_name ILIKE '%Filtro%' THEN
                        6 + random() * 55

                    WHEN category_name ILIKE '%Freno%' 
                      OR category_name IN ('Pastillas de Freno','Discos de Freno','Zapatas de Freno','Campanas de Freno','Kits de Freno') THEN
                        18 + random() * 220

                    WHEN category_name IN ('Amortiguadores','Espirales','Cremalleras de Dirección','Bombas de Dirección') THEN
                        35 + random() * 280

                    WHEN category_name IN ('Alternadores','Motores de Arranque','Sensores','Bobinas de Encendido') THEN
                        25 + random() * 260

                    WHEN category_name IN ('Kits de Distribución','Kits de Embrague','Embragues','Semiejes','Homocinéticas') THEN
                        35 + random() * 340

                    WHEN category_name IN ('Radiadores','Electroventiladores') THEN
                        30 + random() * 260

                    ELSE
                        5 + random() * 150
                END
            )::numeric,
            2
        ) AS base_cost

    FROM product_brand pb

)

INSERT INTO products (
    code,
    cost,
    price,
    stock,
    category_id,
    brand_id,
    is_active,
    description,
    last_acquisition_cost
)

SELECT
    'SKU-' || LPAD(gs::text, 6, '0') AS code,

    base_cost AS cost,

    ROUND(
        (
            base_cost * (1.25 + random() * 0.55)
        )::numeric,
        2
    ) AS price,

    CASE
        WHEN category_name IN ('Neumáticos','Llantas','Baterías','Alternadores','Motores de Arranque') THEN
            FLOOR(2 + random() * 45)::int

        WHEN category_name ILIKE '%Filtro%'
          OR category_name IN ('Aceites de Motor','Aceites de Transmisión','Refrigerantes','Aditivos','Lámparas','Bujías') THEN
            FLOOR(20 + random() * 180)::int

        WHEN category_name ILIKE '%Freno%'
          OR category_name IN ('Pastillas de Freno','Discos de Freno','Amortiguadores','Correas','Tensores') THEN
            FLOOR(5 + random() * 95)::int

        ELSE
            FLOOR(random() * 120)::int
    END AS stock,

    category_id,
    brand_id,

    random() < 0.97 AS is_active,

    product_description AS description,

    ROUND(
        (
            base_cost * (0.92 + random() * 0.16)
        )::numeric,
        2
    ) AS last_acquisition_cost

FROM product_specs

ON CONFLICT (code) DO NOTHING;

-- Product Taxes
INSERT INTO product_taxes (product_id, tax_id)
SELECT
    p.id,
    t.id
FROM products p
JOIN taxes t ON t.name = 'IVA 10%'
ON CONFLICT DO NOTHING;

-- Suppliers
WITH supplier_seed AS MATERIALIZED (

    SELECT
        gs AS supplier_no,

        CASE (gs - 1) % 10
            WHEN 0 THEN 'general'
            WHEN 1 THEN 'lubricantes'
            WHEN 2 THEN 'filtros'
            WHEN 3 THEN 'frenos'
            WHEN 4 THEN 'suspension'
            WHEN 5 THEN 'electrico'
            WHEN 6 THEN 'baterias'
            WHEN 7 THEN 'neumaticos'
            WHEN 8 THEN 'motor_transmision'
            ELSE 'refrigeracion'
        END AS segment

    FROM generate_series(1, 900) gs

),

constants AS (

    SELECT
        ARRAY[
            'Asunción',
            'San Lorenzo',
            'Luque',
            'Capiatá',
            'Fernando de la Mora',
            'Mariano Roque Alonso',
            'Lambaré',
            'Limpio',
            'Ñemby',
            'Itauguá',
            'Areguá',
            'Villa Elisa',
            'San Antonio',
            'Ypané',
            'Encarnación',
            'Ciudad del Este',
            'Hernandarias',
            'Minga Guazú',
            'Presidente Franco',
            'Santa Rita',
            'Coronel Oviedo',
            'Caaguazú',
            'Villarrica',
            'Caacupé',
            'Paraguarí',
            'Pilar',
            'Concepción',
            'Pedro Juan Caballero',
            'Salto del Guairá',
            'Katueté'
        ]::text[] AS cities,

        ARRAY[
            'Av. Mariscal López',
            'Av. Eusebio Ayala',
            'Ruta PY01',
            'Ruta PY02',
            'Ruta PY03',
            'Av. España',
            'Av. Artigas',
            'Av. San Martín',
            'Av. Defensores del Chaco',
            'Av. Madame Lynch',
            'Av. Fernando de la Mora',
            'Av. República Argentina',
            'Av. Acceso Sur',
            'Av. General Santos',
            'Calle Palma',
            'Calle Cerro Corá',
            'Calle Teniente Rojas Silva',
            'Calle Mcal. Estigarribia',
            'Calle Independencia Nacional',
            'Calle Humaitá'
        ]::text[] AS streets,

        ARRAY[
            'S.A.',
            'S.R.L.',
            'S.A.E.',
            'E.A.S.'
        ]::text[] AS legal_types

),

supplier_data AS MATERIALIZED (

    SELECT
        ss.supplier_no,
        ss.segment,

        pick.prefix || ' ' || pick.city || ' ' || pick.legal_type AS name,

        pick.street || ' ' ||
        (100 + ((ss.supplier_no * 37) % 8900))::text ||
        ', ' || pick.city AS address,

        'compras.' ||
        replace(ss.segment, '_', '.') ||
        '.' ||
        lpad(ss.supplier_no::text, 4, '0') ||
        '@proveedores-demo.com.py' AS email,

        lpad((10000000 + ss.supplier_no * 7919)::text, 8, '0') AS stamp,

        random() < 0.985 AS is_active,

        credit.credit_limit,

        ROUND((credit.credit_limit * (random() * 0.30))::numeric, 2) AS curr_credit

    FROM supplier_seed ss
    CROSS JOIN constants k

    CROSS JOIN LATERAL (
        SELECT
            CASE ss.segment
                WHEN 'general' THEN ARRAY[
                    'Distribuidora MotorPar',
                    'Autopartes San Miguel',
                    'Importadora Ruta 1',
                    'Repuestos La Unión',
                    'Central Motor Paraguay',
                    'Autopartes Ñandutí',
                    'Mercosur Repuestos',
                    'Casa del Repuesto',
                    'Motor Center Paraguay',
                    'Distribuidora Guaraní',
                    'Automarket Mayorista',
                    'Repuestos Tres Fronteras',
                    'Autopartes del Este',
                    'Central de Repuestos',
                    'Importadora San Jorge',
                    'Repuestos Don Bosco',
                    'Grupo Autopar',
                    'Repuestos Santa Clara'
                ]

                WHEN 'lubricantes' THEN ARRAY[
                    'Lubricantes Imperial',
                    'Oil Center Paraguay',
                    'LubriExpress Mayorista',
                    'Casa del Lubricante',
                    'Fluidos del Sur',
                    'Distribuidora PetroMotor',
                    'Aceites del Paraguay',
                    'LubriMax Distribuciones',
                    'Central de Lubricantes',
                    'LubriRuta Mayorista',
                    'PetroService Autopartes',
                    'Lubricentro Mayorista',
                    'Importadora OilTech',
                    'Fluidos Premium',
                    'LubriStock Paraguay',
                    'Aceites y Aditivos del Este'
                ]

                WHEN 'filtros' THEN ARRAY[
                    'Filtros del Paraguay',
                    'Filter Center Mayorista',
                    'TecnoFiltros',
                    'Distribuidora Filtramax',
                    'Casa del Filtro',
                    'Filtros y Repuestos Central',
                    'FilterPro Importadora',
                    'Insumos de Filtración',
                    'Paraguay Filter Parts',
                    'FiltroStock Mayorista',
                    'Importadora Aire Limpio',
                    'Repuestos y Filtros del Este'
                ]

                WHEN 'frenos' THEN ARRAY[
                    'Frenos del Sur',
                    'Brake Center Paraguay',
                    'Distribuidora FrenoMax',
                    'Autofrenos Central',
                    'Casa del Freno',
                    'FrenoPart Mayorista',
                    'Importadora BrakeTech',
                    'Sistema de Frenos Paraguay',
                    'Frenos y Discos del Este',
                    'FrenoStock Distribuciones',
                    'Repuestos BrakeLine',
                    'TecnoFrenos Mayorista'
                ]

                WHEN 'suspension' THEN ARRAY[
                    'Suspensión Integral',
                    'Amortiguadores Paraguay',
                    'Tren Delantero Center',
                    'Suspensión y Dirección Central',
                    'Distribuidora AmortiMax',
                    'Casa del Amortiguador',
                    'Dirección y Suspensión del Este',
                    'AutoSuspensión Mayorista',
                    'Paraguay Suspension Parts',
                    'Repuestos TrenPro',
                    'SuspensionStock',
                    'Importadora Ruta Suspensión'
                ]

                WHEN 'electrico' THEN ARRAY[
                    'Eléctrica Automotriz Central',
                    'ElectroAuto Paraguay',
                    'Sensores y Encendido del Este',
                    'Distribuidora ElectroCar',
                    'Casa del Sensor',
                    'Autoeléctrica Mayorista',
                    'Repuestos Eléctricos PY',
                    'TecnoEncendido',
                    'Iluminación Automotriz Central',
                    'ElectroPart Importadora',
                    'AutoLuz Distribuciones',
                    'Central de Encendido'
                ]

                WHEN 'baterias' THEN ARRAY[
                    'Baterías del Paraguay',
                    'Battery Center Mayorista',
                    'Energía Automotriz Central',
                    'Casa de la Batería',
                    'Distribuidora BaterMax',
                    'AutoEnergía del Este',
                    'Baterías y Arranque PY',
                    'PowerAuto Distribuciones',
                    'ElectroBaterías Paraguay',
                    'Baterías Ruta 2',
                    'Importadora PowerStart',
                    'Central de Baterías'
                ]

                WHEN 'neumaticos' THEN ARRAY[
                    'Neumáticos del Paraguay',
                    'Ruedas del Este',
                    'Gomería Mayorista Central',
                    'Distribuidora RuedaMax',
                    'Casa del Neumático',
                    'Tyre Center Paraguay',
                    'Neumáticos Ruta 1',
                    'Ruedas y Llantas PY',
                    'Importadora NeumaSur',
                    'NeumaStock Mayorista',
                    'Llanta y Cubierta Central',
                    'RuedaPro Distribuciones'
                ]

                WHEN 'motor_transmision' THEN ARRAY[
                    'Motor y Transmisión Paraguay',
                    'Distribuidora MotorTech',
                    'Embragues del Este',
                    'Casa de la Distribución',
                    'Transmisión Center',
                    'Repuestos MotorPro',
                    'Kits y Correas PY',
                    'Partes de Motor Central',
                    'MotorStock Mayorista',
                    'Importadora TransMotor',
                    'Rulemanes y Embragues PY',
                    'Autopartes MotorLine'
                ]

                ELSE ARRAY[
                    'Refrigeración Automotriz Central',
                    'Radiadores Paraguay',
                    'CoolParts Distribuciones',
                    'Casa del Radiador',
                    'TermoAuto Mayorista',
                    'Refrigeración del Este',
                    'Distribuidora CoolMax',
                    'Radiadores y Mangueras PY',
                    'Sistema Térmico Automotriz',
                    'Importadora ClimaMotor',
                    'Electroventiladores Central',
                    'AutoCooling Paraguay'
                ]
            END AS prefixes
    ) px

    CROSS JOIN LATERAL (
        SELECT
            px.prefixes[
                1 + ((ss.supplier_no - 1) % array_length(px.prefixes, 1))
            ] AS prefix,

            k.cities[
                1 + (((ss.supplier_no - 1) / array_length(px.prefixes, 1)) % array_length(k.cities, 1))
            ] AS city,

            k.legal_types[
                1 + ((ss.supplier_no - 1) % array_length(k.legal_types, 1))
            ] AS legal_type,

            k.streets[
                1 + ((ss.supplier_no - 1) % array_length(k.streets, 1))
            ] AS street
    ) pick

    CROSS JOIN LATERAL (
        SELECT
            ROUND(
                (
                    CASE ss.segment
                        WHEN 'general' THEN 180000
                        WHEN 'lubricantes' THEN 95000
                        WHEN 'filtros' THEN 55000
                        WHEN 'frenos' THEN 85000
                        WHEN 'suspension' THEN 90000
                        WHEN 'electrico' THEN 75000
                        WHEN 'baterias' THEN 120000
                        WHEN 'neumaticos' THEN 160000
                        WHEN 'motor_transmision' THEN 140000
                        ELSE 80000
                    END
                    * (0.70 + random() * 0.90)
                )::numeric,
                2
            ) AS credit_limit
    ) credit

),

inserted_suppliers AS (

    INSERT INTO suppliers (
        name,
        address,
        email,
        stamp,
        is_active,
        credit_limit,
        curr_credit
    )
    SELECT
        sd.name,
        sd.address,
        sd.email,
        sd.stamp,
        sd.is_active,
        sd.credit_limit,
        sd.curr_credit
    FROM supplier_data sd
    WHERE NOT EXISTS (
        SELECT 1
        FROM suppliers s
        WHERE s.email = sd.email
    )
    RETURNING id, email

),

seed_suppliers AS (

    -- Proveedores recién insertados
    SELECT
        i.id,
        sd.supplier_no,
        sd.segment
    FROM inserted_suppliers i
    JOIN supplier_data sd ON sd.email = i.email

    UNION ALL

    -- Proveedores que ya existían de una ejecución anterior
    SELECT
        s.id,
        sd.supplier_no,
        sd.segment
    FROM suppliers s
    JOIN supplier_data sd ON sd.email = s.email
    WHERE NOT EXISTS (
        SELECT 1
        FROM inserted_suppliers i
        WHERE i.email = sd.email
    )

)


-- CATEGORY_SUPPLIERS
INSERT INTO category_suppliers (
    supplier_id,
    category_id
)

SELECT DISTINCT
    ss.id,
    c.id
FROM seed_suppliers ss

CROSS JOIN LATERAL (

    -- Proveedores generales: pueden abastecer todas las categorías existentes
    SELECT c_all.name AS category_name
    FROM categories c_all
    WHERE ss.segment = 'general'

    UNION ALL

    -- Categorías principales por rubro
    SELECT x.category_name
    FROM unnest(
        CASE ss.segment

            WHEN 'lubricantes' THEN ARRAY[
                'Aceites de Motor',
                'Aceites de Transmisión',
                'Aceites Hidráulicos',
                'Aceites Diferenciales',
                'Grasas Lubricantes',
                'Refrigerantes',
                'Líquidos de Freno',
                'Líquidos Hidráulicos',
                'Aditivos',
                'Limpiadores Automotrices'
            ]

            WHEN 'filtros' THEN ARRAY[
                'Filtros de Aceite',
                'Filtros de Aire',
                'Filtros de Combustible',
                'Filtros de Cabina',
                'Kits de Filtros'
            ]

            WHEN 'frenos' THEN ARRAY[
                'Pastillas de Freno',
                'Discos de Freno',
                'Zapatas de Freno',
                'Campanas de Freno',
                'Cilindros de Freno',
                'Bombas de Freno',
                'Mangueras de Freno',
                'Kits de Freno',
                'Líquidos de Freno'
            ]

            WHEN 'suspension' THEN ARRAY[
                'Amortiguadores',
                'Espirales',
                'Bujes',
                'Rótulas',
                'Extremos de Dirección',
                'Barras Estabilizadoras',
                'Cremalleras de Dirección',
                'Bombas de Dirección'
            ]

            WHEN 'electrico' THEN ARRAY[
                'Alternadores',
                'Motores de Arranque',
                'Bujías',
                'Cables de Bujía',
                'Bobinas de Encendido',
                'Fusibles',
                'Relés',
                'Sensores',
                'Luces LED',
                'Faros',
                'Ópticas',
                'Lámparas',
                'Balizas',
                'Guiños'
            ]

            WHEN 'baterias' THEN ARRAY[
                'Baterías',
                'Alternadores',
                'Motores de Arranque',
                'Fusibles',
                'Relés'
            ]

            WHEN 'neumaticos' THEN ARRAY[
                'Neumáticos',
                'Llantas',
                'Válvulas',
                'Tuercas de Rueda',
                'Tazas de Rueda'
            ]

            WHEN 'motor_transmision' THEN ARRAY[
                'Correas',
                'Kits de Distribución',
                'Tensores',
                'Bombas de Agua',
                'Bombas de Aceite',
                'Juntas',
                'Retenes',
                'Soportes de Motor',
                'Embragues',
                'Kits de Embrague',
                'Rulemanes',
                'Homocinéticas',
                'Semiejes',
                'Crucetas',
                'Aceites de Transmisión',
                'Aceites Diferenciales'
            ]

            WHEN 'refrigeracion' THEN ARRAY[
                'Radiadores',
                'Refrigerantes',
                'Electroventiladores',
                'Termostatos',
                'Mangueras de Radiador',
                'Depósitos de Agua',
                'Bombas de Agua'
            ]

            ELSE ARRAY[]::text[]
        END
    ) AS x(category_name)

    UNION ALL

    -- Muchos proveedores también venden filtros básicos
    SELECT x.category_name
    FROM unnest(ARRAY[
        'Filtros de Aceite',
        'Filtros de Aire',
        'Filtros de Combustible'
    ]) AS x(category_name)
    WHERE ss.supplier_no % 4 = 0

    UNION ALL

    -- Algunos también venden accesorios y limpieza
    SELECT x.category_name
    FROM unnest(ARRAY[
        'Limpiaparabrisas',
        'Escobillas',
        'Accesorios',
        'Cuidado Exterior',
        'Cuidado Interior'
    ]) AS x(category_name)
    WHERE ss.supplier_no % 6 = 0

    UNION ALL

    -- Algunos también venden lubricantes comunes
    SELECT x.category_name
    FROM unnest(ARRAY[
        'Aceites de Motor',
        'Refrigerantes',
        'Aditivos'
    ]) AS x(category_name)
    WHERE ss.supplier_no % 8 = 0

    UNION ALL

    -- Algunos también venden eléctrico básico
    SELECT x.category_name
    FROM unnest(ARRAY[
        'Baterías',
        'Fusibles',
        'Relés',
        'Lámparas'
    ]) AS x(category_name)
    WHERE ss.supplier_no % 10 = 0

    UNION ALL

    -- Algunos también trabajan ruedas y neumáticos
    SELECT x.category_name
    FROM unnest(ARRAY[
        'Neumáticos',
        'Válvulas',
        'Tuercas de Rueda'
    ]) AS x(category_name)
    WHERE ss.supplier_no % 12 = 0

) supplier_categories

JOIN categories c ON c.name = supplier_categories.category_name

ON CONFLICT DO NOTHING;

-- Emission_points
INSERT INTO emission_points (
    establishment,
    emission_point,
    current_sequential,
    max_sequential,
    is_active
)
VALUES (
    1,
    1,
    0,
    9999999,
    TRUE
);

-- sale_confitions
INSERT INTO sale_conditions (name) VALUES ('Cash'), ('Credit');

-- CLIENTS
WITH constants AS (

    SELECT
        ARRAY[
            'Juan','Carlos','Miguel','Luis','Diego','Jorge','Roberto','Hugo','Sergio','Fernando',
            'Oscar','Raúl','Víctor','Gustavo','Eduardo','Ricardo','Mario','Julio','César','Andrés',
            'Pedro','Francisco','Ramón','Alberto','Nicolás','Gabriel','Daniel','Marcelo','Cristian','Héctor',
            'María','Ana','Laura','Sofía','Claudia','Patricia','Carmen','Rosa','Mónica','Verónica',
            'Lucía','Carolina','Gabriela','Silvia','Teresa','Norma','Sandra','Lorena','Natalia','Paola',
            'Elena','Marta','Graciela','Beatriz','Noelia','Camila','Fátima','Liliana','Adriana','Leticia'
        ]::text[] AS names,

        ARRAY[
            'González','Benítez','Martínez','López','Gómez','Fernández','Rodríguez','Pereira','Duarte','Acosta',
            'Vera','Cáceres','Ramírez','Villalba','Torres','Franco','Sosa','Ortiz','Núñez','Rojas',
            'Mendoza','Aguirre','Cardozo','Giménez','Morales','Bogado','Ayala','Lezcano','Barrios','Romero',
            'Cabrera','Velázquez','Escobar','Peralta','Arce','Coronel','Godoy','Miranda','Ibarra','Florentín',
            'Medina','Fleitas','Sanabria','Paredes','Quiñónez','Centurión','Recalde','Maidana','Insfrán','Ferreira'
        ]::text[] AS surnames,

        ARRAY[
            'Asunción',
            'San Lorenzo',
            'Luque',
            'Capiatá',
            'Fernando de la Mora',
            'Mariano Roque Alonso',
            'Lambaré',
            'Limpio',
            'Ñemby',
            'Itauguá',
            'Areguá',
            'Villa Elisa',
            'San Antonio',
            'Ypané',
            'Encarnación',
            'Ciudad del Este',
            'Hernandarias',
            'Minga Guazú',
            'Presidente Franco',
            'Santa Rita',
            'Coronel Oviedo',
            'Caaguazú',
            'Villarrica',
            'Caacupé',
            'Paraguarí',
            'Pilar',
            'Concepción',
            'Pedro Juan Caballero',
            'Salto del Guairá',
            'Katueté'
        ]::text[] AS cities,

        ARRAY[
            'Av. Mariscal López',
            'Av. Eusebio Ayala',
            'Av. España',
            'Av. San Martín',
            'Av. Artigas',
            'Av. Madame Lynch',
            'Av. Fernando de la Mora',
            'Av. Defensores del Chaco',
            'Av. República Argentina',
            'Av. Acceso Sur',
            'Ruta PY01',
            'Ruta PY02',
            'Ruta PY03',
            'Calle Palma',
            'Calle Cerro Corá',
            'Calle Humaitá',
            'Calle Mcal. Estigarribia',
            'Calle Independencia Nacional',
            'Calle 14 de Mayo',
            'Calle 25 de Mayo'
        ]::text[] AS streets

),

client_base AS MATERIALIZED (

    SELECT
        gs,

        k.names[
            1 + ((gs - 1) % array_length(k.names, 1))
        ] AS name,

        k.surnames[
            1 + (((gs - 1) / array_length(k.names, 1)) % array_length(k.surnames, 1))
        ] AS surname,

        k.cities[
            1 + (((gs - 1) / 7) % array_length(k.cities, 1))
        ] AS city,

        k.streets[
            1 + (((gs - 1) / 11) % array_length(k.streets, 1))
        ] AS street

    FROM generate_series(1, 10000) gs
    CROSS JOIN constants k

),

client_credit AS MATERIALIZED (

    SELECT
        cb.*,

        -- Documento sintético único, hasta 10 caracteres
        (1000000 + cb.gs)::varchar(10) AS document,

        cb.street || ' ' ||
        (100 + ((cb.gs * 37) % 9800))::text ||
        ', ' || cb.city AS address,

        'cliente.demo.' ||
        lpad(cb.gs::text, 5, '0') ||
        '@clientes-demo.com.py' AS email,

        (
            DATE '1955-01-01' +
            ((random() * 17500)::int)
        ) AS birth_date,

        ROUND(
            (
                CASE
                    WHEN random() < 0.20 THEN 0
                    WHEN random() < 0.55 THEN 1500000 + random() * 3500000
                    WHEN random() < 0.85 THEN 5000000 + random() * 10000000
                    ELSE 15000000 + random() * 35000000
                END
            )::numeric,
            2
        ) AS credit_limit

    FROM client_base cb

),

client_data AS MATERIALIZED (

    SELECT
        name,
        surname,
        document,
        address,
        email,
        birth_date,
        credit_limit,

        CASE
            WHEN credit_limit = 0 THEN 0
            ELSE ROUND((credit_limit * (random() * 0.35))::numeric, 2)
        END AS curr_credit

    FROM client_credit

)

INSERT INTO clients (
    name,
    surname,
    document,
    address,
    email,
    birth_date,
    curr_credit,
    credit_limit
)

SELECT
    cd.name,
    cd.surname,
    cd.document,
    cd.address,
    cd.email,
    cd.birth_date,
    cd.curr_credit,
    cd.credit_limit
FROM client_data cd
WHERE NOT EXISTS (
    SELECT 1
    FROM clients c
    WHERE c.document = cd.document
       OR c.email = cd.email
);

-- STATUSES
INSERT INTO statuses (status) VALUES
    ('CREATED'),
    ('UNSENT'),
    ('PENDING'),
    ('OK'),
    ('CANCELLED'),
    ('PARTIAL')
ON CONFLICT (status) DO NOTHING;



-- =========================================================
-- 100 QUOTES + DETAILS
-- 50 SALES INVOICES + DETAILS
-- Con algunos documentos de hasta 20 productos
-- =========================================================

-- =========================================================
-- VALIDACIONES BÁSICAS
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM clients) THEN
        RAISE EXCEPTION 'No hay clientes cargados en clients.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM products WHERE is_active = TRUE) THEN
        RAISE EXCEPTION 'No hay productos activos cargados en products.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM statuses WHERE status IN ('OK', 'PENDING', 'CREATED', 'PARTIAL', 'CANCELLED')) THEN
        RAISE EXCEPTION 'Faltan statuses requeridos.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sale_conditions) THEN
        RAISE EXCEPTION 'No hay condiciones de venta cargadas en sale_conditions.';
    END IF;
END $$;


-- =========================================================
-- ASEGURA PUNTO DE EMISIÓN 001-001
-- =========================================================

INSERT INTO emission_points (
    establishment,
    emission_point,
    current_sequential,
    max_sequential,
    is_active
)
VALUES (
    1,
    1,
    0,
    9999999,
    TRUE
)
ON CONFLICT (establishment, emission_point) DO NOTHING;




-- TEMP: QUOTES CREADAS EN ESTE SEED
-- Usamos total negativo temporal para mapear seed_no con id.
-- Luego se recalcula el total real.
DROP TABLE IF EXISTS tmp_seed_quotes;

CREATE TEMP TABLE tmp_seed_quotes AS
WITH quote_source AS (

    SELECT
        gs AS seed_no,

        c.id AS client_id,

        CURRENT_DATE - ((random() * 90)::int) AS created_at,

        CASE
            WHEN gs <= 75 THEN 'OK'
            WHEN gs <= 85 THEN 'PENDING'
            WHEN gs <= 92 THEN 'CREATED'
            WHEN gs <= 97 THEN 'PARTIAL'
            ELSE 'CANCELLED'
        END AS status_name

    FROM generate_series(1, 100) gs

    CROSS JOIN LATERAL (
        SELECT id
        FROM clients
        ORDER BY random() + (gs * 0)
        LIMIT 1
    ) c

),

inserted AS (

    INSERT INTO quotes (
        client_id,
        created_at,
        status_id,
        total
    )
    SELECT
        qs.client_id,
        qs.created_at,
        s.id,
        (qs.seed_no * -1)::numeric
    FROM quote_source qs
    JOIN statuses s ON s.status = qs.status_name
    ORDER BY qs.seed_no
    RETURNING
        id,
        client_id,
        created_at,
        status_id,
        total
)

SELECT
    ABS(total)::int AS seed_no,
    id,
    client_id,
    created_at,
    status_id
FROM inserted;


-- QUOTE DETAILS
-- seed_no 1 a 50: documentos grandes, 8 a 20 productos
-- algunos otros: medianos, 7 a 14 productos
-- resto: normales, 2 a 6 productos
WITH quote_line_counts AS (

    SELECT
        q.id AS quote_id,
        q.seed_no,

        CASE
            WHEN q.seed_no <= 50 THEN
                8 + floor(random() * 13)::int      -- 8 a 20 productos

            WHEN q.seed_no % 5 = 0 THEN
                7 + floor(random() * 8)::int       -- 7 a 14 productos

            ELSE
                2 + floor(random() * 5)::int       -- 2 a 6 productos
        END AS line_count

    FROM tmp_seed_quotes q

)

INSERT INTO quote_details (
    quote_id,
    product_id,
    unit_cost,
    tax,
    quantity
)

SELECT
    qlc.quote_id,
    p.id AS product_id,
    p.price AS unit_cost,

    ROUND(
        (
            p.price
            * qty.quantity
            * COALESCE(tx.percentage, 0)
            / 100
        )::numeric,
        2
    ) AS tax,

    qty.quantity

FROM quote_line_counts qlc

CROSS JOIN LATERAL (
    SELECT
        p.id,
        p.price
    FROM products p
    WHERE p.is_active = TRUE
    ORDER BY random() + (qlc.quote_id * 0)
    LIMIT qlc.line_count
) p

CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN p.price >= 500000 THEN
                1

            WHEN p.price >= 200000 THEN
                1 + floor(random() * 2)::int

            WHEN p.price >= 80000 THEN
                1 + floor(random() * 3)::int

            ELSE
                1 + floor(random() * 6)::int
        END AS quantity
) qty

LEFT JOIN LATERAL (
    SELECT
        SUM(t.percentage) AS percentage
    FROM product_taxes pt
    JOIN taxes t ON t.id = pt.tax_id
    WHERE pt.product_id = p.id
) tx ON TRUE;


-- ACTUALIZAR TOTAL DE QUOTES
UPDATE quotes q
SET total = totals.total
FROM (
    SELECT
        qd.quote_id,
        ROUND(
            SUM(
                qd.unit_cost * qd.quantity + qd.tax
            )::numeric,
            2
        ) AS total
    FROM quote_details qd
    JOIN tmp_seed_quotes tsq ON tsq.id = qd.quote_id
    GROUP BY qd.quote_id
) totals
WHERE q.id = totals.quote_id;


-- TEMP: PUNTO DE EMISIÓN Y SECUENCIAL BASE
DROP TABLE IF EXISTS tmp_seed_emission_point;

CREATE TEMP TABLE tmp_seed_emission_point AS
SELECT
    ep.id AS emission_point_id,
    ep.establishment,
    ep.emission_point,
    GREATEST(
        ep.current_sequential,
        COALESCE((
            SELECT MAX(si.invoice_sequential)
            FROM sales_invoices si
            WHERE si.establishment = ep.establishment
              AND si.emission_point = ep.emission_point
        ), 0)
    ) AS base_sequential
FROM emission_points ep
WHERE ep.is_active = TRUE
ORDER BY ep.id
LIMIT 1;


-- TEMP: 50 QUOTES PARA FACTURAR
-- 25 documentos grandes
-- 25 documentos normales o medianos
DROP TABLE IF EXISTS tmp_invoice_source;

CREATE TEMP TABLE tmp_invoice_source AS
WITH ok_quotes AS (

    SELECT
        q.id AS quote_id,
        q.client_id,
        q.created_at AS quote_created_at,
        q.total,
        tsq.seed_no,
        COUNT(qd.id) AS detail_count

    FROM quotes q
    JOIN tmp_seed_quotes tsq ON tsq.id = q.id
    JOIN statuses s ON s.id = q.status_id
    JOIN quote_details qd ON qd.quote_id = q.id
    WHERE s.status = 'OK'
    GROUP BY
        q.id,
        q.client_id,
        q.created_at,
        q.total,
        tsq.seed_no

),

big_quotes AS (

    SELECT *
    FROM ok_quotes
    WHERE detail_count >= 8
    ORDER BY seed_no
    LIMIT 25

),

normal_quotes AS (

    SELECT oq.*
    FROM ok_quotes oq
    WHERE NOT EXISTS (
        SELECT 1
        FROM big_quotes bq
        WHERE bq.quote_id = oq.quote_id
    )
    ORDER BY oq.seed_no
    LIMIT 25

),

selected_quotes AS (

    SELECT * FROM big_quotes
    UNION ALL
    SELECT * FROM normal_quotes

)

SELECT
    row_number() OVER (
        ORDER BY detail_count DESC, quote_id
    ) AS rn,
    quote_id,
    client_id,
    quote_created_at,
    total,
    detail_count
FROM selected_quotes;


-- INSERTAR 50 SALES INVOICES
DROP TABLE IF EXISTS tmp_seed_invoices;

CREATE TEMP TABLE tmp_seed_invoices AS
WITH invoice_source AS (

    SELECT
        src.rn,
        src.quote_id,
        src.client_id,
        src.total,
        src.detail_count,

        ep.emission_point_id,
        ep.establishment,
        ep.emission_point,
        ep.base_sequential + src.rn AS invoice_sequential,

        LEAST(
            CURRENT_DATE,
            src.quote_created_at + ((random() * 5)::int)
        ) AS invoice_date,

        sc.id AS sale_condition_id

    FROM tmp_invoice_source src
    CROSS JOIN tmp_seed_emission_point ep

    CROSS JOIN LATERAL (
        SELECT id
        FROM sale_conditions
        ORDER BY random() + (src.rn * 0)
        LIMIT 1
    ) sc

),

inserted AS (

    INSERT INTO sales_invoices (
        client_id,
        emission_point_id,
        establishment,
        emission_point,
        invoice_sequential,
        created_at,
        date,
        expiration_date,
        total,
        total_paid,
        sale_condition_id,
        quote_id
    )
    SELECT
        inv.client_id,
        inv.emission_point_id,
        inv.establishment,
        inv.emission_point,
        inv.invoice_sequential,

        inv.invoice_date AS created_at,
        inv.invoice_date AS date,
        inv.invoice_date + 30 AS expiration_date,

        inv.total,

        ROUND(
            (
                CASE
                    -- 70% pagadas totalmente
                    WHEN pay.r < 0.70 THEN
                        inv.total

                    -- 20% parcialmente pagadas
                    WHEN pay.r < 0.90 THEN
                        inv.total * (0.20 + random() * 0.60)

                    -- 10% sin pagar
                    ELSE
                        0
                END
            )::numeric,
            2
        ) AS total_paid,

        inv.sale_condition_id,
        inv.quote_id

    FROM invoice_source inv
    CROSS JOIN LATERAL (
        SELECT random() AS r
    ) pay

    RETURNING
        id,
        quote_id,
        invoice_sequential,
        total,
        total_paid
)

SELECT
    i.id,
    i.quote_id,
    i.invoice_sequential,
    i.total,
    i.total_paid,
    src.detail_count
FROM inserted i
JOIN tmp_invoice_source src ON src.quote_id = i.quote_id;


-- INSERTA SALE INVOICE DETAILS
-- Copia los productos desde quote_details
INSERT INTO sale_invoice_details (
    invoice_id,
    product_id,
    unit_cost,
    tax,
    quantity
)
SELECT
    si.id AS invoice_id,
    qd.product_id,
    qd.unit_cost,
    qd.tax,
    qd.quantity
FROM tmp_seed_invoices si
JOIN quote_details qd ON qd.quote_id = si.quote_id;


-- ACTUALIZAR CORRELATIVO DEL PUNTO DE EMISIÓN
UPDATE emission_points ep
SET
    current_sequential = x.max_invoice_sequential,
    updated_at = NOW()
FROM (
    SELECT
        tsep.emission_point_id,
        MAX(tsi.invoice_sequential) AS max_invoice_sequential
    FROM tmp_seed_emission_point tsep
    JOIN tmp_seed_invoices tsi ON TRUE
    GROUP BY tsep.emission_point_id
) x
WHERE ep.id = x.emission_point_id;



-- HASTA 20 CREDIT NOTES + DETAILS
-- Basadas en sales_invoices existentes

-- VALIDACIONES BÁSICAS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sales_invoices si
        JOIN sale_invoice_details sid ON sid.invoice_id = si.id
    ) THEN
        RAISE EXCEPTION 'No hay facturas con detalles para generar notas de crédito.';
    END IF;
END $$;


-- TEMP: FACTURAS SELECCIONADAS PARA NOTAS DE CRÉDITO
DROP TABLE IF EXISTS tmp_credit_note_source;

CREATE TEMP TABLE tmp_credit_note_source AS
WITH base AS (

    SELECT
        si.id AS sale_invoice_id,
        si.date AS invoice_date,
        si.total AS invoice_total,

        row_number() OVER (ORDER BY random()) AS rn

    FROM sales_invoices si
    WHERE EXISTS (
        SELECT 1
        FROM sale_invoice_details sid
        WHERE sid.invoice_id = si.id
    )
    AND NOT EXISTS (
        SELECT 1
        FROM credit_notes cn
        WHERE cn.sale_invoice_id = si.id
    )
    ORDER BY random()
    LIMIT 20

),

number_base AS (

    SELECT
        COALESCE(COUNT(*), 0) AS existing_credit_notes
    FROM credit_notes

)

SELECT
    b.rn,
    b.sale_invoice_id,
    b.invoice_date,
    b.invoice_total,

    -- Ejemplo: NC-20260531-0001
    'NC-' ||
    TO_CHAR(CURRENT_DATE, 'YYYYMMDD') ||
    '-' ||
    LPAD((nb.existing_credit_notes + b.rn)::text, 4, '0') AS credit_note_nr,

    LEAST(
        CURRENT_DATE,
        b.invoice_date + ((random() * 20)::int)
    ) AS created_at

FROM base b
CROSS JOIN number_base nb;


-- INSERTAR CREDIT NOTES CON TOTAL TEMPORAL 0
DROP TABLE IF EXISTS tmp_seed_credit_notes;

CREATE TEMP TABLE tmp_seed_credit_notes AS
WITH inserted AS (

    INSERT INTO credit_notes (
        credit_note_nr,
        sale_invoice_id,
        created_at,
        total
    )
    SELECT
        src.credit_note_nr,
        src.sale_invoice_id,
        src.created_at,
        0
    FROM tmp_credit_note_source src
    ON CONFLICT (credit_note_nr) DO NOTHING
    RETURNING
        id,
        credit_note_nr,
        sale_invoice_id,
        created_at,
        total

)

SELECT
    i.id,
    i.credit_note_nr,
    i.sale_invoice_id,
    i.created_at
FROM inserted i;


-- CREDIT NOTE DETAILS
-- 1 a 5 productos por nota de crédito
-- Tomados desde la factura original
WITH note_line_counts AS (

    SELECT
        cn.id AS credit_note_id,
        cn.sale_invoice_id,

        CASE
            WHEN random() < 0.20 THEN
                4 + floor(random() * 2)::int    -- 4 a 5 líneas
            WHEN random() < 0.60 THEN
                2 + floor(random() * 2)::int    -- 2 a 3 líneas
            ELSE
                1                               -- 1 línea
        END AS line_count

    FROM tmp_seed_credit_notes cn

)

INSERT INTO credit_note_details (
    credit_note_id,
    product_id,
    unit_cost,
    tax,
    quantity
)

SELECT
    nlc.credit_note_id,
    sid.product_id,
    sid.unit_cost,

    ROUND(
        (
            CASE
                WHEN sid.quantity > 0 THEN
                    sid.tax * returned_qty.quantity::numeric / sid.quantity::numeric
                ELSE
                    0
            END
        )::numeric,
        2
    ) AS tax,

    returned_qty.quantity

FROM note_line_counts nlc

CROSS JOIN LATERAL (
    SELECT
        sid.id,
        sid.product_id,
        sid.unit_cost,
        sid.tax,
        sid.quantity
    FROM sale_invoice_details sid
    WHERE sid.invoice_id = nlc.sale_invoice_id
      AND sid.quantity > 0
    ORDER BY random()
    LIMIT nlc.line_count
) sid

CROSS JOIN LATERAL (
    SELECT
        CASE
            -- 30% de las veces devuelve la línea completa
            WHEN random() < 0.30 THEN
                sid.quantity

            -- 70% devuelve cantidad parcial
            ELSE
                GREATEST(
                    1,
                    floor(1 + random() * sid.quantity)::int
                )
        END AS quantity
) returned_qty;


-- ACTUALIZAR TOTAL DE CREDIT NOTES
UPDATE credit_notes cn
SET total = totals.total
FROM (
    SELECT
        cnd.credit_note_id,
        ROUND(
            SUM(
                cnd.unit_cost * cnd.quantity + cnd.tax
            )::numeric,
            2
        ) AS total
    FROM credit_note_details cnd
    JOIN tmp_seed_credit_notes tcn ON tcn.id = cnd.credit_note_id
    GROUP BY cnd.credit_note_id
) totals
WHERE cn.id = totals.credit_note_id;



-- PHONE NUMBERS

-- =========================================================
-- TEMP: TELÉFONOS A GENERAR
-- =========================================================

DROP TABLE IF EXISTS tmp_phone_candidates;

CREATE TEMP TABLE tmp_phone_candidates AS

-- Employees
SELECT
    'employee'::text AS entity_type,
    e.id AS entity_id,
    '+595 981 ' || LPAD((100000 + e.id)::text, 6, '0') AS phone_number,
    FALSE AS is_emergency
FROM employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM employees_phones ep
    WHERE ep.employee_id = e.id
)

UNION ALL

-- Clients
SELECT
    'client'::text AS entity_type,
    c.id AS entity_id,
    '+595 982 ' || LPAD((100000 + c.id)::text, 6, '0') AS phone_number,
    FALSE AS is_emergency
FROM clients c
WHERE NOT EXISTS (
    SELECT 1
    FROM clients_phones cp
    WHERE cp.client_id = c.id
)

UNION ALL

-- Suppliers
SELECT
    'supplier'::text AS entity_type,
    s.id AS entity_id,
    '+595 983 ' || LPAD((100000 + s.id)::text, 6, '0') AS phone_number,
    FALSE AS is_emergency
FROM suppliers s
WHERE NOT EXISTS (
    SELECT 1
    FROM suppliers_phones sp
    WHERE sp.supplier_id = s.id
)

UNION ALL

-- Relatives
SELECT
    'relative'::text AS entity_type,
    r.id AS entity_id,
    '+595 984 ' || LPAD((100000 + r.id)::text, 6, '0') AS phone_number,
    TRUE AS is_emergency
FROM relatives r
WHERE NOT EXISTS (
    SELECT 1
    FROM relatives_phones rp
    WHERE rp.relative_id = r.id
);


-- =========================================================
-- INSERTAR PHONE NUMBERS
-- Evita insertar el mismo número si ya existe
-- =========================================================

INSERT INTO phone_numbers (
    phone_number,
    is_emergency
)
SELECT
    pc.phone_number,
    BOOL_OR(pc.is_emergency) AS is_emergency
FROM tmp_phone_candidates pc
WHERE NOT EXISTS (
    SELECT 1
    FROM phone_numbers pn
    WHERE pn.phone_number = pc.phone_number
)
GROUP BY pc.phone_number;


-- MAPEO DE PHONE NUMBERS
-- En caso de que ya exista un número, toma el menor id
DROP TABLE IF EXISTS tmp_phone_map;

CREATE TEMP TABLE tmp_phone_map AS
SELECT
    phone_number,
    MIN(id) AS phone_id
FROM phone_numbers
GROUP BY phone_number;


-- EMPLOYEES_PHONES
INSERT INTO employees_phones (
    employee_id,
    phone_id
)
SELECT
    pc.entity_id,
    pm.phone_id
FROM tmp_phone_candidates pc
JOIN tmp_phone_map pm ON pm.phone_number = pc.phone_number
WHERE pc.entity_type = 'employee'
ON CONFLICT DO NOTHING;


-- CLIENTS_PHONES
INSERT INTO clients_phones (
    client_id,
    phone_id
)
SELECT
    pc.entity_id,
    pm.phone_id
FROM tmp_phone_candidates pc
JOIN tmp_phone_map pm ON pm.phone_number = pc.phone_number
WHERE pc.entity_type = 'client'
ON CONFLICT DO NOTHING;


-- SUPPLIERS_PHONES
INSERT INTO suppliers_phones (
    supplier_id,
    phone_id
)
SELECT
    pc.entity_id,
    pm.phone_id
FROM tmp_phone_candidates pc
JOIN tmp_phone_map pm ON pm.phone_number = pc.phone_number
WHERE pc.entity_type = 'supplier'
ON CONFLICT DO NOTHING;


-- RELATIVES_PHONES
INSERT INTO relatives_phones (
    relative_id,
    phone_id
)
SELECT
    pc.entity_id,
    pm.phone_id
FROM tmp_phone_candidates pc
JOIN tmp_phone_map pm ON pm.phone_number = pc.phone_number
WHERE pc.entity_type = 'relative'
ON CONFLICT DO NOTHING;


-- EMPLOYEE_RELATIVES
-- Usa relatives.employee_id si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'relatives'
          AND column_name = 'employee_id'
    ) THEN

        EXECUTE '
            INSERT INTO employee_relatives (
                employee_id,
                relative_id
            )
            SELECT
                r.employee_id,
                r.id
            FROM relatives r
            WHERE r.employee_id IS NOT NULL
            ON CONFLICT DO NOTHING
        ';

    ELSE
        RAISE NOTICE 'No existe relatives.employee_id. No se puede poblar employee_relatives automáticamente.';
    END IF;
END $$;





















--================================
--           Purchases
--================================


-- =========================================================
-- 120 PURCHASE REQUESTS
-- =========================================================

DROP TABLE IF EXISTS tmp_seed_purchase_requests;

CREATE TEMP TABLE tmp_seed_purchase_requests AS
WITH request_source AS (
    SELECT
        gs AS seed_no,
        CURRENT_DATE - (30 + floor(random() * 180)::int) AS created_at,
        e.id AS employee_id
    FROM generate_series(1, 120) gs
    CROSS JOIN LATERAL (
        SELECT id
        FROM employees
        WHERE is_active IS DISTINCT FROM FALSE
        ORDER BY random() + (gs * 0)
        LIMIT 1
    ) e
),
inserted AS (
    INSERT INTO purchase_requests (
        created_at,
        employee_id
    )
    SELECT
        created_at,
        employee_id
    FROM request_source
    ORDER BY seed_no
    RETURNING
        id,
        created_at,
        employee_id
)
SELECT
    row_number() OVER (ORDER BY id)::int AS seed_no,
    id AS purchase_request_id,
    created_at,
    employee_id
FROM inserted;


-- =========================================================
-- 6 TO 20 PRODUCTS PER PURCHASE REQUEST
-- =========================================================

DROP TABLE IF EXISTS tmp_purchase_request_line_counts;

CREATE TEMP TABLE tmp_purchase_request_line_counts AS
SELECT
    purchase_request_id,
    6 + floor(random() * 15)::int AS line_count
FROM tmp_seed_purchase_requests;


INSERT INTO purchase_request_details (
    purchase_request_id,
    product_id,
    quantity
)
SELECT
    lc.purchase_request_id,
    picked_products.id AS product_id,
    CASE
        WHEN random() < 0.20 THEN 5 + floor(random() * 10)::int
        WHEN random() < 0.65 THEN 10 + floor(random() * 25)::int
        ELSE 30 + floor(random() * 70)::int
    END AS quantity
FROM tmp_purchase_request_line_counts lc
CROSS JOIN LATERAL (
    SELECT z.id
    FROM (
        SELECT
            p.id,
            row_number() OVER (ORDER BY random()) AS rn
        FROM products p
        WHERE p.is_active IS DISTINCT FROM FALSE
          AND EXISTS (
              SELECT 1
              FROM category_suppliers cs
              WHERE cs.category_id = p.category_id
          )
    ) z
    WHERE z.rn <= lc.line_count
) picked_products;


DROP TABLE IF EXISTS tmp_seed_purchase_request_details;

CREATE TEMP TABLE tmp_seed_purchase_request_details AS
SELECT
    pr.seed_no,
    pr.purchase_request_id,
    prd.id AS purchase_request_detail_id,
    prd.product_id,
    p.category_id,
    prd.quantity
FROM tmp_seed_purchase_requests pr
JOIN purchase_request_details prd
    ON prd.purchase_request_id = pr.purchase_request_id
JOIN products p
    ON p.id = prd.product_id;


-- =========================================================
-- SUPPLIER CANDIDATES BY REQUEST
-- Based on category_suppliers and product category
-- =========================================================

DROP TABLE IF EXISTS tmp_quote_supplier_candidates;

CREATE TEMP TABLE tmp_quote_supplier_candidates AS
SELECT
    prd.purchase_request_id,
    cs.supplier_id,
    COUNT(DISTINCT prd.category_id) AS matched_categories
FROM tmp_seed_purchase_request_details prd
JOIN category_suppliers cs
    ON cs.category_id = prd.category_id
JOIN suppliers s
    ON s.id = cs.supplier_id
WHERE s.is_active IS DISTINCT FROM FALSE
GROUP BY
    prd.purchase_request_id,
    cs.supplier_id
HAVING COUNT(DISTINCT prd.category_id) > 0;


DROP TABLE IF EXISTS tmp_selected_quote_suppliers;

CREATE TEMP TABLE tmp_selected_quote_suppliers AS
WITH ranked AS (
    SELECT
        pr.seed_no,
        c.purchase_request_id,
        c.supplier_id,
        c.matched_categories,
        row_number() OVER (
            PARTITION BY c.purchase_request_id
            ORDER BY c.matched_categories DESC, random()
        )::int AS quote_no
    FROM tmp_quote_supplier_candidates c
    JOIN tmp_seed_purchase_requests pr
        ON pr.purchase_request_id = c.purchase_request_id
)
SELECT
    seed_no,
    purchase_request_id,
    supplier_id,
    matched_categories,
    quote_no
FROM ranked
WHERE quote_no <= CASE
    WHEN seed_no % 4 = 0 THEN 4
    ELSE 3
END;


DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM tmp_seed_purchase_requests pr
        LEFT JOIN (
            SELECT
                purchase_request_id,
                COUNT(*) AS quote_count
            FROM tmp_selected_quote_suppliers
            GROUP BY purchase_request_id
        ) q ON q.purchase_request_id = pr.purchase_request_id
        WHERE COALESCE(q.quote_count, 0) < 3
    ) THEN
        RAISE EXCEPTION 'Some purchase requests do not have at least 3 compatible suppliers.';
    END IF;
END $$;


-- =========================================================
-- PURCHASE QUOTES
-- 3 TO 4 QUOTES PER PURCHASE REQUEST
-- =========================================================

INSERT INTO purchase_quotes (
    purchase_request_id,
    supplier_id,
    status_id,
    created_at,
    date_sent,
    date_received
)
SELECT
    sqs.purchase_request_id,
    sqs.supplier_id,
    st.id AS status_id,
    pr.created_at + sqs.quote_no AS created_at,

    CASE
        WHEN picked_status.status_name IN ('UNSENT', 'CREATED') THEN NULL
        ELSE pr.created_at + sqs.quote_no + 1
    END AS date_sent,

    CASE
        WHEN picked_status.status_name IN ('OK', 'PARTIAL', 'CANCELLED') THEN pr.created_at + sqs.quote_no + 3
        ELSE NULL
    END AS date_received
FROM tmp_selected_quote_suppliers sqs
JOIN tmp_seed_purchase_requests pr
    ON pr.purchase_request_id = sqs.purchase_request_id
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN sqs.quote_no = 1 THEN 'OK'
            WHEN (sqs.seed_no + sqs.quote_no) % 9 = 0 THEN 'CANCELLED'
            WHEN (sqs.seed_no + sqs.quote_no) % 5 = 0 THEN 'PARTIAL'
            WHEN (sqs.seed_no + sqs.quote_no) % 3 = 0 THEN 'PENDING'
            ELSE 'OK'
        END AS status_name
) picked_status
JOIN statuses st
    ON st.status = picked_status.status_name;


DROP TABLE IF EXISTS tmp_seed_purchase_quotes;

CREATE TEMP TABLE tmp_seed_purchase_quotes AS
SELECT
    sqs.seed_no,
    sqs.quote_no,
    pq.id AS purchase_quote_id,
    pq.purchase_request_id,
    pq.supplier_id,
    pq.status_id,
    st.status AS status_name,
    pq.created_at
FROM tmp_selected_quote_suppliers sqs
JOIN tmp_seed_purchase_requests pr
    ON pr.purchase_request_id = sqs.purchase_request_id
JOIN purchase_quotes pq
    ON pq.purchase_request_id = sqs.purchase_request_id
   AND pq.supplier_id = sqs.supplier_id
   AND pq.created_at = pr.created_at + sqs.quote_no
JOIN statuses st
    ON st.id = pq.status_id;


-- =========================================================
-- PURCHASE QUOTE DETAILS
-- Supplier can only quote products whose category it supplies
-- This also makes several suppliers quote the same products
-- =========================================================

INSERT INTO purchase_quotes_details (
    purchase_quote_id,
    product_id,
    confirmed_quantity,
    unit_cost,
    enabled
)
SELECT
    q.purchase_quote_id,
    prd.product_id,

    GREATEST(
        1,
        floor(prd.quantity * (0.75 + random() * 0.75))::int
    ) AS confirmed_quantity,

    ROUND(
        (
            COALESCE(
                NULLIF(p.last_acquisition_cost, 0),
                NULLIF(p.cost, 0),
                NULLIF(p.price, 0),
                1000
            )
            * (0.90 + random() * 0.28)::numeric
        )::numeric,
        2
    ) AS unit_cost,

    CASE
        WHEN q.quote_no = 1 THEN TRUE
        ELSE random() < 0.96
    END AS enabled
FROM tmp_seed_purchase_quotes q
JOIN tmp_seed_purchase_request_details prd
    ON prd.purchase_request_id = q.purchase_request_id
JOIN products p
    ON p.id = prd.product_id
JOIN category_suppliers cs
    ON cs.supplier_id = q.supplier_id
   AND cs.category_id = prd.category_id;


-- =========================================================
-- 70 PURCHASE ORDERS
-- More than half of 120 purchase requests
-- Chooses the cheapest quote per request
-- =========================================================

DROP TABLE IF EXISTS tmp_quote_totals;

CREATE TEMP TABLE tmp_quote_totals AS
SELECT
    q.seed_no,
    q.purchase_request_id,
    q.purchase_quote_id,
    q.supplier_id,
    SUM(pqd.confirmed_quantity * pqd.unit_cost) AS quote_total,
    COUNT(*) AS detail_count
FROM tmp_seed_purchase_quotes q
JOIN purchase_quotes_details pqd
    ON pqd.purchase_quote_id = q.purchase_quote_id
WHERE q.status_name IN ('OK', 'PARTIAL')
  AND pqd.enabled = TRUE
GROUP BY
    q.seed_no,
    q.purchase_request_id,
    q.purchase_quote_id,
    q.supplier_id;


DROP TABLE IF EXISTS tmp_order_source;

CREATE TEMP TABLE tmp_order_source AS
SELECT
    x.seed_no,
    x.purchase_request_id,
    x.purchase_quote_id,
    x.supplier_id,
    x.quote_total
FROM (
    SELECT
        qt.*,
        row_number() OVER (
            PARTITION BY qt.purchase_request_id
            ORDER BY qt.quote_total ASC, random()
        ) AS best_rank
    FROM tmp_quote_totals qt
    WHERE qt.seed_no <= 70
) x
WHERE x.best_rank = 1;


INSERT INTO purchase_orders (
    purchase_request_id,
    created_at,
    supplier_id,
    status_id
)
SELECT
    os.purchase_request_id,
    pr.created_at + 12 AS created_at,
    os.supplier_id,
    st.id AS status_id
FROM tmp_order_source os
JOIN tmp_seed_purchase_requests pr
    ON pr.purchase_request_id = os.purchase_request_id
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN os.seed_no % 10 = 0 THEN 'PENDING'
            WHEN os.seed_no % 7 = 0 THEN 'PARTIAL'
            ELSE 'OK'
        END AS status_name
) picked_status
JOIN statuses st
    ON st.status = picked_status.status_name;


DROP TABLE IF EXISTS tmp_seed_purchase_orders;

CREATE TEMP TABLE tmp_seed_purchase_orders AS
SELECT
    os.seed_no,
    po.id AS purchase_order_id,
    os.purchase_request_id,
    os.purchase_quote_id,
    os.supplier_id,
    po.created_at,
    po.status_id,
    st.status AS status_name
FROM tmp_order_source os
JOIN tmp_seed_purchase_requests pr
    ON pr.purchase_request_id = os.purchase_request_id
JOIN purchase_orders po
    ON po.purchase_request_id = os.purchase_request_id
   AND po.supplier_id = os.supplier_id
   AND po.created_at = pr.created_at + 12
JOIN statuses st
    ON st.id = po.status_id;


-- =========================================================
-- PURCHASE ORDER DETAILS
-- Copied from chosen quote details
-- =========================================================

INSERT INTO purchase_order_details (
    purchase_order_id,
    product_id,
    ordered_quantity,
    received_quantity
)
SELECT
    po.purchase_order_id,
    pqd.product_id,
    pqd.confirmed_quantity AS ordered_quantity,

    CASE
        WHEN po.status_name = 'OK' THEN
            pqd.confirmed_quantity

        WHEN po.status_name = 'PARTIAL' THEN
            GREATEST(
                1,
                floor(pqd.confirmed_quantity * (0.35 + random() * 0.55))::int
            )

        ELSE
            0
    END AS received_quantity
FROM tmp_seed_purchase_orders po
JOIN purchase_quotes_details pqd
    ON pqd.purchase_quote_id = po.purchase_quote_id
WHERE pqd.enabled = TRUE;


DROP TABLE IF EXISTS tmp_seed_purchase_order_details;

CREATE TEMP TABLE tmp_seed_purchase_order_details AS
SELECT
    po.seed_no,
    po.purchase_order_id,
    po.purchase_quote_id,
    pod.id AS purchase_order_detail_id,
    pod.product_id,
    pod.ordered_quantity,
    pod.received_quantity,
    pqd.unit_cost
FROM tmp_seed_purchase_orders po
JOIN purchase_order_details pod
    ON pod.purchase_order_id = po.purchase_order_id
JOIN purchase_quotes_details pqd
    ON pqd.purchase_quote_id = po.purchase_quote_id
   AND pqd.product_id = pod.product_id;


-- =========================================================
-- PURCHASE INVOICES
-- Created only for orders with received products
-- =========================================================

DROP TABLE IF EXISTS tmp_purchase_invoice_lines;

CREATE TEMP TABLE tmp_purchase_invoice_lines AS
SELECT
    pod.purchase_order_id,
    pod.product_id,
    pod.unit_cost,
    pod.received_quantity AS quantity,

    ROUND(
        (
            pod.unit_cost
            * pod.received_quantity
            * COALESCE(tx.percentage, 10)::numeric
            / 100
        )::numeric,
        2
    ) AS tax
FROM tmp_seed_purchase_order_details pod
LEFT JOIN LATERAL (
    SELECT
        SUM(t.percentage) AS percentage
    FROM product_taxes pt
    JOIN taxes t
        ON t.id = pt.tax_id
    WHERE pt.product_id = pod.product_id
) tx ON TRUE
WHERE pod.received_quantity > 0;


DROP TABLE IF EXISTS tmp_invoice_totals;

CREATE TEMP TABLE tmp_invoice_totals AS
SELECT
    purchase_order_id,
    ROUND(
        SUM(unit_cost * quantity + tax)::numeric,
        2
    ) AS total
FROM tmp_purchase_invoice_lines
GROUP BY purchase_order_id;


INSERT INTO purchase_invoices (
    invoice_nr,
    purchase_order_id,
    created_at,
    sale_condition_id,
    total,
    total_paid
)
SELECT
    'PI-' || LPAD(it.purchase_order_id::text, 6, '0') AS invoice_nr,
    it.purchase_order_id,
    po.created_at + 3 AS created_at,
    sc.id AS sale_condition_id,
    it.total,

    CASE
        WHEN sc.name ILIKE 'Cash' THEN
            it.total

        WHEN pay.r < 0.35 THEN
            it.total

        WHEN pay.r < 0.80 THEN
            ROUND(
                (
                    it.total
                    * (0.15 + random() * 0.70)::numeric
                )::numeric,
                2
            )

        ELSE
            0
    END AS total_paid
FROM tmp_invoice_totals it
JOIN tmp_seed_purchase_orders po
    ON po.purchase_order_id = it.purchase_order_id
CROSS JOIN LATERAL (
    SELECT
        id,
        name
    FROM sale_conditions
    ORDER BY random() + (it.purchase_order_id * 0)
    LIMIT 1
) sc
CROSS JOIN LATERAL (
    SELECT random() AS r
) pay;


DROP TABLE IF EXISTS tmp_seed_purchase_invoices;

CREATE TEMP TABLE tmp_seed_purchase_invoices AS
SELECT
    pi.id AS purchase_invoice_id,
    pi.invoice_nr,
    pi.purchase_order_id,
    po.supplier_id,
    pi.created_at,
    pi.sale_condition_id,
    pi.total,
    pi.total_paid
FROM purchase_invoices pi
JOIN tmp_seed_purchase_orders po
    ON po.purchase_order_id = pi.purchase_order_id
WHERE pi.invoice_nr = 'PI-' || LPAD(pi.purchase_order_id::text, 6, '0');


INSERT INTO purchase_invoice_details (
    purchase_invoice_id,
    product_id,
    unit_cost,
    tax,
    quantity
)
SELECT
    pi.purchase_invoice_id,
    pil.product_id,
    pil.unit_cost,
    pil.tax,
    pil.quantity
FROM tmp_seed_purchase_invoices pi
JOIN tmp_purchase_invoice_lines pil
    ON pil.purchase_order_id = pi.purchase_order_id;


-- =========================================================
-- RETURN NOTES
-- Some purchase invoices will have returns
-- =========================================================

DROP TABLE IF EXISTS tmp_return_source;

CREATE TEMP TABLE tmp_return_source AS
SELECT
    row_number() OVER (ORDER BY random())::int AS rn,
    pi.purchase_invoice_id,
    pi.created_at AS invoice_created_at
FROM tmp_seed_purchase_invoices pi
WHERE EXISTS (
    SELECT 1
    FROM purchase_invoice_details pid
    WHERE pid.purchase_invoice_id = pi.purchase_invoice_id
)
ORDER BY random()
LIMIT 20;


INSERT INTO return_notes (
    purchase_invoice_id,
    motive,
    created_at,
    status_id
)
SELECT
    rs.purchase_invoice_id,

    CASE
        WHEN rs.rn % 4 = 0 THEN 'Producto recibido con defecto de fábrica'
        WHEN rs.rn % 4 = 1 THEN 'Cantidad recibida superior a la solicitada'
        WHEN rs.rn % 4 = 2 THEN 'Producto incompatible con la orden de compra'
        ELSE 'Devolución parcial por control de calidad'
    END AS motive,

    rs.invoice_created_at + (5 + floor(random() * 20)::int) AS created_at,

    st.id AS status_id
FROM tmp_return_source rs
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN rs.rn % 9 = 0 THEN 'CANCELLED'
            WHEN rs.rn % 5 = 0 THEN 'PENDING'
            ELSE 'OK'
        END AS status_name
) picked_status
JOIN statuses st
    ON st.status = picked_status.status_name;


DROP TABLE IF EXISTS tmp_seed_return_notes;

CREATE TEMP TABLE tmp_seed_return_notes AS
SELECT
    rs.rn,
    rn.id AS return_note_id,
    rn.purchase_invoice_id,
    rn.created_at,
    rn.status_id,
    st.status AS status_name
FROM tmp_return_source rs
JOIN return_notes rn
    ON rn.purchase_invoice_id = rs.purchase_invoice_id
JOIN statuses st
    ON st.id = rn.status_id;


WITH return_line_counts AS (
    SELECT
        return_note_id,
        purchase_invoice_id,
        1 + floor(random() * 4)::int AS line_count
    FROM tmp_seed_return_notes
)
INSERT INTO return_note_details (
    return_note_id,
    product_id,
    returned_quantity,
    amount
)
SELECT
    rlc.return_note_id,
    picked.product_id,
    returned_qty.quantity AS returned_quantity,

    ROUND(
        (
            picked.unit_cost * returned_qty.quantity
            +
            CASE
                WHEN picked.quantity > 0 THEN
                    picked.tax * returned_qty.quantity::numeric / picked.quantity::numeric
                ELSE
                    0
            END
        )::numeric,
        2
    ) AS amount
FROM return_line_counts rlc
CROSS JOIN LATERAL (
    SELECT z.*
    FROM (
        SELECT
            pid.*,
            row_number() OVER (ORDER BY random()) AS rn
        FROM purchase_invoice_details pid
        WHERE pid.purchase_invoice_id = rlc.purchase_invoice_id
          AND pid.quantity > 0
    ) z
    WHERE z.rn <= rlc.line_count
) picked
CROSS JOIN LATERAL (
    SELECT
        GREATEST(
            1,
            floor(1 + random() * picked.quantity)::int
        ) AS quantity
) returned_qty;


-- =========================================================
-- RETURN CREDIT NOTES
-- Created for approved return notes
-- =========================================================

DROP TABLE IF EXISTS tmp_return_credit_note_source;

CREATE TEMP TABLE tmp_return_credit_note_source AS
SELECT
    rn.return_note_id,
    rn.created_at,
    ROUND(SUM(rnd.amount)::numeric, 2) AS total
FROM tmp_seed_return_notes rn
JOIN return_note_details rnd
    ON rnd.return_note_id = rn.return_note_id
WHERE rn.status_name = 'OK'
GROUP BY
    rn.return_note_id,
    rn.created_at;


INSERT INTO return_credit_notes (
    note_number,
    return_note_id,
    created_at,
    total
)
SELECT
    'RCN-' || LPAD(src.return_note_id::text, 6, '0') AS note_number,
    src.return_note_id,
    src.created_at + 2 AS created_at,
    src.total
FROM tmp_return_credit_note_source src;


DROP TABLE IF EXISTS tmp_seed_return_credit_notes;

CREATE TEMP TABLE tmp_seed_return_credit_notes AS
SELECT
    rcn.id AS return_credit_note_id,
    rcn.return_note_id,
    rcn.note_number,
    rcn.created_at,
    rcn.total
FROM return_credit_notes rcn
JOIN tmp_return_credit_note_source src
    ON src.return_note_id = rcn.return_note_id
WHERE rcn.note_number = 'RCN-' || LPAD(rcn.return_note_id::text, 6, '0');


INSERT INTO return_credit_note_details (
    return_credit_note_id,
    product_id,
    unit_cost,
    quantity,
    subtotal
)
SELECT
    rcn.return_credit_note_id,
    rnd.product_id,

    ROUND(
        (rnd.amount / NULLIF(rnd.returned_quantity, 0))::numeric,
        2
    ) AS unit_cost,

    rnd.returned_quantity AS quantity,
    rnd.amount AS subtotal
FROM tmp_seed_return_credit_notes rcn
JOIN return_note_details rnd
    ON rnd.return_note_id = rcn.return_note_id;


-- =========================================================
-- PURCHASE PAYMENT ORDERS
-- Created for unpaid or partially paid purchase invoices
-- =========================================================

DROP TABLE IF EXISTS tmp_payment_order_source;

CREATE TEMP TABLE tmp_payment_order_source AS
SELECT
    row_number() OVER (ORDER BY random())::int AS rn,
    pi.purchase_invoice_id,
    pi.supplier_id,
    ROUND((pi.total - pi.total_paid)::numeric, 2) AS balance
FROM tmp_seed_purchase_invoices pi
WHERE pi.total > pi.total_paid
ORDER BY random()
LIMIT 40;


INSERT INTO purchase_payment_orders (
    created_at,
    supplier_id,
    status_id,
    requested_by_employee_id,
    approved_by_employee_id,
    scheduled_payment_date,
    observations
)
SELECT
    CURRENT_DATE - floor(random() * 15)::int AS created_at,
    pos.supplier_id,
    st.id AS status_id,
    requested.id AS requested_by_employee_id,

    CASE
        WHEN picked_status.status_name IN ('OK', 'PARTIAL') THEN approved.id
        ELSE NULL
    END AS approved_by_employee_id,

    CURRENT_DATE + (3 + floor(random() * 30)::int) AS scheduled_payment_date,

    'Seed payment order for purchase invoice ' || pos.purchase_invoice_id::text AS observations
FROM tmp_payment_order_source pos
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN pos.rn % 5 = 0 THEN 'OK'
            WHEN pos.rn % 3 = 0 THEN 'PARTIAL'
            ELSE 'PENDING'
        END AS status_name
) picked_status
JOIN statuses st
    ON st.status = picked_status.status_name
CROSS JOIN LATERAL (
    SELECT id
    FROM employees
    ORDER BY random() + (pos.rn * 0)
    LIMIT 1
) requested
CROSS JOIN LATERAL (
    SELECT id
    FROM employees
    ORDER BY random() + (pos.rn * 0)
    LIMIT 1
) approved;


DROP TABLE IF EXISTS tmp_seed_purchase_payment_orders;

CREATE TEMP TABLE tmp_seed_purchase_payment_orders AS
SELECT
    pos.rn,
    ppo.id AS purchase_payment_order_id,
    pos.purchase_invoice_id,
    pos.supplier_id,
    pos.balance
FROM tmp_payment_order_source pos
JOIN purchase_payment_orders ppo
    ON ppo.observations = 'Seed payment order for purchase invoice ' || pos.purchase_invoice_id::text;


INSERT INTO purchase_payment_order_details (
    purchase_payment_order_id,
    purchase_invoice_id,
    amount_to_pay,
    observations
)
SELECT
    ppo.purchase_payment_order_id,
    ppo.purchase_invoice_id,

    GREATEST(
        1::numeric,
        ROUND(
            (
                ppo.balance
                * (0.35 + random() * 0.65)::numeric
            )::numeric,
            2
        )
    ) AS amount_to_pay,

    'Generated from unpaid or partially paid purchase invoice'
FROM tmp_seed_purchase_payment_orders ppo;


COMMIT;