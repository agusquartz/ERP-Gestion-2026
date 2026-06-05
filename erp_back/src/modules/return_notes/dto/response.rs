use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::modules::return_notes::model;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteResponseDto {
    pub id: i32,
    pub purchase_invoice_id: i32,
    pub motive: String,
    pub created_at: NaiveDate,

    pub credit_note_id: Option<i32>,

    /// Total calculado sumando los amount de los detalles.
    pub total: Decimal,

    pub supplier: ReturnNoteSupplierResponseDto,

    pub status: ReturnNoteStatusResponseDto,
    pub details: Vec<ReturnNoteDetailResponseDto>,
}


//
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteSupplierResponseDto {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteStatusResponseDto {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteDetailResponseDto {
    pub id: i32,
    pub product: ReturnNoteProductResponseDto,
    pub returned_quantity: i32,
    pub amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReturnNoteProductResponseDto {
    pub id: i32,
    pub code: String,
    pub description: String,
}