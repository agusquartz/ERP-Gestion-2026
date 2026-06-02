CREATE TABLE roles (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	description TEXT NOT NULL
);

CREATE TABLE users (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	employee_id INT REFERENCES employees(id),
	username TEXT UNIQUE NOT NULL,
	email TEXT UNIQUE NOT NULL,
	pass_hash TEXT NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	last_login_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	role_id INT REFERENCES roles(id)
);

CREATE TABLE permissions (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code TEXT NOT NULL,
	description TEXT
);

CREATE TABLE roles_permissions (
	role_id INT REFERENCES roles(id),
	permission_id INT REFERENCES permissions(id),
	CONSTRAINT pk_roles_permissions_id PRIMARY KEY (role_id, permission_id)
);

