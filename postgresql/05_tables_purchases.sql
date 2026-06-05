CREATE TABLE purchase_requests(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	created_at DATE,
	employee_id INT NOT NULL REFERENCES employees(id)
);

CREATE TABLE purchase_request_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_request_id INT NOT NULL REFERENCES purchase_requests(id),
	product_id INT NOT NULL REFERENCES products(id),
	quantity INT NOT NULL
);

CREATE TABLE purchase_quotes(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_request_id INT NOT NULL REFERENCES purchase_requests(id),
	supplier_id INT NOT NULL REFERENCES suppliers(id),
	status_id INT NOT NULL REFERENCES statuses(id),
	created_at DATE NOT NULL,
	date_sent DATE,
	date_received DATE
);

CREATE TABLE purchase_quotes_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_quote_id INT NOT NULL REFERENCES purchase_quotes(id),
	product_id INT NOT NULL REFERENCES products(id),
	confirmed_quantity INT NOT NULL,
	unit_cost DECIMAL(17,2) NOT NULL,
	enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE purchase_orders(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_request_id INT NOT NULL REFERENCES purchase_requests(id),
	created_at DATE NOT NULL,
	supplier_id INT NOT NULL REFERENCES suppliers(id),
	status_id INT NOT NULL REFERENCES statuses(id)
);

CREATE TABLE purchase_order_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_order_id INT NOT NULL REFERENCES purchase_orders(id),
	product_id INT NOT NULL REFERENCES products(id),
	ordered_quantity INT NOT NULL,
	received_quantity INT NOT NULL DEFAULT 0
);

CREATE TABLE purchase_invoices(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	invoice_nr TEXT NOT NULL,
	purchase_order_id INT NOT NULL REFERENCES purchase_orders(id),
	created_at DATE NOT NULL,
	sale_condition_id INT NOT NULL REFERENCES sale_conditions(id),
	total DECIMAL(17,2) NOT NULL,
	total_paid DECIMAL(17,2) NOT NULL DEFAULT 0
);

CREATE TABLE purchase_invoice_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_invoice_id INT NOT NULL REFERENCES purchase_invoices(id),
	product_id INT NOT NULL REFERENCES products(id),
	unit_cost DECIMAL(17,2) NOT NULL,
	tax DECIMAL(17,2) NOT NULL,
	quantity INT NOT NULL
);

CREATE TABLE return_notes(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	purchase_invoice_id INT NOT NULL REFERENCES purchase_invoices(id),
	motive TEXT NOT NULL,
	created_at DATE NOT NULL,
	status_id INT NOT NULL REFERENCES statuses(id)
);

CREATE TABLE return_note_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	return_note_id INT NOT NULL REFERENCES return_notes(id),
	product_id INT NOT NULL REFERENCES products(id),
	returned_quantity INT NOT NULL,
	amount DECIMAL(17,2) NOT NULL
);

CREATE TABLE return_credit_notes(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	note_number TEXT NOT NULL,
	return_note_id INT NOT NULL REFERENCES return_notes(id),
	created_at DATE NOT NULL,
	total DECIMAL(17,2) NOT NULL
);

CREATE TABLE return_credit_note_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	return_credit_note_id INT NOT NULL REFERENCES return_credit_notes(id),
	product_id INT NOT NULL REFERENCES products(id),
	unit_cost DECIMAL(17,2) NOT NULL,
	quantity INT NOT NULL,
	subtotal DECIMAL(17,2) NOT NULL
);

CREATE TABLE purchase_payment_orders(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	created_at DATE NOT NULL DEFAULT CURRENT_DATE,

	supplier_id INT NOT NULL REFERENCES suppliers(id),
	status_id INT NOT NULL REFERENCES statuses(id),

	requested_by_employee_id INT REFERENCES employees(id),
	approved_by_employee_id INT REFERENCES employees(id),

	scheduled_payment_date DATE,
	observations TEXT
);

CREATE TABLE purchase_payment_order_details(
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

	purchase_payment_order_id INT NOT NULL
		REFERENCES purchase_payment_orders(id)
		ON DELETE RESTRICT,

	purchase_invoice_id INT NOT NULL REFERENCES purchase_invoices(id),

	amount_to_pay DECIMAL(17,2) NOT NULL,

	observations TEXT,

	CONSTRAINT chk_payment_order_detail_amount
		CHECK (amount_to_pay > 0),

	CONSTRAINT uq_payment_order_invoice
		UNIQUE (purchase_payment_order_id, purchase_invoice_id)
);
