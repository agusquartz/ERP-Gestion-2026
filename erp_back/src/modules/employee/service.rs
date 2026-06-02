use crate::modules::employee::{
    dto::{
        EmployeeListQuery,
        create::{
            CreateEmployeeDto,
        }, 
        response::{
            ListEmployeesView,
            EmployeeResponse,
            PayrollProcessSummaryDto,
        },
        payroll::PayrollStatusAction,
    },
    model::{
        NewEmployee,
        NewPayrollItem,
    },
    repository,
};

use crate::shared::db_config;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use chrono::{NaiveDate, Datelike};

/// Global economic variables required for payroll compliance tracking
pub struct DynamicPayrollParams {
    pub minimum_wage_local: Decimal, // e.g., 2,798,309 PYG (Sueldo Mínimo Legal)
    pub exchange_rate_usd_pyg: Decimal, // e.g., 7,500.00
}

/// Fetches the authoritative configuration parameters.
/// Currently hardcoded, but ready to be hooked up to an external API or config table.
async fn fetch_current_payroll_params() -> DynamicPayrollParams {
    DynamicPayrollParams {
        // Current legal minimum wage in Paraguay (as of mid-2026 baseline values)
        minimum_wage_local: dec!(2798309.00), 
        // Current market exchange rate proxy
        exchange_rate_usd_pyg: dec!(7550.00), 
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum ServiceError {
    Db(db_config::DbError),
    Validation(String),
}

impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        Self::Db(value)
    }
}   

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Db(_) => write!(f, "database error"), 
            ServiceError::Validation(msg) => write!(f, "validation error: {msg}"),
        }
    } 
}

impl std::error::Error for ServiceError {}



// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────
pub async fn get_employees(
    query: EmployeeListQuery,
) -> Result<ListEmployeesView, ServiceError> {
    let rows= repository::query_employees(
        query.search, 
        query.filter, 
        query.since, 
        query.to, 
        query.status, 
        query.cursor, 
        query.limit + 1,
    ).await?;

    let mut employees: Vec<EmployeeResponse> = rows.into_iter().map(EmployeeResponse::from).collect();

    let limit = query.limit as usize;

    let has_more = employees.len() > limit; 

    employees.truncate(limit);

    let view = ListEmployeesView {
        employees: employees,
        has_more: has_more,
    };

    Ok(view)
}


pub async fn get_employee_by_id(
    id: i32,
) -> Result<Option<EmployeeResponse>, ServiceError> {
    let result = repository::query_employee_by_id(id).await?;
    Ok(result.map(Into::into))
}

pub async fn create_employee(
    dto: CreateEmployeeDto,
) -> Result<EmployeeResponse, ServiceError> {
    let employee_data = NewEmployee::from(dto);
    let result = repository::insert_employee(&employee_data).await?;
    Ok(Into::into(result))
}

