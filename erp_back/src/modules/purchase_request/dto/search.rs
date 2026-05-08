use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductSearchResponseDto {
    pub id: i32,
    pub description: String,
    pub code: String,
}