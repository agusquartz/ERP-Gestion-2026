//! # Accounting Repository Layer
//!
//! This module is the only place where the accounting module executes SQL.
//!
//! ## Responsibilities
//! - Read accounting processes.
//! - Read chart of accounts.
//! - CRUD journal entries.
//! - Read modules.
//! - CRUD accounting closures.
//! - Read entry models.
//!
//! ## What this module does NOT do
//! - Apply high-level business rules.
//! - Serialize API responses.
//! - Handle HTTP types.

use chrono::NaiveDate;
use rust_decimal::Decimal;
use tokio_postgres::{Row, Transaction};
use std::collections::HashMap;

use crate::db_config;
use crate::modules::accounting::model::*;

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING PROCESSES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_accounting_processes(
) -> Result<Vec<AccountingProcess>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = client
        .query(
            r#"
            SELECT
                id,
                fiscal_year,
                description,
                account_levels_count,
                digits_per_level,
                created_at
            FROM accounting_processes
            ORDER BY fiscal_year DESC, id DESC
            "#,
            &[],
        )
        .await?;

    Ok(rows.iter().map(row_to_accounting_process).collect())
}

pub async fn get_accounting_process_by_id(
    id: i32,
) -> Result<Option<AccountingProcess>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_opt(
            r#"
            SELECT
                id,
                fiscal_year,
                description,
                account_levels_count,
                digits_per_level,
                created_at
            FROM accounting_processes
            WHERE id = $1
            "#,
            &[&id],
        )
        .await?;

    Ok(row.map(|row| row_to_accounting_process(&row)))
}

fn row_to_accounting_process(row: &Row) -> AccountingProcess {
    AccountingProcess {
        id: row.get("id"),
        fiscal_year: row.get("fiscal_year"),
        description: row.get("description"),
        account_levels_count: row.get("account_levels_count"),
        digits_per_level: row.get("digits_per_level"),
        created_at: row.get("created_at"),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_chart_of_accounts(
    accounting_process_id: Option<i32>,
) -> Result<Vec<ChartOfAccount>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = if let Some(process_id) = accounting_process_id {
        client
            .query(
                r#"
                SELECT
                    id,
                    accounting_process_id,
                    name,
                    COALESCE(is_postable, TRUE) AS is_postable,
                    parent_account_id,
                    account_number,
                    created_at
                FROM chart_of_accounts
                WHERE accounting_process_id = $1
                ORDER BY account_number
                "#,
                &[&process_id],
            )
            .await?
    } else {
        client
            .query(
                r#"
                SELECT
                    id,
                    accounting_process_id,
                    name,
                    COALESCE(is_postable, TRUE) AS is_postable,
                    parent_account_id,
                    account_number,
                    created_at
                FROM chart_of_accounts
                ORDER BY accounting_process_id, account_number
                "#,
                &[],
            )
            .await?
    };

    Ok(rows.iter().map(row_to_chart_account).collect())
}

pub async fn get_chart_account_by_id(
    id: i32,
) -> Result<Option<ChartOfAccount>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_opt(
            r#"
            SELECT
                id,
                accounting_process_id,
                name,
                COALESCE(is_postable, TRUE) AS is_postable,
                parent_account_id,
                account_number,
                created_at
            FROM chart_of_accounts
            WHERE id = $1
            "#,
            &[&id],
        )
        .await?;

    Ok(row.map(|row| row_to_chart_account(&row)))
}

pub async fn account_is_postable(
    account_id: i32,
) -> Result<bool, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_opt(
            r#"
            SELECT COALESCE(is_postable, TRUE) AS is_postable
            FROM chart_of_accounts
            WHERE id = $1
            "#,
            &[&account_id],
        )
        .await?;

    Ok(row
        .map(|row| row.get::<_, bool>("is_postable"))
        .unwrap_or(false))
}

