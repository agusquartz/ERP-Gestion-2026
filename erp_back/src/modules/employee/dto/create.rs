use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  //birthDate, creditLimit, etc
pub struct CreateEmployeeDto {
    pub name: String,
    pub surname: String,
    pub document: String,
    pub birth_date: Option<NaiveDate>,
    pub hire_date: NaiveDate,
    pub created_at: NaiveDate,
    pub job_title: Option<String>,
    pub base_salary: Decimal,
    pub relatives: Vec<CreateRelativeDto>,
}



#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRelativeDto {
    pub name: String,
    pub surname: String,
    pub document: Option<String>,
    pub relation_type: String,
    pub disability: bool,
    pub birth_date: NaiveDate,
}
