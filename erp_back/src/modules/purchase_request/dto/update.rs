use serde::{Serialize, Deserialize};
use chrono::NaiveDate;
 
/// Request body for updating a supplier quote's status.
///
/// Used when the frontend transitions a quote between states.
/// The service layer validates that the transition is allowed
/// before applying it — invalid transitions are rejected with an error.
///
/// Status transition flow (forward-only):
///   created (1) → unsent  (2)   clicking "Generar" on the supplier row
///   unsent  (2) → pending (3)   clicking "Imprimir" OR saving incomplete fields
///   unsent  (2) → ok      (4)   saving with ALL fields complete on first save
///   pending (3) → ok      (4)   completing remaining fields after partial save

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPurchaseQuoteDto {
    pub quote_id: i32,
    pub status_id: i32,
    pub date_sent: Option<NaiveDate>,
    pub date_received: Option<NaiveDate>,
}
