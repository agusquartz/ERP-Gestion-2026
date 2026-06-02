//! # Accounting Service Layer
//!
//! This module contains accounting business logic.
//!
//! ## Responsibilities
//! - Validate journal entries before writing.
//! - Prevent updates/deletes of automatic entries.
//! - Prevent writes into closed accounting periods.
//! - Map repository models into response DTOs.
//!
//! ## What this module does NOT do
//! - Execute SQL directly.
//! - Handle HTTP-specific types.
//! - Serialize JSON manually.

use std::collections::HashSet;

use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::db_config::DbError;
use crate::modules::accounting::{
    dto::{
        create::{CreateAccountingClosureDto, CreateJournalEntryDto},
        response::*,
        update::{UpdateAccountingClosureDto, UpdateJournalEntryDto},
    },
    mapper,
    repository,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING PROCESSES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_accounting_processes(
) -> Result<Vec<AccountingProcessResponseDto>, DbError> {
    let processes = repository::get_accounting_processes().await?;

    Ok(processes
        .into_iter()
        .map(mapper::accounting_process_to_response)
        .collect())
}

pub async fn get_accounting_process_by_id(
    id: i32,
) -> Result<AccountingProcessResponseDto, DbError> {
    validate_positive_id(id, "Accounting process ID")?;

    let process = repository::get_accounting_process_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::accounting_process_to_response(process))
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_chart_of_accounts(
    accounting_process_id: Option<i32>,
) -> Result<Vec<ChartOfAccountResponseDto>, DbError> {
    if let Some(id) = accounting_process_id {
        validate_positive_id(id, "Accounting process ID")?;
    }

    let accounts = repository::get_chart_of_accounts(accounting_process_id).await?;

    Ok(accounts
        .into_iter()
        .map(mapper::chart_account_to_response)
        .collect())
}

pub async fn get_chart_of_accounts_tree(
    accounting_process_id: Option<i32>,
) -> Result<Vec<ChartOfAccountResponseDto>, DbError> {
    if let Some(id) = accounting_process_id {
        validate_positive_id(id, "Accounting process ID")?;
    }

    let accounts = repository::get_chart_of_accounts(accounting_process_id).await?;

    Ok(mapper::chart_accounts_to_tree_response(accounts))
}

pub async fn get_chart_account_by_id(
    id: i32,
) -> Result<ChartOfAccountResponseDto, DbError> {
    validate_positive_id(id, "Chart account ID")?;

    let account = repository::get_chart_account_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::chart_account_to_response(account))
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn create_journal_entry(
    dto: CreateJournalEntryDto,
) -> Result<JournalEntryResponseDto, DbError> {
    validate_create_journal_entry(&dto).await?;
    validate_date_is_not_closed(dto.entry_date).await?;

    let model = mapper::create_journal_entry_dto_to_model(dto);
    let created = repository::create_journal_entry(model).await?;

    Ok(mapper::journal_entry_with_details_to_response(created))
}

pub async fn get_journal_entries(
    contains: Option<String>,
) -> Result<Vec<JournalEntryResponseDto>, DbError> {
    let entries = repository::get_journal_entries(contains).await?;

    Ok(entries
        .into_iter()
        .map(mapper::journal_entry_with_details_to_response)
        .collect())
}

pub async fn get_journal_entry_by_id(
    id: i32,
) -> Result<JournalEntryResponseDto, DbError> {
    validate_positive_id(id, "Journal entry ID")?;

    let entry = repository::get_journal_entry_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::journal_entry_with_details_to_response(entry))
}

pub async fn update_journal_entry(
    id: i32,
    dto: UpdateJournalEntryDto,
) -> Result<JournalEntryResponseDto, DbError> {
    validate_positive_id(id, "Journal entry ID")?;

    let existing = repository::get_journal_entry_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    if existing.journal_entry.is_automatic {
        return Err(DbError::Other(
            "Automatic journal entries cannot be updated".to_string(),
        ));
    }

    let target_date = dto.entry_date.unwrap_or(existing.journal_entry.entry_date);
    validate_date_is_not_closed(target_date).await?;

    if let Some(details) = &dto.details {
        validate_update_journal_entry_details(details).await?;
    }

    let model = mapper::update_journal_entry_dto_to_model(dto);
    let updated = repository::update_journal_entry(id, model).await?;

    Ok(mapper::journal_entry_with_details_to_response(updated))
}

