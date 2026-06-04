//! # Accounting Domain Models
//!
//! This module defines the **internal data structures** used by the accounting
//! module.
//!
//! These models represent the database tables and JOIN projections used by the
//! repository layer. They should not be exposed directly as API responses.
//! Instead, they should be converted into DTOs through the mapper layer.
//!
//! ## Database tables involved
//! - `accounting_processes`      → [`AccountingProcess`]
//! - `chart_of_accounts`        → [`ChartOfAccount`]
//! - `journal_entries`          → [`JournalEntry`]
//! - `journal_entry_details`    → [`JournalEntryDetail`]
//! - `modules`                  → [`AccountingModule`]
//! - `accounting_closures`      → [`AccountingClosure`]
//! - `entry_models`             → [`EntryModel`]
//! - `entry_model_details`      → [`EntryModelDetail`]
//!
//! ## Main use cases
//! - Read accounting processes.
//! - Read chart of accounts.
//! - CRUD journal entries.
//! - Read modules.
//! - CRUD accounting closures.
//! - Read entry models and their details.

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;

/// Accounting process configuration.
///
/// Defines how the chart of accounts is structured for a fiscal year.
#[derive(Debug, Clone)]
pub struct AccountingProcess {
    /// Primary key.
    pub id: i32,

    /// Fiscal year, for example `2026`.
    pub fiscal_year: i32,

    /// Optional process description.
    pub description: Option<String>,

    /// Number of account hierarchy levels.
    ///
    /// Example: `4` for `01.01.01.01`.
    pub account_levels_count: i32,

    /// Digits used per level.
    ///
    /// Example: `2` means each level has two digits.
    pub digits_per_level: i32,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Chart of accounts entity.
///
/// Represents one account inside the account tree.
#[derive(Debug, Clone)]
pub struct ChartOfAccount {
    /// Primary key.
    pub id: i32,

    /// Accounting process this account belongs to.
    pub accounting_process_id: i32,

    /// Account name.
    pub name: String,

    /// Whether journal entries can be posted directly to this account.
    ///
    /// Usually parent accounts are not postable, while leaf accounts are.
    pub is_postable: bool,

    /// Optional parent account ID.
    pub parent_account_id: Option<i32>,

    /// Structured account number.
    ///
    /// Example: `01.01.03.01`.
    pub account_number: String,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Tree representation of a chart account.
///
/// Useful when the API needs to return the chart of accounts as a hierarchy
/// instead of a flat list.
#[derive(Debug, Clone)]
pub struct ChartOfAccountNode {
    /// Current account.
    pub account: ChartOfAccount,

    /// Child accounts.
    pub children: Vec<ChartOfAccountNode>,
}

/// Accounting journal entry header.
///
/// Represents one accounting movement, either manual or automatic.
#[derive(Debug, Clone)]
pub struct JournalEntry {
    /// Primary key.
    pub id: i32,

    /// Sequential accounting entry number.
    pub entry_number: i32,

    /// Accounting date of the entry.
    pub entry_date: NaiveDate,

    /// Optional description.
    pub description: Option<String>,

    /// Whether the entry was generated automatically by the system.
    ///
    /// Automatic entries should be immutable at service layer.
    pub is_automatic: bool,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Lightweight account projection used inside journal entry lines.
#[derive(Debug, Clone)]
pub struct JournalEntryAccount {
    /// Account primary key.
    pub id: i32,

    /// Account number.
    pub account_number: String,

    /// Account name.
    pub name: String,

    /// Whether this account is postable.
    pub is_postable: bool,
}

/// One debit or credit line inside a journal entry.
#[derive(Debug, Clone)]
pub struct JournalEntryDetail {
    /// Primary key.
    pub id: i32,

    /// Parent journal entry ID.
    pub journal_entry_id: i32,

    /// Account snapshot.
    pub account: JournalEntryAccount,

    /// Movement amount.
    pub amount: Decimal,

    /// `true` means debit, `false` means credit.
    pub is_debit: bool,

    /// Line number inside the journal entry.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Fully hydrated journal entry aggregate.
///
/// Returned by repository read operations and mapped into response DTOs.
#[derive(Debug, Clone)]
pub struct JournalEntryWithDetails {
    /// Journal entry header.
    pub journal_entry: JournalEntry,

    /// Total debit amount.
    ///
    /// Usually computed by the repository while assembling the aggregate.
    pub total_debit: Decimal,

    /// Total credit amount.
    ///
    /// Usually computed by the repository while assembling the aggregate.
    pub total_credit: Decimal,

