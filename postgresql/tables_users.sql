create table roles (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name,
	description
);

create table users (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	employee_id INT REFERENCES employees(id),
	username TEXT NOT NULL,
	pass_hash TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	last_login_at TIMESTAMP,
	role_id INT REFERENCES roles(id)
);

create table permissions (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code TEXT NOT NULL,
	description TEXT
);

create table roles_permissions (
	role_id INT REFERENCES roles(id),
	permission_id INT REFERENCES permissions(id),
	CONSTRAINT pk_roles_permissions_id PRIMARY KEY (role_id, permission_id)
);