fn row_to_chart_account(row: &Row) -> ChartOfAccount {
    ChartOfAccount {
        id: row.get("id"),
        accounting_process_id: row.get("accounting_process_id"),
        name: row.get("name"),
        is_postable: row.get("is_postable"),
        parent_account_id: row.get("parent_account_id"),
        account_number: row.get("account_number"),
        created_at: row.get("created_at"),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRY BASE QUERY
// ─────────────────────────────────────────────────────────────────────────────

const JOURNAL_ENTRY_BASE_QUERY: &str = r#"
SELECT
    je.id                       AS journal_entry_id,
    je.entry_number             AS journal_entry_number,
    je.entry_date               AS journal_entry_date,
    je.description              AS journal_entry_description,
    COALESCE(je.is_automatic, FALSE) AS journal_entry_is_automatic,
    je.created_at               AS journal_entry_created_at,

    jed.id                      AS detail_id,
    jed.amount                  AS detail_amount,
    jed.is_debit                AS detail_is_debit,
    jed.line_number             AS detail_line_number,
    jed.line_description        AS detail_line_description,
    jed.created_at              AS detail_created_at,

    coa.id                      AS account_id,
    coa.account_number          AS account_number,
    coa.name                    AS account_name,
    COALESCE(coa.is_postable, TRUE) AS account_is_postable

FROM journal_entries je
LEFT JOIN journal_entry_details jed
    ON jed.journal_entry_id = je.id
LEFT JOIN chart_of_accounts coa
    ON coa.id = jed.account_id
"#;

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES — CREATE
// ─────────────────────────────────────────────────────────────────────────────

pub async fn create_journal_entry(
    entry: NewJournalEntry,
) -> Result<JournalEntryWithDetails, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let entry_number = match entry.entry_number {
        Some(number) => number,
        None => {
            let row = tx
                .query_one(
                    r#"
                    SELECT COALESCE(MAX(entry_number), 0) + 1 AS next_entry_number
                    FROM journal_entries
                    "#,
                    &[],
                )
                .await?;

            row.get("next_entry_number")
        }
    };

    let row = tx
        .query_one(
            r#"
            INSERT INTO journal_entries (
                entry_number,
                entry_date,
                description,
                is_automatic
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id
            "#,
            &[
                &entry_number,
                &entry.entry_date,
                &entry.description,
                &entry.is_automatic,
            ],
        )
        .await?;

    let journal_entry_id: i32 = row.get("id");

    for detail in entry.details {
        tx.execute(
            r#"
            INSERT INTO journal_entry_details (
                journal_entry_id,
                account_id,
                amount,
                is_debit,
                line_number,
                line_description
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            &[
                &journal_entry_id,
                &detail.account_id,
                &detail.amount,
                &detail.is_debit,
                &detail.line_number,
                &detail.line_description,
            ],
        )
        .await?;
    }

    tx.commit().await?;

    get_journal_entry_by_id(journal_entry_id)
        .await?
        .ok_or(db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES — READ
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_journal_entries(
    contains: Option<String>,
) -> Result<Vec<JournalEntryWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let mut sql = JOURNAL_ENTRY_BASE_QUERY.to_string();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();

    let pattern;

    if let Some(q) = contains {
        pattern = format!("%{}%", q);

        sql.push_str(
            r#"
            WHERE (
                je.id::text ILIKE $1
                OR je.entry_number::text ILIKE $1
                OR je.entry_date::text ILIKE $1
                OR je.description ILIKE $1
                OR EXISTS (
                    SELECT 1
                    FROM journal_entry_details jed_filter
                    JOIN chart_of_accounts coa_filter
                        ON coa_filter.id = jed_filter.account_id
                    WHERE jed_filter.journal_entry_id = je.id
                      AND (
                          coa_filter.account_number ILIKE $1
                          OR coa_filter.name ILIKE $1
                      )
                )
            )
            "#,
        );

        params.push(&pattern);
    }

    sql.push_str(" ORDER BY je.entry_date DESC, je.entry_number DESC, jed.line_number");

    let rows = client.query(&sql, &params).await?;

    Ok(rows_to_journal_entries(rows))
}

pub async fn get_journal_entry_by_id(
    id: i32,
) -> Result<Option<JournalEntryWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{JOURNAL_ENTRY_BASE_QUERY}
         WHERE je.id = $1
         ORDER BY jed.line_number"
    );

    let rows = client.query(&sql, &[&id]).await?;
    let data = rows_to_journal_entries(rows);

    Ok(data.into_iter().next())
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES — UPDATE
// ─────────────────────────────────────────────────────────────────────────────

pub async fn update_journal_entry(
    id: i32,
    update: UpdateJournalEntry,
) -> Result<JournalEntryWithDetails, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let updated = tx
        .execute(
            r#"
            UPDATE journal_entries
            SET
                entry_date = COALESCE($1, entry_date),
                description = COALESCE($2, description)
            WHERE id = $3
            "#,
            &[&update.entry_date, &update.description, &id],
        )
        .await?;

    if updated == 0 {
        return Err(db_config::DbError::NotFound);
    }

    if let Some(details) = update.details {
        tx.execute(
            r#"
            DELETE FROM journal_entry_details
            WHERE journal_entry_id = $1
            "#,
            &[&id],
        )
        .await?;

        for detail in details {
            tx.execute(
                r#"
                INSERT INTO journal_entry_details (
                    journal_entry_id,
                    account_id,
                    amount,
                    is_debit,
                    line_number,
                    line_description
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
                &[
                    &id,
                    &detail.account_id,
                    &detail.amount,
                    &detail.is_debit,
                    &detail.line_number,
                    &detail.line_description,
                ],
            )
            .await?;
        }
    }

    tx.commit().await?;

    get_journal_entry_by_id(id)
        .await?
        .ok_or(db_config::DbError::NotFound)
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES — DELETE
// ─────────────────────────────────────────────────────────────────────────────

pub async fn delete_journal_entry(
    id: i32,
) -> Result<(), db_config::DbError> {
    let client = db_config::get_client().await?;

    let deleted = client
        .execute(
            r#"
            DELETE FROM journal_entries
            WHERE id = $1
            "#,
            &[&id],
        )
        .await?;

    if deleted == 0 {
        return Err(db_config::DbError::NotFound);
    }

    Ok(())
}

fn rows_to_journal_entries(
    rows: Vec<Row>,
) -> Vec<JournalEntryWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, JournalEntryWithDetails> = BTreeMap::new();

    for row in rows {
        let journal_entry_id: i32 = row.get("journal_entry_id");

        let entry = map.entry(journal_entry_id).or_insert_with(|| {
            JournalEntryWithDetails {
                journal_entry: JournalEntry {
                    id: journal_entry_id,
                    entry_number: row.get("journal_entry_number"),
                    entry_date: row.get("journal_entry_date"),
                    description: row.get("journal_entry_description"),
                    is_automatic: row.get("journal_entry_is_automatic"),
                    created_at: row.get("journal_entry_created_at"),
                },
                total_debit: Decimal::ZERO,
                total_credit: Decimal::ZERO,
                is_balanced: false,
                details: vec![],
            }
        });

        let detail_id: Option<i32> = row.get("detail_id");

        if let Some(detail_id) = detail_id {
            let amount: Decimal = row.get("detail_amount");
            let is_debit: bool = row.get("detail_is_debit");

            if is_debit {
                entry.total_debit += amount;
            } else {
                entry.total_credit += amount;
            }

            entry.details.push(JournalEntryDetail {
                id: detail_id,
                journal_entry_id,
                account: JournalEntryAccount {
                    id: row.get("account_id"),
                    account_number: row.get("account_number"),
                    name: row.get("account_name"),
                    is_postable: row.get("account_is_postable"),
                },
                amount,
                is_debit,
                line_number: row.get("detail_line_number"),
                line_description: row.get("detail_line_description"),
                created_at: row.get("detail_created_at"),
            });
        }
    }

    map.into_values()
        .map(|mut entry| {
            entry.is_balanced = entry.total_debit == entry.total_credit;
            entry
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_modules(
) -> Result<Vec<AccountingModule>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = client
        .query(
            r#"
            SELECT
                id,
                name,
                created_at
            FROM modules
            ORDER BY name
            "#,
            &[],
        )
        .await?;

    Ok(rows
        .iter()
        .map(|row| AccountingModule {
            id: row.get("id"),
            name: row.get("name"),
            created_at: row.get("created_at"),
        })
        .collect())
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING CLOSURES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn create_accounting_closure(
    closure: NewAccountingClosure,
) -> Result<AccountingClosure, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_one(
            r#"
            INSERT INTO accounting_closures (
                closure_type,
                closure_date
            )
            VALUES ($1, $2)
            RETURNING
                id,
                closure_type,
                closure_date,
                created_at
            "#,
            &[&closure.closure_type, &closure.closure_date],
        )
        .await?;

    Ok(row_to_accounting_closure(&row))
}

pub async fn get_accounting_closures(
) -> Result<Vec<AccountingClosure>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = client
        .query(
            r#"
            SELECT
                id,
                closure_type,
                closure_date,
                created_at
            FROM accounting_closures
            ORDER BY closure_date DESC, id DESC
            "#,
            &[],
        )
        .await?;

    Ok(rows.iter().map(row_to_accounting_closure).collect())
}

pub async fn get_accounting_closure_by_id(
    id: i32,
) -> Result<Option<AccountingClosure>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_opt(
            r#"
            SELECT
                id,
                closure_type,
                closure_date,
                created_at
            FROM accounting_closures
            WHERE id = $1
            "#,
            &[&id],
        )
        .await?;

    Ok(row.map(|row| row_to_accounting_closure(&row)))
}

pub async fn update_accounting_closure(
    id: i32,
    closure: UpdateAccountingClosure,
) -> Result<AccountingClosure, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_opt(
            r#"
            UPDATE accounting_closures
            SET
                closure_type = COALESCE($1, closure_type),
                closure_date = COALESCE($2, closure_date)
            WHERE id = $3
            RETURNING
                id,
                closure_type,
                closure_date,
                created_at
            "#,
            &[&closure.closure_type, &closure.closure_date, &id],
        )
        .await?;

    row.map(|row| row_to_accounting_closure(&row))
        .ok_or(db_config::DbError::NotFound)
}

pub async fn delete_accounting_closure(
    id: i32,
) -> Result<(), db_config::DbError> {
    let client = db_config::get_client().await?;

    let deleted = client
        .execute(
            r#"
            DELETE FROM accounting_closures
            WHERE id = $1
            "#,
            &[&id],
        )
        .await?;

    if deleted == 0 {
        return Err(db_config::DbError::NotFound);
    }

    Ok(())
}

pub async fn get_latest_closure_date(
) -> Result<Option<NaiveDate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row = client
        .query_one(
            r#"
            SELECT MAX(closure_date) AS latest_closure_date
            FROM accounting_closures
            "#,
            &[],
        )
        .await?;

    Ok(row.get("latest_closure_date"))
}

fn row_to_accounting_closure(row: &Row) -> AccountingClosure {
    AccountingClosure {
        id: row.get("id"),
        closure_type: row.get("closure_type"),
        closure_date: row.get("closure_date"),
        created_at: row.get("created_at"),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODELS
// ─────────────────────────────────────────────────────────────────────────────

const ENTRY_MODEL_BASE_QUERY: &str = r#"
SELECT
    em.id                         AS entry_model_id,
    em.module_id                  AS entry_model_module_id,
    COALESCE(em.auto_generate, TRUE) AS entry_model_auto_generate,
    em.entry_type                 AS entry_model_entry_type,
    em.operation_type             AS entry_model_operation_type,
    em.description                AS entry_model_description,
    em.created_at                 AS entry_model_created_at,

    m.id                          AS module_id,
    m.name                        AS module_name,

    emd.id                        AS detail_id,
    emd.is_debit                  AS detail_is_debit,
    emd.line_number               AS detail_line_number,
    emd.line_description          AS detail_line_description,
    emd.created_at                AS detail_created_at,

    coa.id                        AS account_id,
    coa.account_number            AS account_number,
    coa.name                      AS account_name,
    COALESCE(coa.is_postable, TRUE) AS account_is_postable

FROM entry_models em
LEFT JOIN modules m
    ON m.id = em.module_id
LEFT JOIN entry_model_details emd
    ON emd.entry_model_id = em.id
LEFT JOIN chart_of_accounts coa
    ON coa.id = emd.account_id
"#;

pub async fn get_entry_models(
    contains: Option<String>,
) -> Result<Vec<EntryModelWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let mut sql = ENTRY_MODEL_BASE_QUERY.to_string();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();

    let pattern;

    if let Some(q) = contains {
        pattern = format!("%{}%", q);

        sql.push_str(
            r#"
            WHERE (
                em.id::text ILIKE $1
                OR em.entry_type ILIKE $1
                OR em.operation_type ILIKE $1
                OR em.description ILIKE $1
                OR m.name ILIKE $1
                OR EXISTS (
                    SELECT 1
                    FROM entry_model_details emd_filter
                    JOIN chart_of_accounts coa_filter
                        ON coa_filter.id = emd_filter.account_id
                    WHERE emd_filter.entry_model_id = em.id
                      AND (
                          coa_filter.account_number ILIKE $1
                          OR coa_filter.name ILIKE $1
                      )
                )
            )
            "#,
        );

        params.push(&pattern);
    }

    sql.push_str(" ORDER BY em.id, emd.line_number");

    let rows = client.query(&sql, &params).await?;

    Ok(rows_to_entry_models(rows))
}

pub async fn get_entry_model_by_id(
    id: i32,
) -> Result<Option<EntryModelWithDetails>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{ENTRY_MODEL_BASE_QUERY}
         WHERE em.id = $1
         ORDER BY em.id, emd.line_number"
    );

    let rows = client.query(&sql, &[&id]).await?;
    let data = rows_to_entry_models(rows);

    Ok(data.into_iter().next())
}