    /// Whether total debit equals total credit.
    pub is_balanced: bool,

    /// Entry lines.
    pub details: Vec<JournalEntryDetail>,
}

/// Internal model used when creating a journal entry.
#[derive(Debug, Clone)]
pub struct NewJournalEntry {
    /// Optional entry number.
    ///
    /// If `None`, the service/repository can generate the next number.
    pub entry_number: Option<i32>,

    /// Entry date.
    pub entry_date: NaiveDate,

    /// Optional description.
    pub description: Option<String>,

    /// Whether the entry is automatic.
    pub is_automatic: bool,

    /// Entry lines.
    pub details: Vec<NewJournalEntryDetail>,
}

/// Internal model used when creating a journal entry line.
#[derive(Debug, Clone)]
pub struct NewJournalEntryDetail {
    /// Account ID.
    pub account_id: i32,

    /// Amount.
    pub amount: Decimal,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,
}

/// Internal model used when updating a journal entry.
///
/// Details are optional because some PATCH endpoints may update only header
/// fields. If `details` is `Some`, the service can replace the current lines.
#[derive(Debug, Clone)]
pub struct UpdateJournalEntry {
    /// Optional entry date update.
    pub entry_date: Option<NaiveDate>,

    /// Optional description update.
    pub description: Option<String>,

    /// Optional replacement details.
    pub details: Option<Vec<NewJournalEntryDetail>>,
}

/// System module projection.
///
/// These modules group entry models by functional area.
#[derive(Debug, Clone)]
pub struct AccountingModule {
    /// Primary key.
    pub id: i32,

    /// Module name.
    ///
    /// Examples: `Purchases`, `Sales`, `Payroll`.
    pub name: String,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Accounting period closure.
///
/// A closure locks entries up to a specific date.
#[derive(Debug, Clone)]
pub struct AccountingClosure {
    /// Primary key.
    pub id: i32,

    /// Closure type.
    ///
    /// Examples: `monthly`, `yearly`.
    pub closure_type: String,

    /// Closure date.
    pub closure_date: NaiveDate,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Internal model used when creating an accounting closure.
#[derive(Debug, Clone)]
pub struct NewAccountingClosure {
    /// Closure type.
    pub closure_type: String,

    /// Closure date.
    pub closure_date: NaiveDate,
}

/// Internal model used when updating an accounting closure.
#[derive(Debug, Clone)]
pub struct UpdateAccountingClosure {
    /// Optional closure type update.
    pub closure_type: Option<String>,

    /// Optional closure date update.
    pub closure_date: Option<NaiveDate>,
}

/// Entry model header.
///
/// Defines how automatic or manual journal entries are generated for a
/// specific operation.
#[derive(Debug, Clone)]
pub struct EntryModel {
    /// Primary key.
    pub id: i32,

    /// Optional module ID.
    pub module_id: Option<i32>,

    /// Whether this model is auto-generated by the backend.
    pub auto_generate: bool,

    /// Entry type.
    ///
    /// Expected values: `summary` or `detail`.
    pub entry_type: String,

    /// Business operation type.
    ///
    /// Examples: `purchase_invoice`, `sales_invoice`, `payroll_salary`.
    pub operation_type: String,

    /// Optional explanation or formula.
    pub description: Option<String>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Lightweight module projection used inside entry model responses.
#[derive(Debug, Clone)]
pub struct EntryModelModule {
    /// Module primary key.
    pub id: i32,

    /// Module name.
    pub name: String,
}

/// Lightweight account projection used inside entry model details.
#[derive(Debug, Clone)]
pub struct EntryModelAccount {
    /// Account primary key.
    pub id: i32,

    /// Account number.
    pub account_number: String,

    /// Account name.
    pub name: String,

    /// Whether this account is postable.
    pub is_postable: bool,
}

/// One line definition inside an entry model.
#[derive(Debug, Clone)]
pub struct EntryModelDetail {
    /// Primary key.
    pub id: i32,

    /// Parent entry model ID.
    pub entry_model_id: i32,

    /// Account used by this model line.
    pub account: EntryModelAccount,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,

    /// Creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// Fully hydrated entry model aggregate.
#[derive(Debug, Clone)]
pub struct EntryModelWithDetails {
    /// Entry model header.
    pub entry_model: EntryModel,

    /// Optional module snapshot.
    pub module: Option<EntryModelModule>,

    /// Model lines.
    pub details: Vec<EntryModelDetail>,
}