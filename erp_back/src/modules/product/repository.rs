use std::collections::BTreeMap;
use chrono::NaiveDate;

use tokio_postgres::types::ToSql;
use tokio_postgres::Row;

use crate::modules::product::dto::update::PatchProductDto;
use crate::modules::product::model;
use crate::shared::db_config;


/// Base SELECT used to retrieve products with all related data.
///
/// Includes:
/// - Category (INNER JOIN)
/// - Brand (LEFT JOIN)
/// - Taxes (LEFT JOIN, many-to-many)
///
/// The result is a flattened row set that must be aggregated
/// into domain structures (`ProductAggregate`).
const PRODUCT_SELECT_BASE: &str = r#"
SELECT
    p.id AS product_id,
    p.code AS product_code,
    p.description AS product_description,
    p.cost::float8 AS product_cost,
    p.price::float8 AS product_price,
    p.stock AS product_stock,
    p.is_active AS product_is_active,
    p.category_id AS category_id,
    c.name AS category_name,
    p.brand_id AS brand_id,
    b.name AS brand_name,
    t.id AS tax_id,
    t.name AS tax_name,
    t.percentage::float8 AS tax_percentage
FROM products p
JOIN categories c
    ON c.id = p.category_id
LEFT JOIN brands b
    ON b.id = p.brand_id
LEFT JOIN product_taxes pt
    ON pt.product_id = p.id
LEFT JOIN taxes t
    ON t.id = pt.tax_id
"#;


/// Transforms a flat list of database rows into `ProductAggregate` structures.
///
/// This function:
/// - Groups rows by `product_id`
/// - Builds a single `ProductAggregate` per product
/// - Deduplicates taxes (due to JOIN explosion)
///
/// # Notes
///
/// - Uses `BTreeMap` to preserve deterministic ordering
/// - Assumes rows are ordered by `product_id`
fn rows_to_aggregates(rows: Vec<Row>) -> Vec<model::ProductAggregate> {
    let mut map: BTreeMap<i32, model::ProductAggregate> = BTreeMap::new();

    for row in rows {
        let product_id: i32 = row.get("product_id");

        let category = model::Category {
            id: row.get("category_id"),
            name: row.get("category_name"),
        };

        let brand_id: Option<i32> = row.get("brand_id");
        let brand_name: Option<String> = row.get("brand_name");
        let brand = match (brand_id, brand_name) {
            (Some(id), Some(name)) => Some(model::Brand { id, name }),
            _ => None,
        };

        let entry = map.entry(product_id).or_insert_with(|| model::ProductAggregate {
            product: model::Product {
                id: product_id,
                code: row.get("product_code"),
                description: row.get("product_description"),
                cost: row.get("product_cost"),
                price: row.get("product_price"),
                stock: row.get("product_stock"),
                category_id: row.get("category_id"),
                brand_id,
                is_active: row.get("product_is_active"),
            },
            category,
            brand,
            taxes: Vec::new(),
        });

        let tax_id: Option<i32> = row.get("tax_id");
        if let Some(tax_id) = tax_id {
            if !entry.taxes.iter().any(|t| t.id == tax_id) {
                entry.taxes.push(model::Tax {
                    id: tax_id,
                    name: row.get("tax_name"),
                    percentage: row.get("tax_percentage"),
                });
            }
        }
    }

    map.into_values().collect()
}


