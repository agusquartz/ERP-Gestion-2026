use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub employee_id: Option<i32>,
    pub password_hash: String,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub role_name: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Permission {
    pub id: i32,
    pub code: String,
    pub description: Option<String>
}