create table brands (
	brand_id INT IDENTITY PRIMARY KEY,
	name varchar(25)
);

create table categories (
	category_id INT IDENTITY PRIMARY KEY,
	name varchar(30)
);

create table taxes (
	tax_id INT IDENTITY PRIMARY KEY,
	name varchar(100) NOT NULL,
	percentage decimal(17,2) NOT NULL
);

create table suppliers (
	supplier_id INT IDENTITY PRIMARY KEY,
	name varchar(30),
	surname varchar(30),
	address varchar(100),
	phone varchar(20),
	email varchar(100) NOT NULL,
	isActive BIT NOT NULL DEFAULT 1,
	credit decimal(17,2) NOT NULL,
	curr_credit decimal(17,2) NOT NULL DEFAULT 0,
    CONSTRAINT CK_suppliers_credit CHECK (curr_credit <= credit)
);

create table sale_conditions (
	sale_condition_id INT IDENTITY PRIMARY KEY,
	name varchar(25) NOT NULL
);

create table roles (
	role_id INT IDENTITY PRIMARY KEY,
	name varchar(25) NOT NULL
);

create table employees (
	employee_id INT IDENTITY PRIMARY KEY,
	name varchar(50) NOT NULL,
	surname varchar(50),
	role_id INT NOT NULL,
	location_id INT NOT NULL,
	isActive INT NOT NULL DEFAULT 1,
	FOREIGN KEY (location_id) REFERENCES locations(location_id),
	FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- an/a item/product like "Oil 2L"
create table products (
	product_id INT IDENTITY PRIMARY KEY,
	code varchar(25) NOT NULL,
	cost decimal(17,2) NOT NULL,
	price decimal(17,2) NOT NULL,
	category_id INT NOT NULL,
	brand_id INT,				-- Sin el NOT NULL, porque no es realmente necesario aqui
	isActive BIT NOT NULL DEFAULT 1,
	description VARCHAR(MAX) NOT NULL,
	FOREIGN KEY (category_id) REFERENCES categories(category_id),
	FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
);

create table product_suppliers (
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,

    -- Clave primaria compuesta: UNIQUE + CLUSTERED por defecto
    CONSTRAINT pk_product_supplier PRIMARY KEY (product_id, supplier_id),

    -- Claves foraneas
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

create table product_taxes (
	product_id INT,
	tax_id INT,
	FOREIGN KEY (product_id) REFERENCES products(product_id),
	FOREIGN KEY (tax_id) REFERENCES taxes(tax_id),
	
    -- Clave primaria compuesta: UNIQUE + CLUSTERED por defecto
    CONSTRAINT pk_product_tax PRIMARY KEY (product_id, tax_id)
);

create table invoices (
	invoice_id INT IDENTITY PRIMARY KEY,
	supplier_id INT NOT NULL,
	created_at DATETIMEOFFSET(3) NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	date DATE,
	expiration_date DATETIMEOFFSET(3) NOT NULL,
	total decimal(17,2) NOT NULL,
	total_paid decimal(17,2),
	sale_condition_id INT NOT NULL,
	location_id int NOT NULL,
	FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
	FOREIGN KEY (sale_condition_id) REFERENCES sale_conditions(sale_condition_id),
	FOREIGN KEY (location_id) REFERENCES locations(location_id)
)

create table invoice_details (
	invoice_detail_id INT IDENTITY PRIMARY KEY,
	invoice_id INT NOT NULL,
	product_id INT NOT NULL,
	unit_cost decimal(17,2) NOT NULL,
	tax decimal(17,2) NOT NULL,
	quantity INT NOT NULL,
	sub_total decimal(17,2) NOT NULL,
	FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
	FOREIGN KEY (product_id) REFERENCES products(product_id)
)