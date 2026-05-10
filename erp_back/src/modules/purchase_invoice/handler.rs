use axum::{extract::Query, response::IntoResponse, Json};

use crate::modules::purchase_invoice::{
	dto::query::InvoiceQueryParams,
	errors::ServiceError,
	service,
};

pub async fn list_purchase_invoices(
	Query(params): Query<InvoiceQueryParams>,
) -> Result<impl IntoResponse, ServiceError> {
	let invoices = service::list_purchase_invoices(params).await?;
	Ok(Json(invoices))
}