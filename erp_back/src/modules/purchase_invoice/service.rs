use crate::modules::purchase_invoice::{
	dto::{
		query::InvoiceQueryParams,
		response::{PaymentStatus, PurchaseInvoiceResponse},
	},
	errors::ServiceError,
	repository,
};

pub async fn list_purchase_invoices(
	params: InvoiceQueryParams,
) -> Result<Vec<PurchaseInvoiceResponse>, ServiceError> {
	let rows = repository::query_invoice(&params).await?;

	let mut invoices: Vec<PurchaseInvoiceResponse> = 
		rows.into_iter().map(PurchaseInvoiceResponse::from).collect();

	if let Some(ref status_str) = params.status {
		if let Some(target_status) = PaymentStatus::from_str(status_str) {
			invoices.retain(|inv| inv.payment_status == target_status);
		} else {
			invoices.clear();	
		}
	}

	Ok(invoices)
}