/// Calculates monthly salary parameters across all active team records
pub async fn calculate_monthly_payroll(
    start_date: NaiveDate,
    end_date: NaiveDate,
    pay_date: NaiveDate,
    excluded_ids: &[i32],
) -> Result<i32, ServiceError> {
    // 1. Initialize a new ledger transaction sequence tracking instance
    let process = repository::create_payroll_process("salary", pay_date, end_date).await?;
    
    // 2. Load supporting systemic metadata parameters map lookups
    let novelties = repository::query_novelties_map().await?;

    // Fallback extraction IDs checking targets exist securely
    let id_salary  = *novelties.get("SALARIO_BASE").or_else(|| novelties.get("SALARY")).unwrap_or(&1);
    let id_ips     = *novelties.get("DESC_IPS").or_else(|| novelties.get("IPS")).unwrap_or(&4);
    let id_overtime = *novelties.get("HORAS_EXTRA").unwrap_or(&2);
    let id_late    = *novelties.get("DESC_ROTURA").unwrap_or(&5);
    let id_family  = *novelties.get("BON_FAM").unwrap_or(&7);
    
    let params = fetch_current_payroll_params().await;
        // Calculate the 5% legal stipend per child in local currency
    let legal_stipend_local = params.minimum_wage_local * dec!(0.05);
        // Convert that stipend amount to USD based on the active exchange rate parameters
    let legal_stipend_usd = (legal_stipend_local / params.exchange_rate_usd_pyg)
        .round_dp(2); // Round cleanly to standard cents
                      

    // 3. Fetch all active employee aggregate entities matching conditions
    let employees = repository::query_employees(
        None, None, None, None, Some("active".to_string()), None, 1000
    ).await?;

    let mut all_calculated_items: Vec<NewPayrollItem> = Vec::new();

    // 4. Run main payroll computational loop targeting active worker accounts
    for aggregate in employees {
        let emp = aggregate.employee;
        
        if excluded_ids.contains(&emp.id){
            //Skip if user said not to 
            continue;
        }
        // Skip processing if no contract is active
        let contract = match emp.current_contract {
            Some(c) if c.is_active => c,
            _ => continue,
        };

        let employee_id = emp.id;
        let base_salary = contract.salary;

        // Obtain dynamic variable totals derived from time keeping systems
        let (worked_hours, late_minutes, overtime_hours) = 
            repository::query_timesheet_aggregates(employee_id, start_date, end_date).await?;

        // Contextual hourly tracking factors matching structural baselines
        let hourly_rate = base_salary / dec!(240.0); // 30 days * 8 working hours baseline

        let mut gross_ips_base = dec!(0.0);

        // ─────────── A. BASE SALARY EARNING LINE ITEM ───────────
        let base_earning = match contract.period.as_str() {
            "hourly" => worked_hours * base_salary,
            _ => base_salary, // default "monthly" structural matching
        };

        all_calculated_items.push(NewPayrollItem {
            payroll_process_id: process.id,
            employee_id,
            novelty_id: id_salary,
            quantity: if contract.period == "hourly" { worked_hours } else { dec!(1.0) },
            unit_amount: if contract.period == "hourly" { base_salary } else { base_earning },
            total_amount: base_earning,
            origin: "contract_formula".to_string(),
        });
        gross_ips_base += base_earning;

        // ─────────── B. OVERTIME PREMIUM CALCULATION ───────────
        if overtime_hours > dec!(0.0) {
            let ot_multiplier = dec!(1.30); // 30% overtime premium matching rules schema default
            let ot_unit_rate = hourly_rate * ot_multiplier;
            let ot_total = overtime_hours * ot_unit_rate;

            all_calculated_items.push(NewPayrollItem {
                payroll_process_id: process.id,
                employee_id,
                novelty_id: id_overtime,
                quantity: overtime_hours,
                unit_amount: ot_unit_rate,
                total_amount: ot_total,
                origin: "timesheet_overtime".to_string(),
            });
            gross_ips_base += ot_total;
        }

        // ─────────── C. LATENESS PENALTY DEDUCTION ───────────
        if late_minutes > 0 {
            let minute_rate = hourly_rate / dec!(60.0);
            let late_quantity = Decimal::from(late_minutes);
            let late_total = late_quantity * minute_rate;

            all_calculated_items.push(NewPayrollItem {
                payroll_process_id: process.id,
                employee_id,
                novelty_id: id_late,
                quantity: late_quantity,
                unit_amount: minute_rate,
                total_amount: late_total,
                origin: "timesheet_lateness".to_string(),
            });
            // Lateness deductions typically decrease gross base wages before calculating deductions
            gross_ips_base -= late_total;
        }

        // ─────────── D. PARAGUAYAN FAMILY ALLOWANCE (BONO FAMILIAR) ───────────
        let mut dependent_children_count = dec!(0.0);

        for relative in aggregate.relatives {
            if relative.relation_type == "child" {
                let mut qualifies = relative.disability;
                
                if !qualifies {
                    let birth = relative.birth_date; 
                    let age = end_date.year() - birth.year();
                    if age < 18 { qualifies = true; }
                }

                if qualifies {
                    dependent_children_count += dec!(1.0);
                }
            }
        }

        if dependent_children_count > dec!(0.0) {
            let total_family_allowance_usd = dependent_children_count * legal_stipend_usd;
            all_calculated_items.push(NewPayrollItem {
                payroll_process_id: process.id,
                employee_id,
                novelty_id: id_family,
                quantity: dependent_children_count,
                unit_amount: legal_stipend_usd,
                total_amount: total_family_allowance_usd,
                origin: "relatives_lookup".to_string(),
            });
            // Note: Family allowances are structurally exempt from IPS base calculations.
        }

        // ─────────── E. SOCIAL SECURITY TAXATION (IPS DEDUCTION) ───────────
        if gross_ips_base > dec!(0.0) {
            let ips_rate = dec!(0.09); // Employee 9% legal insurance bracket
            let ips_total = gross_ips_base * ips_rate;

            all_calculated_items.push(NewPayrollItem {
                payroll_process_id: process.id,
                employee_id,
                novelty_id: id_ips,
                quantity: dec!(9.0),
                unit_amount: gross_ips_base / dec!(100.0),
                total_amount: ips_total,
                origin: "ips_statutory_calculation".to_string(),
            });
        }
    }

    // 5. Commit batch sets out to analytical data summary matrices
    let process_id = process.id;
    repository::save_payroll_run_results(process_id, &all_calculated_items).await?;

    Ok(process_id)
}


pub async fn update_payroll_status(
    process_id: i32,
    action: PayrollStatusAction,
) -> Result<(), ServiceError> {
    let status_str = match action {
        PayrollStatusAction::Paid => "paid",
        PayrollStatusAction::Cancelled => "cancelled",
    };

    let affected = repository::update_payroll_process_status(process_id, status_str).await?;

    if affected == 0 {
        return Err(ServiceError::Validation(
            "Payroll process not found or already closed (paid/cancelled).".to_string()
        ));
    }

    Ok(())
}

pub async fn get_historical_payroll(
    process_id: i32,
) -> Result<Vec<EmployeeResponse>, ServiceError> {
    let rows = repository::query_historical_payroll_data(process_id).await?;
    
    // Map the structures directly into your response DTO array
    let responses = rows.into_iter().map(EmployeeResponse::from).collect();
    Ok(responses)
}

pub async fn get_processes() -> Result<Vec<PayrollProcessSummaryDto>, ServiceError> {
    let processes = repository::query_processes().await?;
    Ok(processes)
}
