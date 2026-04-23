
/// Core product entity.
///
/// Represents the main `products` table without relational expansions.
/// Relations (category, brand, taxes) are handled separately via aggregates.
#[derive(Debug, Clone)]
pub struct Product {
    pub id: i32,
    pub code: String,
    pub description: String,
    pub cost: f64,
    pub price: f64,
    pub stock: i32,
    pub category_id: i32,
    pub brand_id: Option<i32>,
    pub is_active: bool,
}

/// Category entity.
///
/// Represents the `categories` table.
#[derive(Debug, Clone)]
pub struct Category {
    pub id: i32,
    pub name: String,
}

/// Brand entity.
///
/// Represents the `brands` table.
#[derive(Debug, Clone)]
pub struct Brand {
    pub id: i32,
    pub name: String,
}

/// Tax entity.
///
/// Represents the `taxes` table.
/// Used in many-to-many relation with products.
#[derive(Debug, Clone)]
pub struct Tax {
    pub id: i32,
    pub name: String,
    pub percentage: f64,
}

/// Aggregate representing a product with all its related data.
///
/// This structure is built from joined queries and represents
/// a fully hydrated domain object.
///
/// Includes:
/// - Product (base entity)
/// - Category (required)
/// - Brand (optional)
/// - Taxes (many-to-many)
///
/// Used for:
/// - API responses
/// - Business logic requiring full product context
#[derive(Debug, Clone)]
pub struct ProductAggregate {
    pub product: Product,
    pub category: Category,
    pub brand: Option<Brand>,
    pub taxes: Vec<Tax>,
}