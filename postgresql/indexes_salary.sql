
CREATE INDEX ON employees(document);

CREATE INDEX ON contracts(employee_id);

CREATE INDEX ON employee_schedules(employee_id, start_date);

CREATE UNIQUE INDEX ON timesheets(employee_id, work_date);

CREATE INDEX ON employee_leaves(employee_id, start_date);