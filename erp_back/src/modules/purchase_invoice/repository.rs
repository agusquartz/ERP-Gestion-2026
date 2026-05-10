use tokio_postgres::Row;
use chrono::NaiveDate;

use crate::db_config;
use crate::modules::purchase_invoice::model::PurchaseInvoice;
use crate::modules::purchase_invoice::dto::query::InvoiceQueryParams;

const PURCHASE_INVOICE_SELECT_BASE: &str = r#"
SELECT
	pi.id 					AS id,
	pi.invoice_nr			AS invoice_nr,
	pi.purchase_order_id	AS purchase_order_id,
	s.name					AS supplier_name,
	pi.created_at			AS created_at,
	pi.sale_condition_id	AS sale_condition_id,
	pi.total 				AS total,
	pi.total_paid 			AS total_paid
FROM purchase_invoices AS pi
INNER JOIN purchase_orders	AS po ON po.id = pi.purchase_order_id
INNER JOIN suppliers 		AS s  ON s.id = po.supplier_id 
"#;

pub async fn query_invoice(
	params: &InvoiceQueryParams,
) -> Result<Vec<PurchaseInvoice>, db_config::DbError> {

	let client = db_config::get_client().await?;

	let has_filtered = params.search.is_some() || params.from.is_some() || params.to.is_some();
	
	if has_filtered {
		let mut sql = format!("{} WHERE 1=1", PURCHASE_INVOICE_SELECT_BASE);

		let search_val: String;
		let from_val: NaiveDate;
		let to_val: NaiveDate;

		let mut args: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();
		let mut idx = 1usize;

		if let Some(ref q) = params.search {
			search_val = format!("%{}%", q);

			sql.push_str(&format!(
				" AND (pi.invoice_nr ILIKE ${idx} \
				OR CAST(pi.purchase_order_id AS TEXT) ILIKE ${idx} \
				OR s.name ILIKE ${idx})" 
			));

			args.push(&search_val);
			idx += 1;
		}

		if let Some(ref f) = params.from {
			from_val = *f;
			sql.push_str(&format!(" AND pi.created_at >= ${idx}"));
			args.push(&from_val);
			idx += 1;
		}

		if let Some(ref t) = params.to {
			to_val = *t;
			sql.push_str(&format!(" AND pi.created_at <= ${idx}"));
			args.push(&to_val);
			idx += 1;
		}

		sql.push_str(" ORDER BY pi.id ASC");

		let rows = client.query(sql.as_str(), &args).await?;
		return Ok(rows_to_invoices(rows));
	}
	
	// No filters - fetch all
	let sql = format!("{} ORDER BY pi.id ASC", PURCHASE_INVOICE_SELECT_BASE);
	let rows = client.query(&sql, &[]).await?;
	Ok(rows_to_invoices(rows))
}


fn rows_to_invoices(rows: Vec<Row>) -> Vec<PurchaseInvoice> {
	rows.iter()
		.map(|row| PurchaseInvoice {
			id:					row.get("id"),
			invoice_nr:			row.get("invoice_nr"),
			purchase_order_id:	row.get("purchase_order_id"),
			supplier_name:		row.get("supplier_name"),
			created_at:			row.get("created_at"),
			sale_condition_id:	row.get("sale_condition_id"),
			total:				row.get("total"),
			total_paid:			row.get("total_paid"),
		})
		.collect()
}