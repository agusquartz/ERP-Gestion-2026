//! # Accounting HTTP Handlers
//!
//! This module contains the Axum handler functions bound to HTTP routes in
//! [`crate::modules::accounting::router`].
//!
//! ## Responsibilities
//! - Extract data from HTTP requests.
//! - Call the accounting service layer.
//! - Translate service results into HTTP responses.
//!
//! ## What handlers do NOT do
//! - Execute SQL — repository's job.
//! - Apply business rules — service's job.
//! - Transform domain models — mapper's job.

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Json,
};

use std::collections::HashMap;

use crate::db_config::DbError;

use crate::modules::accounting::service;

use crate::modules::accounting::dto::{
    create::{
        CreateAccountingClosureDto,
        CreateJournalEntryDto,
    },
    response::{
        AccountingClosureResponseDto,
        AccountingModuleResponseDto,
        AccountingProcessResponseDto,
        ChartOfAccountResponseDto,
        EntryModelResponseDto,
        JournalEntryResponseDto,
    },
    update::{
        UpdateAccountingClosureDto,
        UpdateJournalEntryDto,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING PROCESSES
// ─────────────────────────────────────────────────────────────────────────────

/// `GET /accounting/processes`
///
/// Returns all accounting processes.
pub async fn list_accounting_processes_handler(
) -> Result<Json<Vec<AccountingProcessResponseDto>>, (StatusCode, String)> {
    match service::get_accounting_processes().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /accounting/processes/{id}`
///
/// Returns one accounting process by ID.
pub async fn get_accounting_process_handler(
    Path(id): Path<i32>,
) -> Result<Json<AccountingProcessResponseDto>, (StatusCode, String)> {
    match service::get_accounting_process_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

/// `GET /accounting/chart-of-accounts`
///
/// Optional query params:
/// - `accountingProcessId=1`
/// - `tree=true`
///
/// Examples:
/// - `/accounting/chart-of-accounts`
/// - `/accounting/chart-of-accounts?accountingProcessId=1`
/// - `/accounting/chart-of-accounts?accountingProcessId=1&tree=true`
pub async fn list_chart_of_accounts_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<ChartOfAccountResponseDto>>, (StatusCode, String)> {
    let accounting_process_id = parse_optional_i32_param(&params, "accountingProcessId")?;
    let tree = parse_optional_bool_param(&params, "tree").unwrap_or(false);

    let result = if tree {
        service::get_chart_of_accounts_tree(accounting_process_id).await
    } else {
        service::get_chart_of_accounts(accounting_process_id).await
    };

    match result {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /accounting/chart-of-accounts/{id}`
///
/// Returns one chart account by ID.
pub async fn get_chart_account_handler(
    Path(id): Path<i32>,
) -> Result<Json<ChartOfAccountResponseDto>, (StatusCode, String)> {
    match service::get_chart_account_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

/// `POST /accounting/journal-entries`
///
/// Creates a new journal entry.
pub async fn create_journal_entry_handler(
    Json(payload): Json<CreateJournalEntryDto>,
) -> Result<Json<JournalEntryResponseDto>, (StatusCode, String)> {
    match service::create_journal_entry(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_create_error(e)),
    }
}

/// `GET /accounting/journal-entries`
///
/// Optional query param:
/// - `contains=xxx`
pub async fn list_journal_entries_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<JournalEntryResponseDto>>, (StatusCode, String)> {
    let contains = params.get("contains").cloned();

    match service::get_journal_entries(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /accounting/journal-entries/{id}`
///
/// Returns one journal entry by ID.
pub async fn get_journal_entry_handler(
    Path(id): Path<i32>,
) -> Result<Json<JournalEntryResponseDto>, (StatusCode, String)> {
    match service::get_journal_entry_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `PATCH /accounting/journal-entries/{id}`
///
/// Updates a manual journal entry.
pub async fn update_journal_entry_handler(
    Path(id): Path<i32>,
    Json(payload): Json<UpdateJournalEntryDto>,
) -> Result<Json<JournalEntryResponseDto>, (StatusCode, String)> {
    match service::update_journal_entry(id, payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_update_error(e)),
    }
}

/// `DELETE /accounting/journal-entries/{id}`
///
/// Deletes a manual journal entry.
pub async fn delete_journal_entry_handler(
    Path(id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    match service::delete_journal_entry(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err(map_delete_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────────────────

/// `GET /accounting/modules`
///
/// Returns all system modules used by accounting entry models.
pub async fn list_accounting_modules_handler(
) -> Result<Json<Vec<AccountingModuleResponseDto>>, (StatusCode, String)> {
    match service::get_modules().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING CLOSURES
// ─────────────────────────────────────────────────────────────────────────────

/// `POST /accounting/closures`
///
/// Creates a new accounting closure.
pub async fn create_accounting_closure_handler(
    Json(payload): Json<CreateAccountingClosureDto>,
) -> Result<Json<AccountingClosureResponseDto>, (StatusCode, String)> {
    match service::create_accounting_closure(payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_create_error(e)),
    }
}

/// `GET /accounting/closures`
///
/// Returns all accounting closures.
pub async fn list_accounting_closures_handler(
) -> Result<Json<Vec<AccountingClosureResponseDto>>, (StatusCode, String)> {
    match service::get_accounting_closures().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /accounting/closures/{id}`
///
/// Returns one accounting closure by ID.
pub async fn get_accounting_closure_handler(
    Path(id): Path<i32>,
) -> Result<Json<AccountingClosureResponseDto>, (StatusCode, String)> {
    match service::get_accounting_closure_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `PATCH /accounting/closures/{id}`
///
/// Updates an accounting closure.
pub async fn update_accounting_closure_handler(
    Path(id): Path<i32>,
    Json(payload): Json<UpdateAccountingClosureDto>,
) -> Result<Json<AccountingClosureResponseDto>, (StatusCode, String)> {
    match service::update_accounting_closure(id, payload).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_update_error(e)),
    }
}

/// `DELETE /accounting/closures/{id}`
///
/// Deletes an accounting closure.
pub async fn delete_accounting_closure_handler(
    Path(id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    match service::delete_accounting_closure(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err(map_delete_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODELS
// ─────────────────────────────────────────────────────────────────────────────

/// `GET /accounting/entry-models`
///
/// Optional query param:
/// - `contains=xxx`
pub async fn list_entry_models_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<EntryModelResponseDto>>, (StatusCode, String)> {
    let contains = params.get("contains").cloned();

    match service::get_entry_models(contains).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

/// `GET /accounting/entry-models/{id}`
///
/// Returns one entry model by ID.
pub async fn get_entry_model_handler(
    Path(id): Path<i32>,
) -> Result<Json<EntryModelResponseDto>, (StatusCode, String)> {
    match service::get_entry_model_by_id(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err(map_read_error(e)),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY PARAM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

fn parse_optional_i32_param(
    params: &HashMap<String, String>,
    key: &str,
) -> Result<Option<i32>, (StatusCode, String)> {
    match params.get(key) {
        Some(value) if !value.trim().is_empty() => {
            value
                .parse::<i32>()
                .map(Some)
                .map_err(|_| {
                    (
                        StatusCode::BAD_REQUEST,
                        format!("{key} must be a valid integer"),
                    )
                })
        }
        _ => Ok(None),
    }
}

fn parse_optional_bool_param(
    params: &HashMap<String, String>,
    key: &str,
) -> Option<bool> {
    params
        .get(key)
        .map(|value| matches!(value.as_str(), "true" | "1" | "yes"))
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MAPPING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

fn map_create_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
    }
}

fn map_read_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        ),
    }
}

fn map_update_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        ),
    }
}

fn map_delete_error(error: DbError) -> (StatusCode, String) {
    match error {
        DbError::NotFound => (
            StatusCode::NOT_FOUND,
            error.to_string(),
        ),
        DbError::Other(_) => (
            StatusCode::BAD_REQUEST,
            error.to_string(),
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            error.to_string(),
        ),
    }
}