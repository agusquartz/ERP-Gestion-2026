use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};

use crate::modules::employee::dto::create;


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: String,
    pub birth_date: Option<NaiveDate>,
    pub hire_date: NaiveDate,
    pub current_contract: Option<Contract>,
    pub termination_date: Option<NaiveDate>,
    pub job_title: Option<String>,
    pub is_active: bool,
    //pub created_at: DateTime<Utc>,
    //pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Relative {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub document: Option<String>,
    pub relation_type: String,
    pub birth_date: NaiveDate,
    pub disability: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contract {
    pub id: i32,
    pub contract_name: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub salary: Decimal,
    pub period: String,
    pub account: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PayrollSummary {
    pub id: i32,
    pub payroll_process_id: i32,
    pub payroll_process_start_date: DateTime<Utc>,
    pub payroll_process_state: String,
    pub gross_amount: Decimal,
    pub deductions: Decimal,
    pub net_earnings: Decimal,
    pub last_time_computed: DateTime<Utc>,
    pub items: Vec<PayrollItemDetail>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct PayrollItemDetail {
    pub novelty_code: String,
    pub novelty_name: String,
    pub sign: String, // "C" (Credit/Earning) or "D" (Debit/Deduction)
    pub quantity: Decimal,
    pub unit_amount: Decimal,
    pub total_amount: Decimal,
    pub origin: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmployeeAggregate {
    pub employee: Employee,
    pub payroll_summary: Option<PayrollSummary>,
    pub relatives: Vec<Relative>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewEmployee {
    pub name: String,
    pub surname: String,
    pub document: String,
    pub birth_date: Option<NaiveDate>,
    pub hire_date: NaiveDate,
    pub job_title: Option<String>,
    pub base_salary: Decimal,
    pub relatives: Vec<NewRelative>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewRelative {
    pub name: String,
    pub surname: String,
    pub document: Option<String>,
    pub relation_type: String,
    pub birth_date: NaiveDate,
    pub disability: bool,
}

impl From<create::CreateEmployeeDto> for NewEmployee {
    fn from(dto: create::CreateEmployeeDto) -> Self {
        NewEmployee {
            name: dto.name,
            surname: dto.surname,
            document: dto.document,
            birth_date: dto.birth_date,
            hire_date: dto.hire_date,
            job_title: dto.job_title,
            base_salary: dto.base_salary,
            relatives: dto.relatives
                .into_iter()
                .map(NewRelative::from)
                .collect(),
        }
    }
}

impl From<create::CreateRelativeDto> for NewRelative {
    fn from(dto: create::CreateRelativeDto) -> Self {
        NewRelative {
            name: dto.name,
            surname: dto.surname,
            document: dto.document,
            birth_date: dto.birth_date,
            disability: dto.disability,
            relation_type: dto.relation_type,

        }
    }
}

#[derive(Debug, Clone)]
pub struct PayrollProcess {
    pub id: i32,
    pub process_type: String, // "salary", "aguinaldo", etc.
    pub pay_date: NaiveDate,
    pub cutoff_date: NaiveDate,
    pub state: String,        // "draft", "computed", "paid"
}

#[derive(Debug, Clone)]
pub struct NewPayrollItem {
    pub payroll_process_id: i32,
    pub employee_id: i32,
    pub novelty_id: i32,
    pub quantity: Decimal,
    pub unit_amount: Decimal,
    pub total_amount: Decimal,
    pub origin: String,
}
