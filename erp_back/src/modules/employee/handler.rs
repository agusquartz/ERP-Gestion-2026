use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use serde::Deserialize;

use crate::modules::employee::{
    dto::{
        EmployeeListQuery,
        create::CreateEmployeeDto,
        response::{
            EmployeeResponse,
            ListEmployeesView,
            PayrollProcessSummaryDto,
        },
        payroll::{
            TriggerPayrollDto,
            UpdatePayrollStatusDto,
        },
    },
    service,
};


// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────
pub async fn get_employees(
    Query(query): Query<EmployeeListQuery>,
) -> Result<Json<ListEmployeesView>, (StatusCode, String)> {
    match service::get_employees(query).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                e.to_string(),
        )),
    }
}

pub async fn get_employee_by_id(
    Path(id): Path<i32>,
) -> Result<Json<EmployeeResponse>, (StatusCode, String)> {
    match service::get_employee_by_id(id).await {
        Ok(Some(employee)) => Ok(Json(employee)),
        Ok(None) => Err((StatusCode::NOT_FOUND,"Employee not found".to_string())), 
        Err(e) => {
            eprintln!("Error: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

pub async fn create_employee(
    Json(dto): Json<CreateEmployeeDto>,
) -> Result<Json<EmployeeResponse>, (StatusCode, String)> {
    match service::create_employee(dto).await {
        Ok(employee) => Ok(Json(employee)),
        Err(e) => {
            eprintln!("Error: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to create employee".to_string(),
            ))
        }
    }
}

pub async fn run_monthly_payroll(
    Json(payload): Json<TriggerPayrollDto>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
    match service::calculate_monthly_payroll(payload.start_date, payload.end_date, payload.pay_date, payload.excluded_employee_ids.as_deref().unwrap_or(&[])).await {
        Ok(process_id) => Ok((
            StatusCode::CREATED,
            Json(serde_json::json!({
                "status": "success",
                "message": "Payroll computed successfully",
                "payroll_process_id": process_id

            })),
        )),
        Err(e) => {
            eprintln!("Payroll calculation failed: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to compute payroll: {}", e),
            ))
        }
    }
}


pub async fn update_payroll_status(
    Path(id): Path<i32>,
    Json(payload): Json<UpdatePayrollStatusDto>,
) -> Result<StatusCode, (StatusCode, String)> {
    match service::update_payroll_status(id, payload.action).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT), // 204 No Content is ideal for successful state modifications
        Err(service::ServiceError::Validation(msg)) => Err((StatusCode::BAD_REQUEST, msg)),
        Err(e) => {
            eprintln!("Failed to update payroll status: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error updating payroll run status".to_string(),
            ))
        }
    }
}

pub async fn get_historical_payroll(
    Path(process_id): Path<i32>,
) -> Result<Json<Vec<EmployeeResponse>>, (StatusCode, String)> {
    match service::get_historical_payroll(process_id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => {
            eprintln!("Failed to retrieve historical payroll run: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to retrieve historical payroll: {}", e),
            ))
        }
    }
}

pub async fn get_payroll_processes() -> Result<Json<Vec<PayrollProcessSummaryDto>>, (StatusCode, String)> {
    match service::get_processes().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => {
            eprintln!("Failed to retrieve payroll processes");
            Err((StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to retrieve payroll processes list")
                    ))
        }
    }
}
