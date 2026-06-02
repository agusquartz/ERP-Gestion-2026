//! # Accounting Response DTOs
//!
//! Defines the JSON shapes returned by accounting endpoints.
//!
//! ## Covered responses
//! - Accounting processes
//! - Chart of accounts
//! - Journal entries
//! - Modules
//! - Accounting closures
//! - Entry models
//!
//! `#[serde(rename_all = "camelCase")]` is used so JSON follows frontend
//! conventions while Rust keeps `snake_case`.

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Accounting process response.
///
/// Returned by endpoints such as:
/// - `GET /accounting/processes`
/// - `GET /accounting/processes/{id}`
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingProcessResponseDto {
    /// Primary key.
    pub id: i32,

    /// Fiscal year.
    pub fiscal_year: i32,

    /// Optional description.
    pub description: Option<String>,

    /// Number of hierarchy levels.
    pub account_levels_count: i32,

    /// Digits per account level.
    pub digits_per_level: i32,

    /// Creation timestamp serialized as string.
    pub created_at: String,
}

/// Chart of accounts response.
///
/// Can be used as a flat response or as a tree response if `children` is filled.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartOfAccountResponseDto {
    /// Primary key.
    pub id: i32,

    /// Accounting process ID.
    pub accounting_process_id: i32,

    /// Account name.
    pub name: String,

    /// Whether this account accepts journal entry postings.
    pub is_postable: bool,

    /// Parent account ID.
    pub parent_account_id: Option<i32>,

    /// Structured account number.
    pub account_number: String,

    /// Creation timestamp serialized as string.
    pub created_at: String,

    /// Child accounts.
    ///
    /// If your endpoint returns a flat list, keep this as an empty array.
    pub children: Vec<ChartOfAccountResponseDto>,
}

/// Journal entry response.
///
/// Returned by:
/// - `GET /accounting/journal-entries`
/// - `GET /accounting/journal-entries/{id}`
/// - `POST /accounting/journal-entries`
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryResponseDto {
    /// Primary key.
    pub id: i32,

    /// Sequential entry number.
    pub entry_number: i32,

    /// Accounting date serialized as `"YYYY-MM-DD"`.
    pub entry_date: String,

    /// Optional description.
    pub description: Option<String>,

    /// Whether this entry was automatically generated.
    pub is_automatic: bool,

    /// Creation timestamp serialized as string.
    pub created_at: String,

    /// Sum of all debit lines.
    pub total_debit: Decimal,

    /// Sum of all credit lines.
    pub total_credit: Decimal,

    /// Whether total debit equals total credit.
    pub is_balanced: bool,

    /// Journal entry lines.
    pub details: Vec<JournalEntryDetailResponseDto>,
}

/// One journal entry line response.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryDetailResponseDto {
    /// Detail primary key.
    pub id: i32,

    /// Account used in this line.
    pub account: JournalEntryAccountResponseDto,

    /// Line amount.
    pub amount: Decimal,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,

    /// Creation timestamp serialized as string.
    pub created_at: String,
}

/// Account object nested inside a journal entry line.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryAccountResponseDto {
    /// Account primary key.
    pub id: i32,

    /// Structured account number.
    pub account_number: String,

    /// Account name.
    pub name: String,

    /// Whether the account is postable.
    pub is_postable: bool,
}

/// System module response.
///
/// Returned by `GET /accounting/modules`.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingModuleResponseDto {
    /// Primary key.
    pub id: i32,

    /// Module name.
    pub name: String,

    /// Creation timestamp serialized as string.
    pub created_at: String,
}

/// Accounting closure response.
///
/// Returned by:
/// - `GET /accounting/closures`
/// - `GET /accounting/closures/{id}`
/// - `POST /accounting/closures`
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingClosureResponseDto {
    /// Primary key.
    pub id: i32,

    /// Closure type.
    pub closure_type: String,

    /// Closure date serialized as `"YYYY-MM-DD"`.
    pub closure_date: String,

    /// Creation timestamp serialized as string.
    pub created_at: String,
}

/// Entry model response.
///
/// Returned by:
/// - `GET /accounting/entry-models`
/// - `GET /accounting/entry-models/{id}`
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryModelResponseDto {
    /// Primary key.
    pub id: i32,

    /// Optional module.
    pub module: Option<EntryModelModuleResponseDto>,

    /// Whether the model is automatically generated.
    pub auto_generate: bool,

    /// Entry type.
    ///
    /// Expected values: `summary`, `detail`.
    pub entry_type: String,

    /// Operation type.
    ///
    /// Examples: `purchase_invoice`, `sales_invoice`, `payroll_salary`.
    pub operation_type: String,

    /// Optional model description.
    pub description: Option<String>,

    /// Creation timestamp serialized as string.
    pub created_at: String,

    /// Entry model detail lines.
    pub details: Vec<EntryModelDetailResponseDto>,
}

/// Module object nested inside an entry model.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryModelModuleResponseDto {
    /// Module primary key.
    pub id: i32,

    /// Module name.
    pub name: String,
}

/// One entry model detail line.
///
/// Defines which account should be debited or credited when the model is used.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryModelDetailResponseDto {
    /// Detail primary key.
    pub id: i32,

    /// Account used by this model line.
    pub account: EntryModelAccountResponseDto,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,

    /// Creation timestamp serialized as string.
    pub created_at: String,
}

/// Account object nested inside an entry model detail.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryModelAccountResponseDto {
    /// Account primary key.
    pub id: i32,

    /// Structured account number.
    pub account_number: String,

    /// Account name.
    pub name: String,

    /// Whether the account is postable.
    pub is_postable: bool,
}