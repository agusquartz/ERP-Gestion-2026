

use std::collections::BTreeMap;

use tokio_postgres::Row;


use crate::db_config::{self, DbError};

use crate::modules::purchase_request::dto::create::CreatePurchaseRequestDto;
use crate::modules::purchase_request::model::{
    ProductSearch,
    PurchaseRequest,
    PurchaseRequestDetail,
    PurchaseRequestEmployee,
    PurchaseRequestProduct,
    PurchaseRequestWithDetails,
};

// ============================================================
// REPOSITORY
// ============================================================


  
    const BASE_QUERY: &str = r#"
        SELECT
            pr.id          AS purchase_request_id,
            pr.created_at  AS purchase_request_created_at,
            pr.employee_id AS purchase_request_employee_id,

            e.id           AS employee_id,
            e.name         AS employee_name,
            e.surname      AS employee_surname,

            prd.id         AS detail_id,
            prd.quantity   AS detail_quantity,

            p.id           AS product_id,
            p.description  AS product_description,
            p.code         AS product_code

        FROM purchase_requests pr
        JOIN employees e ON pr.employee_id = e.id
        LEFT JOIN purchase_request_details prd
            ON pr.id = prd.purchase_request_id
        LEFT JOIN products p
            ON prd.product_id = p.id
    "#;

    // ---------------- CREATE PURCHASE REQUEST ----------------

    pub async fn create_purchase_request(
        dto: CreatePurchaseRequestDto,
    ) -> Result<PurchaseRequestWithDetails, DbError> {
        if dto.details.is_empty() {
            return Err(DbError::Other(
                "Purchase request must contain at least one detail".to_string(),
            ));
        }

        let mut client = db_config::get_client().await?;
        let tx = client.transaction().await?;

        let row = tx
            .query_one(
                r#"
                INSERT INTO purchase_requests (created_at, employee_id)
                VALUES ($1, $2)
                RETURNING id
                "#,
                &[&dto.created_at, &dto.employee_id],
            )
            .await?;

        let purchase_request_id: i32 = row.get("id");

        for detail in dto.details {
            if detail.quantity <= 0 {
                return Err(DbError::Other(
                    "Product quantity must be greater than zero".to_string(),
                ));
            }

            tx.execute(
                r#"
                INSERT INTO purchase_request_details
                (purchase_request_id, product_id, quantity)
                VALUES ($1, $2, $3)
                "#,
                &[
                    &purchase_request_id,
                    &detail.product_id,
                    &detail.quantity,
                ],
            )
            .await?;
        }

        tx.commit().await?;

        get_purchase_request_by_id(purchase_request_id)
            .await?
            .ok_or(DbError::NotFound)
    }

    // ---------------- GET PURCHASE REQUEST BY ID ----------------

    pub async fn get_purchase_request_by_id(
        id: i32,
    ) -> Result<Option<PurchaseRequestWithDetails>, DbError> {
        let client = db_config::get_client().await?;

        let sql = format!(
            r#"
            {BASE_QUERY}
            WHERE pr.id = $1
            ORDER BY pr.id, prd.id
            "#
        );

        let rows = client.query(&sql, &[&id]).await?;
        let data = rows_to_aggregate(rows);

        Ok(data.into_iter().next())
    }

    // ---------------- LIST PURCHASE REQUESTS ----------------
    //
    // GET /purchase-requests
    // GET /purchase-requests?contains=juan
    //
    // Filtra por:
    // - id de solicitud
    // - nombre del empleado
    // - apellido del empleado
    // - descripción del producto
    // - código del producto

    pub async fn get_purchase_requests(
        contains: Option<String>,
    ) -> Result<Vec<PurchaseRequestWithDetails>, DbError> {
        let client = db_config::get_client().await?;

        let mut sql = BASE_QUERY.to_string();
        let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();

        let mut pattern = String::new();

        if let Some(value) = contains {
            pattern = format!("%{}%", value);

            sql.push_str(
                r#"
                WHERE (
                    pr.id::text ILIKE $1
                    OR e.name ILIKE $1
                    OR e.surname ILIKE $1
                    OR EXISTS (
                        SELECT 1
                        FROM purchase_request_details prd2
                        JOIN products p2 ON prd2.product_id = p2.id
                        WHERE prd2.purchase_request_id = pr.id
                        AND (
                            p2.description ILIKE $1
                            OR p2.code ILIKE $1
                            OR p2.id::text ILIKE $1
                        )
                    )
                )
                "#,
            );

            params.push(&pattern);
        }

        sql.push_str(" ORDER BY pr.id DESC, prd.id");

        let rows = client.query(&sql, &params).await?;

        Ok(rows_to_aggregate(rows))
    }

    // ---------------- SEARCH PRODUCTS ----------------
    //
    // GET /purchase-request-products
    // GET /purchase-request-products?contains=mouse
    //
    // Esta función sirve para buscar productos al crear una solicitud de compra.

    pub async fn search_products(
        contains: Option<String>,
    ) -> Result<Vec<ProductSearch>, DbError> {
        let client = db_config::get_client().await?;

        let mut sql = String::from(
            r#"
            SELECT
                p.id,
                p.description,
                p.code
            FROM products p
            "#,
        );

        let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = Vec::new();
        let mut pattern = String::new();

        if let Some(value) = contains {
            pattern = format!("%{}%", value);

            sql.push_str(
                r#"
                WHERE (
                    p.description ILIKE $1
                    OR p.code ILIKE $1
                    OR p.id::text ILIKE $1
                )
                "#,
            );

            params.push(&pattern);
        }

        sql.push_str(" ORDER BY p.description ASC");

        let rows = client.query(&sql, &params).await?;

        Ok(rows
            .into_iter()
            .map(|row| ProductSearch {
                id: row.get("id"),
                description: row.get("description"),
                code: row.get("code"),
            })
            .collect())
    }

    // ---------------- ROW AGGREGATION HELPER ----------------

    fn rows_to_aggregate(rows: Vec<Row>) -> Vec<PurchaseRequestWithDetails> {
        let mut map: BTreeMap<i32, PurchaseRequestWithDetails> = BTreeMap::new();

        for row in rows {
            let purchase_request_id: i32 = row.get("purchase_request_id");

            let entry = map
                .entry(purchase_request_id)
                .or_insert_with(|| PurchaseRequestWithDetails {
                    purchase_request: PurchaseRequest {
                        id: purchase_request_id,
                        created_at: row.get("purchase_request_created_at"),
                        employee_id: row.get("purchase_request_employee_id"),
                    },

                    employee: PurchaseRequestEmployee {
                        id: row.get("employee_id"),
                        name: row.get("employee_name"),
                        surname: row.get("employee_surname"),
                    },

                    details: vec![],
                });

            let detail_id: Option<i32> = row.get("detail_id");

            if let Some(detail_id) = detail_id {
                entry.details.push(PurchaseRequestDetail {
                    id: detail_id,
                    purchase_request_id,
                    quantity: row.get("detail_quantity"),

                    product: PurchaseRequestProduct {
                        id: row.get("product_id"),
                        description: row.get("product_description"),
                        code: row.get("product_code"),
                    },
                });
            }
        }

        map.into_values().collect()
    }
