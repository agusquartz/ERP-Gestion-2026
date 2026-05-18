use std::collections::BTreeMap;

use tokio_postgres::Row;

use crate::modules::supplier::model;
use crate::shared::db_config;

/// Base SELECT used to retrieve suppliers with their related categories.
///
/// Includes:
/// - suppliers
/// - category_suppliers
/// - categories
///
/// Since one supplier can have many categories, this query returns a flat row set.
/// The rows must be grouped into `SupplierAggregate`.
const SUPPLIER_SELECT_BASE: &str = r#"
SELECT
    s.id AS supplier_id,
    s.name AS supplier_name,
    s.address AS supplier_address,
    s.email AS supplier_email,
    s.is_active AS supplier_is_active,
    s.credit_limit::float8 AS supplier_credit_limit,
    s.curr_credit::float8 AS supplier_curr_credit,

    c.id AS category_id,
    c.name AS category_name
FROM suppliers s
LEFT JOIN category_suppliers cs
    ON cs.supplier_id = s.id
LEFT JOIN categories c
    ON c.id = cs.category_id
"#;

/// Transforms flat database rows into `SupplierAggregate`.
///
/// Why this is needed:
///
/// A supplier can have many categories.
/// SQL JOIN returns one row per supplier-category pair.
///
/// Example:
///
/// supplier 1 + category 1
/// supplier 1 + category 2
/// supplier 1 + category 3
///
/// This function groups those rows into:
///
/// SupplierAggregate {
///     supplier,
///     categories: [cat1, cat2, cat3]
/// }
fn rows_to_aggregates(rows: Vec<Row>) -> Vec<model::SupplierAggregate> {
    let mut map: BTreeMap<i32, model::SupplierAggregate> = BTreeMap::new();

    for row in rows {
        let supplier_id: i32 = row.get("supplier_id");

        let entry = map.entry(supplier_id).or_insert_with(|| {
            model::SupplierAggregate {
                supplier: model::Supplier {
                    id: supplier_id,
                    name: row.get("supplier_name"),
                    address: row.get("supplier_address"),
                    email: row.get("supplier_email"),
                    is_active: row.get("supplier_is_active"),
                    credit_limit: row.get("supplier_credit_limit"),
                    curr_credit: row.get("supplier_curr_credit"),
                },
                categories: Vec::new(),
            }
        });

        let category_id: Option<i32> = row.get("category_id");
        let category_name: Option<String> = row.get("category_name");

        if let (Some(category_id), Some(category_name)) = (category_id, category_name) {
            if !entry.categories.iter().any(|c| c.id == category_id) {
                entry.categories.push(model::Category {
                    id: category_id,
                    name: category_name,
                });
            }
        }
    }

    map.into_values().collect()
}

/// Retrieves suppliers using optional filters.
///
/// Filters:
///
/// - `contains`:
///   Searches by supplier name, email, or address.
///
/// - `category_ids`:
///   Returns suppliers that contain ALL requested categories.
///
/// Example:
///
/// category_ids = [1, 2]
///
/// The supplier must have category 1 AND category 2.
///
/// If `category_ids` is empty, no category filter is applied.
pub async fn query_suppliers(
    contains: Option<&str>,
    category_ids: &[i32],
) -> Result<Vec<model::SupplierAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        r#"
        {}
        WHERE
            (
                $1::text IS NULL
                OR s.name ILIKE '%' || $1 || '%'
                OR s.email ILIKE '%' || $1 || '%'
                OR COALESCE(s.address, '') ILIKE '%' || $1 || '%'
            )
        AND
            (
                cardinality($2::int[]) = 0
                OR s.id IN (
                    SELECT cs_filter.supplier_id
                    FROM category_suppliers cs_filter
                    WHERE cs_filter.category_id = ANY($2::int[])
                    GROUP BY cs_filter.supplier_id
                    HAVING COUNT(DISTINCT cs_filter.category_id) = cardinality($2::int[])
                )
            )
        ORDER BY supplier_id, category_id
        "#,
        SUPPLIER_SELECT_BASE
    );

    let contains_param: Option<&str> = contains;
    let category_ids_param: Vec<i32> = category_ids.to_vec();

    let rows = client
        .query(&sql, &[&contains_param, &category_ids_param])
        .await?;

    Ok(rows_to_aggregates(rows))
}

/// Retrieves a single supplier by ID with its categories.
///
/// Returns:
/// - Ok(Some(SupplierAggregate)) if supplier exists
/// - Ok(None) if supplier does not exist
pub async fn query_supplier_by_id(
    id: i32,
) -> Result<Option<model::SupplierAggregate>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let sql = format!(
        r#"
        {}
        WHERE s.id = $1
        ORDER BY supplier_id, category_id
        "#,
        SUPPLIER_SELECT_BASE
    );

    let rows = client.query(&sql, &[&id]).await?;
    let mut suppliers = rows_to_aggregates(rows);

    Ok(suppliers.pop())
}

/// Retrieves only the categories associated with a supplier.
///
/// This is for:
///
/// GET /suppliers/{id}/categories
///
/// Returns:
/// - Ok(Some(Vec<Category>)) if supplier exists
/// - Ok(None) if supplier does not exist
///
/// Important:
/// If the supplier exists but has no categories, this returns:
/// Ok(Some(vec![]))
pub async fn query_supplier_categories(
    supplier_id: i32,
) -> Result<Option<Vec<model::Category>>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let exists = client
        .query_opt(
            "SELECT 1 FROM suppliers WHERE id = $1",
            &[&supplier_id],
        )
        .await?;

    if exists.is_none() {
        return Ok(None);
    }

    let rows = client
        .query(
            r#"
            SELECT
                c.id AS category_id,
                c.name AS category_name
            FROM category_suppliers cs
            JOIN categories c
                ON c.id = cs.category_id
            WHERE cs.supplier_id = $1
            ORDER BY c.name
            "#,
            &[&supplier_id],
        )
        .await?;

    let categories = rows
        .into_iter()
        .map(|row| model::Category {
            id: row.get("category_id"),
            name: row.get("category_name"),
        })
        .collect();

    Ok(Some(categories))
}

/// Retrieves all categories.
///
/// Useful for frontend filters:
///
/// GET /categories
///
/// Or if you prefer:
///
/// GET /suppliers/categories/options
pub async fn query_categories() -> Result<Vec<model::Category>, db_config::DbError> {
    let client = db_config::get_client().await?;

    let rows = client
        .query(
            r#"
            SELECT
                id AS category_id,
                name AS category_name
            FROM categories
            ORDER BY name
            "#,
            &[],
        )
        .await?;

    let categories = rows
        .into_iter()
        .map(|row| model::Category {
            id: row.get("category_id"),
            name: row.get("category_name"),
        })
        .collect();

    Ok(categories)
}