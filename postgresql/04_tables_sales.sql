CREATE TABLE brands (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT UNIQUE NOT NULL
);

create table categories (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT UNIQUE NOT NULL
);

create table taxes (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	percentage DECIMAL(5,2) NOT NULL
);

create table suppliers (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT NOT NULL,
	address TEXT,
	email TEXT NOT NULL,
	stamp TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	credit_limit DECIMAL(17,2) NOT NULL,
	curr_credit DECIMAL(17,2) NOT NULL DEFAULT 0
);

create table category_suppliers (
	supplier_id INT NOT NULL REFERENCES suppliers(id),
	category_id INT NOT NULL REFERENCES categories(id),
	CONSTRAINT pk_category_suppliers PRIMARY KEY (supplier_id, category_id)
);

CREATE TABLE IF NOT EXISTS emission_points (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    establishment INT NOT NULL,
    emission_point INT NOT NULL,

    current_sequential INT NOT NULL DEFAULT 0,
    max_sequential INT NOT NULL DEFAULT 9999999,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (establishment > 0),
    CHECK (emission_point > 0),
    CHECK (current_sequential >= 0),
    CHECK (max_sequential > 0),
    CHECK (current_sequential <= max_sequential),

    UNIQUE(establishment, emission_point)
);

create table sale_conditions (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name VARCHAR(25) NOT NULL
);

-- an/a item/product like "Oil 2L"
create table products (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code TEXT UNIQUE NOT NULL,
	cost DECIMAL(17,2) NOT NULL,
	price DECIMAL(17,2) NOT NULL,
	stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
	category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
	brand_id INT REFERENCES brands(id) ON DELETE RESTRICT,	
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	description TEXT NOT NULL,
	last_acquisition_cost DECIMAL(17,2) NOT NULL DEFAULT 0
);


create table product_taxes (
	product_id INT NOT NULL REFERENCES products(id),
	tax_id INT NOT NULL REFERENCES taxes(id),
	
    CONSTRAINT pk_product_tax PRIMARY KEY (product_id, tax_id)
);

create table clients (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT NOT NULL,
	surname TEXT NOT NULL,
	document VARCHAR(10) NOT NULL,
	address TEXT,
	email TEXT NOT NULL,
	birth_date DATE,
	curr_credit DECIMAL(17,2) NOT NULL DEFAULT 0,
	credit_limit DECIMAL(17,2) NOT NULL
);

create table statuses (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	status TEXT UNIQUE NOT NULL
);

create table quotes (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	client_id INT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
	created_at DATE NOT NULL,
	status_id INT NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT,
	total DECIMAL(17,2) NOT NULL
);

create table sales_invoices (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	client_id INT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,

	emission_point_id INT NOT NULL REFERENCES emission_points(id) ON DELETE RESTRICT,

	establishment INT NOT NULL DEFAULT 1,
	emission_point INT NOT NULL DEFAULT 1,
	invoice_sequential INT,

	created_at DATE NOT NULL DEFAULT CURRENT_DATE,
	date DATE NOT NULL,
	expiration_date DATE NOT NULL,

	total decimal(17,2) NOT NULL,
	total_paid decimal(17,2) DEFAULT 0 NOT NULL,

	sale_condition_id INT NOT NULL REFERENCES sale_conditions(id),
	quote_id INT REFERENCES quotes(id),

	CONSTRAINT uq_sales_invoice_number
		UNIQUE (establishment, emission_point, invoice_sequential),

	CONSTRAINT chk_sales_invoice_establishment
		CHECK (establishment > 0),

	CONSTRAINT chk_sales_invoice_emission_point
		CHECK (emission_point > 0),

	CONSTRAINT chk_sales_invoice_sequential
		CHECK (invoice_sequential > 0)
);

create table sale_invoice_details (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	invoice_id INT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
	product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	unit_cost DECIMAL(17,2) NOT NULL,
	tax DECIMAL(17,2) NOT NULL,
	quantity INT NOT NULL
);

create table quote_details (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quote_id INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
	product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	unit_cost DECIMAL(17,2) NOT NULL,
	tax DECIMAL(17,2) NOT NULL,
	quantity INT NOT NULL
);

create table credit_notes (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	credit_note_nr VARCHAR(20) UNIQUE NOT NULL,
	sale_invoice_id INT NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
	created_at DATE NOT NULL,
	total DECIMAL(17,2) NOT NULL
);

create table credit_note_details (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	credit_note_id INT NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
	product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
	unit_cost DECIMAL(17,2) NOT NULL,
	tax DECIMAL(17,2) NOT NULL,
	quantity INT NOT NULL
);


create table phone_numbers (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	phone_number TEXT NOT NULL,
	is_emergency BOOLEAN DEFAULT FALSE
);

create table employee_relatives (
	employee_id INT NOT NULL REFERENCES employees(id),
	relative_id INT NOT NULL REFERENCES relatives(id),
	CONSTRAINT pk_employee_relatives PRIMARY KEY (employee_id, relative_id)
);

create table suppliers_phones (
	supplier_id INT NOT NULL REFERENCES suppliers(id),
	phone_id INT NOT NULL REFERENCES phone_numbers(id),
	PRIMARY KEY (supplier_id, phone_id)
);

create table relatives_phones (
	relative_id INT NOT NULL REFERENCES relatives(id),
	phone_id INT NOT NULL REFERENCES phone_numbers(id),
	PRIMARY KEY (relative_id, phone_id)
);

create table clients_phones (
	client_id INT NOT NULL REFERENCES clients(id),
	phone_id INT NOT NULL REFERENCES phone_numbers(id),
	PRIMARY KEY (client_id, phone_id)
);

create table employees_phones (
	employee_id INT NOT NULL REFERENCES employees(id),
	phone_id INT NOT NULL REFERENCES phone_numbers(id),
	PRIMARY KEY (employee_id, phone_id)
);


CREATE OR REPLACE FUNCTION set_sales_invoice_number()
RETURNS TRIGGER AS $$ DECLARE v_emission_point_id INT;
v_establishment INT;
v_emission_point INT;
v_invoice_sequential INT;
BEGIN UPDATE emission_points ep
SET
current_sequential = ep.current_sequential + 1,
updated_at = NOW()
WHERE ep.id = COALESCE( NEW.emission_point_id, ( SELECT id FROM emission_points WHERE is_active = TRUE ORDER BY id LIMIT 1 ) )
AND ep.is_active = TRUE AND ep.current_sequential < ep.max_sequential
RETURNING ep.id, ep.establishment, ep.emission_point, ep.current_sequential
INTO v_emission_point_id, v_establishment, v_emission_point, v_invoice_sequential;
IF NOT FOUND THEN RAISE EXCEPTION 'No active emission point found or max sequential reached';
END IF;
NEW.emission_point_id = v_emission_point_id;
NEW.establishment = v_establishment;
NEW.emission_point = v_emission_point;
NEW.invoice_sequential = v_invoice_sequential;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sales_invoice_number
BEFORE INSERT ON sales_invoices
FOR EACH ROW
EXECUTE FUNCTION set_sales_invoice_number();