fn rows_to_entry_models(
    rows: Vec<Row>,
) -> Vec<EntryModelWithDetails> {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<i32, EntryModelWithDetails> = BTreeMap::new();

    for row in rows {
        let entry_model_id: i32 = row.get("entry_model_id");

        let module_id: Option<i32> = row.get("module_id");

        let module = module_id.map(|id| EntryModelModule {
            id,
            name: row.get("module_name"),
        });

        let entry = map.entry(entry_model_id).or_insert_with(|| {
            EntryModelWithDetails {
                entry_model: EntryModel {
                    id: entry_model_id,
                    module_id: row.get("entry_model_module_id"),
                    auto_generate: row.get("entry_model_auto_generate"),
                    entry_type: row.get("entry_model_entry_type"),
                    operation_type: row.get("entry_model_operation_type"),
                    description: row.get("entry_model_description"),
                    created_at: row.get("entry_model_created_at"),
                },
                module,
                details: vec![],
            }
        });

        let detail_id: Option<i32> = row.get("detail_id");

        if let Some(detail_id) = detail_id {
            entry.details.push(EntryModelDetail {
                id: detail_id,
                entry_model_id,
                account: EntryModelAccount {
                    id: row.get("account_id"),
                    account_number: row.get("account_number"),
                    name: row.get("account_name"),
                    is_postable: row.get("account_is_postable"),
                },
                is_debit: row.get("detail_is_debit"),
                line_number: row.get("detail_line_number"),
                line_description: row.get("detail_line_description"),
                created_at: row.get("detail_created_at"),
            });
        }
    }

    map.into_values().collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC JOURNAL ENTRIES — PURCHASES SUPPORT
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PurchaseInvoicePostingData {
    pub id: i32,
    pub invoice_nr: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub gross_amount: Decimal,
    pub inventory_amount: Decimal,
    pub vat_amount: Decimal,
}

#[derive(Debug, Clone)]
pub struct ReturnCreditNotePostingData {
    pub id: i32,
    pub note_number: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub gross_amount: Decimal,
    pub inventory_amount: Decimal,
    pub vat_amount: Decimal,
}

#[derive(Debug, Clone)]
pub struct PurchasePaymentPostingData {
    pub id: i32,
    pub entry_date: NaiveDate,
    pub supplier_id: i32,
    pub amount_to_pay: Decimal,
}

#[derive(Debug, Clone)]
pub struct AutomaticJournalEntryDetailInput {
    pub account_id: i32,
    pub amount: Decimal,
    pub is_debit: bool,
    pub line_number: i32,
    pub line_description: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NewAutomaticJournalEntry {
    pub entry_date: NaiveDate,
    pub description: Option<String>,
    pub entry_model_id: i32,
    pub source_type: String,
    pub source_id: i32,
    pub details: Vec<AutomaticJournalEntryDetailInput>,
}

pub async fn get_latest_closure_date_tx(
    tx: &Transaction<'_>,
) -> Result<Option<NaiveDate>, db_config::DbError> {
    let row = tx
        .query_one(
            r#"
            SELECT MAX(closure_date) AS latest_closure_date
            FROM accounting_closures
            "#,
            &[],
        )
        .await?;

    Ok(row.get("latest_closure_date"))
}

pub async fn get_entry_model_by_operation_type_tx(
    tx: &Transaction<'_>,
    operation_type: &str,
) -> Result<EntryModelWithDetails, db_config::DbError> {
    let sql = format!(
        "{ENTRY_MODEL_BASE_QUERY}
         WHERE em.operation_type = $1
         ORDER BY em.id, emd.line_number"
    );

    let rows = tx.query(&sql, &[&operation_type]).await?;
    let mut models = rows_to_entry_models(rows);

    models
        .pop()
        .ok_or_else(|| {
            db_config::DbError::Other(format!(
                "Entry model not found for operation type '{}'",
                operation_type
            ))
        })
}

pub async fn get_purchase_invoice_posting_data_tx(
    tx: &Transaction<'_>,
    purchase_invoice_id: i32,
) -> Result<PurchaseInvoicePostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            WITH invoice_lines AS (
                SELECT
                    pid.purchase_invoice_id,
                    pid.product_id,
                    ROUND((pid.quantity * pid.unit_cost)::numeric, 2) AS gross_line_amount,

                    COALESCE(iva.rate, 10.00) AS iva_rate
                FROM purchase_invoice_details pid
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(t.percentage) AS rate
                    FROM product_taxes pt
                    JOIN taxes t
                        ON t.id = pt.tax_id
                    WHERE pt.product_id = pid.product_id
                      AND t.name ILIKE 'IVA%'
                ) iva ON TRUE
                WHERE pid.purchase_invoice_id = $1
            ),
            calculated AS (
                SELECT
                    purchase_invoice_id,

                    ROUND(SUM(gross_line_amount)::numeric, 2) AS gross_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            - (
                                gross_line_amount
                                * iva_rate
                                / (100 + iva_rate)
                            )
                        )::numeric,
                        2
                    ) AS inventory_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            * iva_rate
                            / (100 + iva_rate)
                        )::numeric,
                        2
                    ) AS vat_amount
                FROM invoice_lines
                GROUP BY purchase_invoice_id
            )
            SELECT
                pi.id,
                pi.invoice_nr,
                pi.created_at,
                pi.total,
                COALESCE(c.gross_amount, 0) AS gross_amount,
                COALESCE(c.inventory_amount, 0) AS inventory_amount,
                COALESCE(c.vat_amount, 0) AS vat_amount
            FROM purchase_invoices pi
            LEFT JOIN calculated c
                ON c.purchase_invoice_id = pi.id
            WHERE pi.id = $1
            "#,
            &[&purchase_invoice_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(PurchaseInvoicePostingData {
        id: row.get("id"),
        invoice_nr: row.get("invoice_nr"),
        created_at: row.get("created_at"),
        total: row.get("total"),
        gross_amount: row.get("gross_amount"),
        inventory_amount: row.get("inventory_amount"),
        vat_amount: row.get("vat_amount"),
    })
}

