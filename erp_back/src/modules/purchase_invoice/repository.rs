use tokio_postgres::Row;
use crate::db_config;
use crate::modules::model::PurchaseInvoice;

const PURCHASE_INVOICE_SELECT_BASE: &str = r"#
SELECT
	pi.id
	pi.invoice_nr
	pi.purchase_order_id
	s.name
	pi.created_at
	pi.sale_condition_id
	pi.total
	pi.total_paid
FROM purchase_invoices AS pi
INNER JOIN purchase_ordes	AS po ON po.id = pi.purchase_order_id
INNER JOIN suppliers 		AS s  ON s.id = po.supplier_id 
#";

pub async fn query_invoice() -> Result<PurchaseInvoice, db_config::DbError> {
	let client = db_config::getClient().await?;

	let sql = format!("{} ORDER BY pi.id ASC", PURCHASE_INVOICE_SELECT_BASE);
	let rows = client.query(&sql, &[]).await?;

	Ok(rows_to_invoive(rows))
}


fn rows_to_invoive(rows: Vec<Row>) -> Vec<PurchaseInvoice> {
	rows.iter()
		.map(|row| PurchaseInvoice {
			id:					row.get("id"),
			invoice_nr:			row.get("invoice_nr"),
			purchase_order_id:	row.get("purchase_order_id"),
			created_at:			row.get("created_at"),
			sale_condition_id:	row.get("sale_condition_id"),
			total:				row.get("total"),
			total_paid:			row.get("total_paid"),
		})
		.collect()
}