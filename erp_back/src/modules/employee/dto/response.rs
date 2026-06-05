use crate::modules::employee::model::{
    EmployeeAggregate,
    Employee,
    Relative,
    PayrollSummary,
    PayrollItemDetail,
};
use chrono::{NaiveDate, DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};


// ─────────────────────────────────────────────────────────────────────────────
// From implementations — model → DTO conversions
// ─────────────────────────────────────────────────────────────────────────────


impl From<EmployeeAggregate> for EmployeeResponse {
    fn from(agg: EmployeeAggregate) -> Self {
        EmployeeResponse {
            id: agg.employee.id,
            name: agg.employee.name,
            surname: agg.employee.surname,
            document: agg.employee.document,
            birth_date: agg.employee.birth_date,
            hire_date: agg.employee.hire_date,
            termination_date: agg.employee.termination_date,
            job_title: agg.employee.job_title,
            is_active: agg.employee.is_active,
            current_contract: agg.employee.current_contract.map(|contract| ContractDto {
                contract_id: contract.id,
                contract_name: contract.contract_name,
                start_date: contract.start_date,
                end_date: contract.end_date,
                salary: contract.salary,
                period: contract.period,
                account: contract.account,
                is_active: contract.is_active,
            }),
            payroll_summary: agg.payroll_summary.map(|summary| PayrollSummaryDto {
                id: summary.id,
                payroll_process_id: summary.payroll_process_id,
                payroll_process_start_date: summary.payroll_process_start_date,
                payroll_process_state: summary.payroll_process_state,
                gross_amount: summary.gross_amount,
                deductions: summary.deductions,
                net_earnings: summary.net_earnings,
                last_time_computed: summary.last_time_computed,
                items: summary.items.into_iter().map(PayrollItemDetailDto::from).collect(),
            }),
            relatives: agg.relatives
                .into_iter()
                .map(RelativeResponse::from)
                .collect(),
        }
    }
}

impl From<PayrollItemDetail> for PayrollItemDetailDto {
    fn from(s: PayrollItemDetail) -> Self {
        PayrollItemDetailDto {
            novelty_code: s.novelty_code,
            novelty_name: s.novelty_name, 
            sign: s.sign,
            quantity: s.quantity,
            unit_amount: s.unit_amount,
            total_amount: s.total_amount,
            origin: s.origin,
        }
    }
}


impl From<Relative> for RelativeResponse {
    fn from(r: Relative) -> Self {
        RelativeResponse {
            id: r.id,
            name: r.name,
            surname: r.surname,
            document: r.document,
            relation_type: r.relation_type,
            birth_date: r.birth_date,
            disability: r.disability,
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// DTO structs
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListEmployeesView {
    pub employees: Vec<EmployeeResponse>,
    pub has_more: bool,
}
 
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployeeResponse {
    pub id: i32,    
    pub name: String,
    pub surname: String,
    pub document: String,
    pub birth_date: Option<NaiveDate>,
    pub hire_date: NaiveDate,
    pub current_contract: Option<ContractDto>,
    pub termination_date: Option<NaiveDate>,
    pub job_title: Option<String>,
    pub is_active: bool,
    //pub created_at: DateTime<Utc>,
    //pub updated_at: DateTime<Utc>,

    pub relatives: Vec<RelativeResponse>,
    pub payroll_summary: Option<PayrollSummaryDto>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PayrollSummaryDto {
    pub id: i32,
    pub payroll_process_id: i32,
    pub payroll_process_start_date: DateTime<Utc>,
    pub payroll_process_state: String,
    pub gross_amount: Decimal,
    pub deductions: Decimal,
    pub net_earnings: Decimal,
    pub last_time_computed: DateTime<Utc>,
    pub items: Vec<PayrollItemDetailDto>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayrollItemDetailDto {
    pub novelty_code: String,
    pub novelty_name: String,
    pub sign: String, // "C" (Credit/Earning) or "D" (Debit/Deduction)
    pub quantity: Decimal,
    pub unit_amount: Decimal,
    pub total_amount: Decimal,
    pub origin: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContractDto {
    pub contract_id: i32,
    pub contract_name: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub salary: Decimal,
    pub period: String,
    pub account: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RelativeResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: Option<String>,
    pub relation_type: String,
    pub birth_date: NaiveDate,
    pub disability: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PayrollProcessSummaryDto {
    pub id: i32,
    pub cutoff_date: NaiveDate,
    pub pay_date: NaiveDate,
    pub process_type: String,
    pub state: String,
}