pub async fn delete_journal_entry(
    id: i32,
) -> Result<(), DbError> {
    validate_positive_id(id, "Journal entry ID")?;

    let existing = repository::get_journal_entry_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    if existing.journal_entry.is_automatic {
        return Err(DbError::Other(
            "Automatic journal entries cannot be deleted".to_string(),
        ));
    }

    validate_date_is_not_closed(existing.journal_entry.entry_date).await?;

    repository::delete_journal_entry(id).await
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_modules(
) -> Result<Vec<AccountingModuleResponseDto>, DbError> {
    let modules = repository::get_modules().await?;

    Ok(modules
        .into_iter()
        .map(mapper::accounting_module_to_response)
        .collect())
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING CLOSURES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn create_accounting_closure(
    dto: CreateAccountingClosureDto,
) -> Result<AccountingClosureResponseDto, DbError> {
    validate_create_accounting_closure(&dto).await?;

    let model = mapper::create_accounting_closure_dto_to_model(dto);
    let created = repository::create_accounting_closure(model).await?;

    Ok(mapper::accounting_closure_to_response(created))
}

pub async fn get_accounting_closures(
) -> Result<Vec<AccountingClosureResponseDto>, DbError> {
    let closures = repository::get_accounting_closures().await?;

    Ok(closures
        .into_iter()
        .map(mapper::accounting_closure_to_response)
        .collect())
}

pub async fn get_accounting_closure_by_id(
    id: i32,
) -> Result<AccountingClosureResponseDto, DbError> {
    validate_positive_id(id, "Accounting closure ID")?;

    let closure = repository::get_accounting_closure_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::accounting_closure_to_response(closure))
}

pub async fn update_accounting_closure(
    id: i32,
    dto: UpdateAccountingClosureDto,
) -> Result<AccountingClosureResponseDto, DbError> {
    validate_positive_id(id, "Accounting closure ID")?;
    validate_update_accounting_closure(&dto)?;

    let model = mapper::update_accounting_closure_dto_to_model(dto);
    let updated = repository::update_accounting_closure(id, model).await?;

    Ok(mapper::accounting_closure_to_response(updated))
}

pub async fn delete_accounting_closure(
    id: i32,
) -> Result<(), DbError> {
    validate_positive_id(id, "Accounting closure ID")?;

    repository::delete_accounting_closure(id).await
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODELS
// ─────────────────────────────────────────────────────────────────────────────

pub async fn get_entry_models(
    contains: Option<String>,
) -> Result<Vec<EntryModelResponseDto>, DbError> {
    let models = repository::get_entry_models(contains).await?;

    Ok(models
        .into_iter()
        .map(mapper::entry_model_with_details_to_response)
        .collect())
}

pub async fn get_entry_model_by_id(
    id: i32,
) -> Result<EntryModelResponseDto, DbError> {
    validate_positive_id(id, "Entry model ID")?;

    let model = repository::get_entry_model_by_id(id)
        .await?
        .ok_or(DbError::NotFound)?;

    Ok(mapper::entry_model_with_details_to_response(model))
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

fn validate_positive_id(
    id: i32,
    field_name: &str,
) -> Result<(), DbError> {
    if id <= 0 {
        return Err(DbError::Other(format!(
            "{field_name} must be a positive integer"
        )));
    }

    Ok(())
}

async fn validate_date_is_not_closed(
    entry_date: NaiveDate,
) -> Result<(), DbError> {
    let latest_closure_date = repository::get_latest_closure_date().await?;

    if let Some(closure_date) = latest_closure_date {
        if entry_date <= closure_date {
            return Err(DbError::Other(format!(
                "Cannot write journal entries on or before closed date {closure_date}"
            )));
        }
    }

    Ok(())
}

async fn validate_create_journal_entry(
    dto: &CreateJournalEntryDto,
) -> Result<(), DbError> {
    if let Some(entry_number) = dto.entry_number {
        if entry_number <= 0 {
            return Err(DbError::Other(
                "Entry number must be a positive integer".to_string(),
            ));
        }
    }

    validate_create_journal_entry_details(&dto.details).await
}

async fn validate_create_journal_entry_details(
    details: &[crate::modules::accounting::dto::create::CreateJournalEntryDetailDto],
) -> Result<(), DbError> {
    if details.len() < 2 {
        return Err(DbError::Other(
            "Journal entry must contain at least two detail lines".to_string(),
        ));
    }

    let mut line_numbers = HashSet::new();
    let mut total_debit = Decimal::ZERO;
    let mut total_credit = Decimal::ZERO;

    for detail in details {
        validate_positive_id(detail.account_id, "Account ID")?;

        if detail.amount <= Decimal::ZERO {
            return Err(DbError::Other(
                "Journal entry detail amount must be greater than zero".to_string(),
            ));
        }

        if detail.line_number <= 0 {
            return Err(DbError::Other(
                "Line number must be a positive integer".to_string(),
            ));
        }

        if !line_numbers.insert(detail.line_number) {
            return Err(DbError::Other(format!(
                "Line number {} is duplicated",
                detail.line_number
            )));
        }

        if !repository::account_is_postable(detail.account_id).await? {
            return Err(DbError::Other(format!(
                "Account {} does not exist or is not postable",
                detail.account_id
            )));
        }

        if detail.is_debit {
            total_debit += detail.amount;
        } else {
            total_credit += detail.amount;
        }
    }

    if total_debit != total_credit {
        return Err(DbError::Other(format!(
            "Journal entry is not balanced. Debit: {total_debit}, Credit: {total_credit}"
        )));
    }

    Ok(())
}

async fn validate_update_journal_entry_details(
    details: &[crate::modules::accounting::dto::update::UpdateJournalEntryDetailDto],
) -> Result<(), DbError> {
    if details.len() < 2 {
        return Err(DbError::Other(
            "Journal entry must contain at least two detail lines".to_string(),
        ));
    }

    let mut line_numbers = HashSet::new();
    let mut total_debit = Decimal::ZERO;
    let mut total_credit = Decimal::ZERO;

    for detail in details {
        validate_positive_id(detail.account_id, "Account ID")?;

        if detail.amount <= Decimal::ZERO {
            return Err(DbError::Other(
                "Journal entry detail amount must be greater than zero".to_string(),
            ));
        }

        if detail.line_number <= 0 {
            return Err(DbError::Other(
                "Line number must be a positive integer".to_string(),
            ));
        }

        if !line_numbers.insert(detail.line_number) {
            return Err(DbError::Other(format!(
                "Line number {} is duplicated",
                detail.line_number
            )));
        }

        if !repository::account_is_postable(detail.account_id).await? {
            return Err(DbError::Other(format!(
                "Account {} does not exist or is not postable",
                detail.account_id
            )));
        }

        if detail.is_debit {
            total_debit += detail.amount;
        } else {
            total_credit += detail.amount;
        }
    }

    if total_debit != total_credit {
        return Err(DbError::Other(format!(
            "Journal entry is not balanced. Debit: {total_debit}, Credit: {total_credit}"
        )));
    }

    Ok(())
}

async fn validate_create_accounting_closure(
    dto: &CreateAccountingClosureDto,
) -> Result<(), DbError> {
    if dto.closure_type.trim().is_empty() {
        return Err(DbError::Other(
            "Closure type cannot be empty".to_string(),
        ));
    }

    let latest_closure_date = repository::get_latest_closure_date().await?;

    if let Some(latest) = latest_closure_date {
        if dto.closure_date <= latest {
            return Err(DbError::Other(format!(
                "New closure date must be after the latest closure date {latest}"
            )));
        }
    }

    Ok(())
}

fn validate_update_accounting_closure(
    dto: &UpdateAccountingClosureDto,
) -> Result<(), DbError> {
    if let Some(closure_type) = &dto.closure_type {
        if closure_type.trim().is_empty() {
            return Err(DbError::Other(
                "Closure type cannot be empty".to_string(),
            ));
        }
    }

    Ok(())
}