pub async fn get_return_credit_note_posting_data_tx(
    tx: &Transaction<'_>,
    return_credit_note_id: i32,
) -> Result<ReturnCreditNotePostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            WITH note_lines AS (
                SELECT
                    rcnd.return_credit_note_id,
                    rcnd.product_id,
                    ROUND(rcnd.subtotal::numeric, 2) AS gross_line_amount,

                    COALESCE(iva.rate, 10.00) AS iva_rate
                FROM return_credit_note_details rcnd
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(t.percentage) AS rate
                    FROM product_taxes pt
                    JOIN taxes t
                        ON t.id = pt.tax_id
                    WHERE pt.product_id = rcnd.product_id
                      AND t.name ILIKE 'IVA%'
                ) iva ON TRUE
                WHERE rcnd.return_credit_note_id = $1
            ),
            calculated AS (
                SELECT
                    return_credit_note_id,

                    ROUND(SUM(gross_line_amount)::numeric, 2) AS gross_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            - (
                                gross_line_amount
                                * iva_rate
                                / (100 + iva_rate)
                            )
                        )::numeric,
                        2
                    ) AS inventory_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            * iva_rate
                            / (100 + iva_rate)
                        )::numeric,
                        2
                    ) AS vat_amount
                FROM note_lines
                GROUP BY return_credit_note_id
            )
            SELECT
                rcn.id,
                rcn.note_number,
                rcn.created_at,
                rcn.total,
                COALESCE(c.gross_amount, 0) AS gross_amount,
                COALESCE(c.inventory_amount, 0) AS inventory_amount,
                COALESCE(c.vat_amount, 0) AS vat_amount
            FROM return_credit_notes rcn
            LEFT JOIN calculated c
                ON c.return_credit_note_id = rcn.id
            WHERE rcn.id = $1
            "#,
            &[&return_credit_note_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(ReturnCreditNotePostingData {
        id: row.get("id"),
        note_number: row.get("note_number"),
        created_at: row.get("created_at"),
        total: row.get("total"),
        gross_amount: row.get("gross_amount"),
        inventory_amount: row.get("inventory_amount"),
        vat_amount: row.get("vat_amount"),
    })
}

