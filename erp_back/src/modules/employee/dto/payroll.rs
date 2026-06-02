use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Debug, Deserialize)]
pub struct TriggerPayrollDto {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub pay_date: NaiveDate,
    pub excluded_employee_ids: Option<Vec<i32>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PayrollStatusAction {
    Paid,
    Cancelled,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePayrollStatusDto {
    pub action: PayrollStatusAction,
}

