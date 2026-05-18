/// Core supplier entity.
///
/// Represents the main `suppliers` table without relational expansions.
/// Relations with categories are handled through `SupplierAggregate`.
#[derive(Debug, Clone)]
pub struct Supplier {
    pub id: i32,
    pub name: String,
    pub address: Option<String>,
    pub email: String,
    pub is_active: bool,
    pub credit_limit: f64,
    pub curr_credit: f64,
}

/// Category entity.
///
/// Represents the `categories` table.
/// Suppliers are related to categories through `category_suppliers`.
#[derive(Debug, Clone)]
pub struct Category {
    pub id: i32,
    pub name: String,
}

/// Aggregate representing a supplier with its related categories.
///
/// Built from joined queries:
/// - suppliers
/// - category_suppliers
/// - categories
///
/// Used for:
/// - API responses
/// - supplier listing with category filtering
/// - business logic that requires supplier-category context
#[derive(Debug, Clone)]
pub struct SupplierAggregate {
    pub supplier: Supplier,
    pub categories: Vec<Category>,
}