pub async fn get_purchase_payment_posting_data_tx(
    tx: &Transaction<'_>,
    purchase_payment_order_id: i32,
) -> Result<PurchasePaymentPostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            SELECT
                ppo.id,
                COALESCE(ppo.scheduled_payment_date, ppo.created_at) AS entry_date,
                ppo.supplier_id,
                ROUND(COALESCE(SUM(ppod.amount_to_pay), 0)::numeric, 2) AS amount_to_pay
            FROM purchase_payment_orders ppo
            LEFT JOIN purchase_payment_order_details ppod
                ON ppod.purchase_payment_order_id = ppo.id
            WHERE ppo.id = $1
            GROUP BY
                ppo.id,
                ppo.created_at,
                ppo.scheduled_payment_date,
                ppo.supplier_id
            "#,
            &[&purchase_payment_order_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(PurchasePaymentPostingData {
        id: row.get("id"),
        entry_date: row.get("entry_date"),
        supplier_id: row.get("supplier_id"),
        amount_to_pay: row.get("amount_to_pay"),
    })
}

pub async fn create_automatic_journal_entry_tx(
    tx: &Transaction<'_>,
    entry: NewAutomaticJournalEntry,
) -> Result<i32, db_config::DbError> {
    if entry.details.is_empty() {
        return Err(db_config::DbError::Other(
            "Automatic journal entry must have details".to_string(),
        ));
    }

    let existing = tx
        .query_opt(
            r#"
            SELECT id
            FROM journal_entries
            WHERE source_type = $1
              AND source_id = $2
            "#,
            &[&entry.source_type, &entry.source_id],
        )
        .await?;

    if let Some(row) = existing {
        return Ok(row.get("id"));
    }

    tx.execute(
        r#"
        LOCK TABLE journal_entries IN EXCLUSIVE MODE
        "#,
        &[],
    )
    .await?;

    let row = tx
        .query_one(
            r#"
            SELECT COALESCE(MAX(entry_number), 0) + 1 AS next_entry_number
            FROM journal_entries
            "#,
            &[],
        )
        .await?;

    let entry_number: i32 = row.get("next_entry_number");

    let row = tx
        .query_one(
            r#"
            INSERT INTO journal_entries (
                entry_number,
                entry_date,
                description,
                is_automatic,
                entry_model_id,
                source_type,
                source_id
            )
            VALUES ($1, $2, $3, TRUE, $4, $5, $6)
            RETURNING id
            "#,
            &[
                &entry_number,
                &entry.entry_date,
                &entry.description,
                &entry.entry_model_id,
                &entry.source_type,
                &entry.source_id,
            ],
        )
        .await?;

    let journal_entry_id: i32 = row.get("id");

    for detail in entry.details {
        tx.execute(
            r#"
            INSERT INTO journal_entry_details (
                journal_entry_id,
                account_id,
                amount,
                is_debit,
                line_number,
                line_description
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            &[
                &journal_entry_id,
                &detail.account_id,
                &detail.amount,
                &detail.is_debit,
                &detail.line_number,
                &detail.line_description,
            ],
        )
        .await?;
    }

    Ok(journal_entry_id)
}




// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC JOURNAL ENTRIES — SALES SUPPORT
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct SalesInvoicePostingData {
    pub id: i32,
    pub invoice_number: String,
    pub entry_date: NaiveDate,
    pub total: Decimal,
    pub gross_amount: Decimal,
    pub sales_amount: Decimal,
    pub vat_amount: Decimal,
    pub cogs_amount: Decimal,
}

#[derive(Debug, Clone)]
pub struct SalesCreditNotePostingData {
    pub id: i32,
    pub credit_note_nr: String,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub gross_amount: Decimal,
    pub sales_return_amount: Decimal,
    pub vat_amount: Decimal,
}

pub async fn get_sales_invoice_posting_data_tx(
    tx: &Transaction<'_>,
    sales_invoice_id: i32,
) -> Result<SalesInvoicePostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            WITH invoice_lines AS (
                SELECT
                    sid.invoice_id,

                    ROUND(
                        (sid.unit_cost * sid.quantity)::numeric,
                        2
                    ) AS gross_line_amount,

                    COALESCE(
                        NULLIF(sid.tax, 0),
                        iva.rate,
                        10.00
                    ) AS iva_rate,

                    ROUND(
                        (
                            COALESCE(
                                NULLIF(p.last_acquisition_cost, 0),
                                NULLIF(p.cost, 0),
                                0
                            )
                            * sid.quantity
                        )::numeric,
                        2
                    ) AS cogs_line_amount

                FROM sale_invoice_details sid
                JOIN products p
                    ON p.id = sid.product_id
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(t.percentage) AS rate
                    FROM product_taxes pt
                    JOIN taxes t
                        ON t.id = pt.tax_id
                    WHERE pt.product_id = sid.product_id
                      AND t.name ILIKE 'IVA%'
                ) iva ON TRUE
                WHERE sid.invoice_id = $1
            ),
            calculated AS (
                SELECT
                    invoice_id,

                    ROUND(
                        SUM(gross_line_amount)::numeric,
                        2
                    ) AS gross_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            * iva_rate
                            / (100 + iva_rate)
                        )::numeric,
                        2
                    ) AS vat_amount,

                    ROUND(
                        SUM(cogs_line_amount)::numeric,
                        2
                    ) AS cogs_amount

                FROM invoice_lines
                GROUP BY invoice_id
            )
            SELECT
                si.id,

                (
                    LPAD(si.establishment::text, 3, '0') || '-' ||
                    LPAD(si.emission_point::text, 3, '0') || '-' ||
                    LPAD(si.invoice_sequential::text, 7, '0')
                ) AS invoice_number,

                si.date AS entry_date,
                si.total,

                COALESCE(c.gross_amount, 0) AS gross_amount,
                COALESCE(c.vat_amount, 0) AS vat_amount,
                COALESCE(c.cogs_amount, 0) AS cogs_amount,

                ROUND(
                    (
                        si.total - COALESCE(c.vat_amount, 0)
                    )::numeric,
                    2
                ) AS sales_amount

            FROM sales_invoices si
            LEFT JOIN calculated c
                ON c.invoice_id = si.id
            WHERE si.id = $1
            "#,
            &[&sales_invoice_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(SalesInvoicePostingData {
        id: row.get("id"),
        invoice_number: row.get("invoice_number"),
        entry_date: row.get("entry_date"),
        total: row.get("total"),
        gross_amount: row.get("gross_amount"),
        sales_amount: row.get("sales_amount"),
        vat_amount: row.get("vat_amount"),
        cogs_amount: row.get("cogs_amount"),
    })
}

