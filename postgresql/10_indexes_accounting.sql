
CREATE INDEX ON chart_of_accounts(accounting_process_id);

CREATE INDEX ON chart_of_accounts(parent_account_id);

CREATE INDEX ON journal_entry_details(journal_entry_id);

CREATE INDEX ON entry_model_details(entry_model_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_entries_source
ON journal_entries(source_type, source_id)
WHERE source_type IS NOT NULL
  AND source_id IS NOT NULL;