/// Retrieves all products or filters them by a search term.
///
/// # Arguments
///
/// - `contains`: Optional string used to filter by `code` or `description`
///
/// # Behavior
///
/// - If `contains` is `Some`, applies a case-insensitive filter (`ILIKE`)
/// - If `None`, returns all products
///
/// # Returns
///
/// A list of fully populated `ProductAggregate`
pub async fn query_products(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
) -> Result<Vec<model::ProductAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{} 
	WHERE p.id IN (
			SELECT DISTINCT p2.id
			FROM products AS p2
			INNER JOIN categories AS c2 ON p2.category_id = c2.id
			LEFT JOIN brands AS b2 ON b2.id = p2.brand_id
			LEFT JOIN product_taxes AS pt2 ON p2.id = pt2.product_id
			LEFT JOIN taxes AS t2 ON t2.id = pt2.tax_id
			WHERE ($1::INT  IS NULL OR p2.id                      > $1)
			AND ($3::TEXT IS NULL OR b2.name::TEXT ILIKE '%' || $3 || '%' OR c2.name::TEXT ILIKE '%' || $3 || '%')
			ORDER BY p2.id ASC
			LIMIT $4
			)
	AND($2::TEXT IS NULL OR p.description ILIKE '%' || $2 || '%' OR p.code ILIKE '%' || $2 || '%')
	ORDER BY p.id ASC",
        PRODUCT_SELECT_BASE
    );

    //let rows = client.query(&sql, &[&cursor, &search, &filter, &limit]).await?;
    let rows = match client.query(&sql, &[&cursor, &search, &filter, &limit]).await {
        Ok(rows) => rows,
        Err(e) => {
            dbg!(&e);
            return Err(db_config::DbError::Other("Query error".to_string()))
        },
    };
    Ok(rows_to_aggregates(rows))
}


/// Retrieves a single product by its ID.
///
/// # Returns
///
/// - `Ok(Some(ProductAggregate))` if found
/// - `Ok(None)` if no product exists with the given ID
pub async fn query_product_by_id(
    id: i32,
) -> Result<Option<model::ProductAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE p.id = $1 ORDER BY product_id, tax_id",
        PRODUCT_SELECT_BASE
    );

    let rows = client.query(&sql, &[&id]).await?;
    let mut products = rows_to_aggregates(rows);

    Ok(products.pop())
}


/// Partially updates a product and optionally its taxes.
///
/// This operation is transactional:
/// - Updates product fields dynamically
/// - Replaces tax relationships if provided
///
/// # Behavior
///
/// - Only updates fields present in `PatchProductDto`
/// - If `tax_ids` is provided, replaces all existing taxes
/// - If product does not exist, returns `Ok(None)`
///
/// # Returns
///
/// - `Ok(Some(ProductAggregate))` → updated product
/// - `Ok(None)` → product not found
///
/// # Notes
///
/// - Uses dynamic SQL generation for partial updates
/// - Uses boxed parameters to support heterogeneous types
pub async fn patch_product(
    id: i32,
    patch: &PatchProductDto,
) -> Result<Option<model::ProductAggregate>, db_config::DbError> {
    let mut client = db_config::get_client().await?;
    let tx = client.transaction().await?;

    let exists = tx
        .query_opt("SELECT 1 FROM products WHERE id = $1", &[&id])
        .await?;

    if exists.is_none() {
        tx.rollback().await?;
        return Ok(None);
    }

    let mut sets: Vec<String> = Vec::new();
    let mut owned_params: Vec<Box<dyn ToSql + Sync + Send + 'static>> = Vec::new();
    let mut idx: i32 = 0;

    if let Some(v) = patch.code.as_ref() {
        idx += 1;
        sets.push(format!("code = ${}", idx));
        owned_params.push(Box::new(v.clone()));
    }

    if let Some(v) = patch.description.as_ref() {
        idx += 1;
        sets.push(format!("description = ${}", idx));
        owned_params.push(Box::new(v.clone()));
    }

    if let Some(v) = patch.cost {
        idx += 1;
        sets.push(format!("cost = ${}", idx));
        owned_params.push(Box::new(v));
    }

    if let Some(v) = patch.price {
        idx += 1;
        sets.push(format!("price = ${}", idx));
        owned_params.push(Box::new(v));
    }

    if let Some(v) = patch.category_id {
        idx += 1;
        sets.push(format!("category_id = ${}", idx));
        owned_params.push(Box::new(v));
    }

    if let Some(v) = patch.brand_id {
        idx += 1;
        sets.push(format!("brand_id = ${}", idx));
        owned_params.push(Box::new(v));
    }

    if let Some(v) = patch.is_active {
        idx += 1;
        sets.push(format!("is_active = ${}", idx));
        owned_params.push(Box::new(v));
    }

    if !sets.is_empty() {
        idx += 1;
        let sql = format!("UPDATE products SET {} WHERE id = ${}", sets.join(", "), idx);
        owned_params.push(Box::new(id));

        let mut param_refs: Vec<&(dyn ToSql + Sync)> = Vec::with_capacity(owned_params.len());
        for p in &owned_params {
            param_refs.push(&**p);
        }

        let stmt = tx.prepare(&sql).await?;
        tx.execute(&stmt, &param_refs).await?;
    }

    if let Some(tax_ids) = patch.tax_ids.as_ref() {
        tx.execute("DELETE FROM product_taxes WHERE product_id = $1", &[&id])
            .await?;

        for tax_id in tax_ids {
            tx.execute(
                "INSERT INTO product_taxes (product_id, tax_id) VALUES ($1, $2)",
                &[&id, tax_id],
            )
            .await?;
        }
    }

    // Fetch updated entity
    let sql = format!(
        "{} WHERE p.id = $1 ORDER BY product_id, tax_id",
        PRODUCT_SELECT_BASE
    );
    let rows = tx.query(&sql, &[&id]).await?;
    let mut products = rows_to_aggregates(rows);

    tx.commit().await?;
    Ok(products.pop())
}

