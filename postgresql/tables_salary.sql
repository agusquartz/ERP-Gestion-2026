-- Basic and stable data about employees.
CREATE TABLE employees (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document        VARCHAR(20) UNIQUE NOT NULL,
    name	        TEXT NOT NULL,
    surname	        TEXT NOT NULL,
    birth_date      DATE,
    hire_date       DATE NOT NULL,
    termination_date DATE,
    job_title       TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
);

-- Current contract or economic condition of an employee.
-- This allows to keep a history of contracts and changes in salary, schedule, etc.
-- An employee can have multiple contracts over time, but only one active at a time.
-- Purpose: Maintain historical records of salaries and conditions.
--      Contracts → used by payroll to determine the applicable rate on a given date.
-- ie.: John's contract: salary 4,500,000 monthly from 2024-01-10.
CREATE TABLE contracts (
    id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id       INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    contract_name     TEXT,
    start_date        DATE NOT NULL,
    end_date          DATE,
    salary            DECIMAL(14,2) NOT NULL,         -- nominal salary (according to period_type)
    salary_period_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'hourly', 'daily'
    payroll_account   VARCHAR(128),
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reusable shift templates (office, night, split, etc).
-- purpose: Purpose: Define templates:
--      example: Office 08:00-17:00 {1,2,3,4,5}. Reusable in employee_schedules.
CREATE TABLE schedules (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    work_days     SMALLINT[] NOT NULL,   -- 1..7 (Mon..Sun)
    default_hours DECIMAL(5,2) NOT NULL, -- expected hours per day
    is_night_shift BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Schedule assignments to employees with history (allows changes).
-- Purpose:
--     It allows each employee to have different schedules over time (historical).
--     The calculation process uses the row where
--     start_date <= date and end_date IS NULL OR end_date >= date.
-- IE.:
--     John: schedule_id 1 from 2024-01-10 to 2024-12-31; then another from 2025-01-01.
CREATE TABLE employee_schedules (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id  INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    schedule_id  INT NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
    start_date   DATE NOT NULL,
    end_date     DATE,
    note         TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for recording attendance logs (clock-in/out, breaks, etc).
-- Purpose: Store raw attendance events for each employee,
-- which can be processed to calculate worked hours
-- even quantity of items means a finished working block, odd quantity means unfinished block.
-- IE.:
--     John: 2026-03-05 08:02 clock-in; 2026-03-05 12:00 clock-out;
--    2026-03-05 13:00 clock-in; 2026-03-05 17:05 clock-out. 
CREATE TABLE attendance_logs (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT NOT NULL
);

-- Table with the daily summary already calculated (produced by batch or triggers).
-- Purpose: Store the daily summary of hours, lateness, absences, etc. per employee.
-- IE.:
--      For 2026-03-05 John: scheduled_hours=8, worked_hours=8.02, late_minutes=2,
--      overtime_hours=0.75, etc.
CREATE TABLE timesheets (
    id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id    INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    work_date      DATE NOT NULL,
    scheduled_hours DECIMAL(5,2) DEFAULT 0,
    worked_hours   DECIMAL(6,2) DEFAULT 0,
    late_minutes   INT DEFAULT 0,
    early_minutes  INT DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    absence        BOOLEAN DEFAULT FALSE,
    attendance_logs_ids     INT[] DEFAULT ARRAY[]::INT[], -- ids of used attendance_logs
    processed_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes          TEXT
);

-- Classification of permits.
CREATE TABLE leave_types (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- 'VAC','SICK','MAT'
    name TEXT NOT NULL,
    paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for recording leaves (vacation, sick, etc).
-- Purpose: Store employee leaves with type and duration.
-- IE.:
--      John: VAC from 2026-04-01 to 2026-04-10; SICK on 2026-05-15.
--      This allows the payroll process to consider these leaves when calculating pay and benefits.
-- When processing timesheets, if work_date falls within an approved
-- and paid employee_leaves, mark absence=false but worked_hours=scheduled_hours
-- (according to rules).
CREATE TABLE employee_leaves (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    leave_type_id INT NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending','approved','rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Holidays that affect the calculation.
-- If work_date is holiday and the role does not require presence,
-- do not count as an absence; apply special rates for hours worked.
CREATE TABLE holidays (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    holiday_date DATE NOT NULL,
    name TEXT,
    region TEXT,
    is_national BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (holiday_date, region)
);

-- Rules for calculating overtime hours.
CREATE TABLE overtime_rules (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT,
    applies_after_hours DECIMAL(5,2) NOT NULL, -- ej: 8h
    multiplier DECIMAL(4,2) DEFAULT 1.3, -- overtime rate (e.g., 1.3 for 30% extra)
    applies_on_weekend BOOLEAN DEFAULT FALSE,
    applies_on_holiday BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- novelties (definition of a 'novedad')
CREATE TABLE novelties (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "BONFAM", "OT_EXTRA", "DESC_SANC"
    name TEXT NOT NULL,
    sign CHAR(1) NOT NULL CHECK(sign IN ('C','D')), -- 'C' credit (company pays), 'D' debit (deduct)
    class CHAR(1) NOT NULL CHECK(class IN ('F','C')), -- 'F' fixed, 'C' calculated
    formula TEXT, -- expression in a safe DSL (see notes)
    deductible_ips BOOLEAN DEFAULT TRUE, -- whether this amount composes IPS base
    taxable_for_aguinaldo BOOLEAN DEFAULT TRUE, -- whether included in aguinaldo base
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- relatives (parientes) -> for family allowance
CREATE TABLE relatives (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    document TEXT,
    relation_type TEXT NOT NULL, -- child, spouse, other
    birth_date DATE,
    disability BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payroll_processes (runs)
-- Purpose: Store each payroll run (salary, aguinaldo, bonus, etc) with its parameters and state.
-- IE.:
--      process_type='salary', pay_date=2026-03-31, cutoff_date=2026-03-31, state='draft'.
CREATE TABLE payroll_processes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    process_type TEXT NOT NULL CHECK(process_type IN ('salary','aguinaldo','bonus','severance')),
    pay_date DATE NOT NULL, -- date current payment is made
    cutoff_date DATE NOT NULL, -- fecha_alto / fecha de cierre to calculate novelties
    state TEXT NOT NULL DEFAULT 'draft', -- draft, computed, paid, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payroll_items (details of each item in a payroll run)
-- Purpose: Store the detailed items (novelties) applied to each employee in a payroll run,
-- including the calculated amount, quantity, and references to the source (timesheet, leave, etc).
CREATE TABLE payroll_items (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payroll_process_id INT NOT NULL REFERENCES payroll_processes(id) ON DELETE RESTRICT,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    novelty_id INT NOT NULL REFERENCES novelties(id) ON DELETE RESTRICT,

    quantity DECIMAL(10,2) DEFAULT 1,
    unit_amount DECIMAL(14,2) DEFAULT 0,
    total_amount DECIMAL(14,2) NOT NULL,

    origin TEXT, -- manual, formula, timesheet, leave, overtime, etc

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payments_summary (results saved per employee per payroll run)
-- Purpose: Store the final summary of payments per employee per payroll run,
-- to avoid recalculating and for historical records.
CREATE TABLE payroll_employee_summary (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payroll_process_id INT REFERENCES payroll_processes(id),
    employee_id INT REFERENCES employees(id),

    gross_amount DECIMAL(14,2),
    deduction_amount DECIMAL(14,2),
    net_amount DECIMAL(14,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    UNIQUE(payroll_process_id, employee_id)
);
