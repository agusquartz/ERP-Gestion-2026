//! status.rs — purchase_request module
//!
//! Status ID constants matching the `statuses` table
//! and transition validation logic.
//!
//! Kept separate from model.rs because these are business rules,
//! not database structure. model.rs only mirrors DB tables.
 
/// Quote just created, no action taken yet
pub const STATUS_CREATED: i32 = 1;
 
/// "Generar" clicked — quote generated but not sent or saved yet
pub const STATUS_UNSENT: i32 = 2;
 
/// Saved with incomplete fields OR printed
pub const STATUS_PENDING: i32 = 3;
 
/// All fields filled and saved — read-only in the frontend modal
pub const STATUS_OK: i32 = 4;

/// All products cancelled from the supplier
pub const STATUS_CANCELLED: i32 = 5;

// =============================================================================
// Status transition validation
// =============================================================================
 
/// Returns true if transitioning from `from` to `to` is a valid forward step.
///
/// Transitions are forward-only — going backwards or skipping states
/// is explicitly rejected by the service layer before any DB write.
///
/// Valid transitions:
///   created (1) → unsent  (2)  clicking "Generar" on the supplier row
///   unsent  (2) → pending (3)  printing OR saving with incomplete fields
///   unsent  (2) → ok      (4)  saving with ALL fields complete on first save
///   pending (3) → ok      (4)  completing remaining fields after partial save
///
/// Called by: service::patch_purchase_quote before applying any DB change.
pub fn is_valid_transition(from: i32, to: i32) -> bool {
    matches!(
        (from, to),
        (STATUS_CREATED, STATUS_UNSENT) | // created → unsent
        (STATUS_UNSENT, STATUS_PENDING) | // unsent  → pending
        (STATUS_UNSENT, STATUS_OK) | // unsent  → ok        (all fields filled on first save)
        (STATUS_UNSENT, STATUS_CANCELLED) | // unsent  → cancelled (all fields descarded on first save) 
        (STATUS_PENDING, STATUS_PENDING) | // pending → pending   (unchanged)
        (STATUS_PENDING, STATUS_OK) | // pending → ok        (fields completed after partial save)
        (STATUS_PENDING, STATUS_CANCELLED)   // pending → cancelled
    )
}
