use crate::modules::credit_notes::repository;
use crate::modules::credit_notes::errors;
use crate::modules::credit_notes::model::{ NewCreditNote, 
                                           LineProduct, 
                                           CreditNoteLineItem };
use crate::modules::credit_notes::dto::{ response::CreditNoteResponse,
                                         create::CreateCreditNoteDto };

use crate::modules::product::{ self,
                               dto::ProductResponse };
use std::collections::HashMap;
use rust_decimal::{ Decimal,
                    prelude::FromPrimitive};

use crate::shared::db_config;

/// Lists credit notes with optional filtering.
pub async fn list_credit_notes(contains: Option<String>) -> Result<Vec<CreditNoteResponse>, errors::ServiceError> {
    let rows= repository::query_credit_notes(contains.as_deref()).await?;
    Ok(rows.into_iter().map(|note| CreditNoteResponse::from(note)).collect())
}

/// Retrieves a single credit note by ID.
///
/// # Returns
/// - `Some(CreditNoteResponse)` if found
/// - `None` otherwise
pub async fn get_credit_note(id: i32) -> Result<Option<CreditNoteResponse>, errors::ServiceError> {
    let invoice = repository::query_credit_note_by_id(id).await?;
    Ok(invoice.map(|note| CreditNoteResponse::from(note)))
}

/// Creates a new credit note.
///
/// # Workflow
/// 1. Resolve products from product service
/// 2. Build domain line items
/// 3. Compute total
/// 4. Open transaction at service level
/// 5. Persist credit note via repository
/// 6. Create automatic accounting entry
/// 7. Commit transaction
/// 8. Re-query aggregate and map to response
pub async fn create_credit_note(
    dto: CreateCreditNoteDto,
) -> Result<CreditNoteResponse, errors::ServiceError> {
    // Make a map with products
    let mut products: HashMap<i32, ProductResponse> = HashMap::new();

    for line in &dto.details {
        // Bring product from db
        let p: ProductResponse = product::service::get_product(line.product_id)
            .await?
            .ok_or(errors::ServiceError::Validation(errors::ValidationError {
                context: format!("missing product {}", line.product_id),
            }))?;

        // Insert to map
        products.insert(p.id, p);
    }

    let mut details: Vec<CreditNoteLineItem> = Vec::new();

    // Create all LineItems
    for line in dto.details {
        let p = products
            .get(&line.product_id)
            .expect("already validated above");

        let tax = p
            .taxes
            .first()
            .ok_or(errors::ServiceError::Validation(errors::ValidationError {
                context: format!("product with id {} has no tax associated", p.id),
            }))?
            .percentage;

        let item = CreditNoteLineItem {
            product: LineProduct {
                id: p.id,
                code: p.code.clone(),
                description: p.description.clone(),
            },
            unit_cost: line.unit_cost,
            tax: Decimal::from_f64(tax).ok_or(errors::ServiceError::Validation(
                errors::ValidationError {
                    context: "invalid float tax value".to_string(),
                },
            ))?,
            quantity: line.quantity,
        };

        // Store in details vector
        details.push(item);
    }

    // Create credit note proper
    let credit_note = NewCreditNote {
        credit_note_number: dto.credit_note_number,
        sale_invoice_id: dto.sale_invoice_id,
        created_at: dto.created_at,
        total: compute_credit_note_total(&details),
        details,
    };

    // Open transaction in service layer
    let mut client = db_config::get_client().await?;
    let tx = client
        .transaction()
        .await
        .map_err(db_config::DbError::from)?;

    let result: Result<i32, errors::ServiceError> = async {
        // Persist credit note inside the same transaction
        let credit_note_id = repository::store_new_credit_note(
            &tx,
            credit_note,
        )
        .await?;

        // Create automatic accounting entry inside the same transaction
        crate::modules::accounting::service::post_sales_credit_note_tx(
            &tx,
            credit_note_id,
        )
        .await?;

        Ok(credit_note_id)
    }
    .await;

    match result {
        Ok(credit_note_id) => {
            tx.commit()
                .await
                .map_err(db_config::DbError::from)?;

            let aggregate = repository::query_credit_note_by_id(credit_note_id)
                .await?
                .ok_or(errors::ServiceError::Database(
                    db_config::DbError::InvariantViolation(
                        "Inserted credit note not found after commit".into(),
                    ),
                ))?;

            let response = CreditNoteResponse::from(aggregate);

            Ok(response)
        }

        Err(e) => {
            let _ = tx.rollback().await;
            Err(e)
        }
    }
}

/// Computes the total invoice amount including taxes.
///
/// # Formula
/// total = Σ (unit_cost × quantity) + tax_amount
fn compute_credit_note_total(details: &Vec<CreditNoteLineItem>) -> rust_decimal::Decimal {
    let total = details.iter().fold(Decimal::ZERO, |acc, line| {
        let subtotal = compute_line_subtotal(line);
        acc + subtotal 
    });

    total
}

pub fn compute_line_subtotal(line: &CreditNoteLineItem) -> rust_decimal::Decimal {
    let duty_free = line.unit_cost * Decimal::from(line.quantity);
    let tax_amount = duty_free * line.tax / Decimal::from(100);
    let subtotal = duty_free + tax_amount;
    subtotal
}
