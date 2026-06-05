use crate::modules::user::model::Permission;
use crate::shared::errors::AppError;
use crate::modules::user::repository::query_user_by_username;
use crate::modules::user::repository::query_user_permissions;
use crate::modules::user::repository::query_user_by_id;
use crate::modules::user::model;

pub async fn get_user_by_name(username: &str) -> Result<model::User, AppError> {
    let usr_opt = query_user_by_username(username).await?;
    usr_opt.ok_or(AppError::UserNotFound(username.to_string()))
}

pub async fn get_user_permissions(user_id: i32) -> Result<Vec<Permission>, AppError> {
    let user_opt = query_user_by_id(user_id).await?;
    user_opt.ok_or(AppError::UserNotFound(user_id.to_string()))?;

    let permissions = query_user_permissions(user_id).await?;
    Ok(permissions)
}