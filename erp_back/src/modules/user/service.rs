use crate::shared::errors::AppError;
use crate::modules::user::repository::query_user_by_username;
use crate::modules::user::model;

pub async fn get_user_by_name(username: &str) -> Result<model::User, AppError> {
    let usr_opt = query_user_by_username(username).await?;
    usr_opt.ok_or(AppError::UserNotFound(username.to_string()))
}


