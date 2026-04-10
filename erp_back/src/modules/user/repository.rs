use crate::shared::db_config;
use crate::modules::user::model;

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
    let row_opt = client.query_opt("SELECT id, username, employee_id, pass_hash, last_login_at, created_at, updated_at, is_active FROM users WHERE users.username =  $1;", &[&username]).await?;
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
            };
            Ok(Some(user))
        },
        None => Ok(None),
    }
}
