use crate::shared::db_config;

/// Tipo de error unificado para la capa de servicio del módulo de ventas y reportes.
#[derive(Debug)]
pub enum ServiceError {
    /// Errores originados en la capa de persistencia/base de datos.
    Database(db_config::DbError),
    /// Errores causados por parámetros inválidos o violaciones de reglas de negocio.
    Validation(ValidationError),
    /// Indica que el reporte o entidad solicitada no existe.
    NotFound(Context),
    /// Errores originados por fallas en dependencias externas.
    Dependency(DependencyError),
}

/// Información de contexto para errores del tipo "Not Found".
#[derive(Debug)]
pub struct Context {
    /// Nombre de la entidad o reporte (ej: "sales_report", "invoice").
    pub entity: &'static str,
    /// Identificador opcional si aplica (o None si se busca por string).
    pub id: Option<i32>,
}

/// Representa un error de validación en los filtros de entrada del reporte.
#[derive(Debug)]
pub struct ValidationError {
    pub context: String,
}

/// Representa una falla en un módulo externo del cual dependemos.
#[derive(Debug)]
pub struct DependencyError {
    pub system: &'static str,
    pub message: String,
}

/// Conversión automática de un DbError genérico a nuestro ServiceError del módulo.
impl From<db_config::DbError> for ServiceError {
    fn from(value: db_config::DbError) -> Self {
        // Si el repositorio tira un NotFound interno, lo mapeamos al NotFound semántico del servicio
        match value {
            db_config::DbError::NotFound => Self::NotFound(Context {
                entity: "sales_report",
                id: None,
            }),
            _ => Self::Database(value),
        }
    }
}

/// Formateo estético del error para logs o respuestas.
impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::Database(err) => write!(f, "database error: {}", err),
            ServiceError::Validation(err) => write!(f, "validation error: {}", err.context),
            ServiceError::NotFound(context) => write!(f, "The requested {} does not exist", context.entity),
            ServiceError::Dependency(err) => write!(f, "{} system has failed: {}", err.system, err.message),
        }
    }
}

impl std::error::Error for ServiceError {}