/// Retrieves a single product by its exact code.
///
/// # Arguments
///
/// - `code`: Exact product code used to identify the product
///
/// # Behavior
///
/// - Performs an exact match against `p.code`
/// - Returns the product with all related data:
///   - Category
///   - Brand
///   - Taxes
///
/// # Returns
///
/// - `Ok(Some(ProductAggregate))` if a matching product is found
/// - `Ok(None)` if no product exists with the given code
///
/// # Notes
///
/// - Intended for barcode/POS/product scanner workflows
/// - Uses `query_opt` because product codes are expected to be unique
/// - Reuses `rows_to_aggregates` to build the aggregate structures
pub async fn get_product_by_code(
    code: &str,
) -> Result<Option<model::ProductAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;


    let row = client
        .query_opt(
            &format!("{} WHERE p.code = $1", PRODUCT_SELECT_BASE),
            &[&code],
        )
        .await?;
    
    Ok(row.map(|r| rows_to_aggregates(vec![r]).remove(0)))
}

pub async fn set_stock(
    tx: &tokio_postgres::Transaction<'_>,
    product_id: i32,
    new_stock: i32,
) -> Result<(), db_config::DbError> {
    tx.execute(
        "UPDATE products SET stock = $1 WHERE id = $2",
        &[&new_stock, &product_id],
    )
    .await?;

    Ok(())
}

pub async fn get_stock(
    tx: &tokio_postgres::Transaction<'_>,
    product_id: i32,
) -> Result<i32, db_config::DbError> {
    let row = tx
        .query_one("SELECT stock FROM products WHERE id = $1", &[&product_id])
        .await?;

    Ok(row.get("stock"))
}

pub async fn decrease_stock(
    tx: &tokio_postgres::Transaction<'_>,
    product_id: i32,
    amount: i32,
) -> Result<bool, db_config::DbError> {
    let rows = tx.execute(
        "UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND stock >= $1",
        &[&amount, &product_id],
    ).await?;

    Ok(rows == 1)
}

pub async fn increase_stock(
    tx: &tokio_postgres::Transaction<'_>,
    product_id: i32,
    amount: i32,
) -> Result<(), db_config::DbError> {
    tx.execute(
        "UPDATE products
         SET stock = stock + $1
         WHERE id = $2",
        &[&amount, &product_id],
    )
    .await?;

    Ok(())
}
