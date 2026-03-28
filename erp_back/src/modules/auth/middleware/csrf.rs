use rand::{distributions::Alphanumeric, Rng};
use crate::shared::config::CONFIG;


/// Generates a random CSRF token.
///
/// **CSRF (Cross-Site Request Forgery) tokens** are used to prevent
/// unauthorized actions performed on behalf of a logged-in user.
///
/// # Returns
/// A random alphanumeric string whose length is defined by
/// the `CSRF_TOKEN_BYTES` environment variable.
///
/// # Example
/// ```
/// let token = generate_csrf();
/// println!("CSRF token: {}", token);
/// ```
pub fn generate_csrf() -> String {
    let size = CONFIG.csrf_token_bytes;
    
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(size)
        .map(char::from)
        .collect()
}