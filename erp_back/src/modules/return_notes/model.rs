use chrono::NaiveDate;
use rust_decimal::Decimal;


/// Represents the return_notes table
#[derive(Debug, Clone)]
pub struct ReturnNote {
    pub id: i32,
    pub purchase_invoice_id: i32,
    pub motive: String,
    pub created_at: NaiveDate,
    pub status_id: i32,
}

/// Represents the return_note_details table
#[derive(Debug, Clone)]
pub struct ReturnNoteDetail {
    pub id: i32,
    pub return_note_id: i32,
    pub product_id: i32,
    pub returned_quantity: i32,
    pub amount: Decimal,
}


/// Status data joined from statuses.
#[derive(Debug, Clone)]
pub struct ReturnNoteStatus {
    pub id: i32,
    pub name: String,
}


/// Product data joined from products
#[derive(Debug, Clone)]
pub struct ReturnNoteProduct {
    pub id: i32,
    pub code: String,
    pub description: String,
}



///--------------------[AGREGRATE]------------------------------
/// Full return note aggregate used by repository/service
#[derive(Debug, Clone)]
pub struct ReturnNoteAggregate {
    pub return_note: ReturnNote,
    pub status: ReturnNoteStatus,
    pub details: Vec<ReturnNoteDetailAggregate>,
}


#[derive(Debug, Clone)]
pub struct ReturnNoteDetailAggregate {
    pub id: i32,
    pub product: ReturnNoteProduct,
    pub returned_quantity: i32,
    pub amount: Decimal,
}


/// Detail with product data included
#[derive(Debug, Clone)]
pub struct NewReturnNote {
    pub purchase_invoice_id: i32,
    pub motive: String,
    pub created_at: NaiveDate,
    pub status_id: i32,
    pub details: Vec<NewReturnNoteDetail>,
}


/// Internal model used to create a return note
#[derive(Debug, Clone)]
pub struct NewReturnNoteDetail {
    pub product_id: i32,
    pub returned_quantity: i32,
    pub amount: Decimal,
}