use chrono::NaiveDate;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct InvoiceQueryParams {
	pub search: Option<String>,
	pub filter: Option<String>,
	pub from: Option<NaiveDate>,
	pub to: Option<NaiveDate>,
	pub status: Option<String>,
}