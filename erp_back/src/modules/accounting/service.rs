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
use tokio_postgres::Transaction;

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
    model::{EntryModelDetail, EntryModelWithDetails},
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
// AUTOMATIC POSTING — PURCHASES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn post_purchase_invoice_tx(
    tx: &Transaction<'_>,
    purchase_invoice_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(purchase_invoice_id, "Purchase invoice ID")?;

    let data = repository::get_purchase_invoice_posting_data_tx(
        tx,
        purchase_invoice_id,
    )
    .await?;

    validate_entry_date_is_not_closed_tx(tx, data.created_at).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "purchase_invoice",
    )
    .await?;

    let inventory_amount = adjust_inventory_amount_to_total(
        data.inventory_amount,
        data.vat_amount,
        data.total,
    );

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            inventory_amount,
            Some(format!(
                "Mercaderías compradas según factura {}",
                data.invoice_nr
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            data.vat_amount,
            Some(format!(
                "IVA crédito fiscal incluido en factura {}",
                data.invoice_nr
            )),
        )?,
        automatic_line_from_model(
            &model,
            3,
            data.total,
            Some(format!(
                "Cuenta a pagar al proveedor por factura {}",
                data.invoice_nr
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.created_at,
            description: Some(format!(
                "Asiento automático por factura de compra {}",
                data.invoice_nr
            )),
            entry_model_id: model.entry_model.id,
            source_type: "purchase_invoice".to_string(),
            source_id: data.id,
            details,
        },
    )
    .await
}

pub async fn post_purchase_return_credit_note_tx(
    tx: &Transaction<'_>,
    return_credit_note_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(return_credit_note_id, "Return credit note ID")?;

    let data = repository::get_return_credit_note_posting_data_tx(
        tx,
        return_credit_note_id,
    )
    .await?;

    validate_entry_date_is_not_closed_tx(tx, data.created_at).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "purchase_return_credit_note",
    )
    .await?;

    let inventory_amount = adjust_inventory_amount_to_total(
        data.inventory_amount,
        data.vat_amount,
        data.total,
    );

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            data.total,
            Some(format!(
                "Disminución de cuenta a pagar por nota de crédito {}",
                data.note_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            inventory_amount,
            Some(format!(
                "Salida/reversión de mercaderías por nota de crédito {}",
                data.note_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            3,
            data.vat_amount,
            Some(format!(
                "Reversión de IVA crédito fiscal por nota de crédito {}",
                data.note_number
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.created_at,
            description: Some(format!(
                "Asiento automático por nota de crédito de proveedor {}",
                data.note_number
            )),
            entry_model_id: model.entry_model.id,
            source_type: "purchase_return_credit_note".to_string(),
            source_id: data.id,
            details,
        },
    )
    .await
}

pub async fn post_purchase_payment_order_tx(
    tx: &Transaction<'_>,
    purchase_payment_order_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(purchase_payment_order_id, "Purchase payment order ID")?;

    let data = repository::get_purchase_payment_posting_data_tx(
        tx,
        purchase_payment_order_id,
    )
    .await?;

    if data.amount_to_pay <= Decimal::ZERO {
        return Err(DbError::Other(
            "Purchase payment order has no amount to post".to_string(),
        ));
    }

    validate_entry_date_is_not_closed_tx(tx, data.entry_date).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "purchase_payment",
    )
    .await?;

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            data.amount_to_pay,
            Some(format!(
                "Disminución de cuenta a pagar por orden de pago {}",
                data.id
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            data.amount_to_pay,
            Some(format!(
                "Salida de banco por orden de pago {}",
                data.id
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.entry_date,
            description: Some(format!(
                "Asiento automático por pago a proveedor, orden {}",
                data.id
            )),
            entry_model_id: model.entry_model.id,
            source_type: "purchase_payment_order".to_string(),
            source_id: data.id,
            details,
        },
    )
    .await
}






// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC POSTING — SALES
// ─────────────────────────────────────────────────────────────────────────────

pub async fn post_sales_invoice_tx(
    tx: &Transaction<'_>,
    sales_invoice_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(sales_invoice_id, "Sales invoice ID")?;

    let data = repository::get_sales_invoice_posting_data_tx(
        tx,
        sales_invoice_id,
    )
    .await?;

    validate_entry_date_is_not_closed_tx(tx, data.entry_date).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "sales_invoice",
    )
    .await?;

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            data.total,
            Some(format!(
                "Cuenta por cobrar al cliente por factura {}",
                data.invoice_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            data.sales_amount,
            Some(format!(
                "Ingreso por venta de mercaderías según factura {}",
                data.invoice_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            3,
            data.vat_amount,
            Some(format!(
                "IVA débito fiscal incluido en factura {}",
                data.invoice_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            4,
            data.cogs_amount,
            Some(format!(
                "Costo de mercaderías vendidas según factura {}",
                data.invoice_number
            )),
        )?,
        automatic_line_from_model(
            &model,
            5,
            data.cogs_amount,
            Some(format!(
                "Salida de inventario por factura {}",
                data.invoice_number
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.entry_date,
            description: Some(format!(
                "Asiento automático por factura de venta {}",
                data.invoice_number
            )),
            entry_model_id: model.entry_model.id,
            source_type: "sales_invoice".to_string(),
            source_id: data.id,
            details,
        },
    )
    .await
}

pub async fn post_sales_credit_note_tx(
    tx: &Transaction<'_>,
    credit_note_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(credit_note_id, "Sales credit note ID")?;

    let data = repository::get_sales_credit_note_posting_data_tx(
        tx,
        credit_note_id,
    )
    .await?;

    validate_entry_date_is_not_closed_tx(tx, data.created_at).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "sales_credit_note",
    )
    .await?;

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            data.sales_return_amount,
            Some(format!(
                "Devolución sobre ventas según nota de crédito {}",
                data.credit_note_nr
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            data.vat_amount,
            Some(format!(
                "Disminución de IVA débito fiscal por nota de crédito {}",
                data.credit_note_nr
            )),
        )?,
        automatic_line_from_model(
            &model,
            3,
            data.total,
            Some(format!(
                "Disminución de cuenta por cobrar por nota de crédito {}",
                data.credit_note_nr
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.created_at,
            description: Some(format!(
                "Asiento automático por nota de crédito de venta {}",
                data.credit_note_nr
            )),
            entry_model_id: model.entry_model.id,
            source_type: "sales_credit_note".to_string(),
            source_id: data.id,
            details,
        },
    )
    .await
}





// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATIC POSTING — PAYROLL
// ─────────────────────────────────────────────────────────────────────────────

pub async fn post_payroll_salary_tx(
    tx: &Transaction<'_>,
    payroll_process_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(payroll_process_id, "Payroll process ID")?;

    let data = repository::get_payroll_posting_data_tx(
        tx,
        payroll_process_id,
    )
    .await?;

    if data.process_type != "salary" {
        return Err(DbError::Other(format!(
            "Payroll process {} is not a salary process",
            payroll_process_id
        )));
    }

    if data.employee_count <= 0 {
        return Err(DbError::Other(format!(
            "Payroll process {} has no employee summary rows",
            payroll_process_id
        )));
    }

    if data.unsupported_earnings_amount > Decimal::ZERO {
        return Err(DbError::Other(format!(
            "Payroll process {} has unsupported earning novelties totaling {}",
            payroll_process_id,
            data.unsupported_earnings_amount
        )));
    }

    if data.unsupported_deductions_amount > Decimal::ZERO {
        return Err(DbError::Other(format!(
            "Payroll process {} has unsupported deduction novelties totaling {}",
            payroll_process_id,
            data.unsupported_deductions_amount
        )));
    }

    if data.salary_advance_deduction_amount > Decimal::ZERO {
        return Err(DbError::Other(
            "DESC_ADELANTO exists, but the payroll_salary entry model has no account line for salary advances. Add a line for account 01.01.02.04 or remove DESC_ADELANTO from this payroll process.".to_string(),
        ));
    }

    validate_entry_date_is_not_closed_tx(tx, data.cutoff_date).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "payroll_salary",
    )
    .await?;

    let mut details = Vec::new();

    push_automatic_line_if_positive(
        &mut details,
        &model,
        1,
        data.salary_base_amount,
        Some(format!(
            "Salario base del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        2,
        data.overtime_amount,
        Some(format!(
            "Horas extras del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        3,
        data.bonus_amount,
        Some(format!(
            "Bonificaciones del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    /*
        Aporte patronal IPS:
        Por ahora queda en 0 porque no tenés una tabla/regla estable
        para calcular el aporte patronal.

        Cuando tengas una tabla de reglas IPS, podés calcularlo y cargarlo
        en la línea 4 del modelo.
    */
    let employer_ips_amount = Decimal::ZERO;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        4,
        employer_ips_amount,
        Some(format!(
            "Aporte patronal IPS del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        5,
        data.net_amount,
        Some(format!(
            "Salario neto a pagar del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        6,
        data.employee_ips_amount + employer_ips_amount,
        Some(format!(
            "IPS a pagar del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    push_automatic_line_if_positive(
        &mut details,
        &model,
        7,
        data.damage_deduction_amount,
        Some(format!(
            "Descuentos por daños o roturas del proceso de nómina {}",
            payroll_process_id
        )),
    )?;

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.cutoff_date,
            description: Some(format!(
                "Asiento automático por liquidación de salario del proceso {}",
                payroll_process_id
            )),
            entry_model_id: model.entry_model.id,
            source_type: "payroll_salary".to_string(),
            source_id: data.payroll_process_id,
            details,
        },
    )
    .await
}

pub async fn post_payroll_payment_tx(
    tx: &Transaction<'_>,
    payroll_process_id: i32,
) -> Result<i32, DbError> {
    validate_positive_id(payroll_process_id, "Payroll process ID")?;

    let data = repository::get_payroll_posting_data_tx(
        tx,
        payroll_process_id,
    )
    .await?;

    if data.process_type != "salary" {
        return Err(DbError::Other(format!(
            "Payroll process {} is not a salary process",
            payroll_process_id
        )));
    }

    if data.employee_count <= 0 {
        return Err(DbError::Other(format!(
            "Payroll process {} has no employee summary rows",
            payroll_process_id
        )));
    }

    if data.net_amount <= Decimal::ZERO {
        return Err(DbError::Other(format!(
            "Payroll process {} has no net salary amount to pay",
            payroll_process_id
        )));
    }

    validate_entry_date_is_not_closed_tx(tx, data.pay_date).await?;

    let model = repository::get_entry_model_by_operation_type_tx(
        tx,
        "payroll_payment",
    )
    .await?;

    let details = vec![
        automatic_line_from_model(
            &model,
            1,
            data.net_amount,
            Some(format!(
                "Pago de salarios del proceso de nómina {}",
                payroll_process_id
            )),
        )?,
        automatic_line_from_model(
            &model,
            2,
            data.net_amount,
            Some(format!(
                "Salida de banco por pago de salarios del proceso de nómina {}",
                payroll_process_id
            )),
        )?,
    ];

    validate_automatic_entry_details_are_balanced(&details)?;

    repository::create_automatic_journal_entry_tx(
        tx,
        repository::NewAutomaticJournalEntry {
            entry_date: data.pay_date,
            description: Some(format!(
                "Asiento automático por pago de salario del proceso {}",
                payroll_process_id
            )),
            entry_model_id: model.entry_model.id,
            source_type: "payroll_payment".to_string(),
            source_id: data.payroll_process_id,
            details,
        },
    )
    .await
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

async fn validate_entry_date_is_not_closed_tx(
    tx: &Transaction<'_>,
    entry_date: NaiveDate,
) -> Result<(), DbError> {
    let latest_closure_date = repository::get_latest_closure_date_tx(tx).await?;

    if let Some(closure_date) = latest_closure_date {
        if entry_date <= closure_date {
            return Err(DbError::Other(format!(
                "Cannot write automatic journal entry on or before closed date {closure_date}"
            )));
        }
    }

    Ok(())
}

fn automatic_line_from_model(
    model: &EntryModelWithDetails,
    model_line_number: i32,
    amount: Decimal,
    custom_description: Option<String>,
) -> Result<repository::AutomaticJournalEntryDetailInput, DbError> {
    if amount <= Decimal::ZERO {
        return Err(DbError::Other(format!(
            "Automatic journal entry line {} has invalid amount {}",
            model_line_number,
            amount
        )));
    }

    let model_detail = find_entry_model_detail(model, model_line_number)?;

    if !model_detail.account.is_postable {
        return Err(DbError::Other(format!(
            "Account {} - {} is not postable",
            model_detail.account.account_number,
            model_detail.account.name
        )));
    }

    Ok(repository::AutomaticJournalEntryDetailInput {
        account_id: model_detail.account.id,
        amount,
        is_debit: model_detail.is_debit,
        line_number: model_detail.line_number,
        line_description: custom_description.or_else(|| {
            model_detail.line_description.clone()
        }),
    })
}

fn find_entry_model_detail<'a>(
    model: &'a EntryModelWithDetails,
    line_number: i32,
) -> Result<&'a EntryModelDetail, DbError> {
    model
        .details
        .iter()
        .find(|detail| detail.line_number == line_number)
        .ok_or_else(|| {
            DbError::Other(format!(
                "Entry model '{}' does not have line number {}",
                model.entry_model.operation_type,
                line_number
            ))
        })
}

fn validate_automatic_entry_details_are_balanced(
    details: &[repository::AutomaticJournalEntryDetailInput],
) -> Result<(), DbError> {
    if details.len() < 2 {
        return Err(DbError::Other(
            "Automatic journal entry must have at least two detail lines".to_string(),
        ));
    }

    let mut total_debit = Decimal::ZERO;
    let mut total_credit = Decimal::ZERO;

    for detail in details {
        if detail.amount <= Decimal::ZERO {
            return Err(DbError::Other(
                "Automatic journal entry detail amount must be greater than zero"
                    .to_string(),
            ));
        }

        if detail.is_debit {
            total_debit += detail.amount;
        } else {
            total_credit += detail.amount;
        }
    }

    if total_debit != total_credit {
        return Err(DbError::Other(format!(
            "Automatic journal entry is not balanced. Debit: {total_debit}, Credit: {total_credit}"
        )));
    }

    Ok(())
}

fn adjust_inventory_amount_to_total(
    inventory_amount: Decimal,
    vat_amount: Decimal,
    document_total: Decimal,
) -> Decimal {
    let calculated_total = inventory_amount + vat_amount;
    let difference = document_total - calculated_total;

    inventory_amount + difference
}


fn push_automatic_line_if_positive(
    details: &mut Vec<repository::AutomaticJournalEntryDetailInput>,
    model: &EntryModelWithDetails,
    line_number: i32,
    amount: Decimal,
    override_description: Option<String>,
) -> Result<(), DbError> {
    if amount <= Decimal::ZERO {
        return Ok(());
    }

    details.push(automatic_line_from_model(
        model,
        line_number,
        amount,
        override_description,
    )?);

    Ok(())
}