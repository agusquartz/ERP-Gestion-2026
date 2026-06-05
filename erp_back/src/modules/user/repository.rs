use crate::shared::db_config;
use crate::modules::user::model::{self, Permission};

//Queries the Database for a user with a certain username.
//Returns an Option with domain model mapped from the response, a None value,
//or a DbError
//
//GIVEN                         |   RETURN
//query_user_by_name("chyrnia") |   Ok(User { id: 1, username: "chyrnia" ... })
//query_user_by_name("naides")  |   Ok(None)
//This thing should'nt fail unless the db fails
pub async fn query_user_by_username(username: &str) -> Result<Option<model::User>, db_config::DbError> {
    let client = db_config::get_client().await?;
    
    let row_opt = client.query_opt("
        SELECT 
            u.id, 
            u.username, 
            u.employee_id, 
            u.pass_hash, 
            u.last_login_at, 
            u.created_at, 
            u.updated_at, 
            u.is_active, 
            r.name as role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = $1;
    ", &[&username]).await?;


    match row_opt {
        Some(row) => {
            let user = model::User {
                id: row.get("id"),
                username: row.get("username"),
                employee_id: row.get("employee_id"),
                password_hash: row.get("pass_hash"),
                last_login_at: row.get("last_login_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                is_active: row.get("is_active"),
                role_name: row.get("role_name")
            };
            Ok(Some(user))
        },
        None => Ok(None),
    }
}

pub async fn query_user_permissions(user_id: i32) -> Result<Vec<Permission>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = client
        .query(
            "
            SELECT p.id, p.code, p.description
            FROM users u
            JOIN roles_permissions rp ON rp.role_id = u.role_id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE u.id = $1;
            ",
            &[&user_id],
        )
        .await?;

    let permissions = rows
        .into_iter()
        .map(|row| Permission {
            id: row.get("id"),
            code: row.get("code"),
            description: row.get("description"),
        })
        .collect();

    Ok(permissions)
}

pub async fn query_user_by_id(user_id: i32) -> Result<Option<model::User>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let row_opt = client.query_opt(
    "
        SELECT 
            u.id, 
            u.username, 
            u.employee_id, 
            u.pass_hash, 
            u.last_login_at, 
            u.created_at, 
            u.updated_at, 
            u.is_active, 
            r.name as role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1;
        ",
        &[&user_id],
    ).await?;

    match row_opt {
        Some(row) => {
            let user = model::User {
                id: row.get("id"),
                username: row.get("username"),
                employee_id: row.get("employee_id"),
                password_hash: row.get("pass_hash"),
                last_login_at: row.get("last_login_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                is_active: row.get("is_active"),
                role_name: row.get("role_name")
            };
            Ok(Some(user))
        }
        None => Ok(None),
    }
}