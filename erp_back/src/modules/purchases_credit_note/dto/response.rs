use serde::Serialize;
use chrono::NaiveDate;
use rust_decimal::Decimal;
use crate::modules::purchases_credit_note::model::credit_note_model::CreditNoteAggregate;

#[derive(Debug, Serialize)]
pub struct CreditNoteResponse {
    pub id: i32,
    pub note_number: String,
    pub return_note_id: i32,
    pub invoice_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub supplier: SupplierResponse,
    pub details: Vec<CreditNoteDetailResponse>,
}

#[derive(Debug, Serialize)]
pub struct SupplierResponse {
    pub id: i32,
    pub name: String,
    pub stamp: String,
}

#[derive(Debug, Serialize)]
pub struct CreditNoteDetailResponse {
    pub product_id: i32,
    pub product_code: String,
    pub product_description: String,
    pub quantity: i32,
    pub unit_cost: Decimal,
    pub subtotal: Decimal,
}


impl From<CreditNoteAggregate> for CreditNoteResponse {
    fn from(agg: CreditNoteAggregate) -> Self {
        Self {
            id: agg.credit_note.id,
            note_number: agg.credit_note.note_number,
            return_note_id: agg.credit_note.return_note_id,
            invoice_id: agg.credit_note.invoice_id,
            created_at: agg.credit_note.created_at,
            total: agg.credit_note.total,
            supplier: SupplierResponse {
                id: agg.supplier.id,
                name: agg.supplier.name,
                stamp: agg.supplier.stamp,
            },
            details: agg.credit_note.details.into_iter().map(|d| CreditNoteDetailResponse {
                product_id: d.product.id,
                product_code: d.product.code,
                product_description: d.product.description,
                quantity: d.quantity,
                unit_cost: d.unit_cost,
                subtotal: d.subtotal,
            }).collect(),
        }
    }
}