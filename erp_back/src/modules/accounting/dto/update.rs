//! # Accounting Update DTOs
//!
//! Defines request body shapes for accounting update endpoints.
//!
//! ## Included update operations
//! - `PATCH /accounting/journal-entries/{id}`
//! - `PATCH /accounting/closures/{id}`
//!
//! Automatic journal entries should not be editable. This rule should be
//! enforced in the service layer by checking `journal_entries.is_automatic`.

use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Deserialize;

/// Payload received by `PATCH /accounting/journal-entries/{id}`.
///
/// This DTO supports partial header updates and optional full detail replacement.
///
/// If `details` is provided, the service layer can delete the old lines and
/// insert the new lines inside the same transaction.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateJournalEntryDto {
    /// Optional new entry date.
    pub entry_date: Option<NaiveDate>,

    /// Optional new description.
    pub description: Option<String>,

    /// Optional replacement lines.
    ///
    /// If present, the new details must balance:
    /// total debit = total credit.
    pub details: Option<Vec<UpdateJournalEntryDetailDto>>,
}

/// Replacement line used by `UpdateJournalEntryDto`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateJournalEntryDetailDto {
    /// Account to debit or credit.
    pub account_id: i32,

    /// Line amount.
    pub amount: Decimal,

    /// `true` = debit, `false` = credit.
    pub is_debit: bool,

    /// Line number.
    pub line_number: i32,

    /// Optional line description.
    pub line_description: Option<String>,
}

/// Payload received by `PATCH /accounting/closures/{id}`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAccountingClosureDto {
    /// Optional closure type update.
    pub closure_type: Option<String>,

    /// Optional closure date update.
    pub closure_date: Option<NaiveDate>,
}