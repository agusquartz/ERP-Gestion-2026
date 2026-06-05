//! argon2.rs
//!
//! Secure password hashing and verification using the Argon2id algorithm.
//!
//! This module provides two main functions:
//! - `hash_password` – Securely hashes a plaintext password.
//! - `verify_password` – Verifies a plaintext password against a stored hash.
//!
//! # Security Notes
//! - Uses **Argon2id**, the recommended Argon2 variant for password hashing.
//! - Generates a cryptographically secure random salt for each password.
//! - Parameters are embedded in the resulting hash string.
//! - Safe for database storage.
//!
//! The resulting hash string is in PHC string format, for example:
//! `$argon2id$v=19$m=32768,t=3,p=1$<salt>$<hash>`
//!
//! You should store this full string in your database.

use argon2::{Argon2, PasswordHasher, PasswordVerifier, Params};
use password_hash::{SaltString, PasswordHash};
use rand_core::OsRng;

/// Hash a plaintext password using Argon2id.
///
/// # Arguments
/// * `password` - A plaintext password as a string slice.
///
/// # Returns
/// * `Ok(String)` - A PHC-formatted hash string ready for storage.
/// * `Err(password_hash::Error)` - If hashing fails.
///
/// # Algorithm Configuration
/// - Memory cost: 32_768 KiB (32 MB)
/// - Time cost: 3 iterations
/// - Parallelism: 1 lane
/// - Variant: Argon2id (recommended hybrid variant)
///
/// # Example
/// ```
/// let hash = hash_password("my_secure_password")?;
/// println!("Hash: {}", hash);
/// ```
pub fn hash_password(password: &str) -> Result<String, password_hash::Error> {
    // Generate a cryptographically secure random salt.
    // A new salt MUST be generated for every password.
    let salt = SaltString::generate(&mut OsRng);

    // Configure Argon2 parameters.
    //
    // Params::new(memory_cost, time_cost, parallelism, output_length)
    //
    // - memory_cost is in KiB
    // - time_cost is the number of iterations
    // - parallelism is the number of lanes (threads)
    // - output_length = None uses default (32 bytes)
    let params = Params::new(
        32_768, // Memory cost (32 MB)
        3,      // Time cost (iterations)
        1,      // Parallelism (lanes)
        None,   // Default output length
    )?;

    // Create an Argon2 instance configured for Argon2id (recommended).
    let argon2 = Argon2::new(
        argon2::Algorithm::Argon2id,
        argon2::Version::V0x13,
        params,
    );

    // Hash the password using the generated salt.
    // The returned hash includes:
    // - Algorithm
    // - Version
    // - Parameters
    // - Salt
    // - Final hash
    let hash = argon2.hash_password(password.as_bytes(), &salt)?;

    // Convert the hash object to a PHC string.
    Ok(hash.to_string())
}

/// Verify a plaintext password against a stored Argon2 hash.
///
/// # Arguments
/// * `raw_password` - The plaintext password to verify.
/// * `hashed_password` - The previously stored PHC-formatted hash string.
///
/// # Returns
/// * `Ok(true)` if the raw_password is valid.
/// * `Ok(false)` if the raw_password does not match.
/// * `Err(password_hash::Error)` if the hash is malformed.
///
/// # Important
/// The parameters (memory, iterations, parallelism, algorithm)
/// are automatically read from the hash string itself.
/// This allows future parameter upgrades without breaking old hashes.
///
/// # Example
/// ```
/// let is_valid = verify_password("my_password", &stored_hash)?;
/// ```
pub fn verify_password(
    raw_password: &str,
    hashed_password: &str,
) -> Result<bool, password_hash::Error> {

    // Parse the PHC hash string.
    // This extracts algorithm, version, parameters, salt, and hash.
    let parsed_hash = PasswordHash::new(hashed_password)?;

    // Use default Argon2 configuration.
    // IMPORTANT:
    // The verify function reads the required parameters from the parsed hash.
    // This ensures compatibility with different configurations.
    let argon2 = Argon2::default();

    // verify_password returns Ok(()) if successful,
    // so we convert that to a boolean.
    Ok(
        argon2
            .verify_password(raw_password.as_bytes(), &parsed_hash)
            .is_ok()
    )
}