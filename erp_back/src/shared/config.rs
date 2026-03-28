use once_cell::sync::Lazy;
use std::env;
use url::Url;

/// Global application configuration
pub static CONFIG: Lazy<AppConfig> = Lazy::new(|| {
    AppConfig::from_env()
});

/// Strongly typed config
pub struct AppConfig {
    pub jwt_secret: String,
    pub jwt_ttl_seconds: u64,
    pub cors_allowed_origin: String,
    pub cookie_domain: String,
    pub csrf_token_bytes: usize,
}

impl AppConfig {

    // --- Load config from environment ---
    fn from_env() -> Self {
        let origin = env::var("CORS_ALLOWED_ORIGIN")
            .expect("CORS_ALLOWED_ORIGIN must be set");

        let url = Url::parse(&origin)
            .expect("CORS_ALLOWED_ORIGIN must be a valid URL");

        let domain = url
            .host_str()
            .expect("Invalid host in CORS_ALLOWED_ORIGIN")
            .to_string();
        Self {
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),

            jwt_ttl_seconds: env::var("JWT_TTL_SECONDS")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .expect("JWT_TTL_SECONDS must be a number"),

            cors_allowed_origin: origin,
            cookie_domain: domain,

            csrf_token_bytes: env::var("CSRF_TOKEN_BYTES")
                .expect("CSRF_TOKEN_BYTES must be set")
                .parse()
                .expect("CSRF_TOKEN_BYTES must be a number"),
        }
    }
}