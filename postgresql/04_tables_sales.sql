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
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	credit_limit DECIMAL(17,2) NOT NULL,
	curr_credit DECIMAL(17,2) NOT NULL DEFAULT 0
);

create table category_suppliers (
	supplier_id INT NOT NULL REFERENCES suppliers(id),
	category_id INT NOT NULL REFERENCES categories(id),
	CONSTRAINT pk_category_suppliers PRIMARY KEY (supplier_id, category_id)
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
	category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
	brand_id INT REFERENCES brands(id) ON DELETE RESTRICT,	
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	description TEXT NOT NULL
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
	invoice_nr VARCHAR(20) NOT NULL,
	created_at DATE NOT NULL DEFAULT CURRENT_DATE,
	date DATE NOT NULL,
	expiration_date DATE NOT NULL,
	total decimal(17,2) NOT NULL,
	total_paid decimal(17,2) DEFAULT 0 NOT NULL,
	sale_condition_id INT NOT NULL REFERENCES sale_conditions(id),
	quote_id INT REFERENCES quotes(id)
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


	
