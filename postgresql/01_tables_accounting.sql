-- Defines an accounting process configuration (chart structure rules).
-- Purpose:
--   - Define how account numbers are structured.
--   - Allow multiple accounting schemas if needed.
CREATE TABLE accounting_processes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fiscal_year INT NOT NULL, -- e.g. 2026
    description TEXT,
    account_levels_count INT NOT NULL, -- number of hierarchy levels (e.g. 4)
    digits_per_level INT NOT NULL, -- digits per level (e.g. 2 → 01.02.03.04)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chart of accounts (hierarchical structure).
-- Purpose:
--   - Define all accounting accounts.
--   - Support parent-child relationships.
CREATE TABLE chart_of_accounts (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    accounting_process_id INT NOT NULL REFERENCES accounting_processes(id) ON DELETE RESTRICT,

    name TEXT NOT NULL,
    is_postable BOOLEAN DEFAULT TRUE, -- whether entries can be posted to this account

    parent_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,

    account_number VARCHAR(50) NOT NULL, -- structured account code

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- Accounting journal entries.
-- Purpose:
--   - Store accounting movements (manual or automatic).
--   - Automatic entries come from entry models and must be immutable.
CREATE TABLE journal_entries (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    entry_number INT NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,

    is_automatic BOOLEAN DEFAULT FALSE, -- true = system-generated, immutable

    entry_model_id INT REFERENCES entry_models(id) ON DELETE RESTRICT,
    source_type TEXT,
    source_id INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS entry_model_id INT REFERENCES entry_models(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_id INT;

-- Journal entry lines (debits and credits).
-- Purpose:
--   - Represent each movement within an entry.
--   - Must balance (sum debit = sum credit).
CREATE TABLE journal_entry_details (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    journal_entry_id INT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,

    amount DECIMAL(14,2) NOT NULL,
    is_debit BOOLEAN NOT NULL, -- true = debit, false = credit

    line_number INT NOT NULL,
    line_description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- System modules (payroll, billing, etc).
-- Purpose:
--   - Group entry models by functional area.
CREATE TABLE modules (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Accounting closure (period lock).
-- Purpose:
--   - Freeze all entries up to a certain date.
--   - Prevent modifications after closing.
CREATE TABLE accounting_closures (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    closure_type TEXT NOT NULL, -- e.g. 'monthly','yearly'
    closure_date DATE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Entry templates for automatic or manual generation.
-- Purpose:
--   - Define how entries are generated for business operations.
--   - Can be linked to modules (e.g. payroll, invoicing).
CREATE TABLE entry_models (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    module_id INT REFERENCES modules(id) ON DELETE SET NULL,

    auto_generate BOOLEAN DEFAULT TRUE, 
    -- true = backend generates automatically (immutable entry)
    -- false = manual generation allowed

    entry_type TEXT NOT NULL CHECK(entry_type IN ('summary','detail')),
    -- summary = grouped entry, detail = per-record entry

    operation_type TEXT NOT NULL, -- e.g. 'invoice','payment','payroll'

    description TEXT, -- formula or explanation

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Defines the lines of an entry model.
-- Purpose:
--   - Specify debit/credit behavior and accounts.
CREATE TABLE entry_model_details (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    entry_model_id INT NOT NULL REFERENCES entry_models(id) ON DELETE CASCADE,

    account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,

    is_debit BOOLEAN NOT NULL,

    line_number INT NOT NULL,
    line_description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