pub async fn get_sales_credit_note_posting_data_tx(
    tx: &Transaction<'_>,
    credit_note_id: i32,
) -> Result<SalesCreditNotePostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            WITH credit_note_lines AS (
                SELECT
                    cnd.credit_note_id,

                    ROUND(
                        (cnd.unit_cost * cnd.quantity)::numeric,
                        2
                    ) AS gross_line_amount,

                    COALESCE(
                        NULLIF(cnd.tax, 0),
                        iva.rate,
                        10.00
                    ) AS iva_rate

                FROM credit_note_details cnd
                JOIN products p
                    ON p.id = cnd.product_id
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(t.percentage) AS rate
                    FROM product_taxes pt
                    JOIN taxes t
                        ON t.id = pt.tax_id
                    WHERE pt.product_id = cnd.product_id
                      AND t.name ILIKE 'IVA%'
                ) iva ON TRUE
                WHERE cnd.credit_note_id = $1
            ),
            calculated AS (
                SELECT
                    credit_note_id,

                    ROUND(
                        SUM(gross_line_amount)::numeric,
                        2
                    ) AS gross_amount,

                    ROUND(
                        SUM(
                            gross_line_amount
                            * iva_rate
                            / (100 + iva_rate)
                        )::numeric,
                        2
                    ) AS vat_amount

                FROM credit_note_lines
                GROUP BY credit_note_id
            )
            SELECT
                cn.id,
                cn.credit_note_nr,
                cn.created_at,
                cn.total,

                COALESCE(c.gross_amount, 0) AS gross_amount,
                COALESCE(c.vat_amount, 0) AS vat_amount,

                ROUND(
                    (
                        cn.total - COALESCE(c.vat_amount, 0)
                    )::numeric,
                    2
                ) AS sales_return_amount

            FROM credit_notes cn
            LEFT JOIN calculated c
                ON c.credit_note_id = cn.id
            WHERE cn.id = $1
            "#,
            &[&credit_note_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(SalesCreditNotePostingData {
        id: row.get("id"),
        credit_note_nr: row.get("credit_note_nr"),
        created_at: row.get("created_at"),
        total: row.get("total"),
        gross_amount: row.get("gross_amount"),
        sales_return_amount: row.get("sales_return_amount"),
        vat_amount: row.get("vat_amount"),
    })
}










// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC JOURNAL ENTRIES — PAYROLL SUPPORT
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PayrollPostingData {
    pub payroll_process_id: i32,
    pub process_type: String,
    pub state: String,
    pub pay_date: NaiveDate,
    pub cutoff_date: NaiveDate,

    pub salary_base_amount: Decimal,
    pub overtime_amount: Decimal,
    pub bonus_amount: Decimal,

    pub employee_ips_amount: Decimal,
    pub damage_deduction_amount: Decimal,
    pub salary_advance_deduction_amount: Decimal,

    pub unsupported_earnings_amount: Decimal,
    pub unsupported_deductions_amount: Decimal,

    pub gross_amount: Decimal,
    pub deduction_amount: Decimal,
    pub net_amount: Decimal,
    pub employee_count: i64,
}

pub async fn get_payroll_posting_data_tx(
    tx: &Transaction<'_>,
    payroll_process_id: i32,
) -> Result<PayrollPostingData, db_config::DbError> {
    let row = tx
        .query_opt(
            r#"
            WITH item_totals AS (
                SELECT
                    pi.payroll_process_id,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'SALARIO_BASE'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS salary_base_amount,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'HORAS_EXTRA'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS overtime_amount,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'BONIFICACION'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS bonus_amount,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'DESC_IPS'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS employee_ips_amount,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'DESC_ROTURA'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS damage_deduction_amount,

                    COALESCE(SUM(
                        CASE WHEN n.code = 'DESC_ADELANTO'
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS salary_advance_deduction_amount,

                    COALESCE(SUM(
                        CASE
                            WHEN n.sign = 'C'
                             AND n.code NOT IN (
                                'SALARIO_BASE',
                                'HORAS_EXTRA',
                                'BONIFICACION'
                             )
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS unsupported_earnings_amount,

                    COALESCE(SUM(
                        CASE
                            WHEN n.sign = 'D'
                             AND n.code NOT IN (
                                'DESC_IPS',
                                'DESC_ROTURA',
                                'DESC_ADELANTO'
                             )
                            THEN ABS(pi.total_amount)
                            ELSE 0
                        END
                    ), 0)::numeric AS unsupported_deductions_amount

                FROM payroll_items pi
                JOIN novelties n
                    ON n.id = pi.novelty_id
                WHERE pi.payroll_process_id = $1
                GROUP BY pi.payroll_process_id
            ),
            summary_totals AS (
                SELECT
                    pes.payroll_process_id,

                    COALESCE(SUM(pes.gross_amount), 0)::numeric AS gross_amount,
                    COALESCE(SUM(pes.deduction_amount), 0)::numeric AS deduction_amount,
                    COALESCE(SUM(pes.net_amount), 0)::numeric AS net_amount,

                    COUNT(DISTINCT pes.employee_id)::bigint AS employee_count

                FROM payroll_employee_summary pes
                WHERE pes.payroll_process_id = $1
                GROUP BY pes.payroll_process_id
            )
            SELECT
                pp.id AS payroll_process_id,
                pp.process_type,
                pp.state,
                pp.pay_date,
                pp.cutoff_date,

                COALESCE(it.salary_base_amount, 0) AS salary_base_amount,
                COALESCE(it.overtime_amount, 0) AS overtime_amount,
                COALESCE(it.bonus_amount, 0) AS bonus_amount,

                COALESCE(it.employee_ips_amount, 0) AS employee_ips_amount,
                COALESCE(it.damage_deduction_amount, 0) AS damage_deduction_amount,
                COALESCE(it.salary_advance_deduction_amount, 0) AS salary_advance_deduction_amount,

                COALESCE(it.unsupported_earnings_amount, 0) AS unsupported_earnings_amount,
                COALESCE(it.unsupported_deductions_amount, 0) AS unsupported_deductions_amount,

                COALESCE(st.gross_amount, 0) AS gross_amount,
                COALESCE(st.deduction_amount, 0) AS deduction_amount,
                COALESCE(st.net_amount, 0) AS net_amount,
                COALESCE(st.employee_count, 0) AS employee_count

            FROM payroll_processes pp
            LEFT JOIN item_totals it
                ON it.payroll_process_id = pp.id
            LEFT JOIN summary_totals st
                ON st.payroll_process_id = pp.id
            WHERE pp.id = $1
            "#,
            &[&payroll_process_id],
        )
        .await?;

    let row = row.ok_or(db_config::DbError::NotFound)?;

    Ok(PayrollPostingData {
        payroll_process_id: row.get("payroll_process_id"),
        process_type: row.get("process_type"),
        state: row.get("state"),
        pay_date: row.get("pay_date"),
        cutoff_date: row.get("cutoff_date"),

        salary_base_amount: row.get("salary_base_amount"),
        overtime_amount: row.get("overtime_amount"),
        bonus_amount: row.get("bonus_amount"),

        employee_ips_amount: row.get("employee_ips_amount"),
        damage_deduction_amount: row.get("damage_deduction_amount"),
        salary_advance_deduction_amount: row.get("salary_advance_deduction_amount"),

        unsupported_earnings_amount: row.get("unsupported_earnings_amount"),
        unsupported_deductions_amount: row.get("unsupported_deductions_amount"),

        gross_amount: row.get("gross_amount"),
        deduction_amount: row.get("deduction_amount"),
        net_amount: row.get("net_amount"),
        employee_count: row.get("employee_count"),
    })
}