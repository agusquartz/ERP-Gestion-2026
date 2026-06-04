//! # Accounting Mapper Layer
//!
//! This module transforms accounting domain models into API response DTOs.
//!
//! ## Responsibilities
//! - Convert repository/domain models into response DTOs.
//! - Convert create/update DTOs into internal write models.
//! - Build chart-of-accounts tree responses when needed.
//!
//! ## What this module does NOT do
//! - Execute SQL queries.
//! - Apply business rules.
//! - Handle HTTP types.

use std::collections::BTreeMap;

use crate::modules::accounting::{
    dto::{
        create::{CreateAccountingClosureDto, CreateJournalEntryDto},
        response::*,
        update::{UpdateAccountingClosureDto, UpdateJournalEntryDto},
    },
    model::*,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING PROCESSES
// ─────────────────────────────────────────────────────────────────────────────

pub fn accounting_process_to_response(
    model: AccountingProcess,
) -> AccountingProcessResponseDto {
    AccountingProcessResponseDto {
        id: model.id,
        fiscal_year: model.fiscal_year,
        description: model.description,
        account_levels_count: model.account_levels_count,
        digits_per_level: model.digits_per_level,
        created_at: model.created_at.to_rfc3339(),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

pub fn chart_account_to_response(
    model: ChartOfAccount,
) -> ChartOfAccountResponseDto {
    ChartOfAccountResponseDto {
        id: model.id,
        accounting_process_id: model.accounting_process_id,
        name: model.name,
        is_postable: model.is_postable,
        parent_account_id: model.parent_account_id,
        account_number: model.account_number,
        created_at: model.created_at.to_rfc3339(),
        children: vec![],
    }
}

pub fn chart_accounts_to_tree_response(
    accounts: Vec<ChartOfAccount>,
) -> Vec<ChartOfAccountResponseDto> {
    let mut by_parent: BTreeMap<Option<i32>, Vec<ChartOfAccount>> = BTreeMap::new();

    for account in accounts {
        by_parent
            .entry(account.parent_account_id)
            .or_default()
            .push(account);
    }

    build_chart_tree(None, &mut by_parent)
}

fn build_chart_tree(
    parent_id: Option<i32>,
    by_parent: &mut BTreeMap<Option<i32>, Vec<ChartOfAccount>>,
) -> Vec<ChartOfAccountResponseDto> {
    let mut accounts = by_parent.remove(&parent_id).unwrap_or_default();

    accounts.sort_by(|a, b| a.account_number.cmp(&b.account_number));

    accounts
        .into_iter()
        .map(|account| {
            let children = build_chart_tree(Some(account.id), by_parent);

            ChartOfAccountResponseDto {
                id: account.id,
                accounting_process_id: account.accounting_process_id,
                name: account.name,
                is_postable: account.is_postable,
                parent_account_id: account.parent_account_id,
                account_number: account.account_number,
                created_at: account.created_at.to_rfc3339(),
                children,
            }
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

pub fn create_journal_entry_dto_to_model(
    dto: CreateJournalEntryDto,
) -> NewJournalEntry {
    NewJournalEntry {
        entry_number: dto.entry_number,
        entry_date: dto.entry_date,
        description: dto.description,
        is_automatic: dto.is_automatic.unwrap_or(false),
        details: dto
            .details
            .into_iter()
            .map(|detail| NewJournalEntryDetail {
                account_id: detail.account_id,
                amount: detail.amount,
                is_debit: detail.is_debit,
                line_number: detail.line_number,
                line_description: detail.line_description,
            })
            .collect(),
    }
}

pub fn update_journal_entry_dto_to_model(
    dto: UpdateJournalEntryDto,
) -> UpdateJournalEntry {
    UpdateJournalEntry {
        entry_date: dto.entry_date,
        description: dto.description,
        details: dto.details.map(|details| {
            details
                .into_iter()
                .map(|detail| NewJournalEntryDetail {
                    account_id: detail.account_id,
                    amount: detail.amount,
                    is_debit: detail.is_debit,
                    line_number: detail.line_number,
                    line_description: detail.line_description,
                })
                .collect()
        }),
    }
}

pub fn journal_entry_with_details_to_response(
    model: JournalEntryWithDetails,
) -> JournalEntryResponseDto {
    JournalEntryResponseDto {
        id: model.journal_entry.id,
        entry_number: model.journal_entry.entry_number,
        entry_date: model.journal_entry.entry_date.to_string(),
        description: model.journal_entry.description,
        is_automatic: model.journal_entry.is_automatic,
        created_at: model.journal_entry.created_at.to_rfc3339(),
        total_debit: model.total_debit,
        total_credit: model.total_credit,
        is_balanced: model.is_balanced,
        details: model
            .details
            .into_iter()
            .map(|detail| JournalEntryDetailResponseDto {
                id: detail.id,
                account: JournalEntryAccountResponseDto {
                    id: detail.account.id,
                    account_number: detail.account.account_number,
                    name: detail.account.name,
                    is_postable: detail.account.is_postable,
                },
                amount: detail.amount,
                is_debit: detail.is_debit,
                line_number: detail.line_number,
                line_description: detail.line_description,
                created_at: detail.created_at.to_rfc3339(),
            })
            .collect(),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES
// ─────────────────────────────────────────────────────────────────────────────

pub fn accounting_module_to_response(
    model: AccountingModule,
) -> AccountingModuleResponseDto {
    AccountingModuleResponseDto {
        id: model.id,
        name: model.name,
        created_at: model.created_at.to_rfc3339(),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTING CLOSURES
// ─────────────────────────────────────────────────────────────────────────────

pub fn create_accounting_closure_dto_to_model(
    dto: CreateAccountingClosureDto,
) -> NewAccountingClosure {
    NewAccountingClosure {
        closure_type: dto.closure_type,
        closure_date: dto.closure_date,
    }
}

pub fn update_accounting_closure_dto_to_model(
    dto: UpdateAccountingClosureDto,
) -> UpdateAccountingClosure {
    UpdateAccountingClosure {
        closure_type: dto.closure_type,
        closure_date: dto.closure_date,
    }
}

pub fn accounting_closure_to_response(
    model: AccountingClosure,
) -> AccountingClosureResponseDto {
    AccountingClosureResponseDto {
        id: model.id,
        closure_type: model.closure_type,
        closure_date: model.closure_date.to_string(),
        created_at: model.created_at.to_rfc3339(),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MODELS
// ─────────────────────────────────────────────────────────────────────────────

pub fn entry_model_with_details_to_response(
    model: EntryModelWithDetails,
) -> EntryModelResponseDto {
    EntryModelResponseDto {
        id: model.entry_model.id,

        module: model.module.map(|module| EntryModelModuleResponseDto {
            id: module.id,
            name: module.name,
        }),

        auto_generate: model.entry_model.auto_generate,
        entry_type: model.entry_model.entry_type,
        operation_type: model.entry_model.operation_type,
        description: model.entry_model.description,
        created_at: model.entry_model.created_at.to_rfc3339(),

        details: model
            .details
            .into_iter()
            .map(|detail| EntryModelDetailResponseDto {
                id: detail.id,
                account: EntryModelAccountResponseDto {
                    id: detail.account.id,
                    account_number: detail.account.account_number,
                    name: detail.account.name,
                    is_postable: detail.account.is_postable,
                },
                is_debit: detail.is_debit,
                line_number: detail.line_number,
                line_description: detail.line_description,
                created_at: detail.created_at.to_rfc3339(),
            })
            .collect(),
    }
}