#[derive(Debug, Clone)]
pub struct Product {
    pub id: i32,
    pub code: String,
    pub description: String,
    pub cost: f64,
    pub price: f64,
    pub category_id: i32,
    pub brand_id: Option<i32>,
    pub is_active: bool,
}

#[derive(Debug, Clone)]
pub struct Category {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct Brand {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct Tax {
    pub id: i32,
    pub name: String,
    pub percentage: f64,
}

#[derive(Debug, Clone)]
pub struct ProductAggregate {
    pub product: Product,
    pub category: Category,
    pub brand: Option<Brand>,
    pub taxes: Vec<Tax>,
}