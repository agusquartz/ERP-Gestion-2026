//! # Accounting Create DTOs
//!
//! Defines request body shapes for accounting creation endpoints.
//!
//! ## Included create operations
//! - `POST /accounting/journal-entries`
//! - `POST /accounting/closures`
//!
//! Other accounting resources such as accounting processes, chart of accounts,
//! modules, and entry models are currently read-only for this module.

use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Deserialize;

/// Payload received by `POST /accounting/journal-entries`.
///
/// Manual entries should be created with `isAutomatic = false`.
/// Automatic entries should normally be created internally by backend modules,
/// not directly by API consumers.
///
/// # Example JSON
/// ```json
/// {
///   "entryDate": "2026-06-02",
///   "description": "Manual adjustment entry",
///   "isAutomatic": false,
///   "details": [
///     {
///       "accountId": 10,
///       "amount": "100000.00",
///       "isDebit": true,
///       "lineNumber": 1,
///       "lineDescription": "Debit adjustment"
///     },
///     {
///       "accountId": 20,
///       "amount": "100000.00",
///       "isDebit": false,
///       "lineNumber": 2,
///       "lineDescription": "Credit adjustment"
///     }
///   ]
/// }
/// ```
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJournalEntryDto {
    /// Optional entry number.
    ///
    /// If omitted, the service/repository should generate the next available
    /// entry number.
    pub entry_number: Option<i32>,

    /// Accounting date.
    pub entry_date: NaiveDate,

    /// Optional entry description.
    pub description: Option<String>,

    /// Whether this entry is automatic.
    ///
    /// For normal manual CRUD, this should usually be `false`.
    pub is_automatic: Option<bool>,

    /// Journal entry lines.
    ///
    /// Must contain at least two lines and must balance:
    /// total debit = total credit.
    pub details: Vec<CreateJournalEntryDetailDto>,
}

/// A single line inside `CreateJournalEntryDto`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJournalEntryDetailDto {
    /// Account to debit or credit.
    ///
    /// The selected account should be postable.
    pub account_id: i32,

    /// Line amount.
    ///
    /// Must be greater than zero.
    pub amount: Decimal,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number inside the entry.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,
}

/// Payload received by `POST /accounting/closures`.
///
/// # Example JSON
/// ```json
/// {
///   "closureType": "monthly",
///   "closureDate": "2026-06-30"
/// }
/// ```
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAccountingClosureDto {
    /// Closure type.
    ///
    /// Suggested values: `monthly`, `yearly`.
    pub closure_type: String,

    /// Entries up to this date should be locked.
    pub closure_date: NaiveDate,
}