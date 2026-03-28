use std::env;

use axum::{
    extract::Json,
    response::IntoResponse,
    http::StatusCode,
    extract::Extension,
};
use serde::Deserialize;
use tower_cookies::cookie::time;
use tower_cookies::{Cookies, Cookie};

use crate::modules::auth::middleware::jwt::{create_jwt, Claims};
use crate::modules::auth::middleware::csrf::generate_csrf;
use crate::modules::user::service::get_user_by_name;
use crate::utils::argon2::verify_password;
use crate::shared::config::CONFIG;

/// Structure representing the login request payload.
///
/// # Fields
/// - `username`: The user's login name
/// - `password`: The user's password
#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// Handler that returns the JWT claims of the authenticated user.
///
/// Extracts the claims stored in the request extensions by the
/// `auth_middleware` and returns them as JSON.
///
/// # Example
/// ```
/// GET /auth/whoami
/// Response: { "sub": "user123", "iat": 1670000000, "exp": 1670003600 }
/// ```
pub async fn whoami(Extension(claims): Extension<Claims>) -> Json<Claims> {
    Json(claims)
}

/// Handles user login.
///
/// Steps performed:
/// 1. Validate username and password (demo validation in this example).
/// 2. Generate a JWT token for authenticated sessions.
/// 3. Generate a CSRF token for request protection.
/// 4. Set cookies:
///    - `jwt` → HttpOnly, Secure, SameSite=None
///    - `csrf` → Secure, SameSite=None (accessible by JS)
///
/// # Example
/// ```http
/// POST /auth/login
/// Content-Type: application/json
///
/// { "username": "user", "password": "password" }
///
/// ```
pub async fn login(
    cookies: Cookies,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, impl IntoResponse> {

    // 0. Get user from database
    let user = match get_user_by_name(&payload.username).await {
        Ok(user) => user,
        Err(_) => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "Invalid credentials"})),
            ));
        }
    };

    // -----------------------------
    // 1. Validate credentials
    // -----------------------------
    let is_valid = verify_password(&payload.password, &user.password_hash)
    .map_err(|_| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(serde_json::json!({"error": "Password verification failed"}))
    ))?;

    // -----------------------------
    // 2. Create JWT
    // -----------------------------
    let ttl_seconds = CONFIG.jwt_ttl_seconds;

    let token = create_jwt(&payload.username, ttl_seconds)
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Token creation failed"}))
        ))?;

    // -----------------------------
    // 3. Create CSRF token
    // -----------------------------
    let csrf_token = generate_csrf();

    // -----------------------------
    // 4. Set cookies
    // -----------------------------
    // JWT cookie (HttpOnly)
    let mut jwt_cookie = Cookie::new("jwt", token);
    jwt_cookie.set_path("/");
    jwt_cookie.set_http_only(true);
    jwt_cookie.set_secure(true);
    jwt_cookie.set_same_site(tower_cookies::cookie::SameSite::Strict);
    jwt_cookie.set_domain(&CONFIG.cookie_domain);
    cookies.add(jwt_cookie);

    // CSRF cookie (accessible by JS)
    let mut csrf_cookie = Cookie::new("csrfToken", csrf_token.clone());
    csrf_cookie.set_path("/");
    csrf_cookie.set_secure(true);
    csrf_cookie.set_same_site(tower_cookies::cookie::SameSite::Strict);
    csrf_cookie.set_domain(&CONFIG.cookie_domain);
    cookies.add(csrf_cookie);

    // -----------------------------
    // 5. Return CSRF token in JSON
    // -----------------------------
    Ok(Json(serde_json::json!({})))
}

pub async fn logout(cookies: Cookies) -> impl IntoResponse {
    let mut jwt_cookie = Cookie::new("jwt", "");
    jwt_cookie.set_path("/");
    jwt_cookie.set_max_age(time::Duration::seconds(0));

    let mut csrf_cookie = Cookie::new("csrfToken", "");
    csrf_cookie.set_path("/");
    csrf_cookie.set_max_age(time::Duration::seconds(0));

    cookies.add(jwt_cookie);
    cookies.add(csrf_cookie);

    StatusCode::OK
}