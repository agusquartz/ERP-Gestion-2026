use chrono::NaiveDate;
use rust_decimal::Decimal;

pub struct CreditNoteHeader{
    pub id: i32,
    pub note_number: String,
    pub return_note_id: i32,
    pub invoice_id: i32,
    pub created_at: NaiveDate,
    pub total: Decimal,
    pub supplier_id: i32,
    pub details: Vec<CreditNoteDetail>, 
}

pub struct CreditNoteDetail{
    pub product: ProductInfo,
    pub unit_cost: Decimal,
    pub quantity: i32,
    pub subtotal: Decimal,
}

pub struct ProductInfo{
    pub id: i32,
    pub description: String,
    pub code: String,
}

pub struct Supplier{
    pub id: i32,
    pub name: String,
    pub stamp: String, 
}

pub struct CreditNoteAggregate{
    pub credit_note: CreditNoteHeader,
    pub supplier: Supplier,
}