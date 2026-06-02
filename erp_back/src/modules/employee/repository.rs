use std::collections::{ BTreeMap, HashMap};

use super::model::{PayrollProcess, NewPayrollItem};

use tokio_postgres::Row;
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::shared::db_config;
use crate::modules::employee::{
    dto::response::PayrollProcessSummaryDto,
    model::{
        NewEmployee,
        Employee,
        Contract,
        PayrollSummary,
        PayrollItemDetail,
        Relative,
        EmployeeAggregate,
    },
};


// ─────────────────────────────────────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────────────────────────────────────
 
const EMPLOYEE_SELECT_BASE: &str = r#"
SELECT 
e.id AS employee_id,
e.name AS employee_name,
e.surname AS employee_surname,
e.document AS employee_document,
e.birth_date AS employee_birth_date,
e.hire_date AS employee_hire_date,
e.termination_date AS employee_termination_date,
e.job_title AS employee_job_title,
e.is_active AS employee_is_active,
e.created_at AS employee_created_at,
e.updated_at AS employee_last_update,
c.id AS contract_id,
c.contract_name AS contract_name,
c.start_date AS contract_start,
c.end_date AS contract_end,
c.salary AS contract_base_salary,
c.salary_period_type AS contract_salary_period,
c.payroll_account AS contract_payment_account,
c.is_active AS contract_is_active,
r.id AS relative_id,
r.name AS relative_name,
r.surname AS relative_surname,
r.document AS relative_document,
r.relation_type AS relation,
r.birth_date AS relative_birth_date,
r.disability AS relative_disability,
r.created_at AS relative_created_at,
pp.id AS payroll_process_id,
pp.created_at AS payroll_process_start_date,
pp.state AS payroll_process_state,
pes.id AS payroll_summary_id,
pes.gross_amount AS gross_earnings,
pes.deduction_amount AS deductions,
pes.net_amount AS net_earnings,
pes.created_at AS last_time_computed,
pi.quantity AS item_quantity,
pi.unit_amount AS item_unit_amount,
pi.total_amount AS item_total_amount,
pi.origin AS item_origin,
n.code AS novelty_code,
n.name AS novelty_name,
n.sign AS novelty_sign
FROM employees AS e
LEFT JOIN contracts AS c ON e.id = c.employee_id
LEFT JOIN employee_relatives AS er ON e.id = er.employee_id
LEFT JOIN relatives AS r ON er.relative_id = r.id
"#;

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
fn rows_to_aggregates(rows: Vec<Row>) -> Vec<EmployeeAggregate> {
    let mut map: BTreeMap<i32, EmployeeAggregate> = BTreeMap::new();

    for row in rows {
        let employee_id: i32 = row.get("employee_id");

        let entry = map.entry(employee_id).or_insert_with(|| EmployeeAggregate {
            employee: Employee {
                id: employee_id,
                name: row.get("employee_name"),
                surname: row.get("employee_surname"),
                document: row.get("employee_document"),
                birth_date: row.get("employee_birth_date"),
                hire_date: row.get("employee_hire_date"), 
                termination_date: row.get("employee_termination_date"), 
                //created_at: row.get("employee_created_at"),
                //updated_at: row.get("employee_last_update"),
                job_title: row.get("employee_job_title"),
                is_active: row.get("employee_is_active"),
                current_contract: row
                    .get::<_,Option<i32>>("contract_id")
                    .map(|contract_id| Contract {
                        id: contract_id,
                        contract_name: row.get("contract_name"),
                        start_date: row.get("contract_start"),
                        end_date: row.get("contract_end"),
                        salary: row.get("contract_base_salary"),
                        period: row.get("contract_salary_period"),
                        account: row.get("contract_payment_account"),
                        is_active: row.get("contract_is_active"),
                    }),
            },
            payroll_summary: row
                .get::<_, Option<i32>>("payroll_summary_id")
                .map(|summary_id|PayrollSummary {
                    id: summary_id,
                    payroll_process_id: row.get("payroll_process_id"),
                    payroll_process_start_date: row.get("payroll_process_start_date"),
                    gross_amount: row.get("gross_earnings"),
                    deductions: row.get("deductions"),
                    net_earnings: row.get("net_earnings"),
                    last_time_computed: row.get("last_time_computed"),
                    items: Vec::new(),
                }),
                relatives: Vec::new(),
        });



        let relative_id: Option<i32> = row.get("relative_id");
        if let Some(rid) = relative_id {
            if !entry.relatives.iter().any(|r| r.id == rid) {
                entry.relatives.push(Relative {
                    id: rid,  
                    name: row.get("relative_name"),
                    surname: row.get("relative_surname"),
                    document: row.get("relative_document"),
                    relation_type: row.get("relation"),
                    birth_date: row.get("relative_birth_date"),
                    disability: row.get("relative_disability"),
                });
            }
        }
        if let Some(ref mut summary) = entry.payroll_summary {
            if let Some(novelty_code) = row.get::<_, Option<String>>("novelty_code") {
                // Deduplicate item additions per row pass
                if !summary.items.iter().any(|i| i.novelty_code == novelty_code) {
                    summary.items.push(PayrollItemDetail {
                        novelty_code,
                        novelty_name: row.get("novelty_name"),
                        sign: row.get("novelty_sign"),
                        quantity: row.get("item_quantity"),
                        unit_amount: row.get("item_unit_amount"),
                        total_amount: row.get("item_total_amount"),
                        origin: row.get("item_origin"),
                    });
                }
            }
        }
    }
    map.into_values().collect() 
}

pub async fn query_employees(
    search: Option<String>,
    filter: Option<String>,
    since:  Option<NaiveDate>,
    to:     Option<NaiveDate>,
    status: Option<String>,
    cursor: Option<i32>,
    limit:  i64,
) -> Result<Vec<EmployeeAggregate>, db_config::DbError> {
    let conn = db_config::get_client().await?;
    let sql = format!("
       {}
       LEFT JOIN payroll_employee_summary AS pes ON e.id = pes.employee_id
       AND pes.created_at = (
               SELECT MAX(pes2.created_at)
               FROM payroll_employee_summary pes2
               WHERE pes2.employee_id = e.id
          )
       LEFT JOIN payroll_items AS pi ON pes.payroll_process_id = pi.payroll_process_id AND e.id = pi.employee_id
       LEFT JOIN novelties AS n ON pi.novelty_id = n.id
       LEFT JOIN payroll_processes AS pp ON pes.payroll_process_id = pp.id
       WHERE e.id IN (
       SELECT DISTINCT e2.id
       FROM employees AS e2
       LEFT JOIN employee_relatives AS er2 ON e2.id = er2.employee_id
       LEFT JOIN relatives AS r2 ON er2.relative_id = r2.id
       LEFT JOIN contracts AS c2 ON e2.id = c2.employee_id
       WHERE ($1::INT  IS NULL OR e2.id                      > $1)
       AND ($3::TEXT IS NULL OR c2.contract_name::TEXT ILIKE '%' || $3 || '%' OR r2.name::TEXT ILIKE '%' || $3 || '%' OR r2.surname::TEXT ILIKE '%' || $3 || '%' OR r2.document::TEXT ILIKE '%' || $3 || '%')
       AND ($4::DATE IS NULL OR e2.hire_date             >= $4)
       AND ($5::DATE IS NULL OR e2.hire_date             <= $5)
       ORDER BY e2.id ASC
       LIMIT $6
       )
       AND($2::TEXT IS NULL OR e.name ILIKE '%' || $2 || '%' OR e.surname ILIKE '%' || $2 || '%' OR e.job_title ILIKE '%' || $2 || '%')
       ORDER BY e.id ASC, r.id ASC
       ",EMPLOYEE_SELECT_BASE);

    dbg!(&cursor, &search, &filter, &since, &to, &limit);

    let rows = match conn.query(&sql, &[&cursor, &search, &filter, &since, &to, &limit]).await {

        Ok(rows) => rows,
        Err(e) => {
            dbg!(&e);
            return Err(db_config::DbError::Other("Query couldn't retrieve data".to_string()))
        }
    };

    Ok(rows_to_aggregates(rows))
}


pub async fn query_employee_by_id(
    id: i32,
) -> Result<Option<EmployeeAggregate>, db_config::DbError> {
    let conn = db_config::get_client().await?;

    let sql = format!(
        "{} WHERE e.id = $1 ORDER BY e.id, r.id",
        EMPLOYEE_SELECT_BASE
    );

    let rows = conn.query(&sql, &[&id]).await?;
    let mut results = rows_to_aggregates(rows);
    Ok(results.pop())
}

pub async fn insert_employee(
    model: &NewEmployee,
) -> Result<EmployeeAggregate, db_config::DbError> {
    let mut conn = db_config::get_client().await?;
    let tx = conn.transaction().await?;

    // Step 1: Insert the employee and retrieve the auto-generated id
    let row = tx.query_one(
        r#"
        INSERT INTO employees (name, surname, document, birth_date, hire_date, job_title)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
        &[
        &model.name,
        &model.surname,
        &model.document,
        &model.birth_date,
        &model.hire_date,
        &model.job_title,
        ],
    ).await?;

    let employee_id: i32 = row.get("id");

    // Step 2: Generate the contract for the employee
    // Hardcoded because we're using just one contract for every employee now
    let contract_name = "Contrato Laboral";
    let bank_account: Option<String> = None; 

    tx.execute(
        r#"
        INSERT INTO contracts (contract_name, start_date, employee_id, salary, payroll_account)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
        &[
        &contract_name,
        &model.hire_date,
        &employee_id,
        &model.base_salary,
        &bank_account,
        ],
    ).await?;

    // Step 3: For each relative — insert, then link to employee via pivot table

    for relative in &model.relatives {

        // 3a. Insert the relative, get its generated id
        let relative_row = tx.query_one(
            "INSERT INTO relatives(name, surname, document, relation_type, birth_date, disability) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            &[&relative.name, &relative.surname, &relative.document, &relative.relation_type, &relative.birth_date, &relative.disability],
        ).await?;

        let relative_id: i32 = relative_row.get("id");


        // 3b. Link relative to employee in the many-to-many pivot table
        tx.execute(
            "INSERT INTO employee_relatives (employee_id, relative_id) VALUES ($1, $2)",
            &[&employee_id, &relative_id],
        ).await?;
    }

    // Step 4: Re-query the full aggregate to return authoritative DB state
    let sql = format!(
        "{} WHERE e.id = $1",
        EMPLOYEE_SELECT_BASE
    );
    let rows = tx.query(&sql, &[&employee_id]).await?;
    let mut results = rows_to_aggregates(rows);


    // Step 5: Commit — makes all inserts permanent
    tx.commit().await?;
    Ok(results.pop().unwrap())
}


/// Creates a new payroll process run inside the database
pub async fn create_payroll_process(
    process_type: &str,
    pay_date: NaiveDate,
    cutoff_date: NaiveDate,
) -> Result<PayrollProcess, db_config::DbError> {
    let conn = db_config::get_client().await?;
    let row = conn.query_one(
        r#"
        INSERT INTO payroll_processes (process_type, pay_date, cutoff_date, state)
        VALUES ($1, $2, $3, 'draft')
        RETURNING id, process_type, pay_date, cutoff_date, state
        "#,
        &[&process_type.to_string(), &pay_date, &cutoff_date],
    ).await?;

    Ok(PayrollProcess {
        id: row.get("id"),
        process_type: row.get("process_type"),
        pay_date: row.get("pay_date"),
        cutoff_date: row.get("cutoff_date"),
        state: row.get("state"),
    })
}

/// Fetches pre-calculated timesheet aggregate values for a designated period window
pub async fn query_timesheet_aggregates(
    employee_id: i32,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<(Decimal, i32, Decimal), db_config::DbError> {
    let conn = db_config::get_client().await?;
    let row = conn.query_one(
        r#"
        SELECT 
            COALESCE(SUM(worked_hours), 0) as total_worked,
            COALESCE(SUM(late_minutes), 0)::INT as total_late,
            COALESCE(SUM(overtime_hours), 0) as total_overtime
        FROM timesheets
        WHERE employee_id = $1 AND work_date BETWEEN $2 AND $3
        "#,
        &[&employee_id, &start_date, &end_date],
    ).await?;

    Ok((
            row.get("total_worked"),
            row.get("total_late"),
            row.get("total_overtime"),
    ))
}

/// Pulls configured novelties map indexed by their system String codes
pub async fn query_novelties_map() -> Result<HashMap<String, i32>, db_config::DbError> {
    let conn = db_config::get_client().await?;
    let rows = conn.query("SELECT id, code FROM novelties", &[]).await?;

    let mut map = HashMap::new();
    for row in rows {
        let id: i32 = row.get("id");
        let code: String = row.get("code");
        map.insert(code, id);
    }
    Ok(map)
}

/// Batches line items into database records and builds an immutable employee runtime execution summary
pub async fn save_payroll_run_results(
    process_id: i32,
    items: &[NewPayrollItem],
) -> Result<(), db_config::DbError> {
    let mut conn = db_config::get_client().await?;
    let tx = conn.transaction().await?;

    // Step 1: Bulk write computed line items
    for item in items {
        tx.execute(
            r#"
            INSERT INTO payroll_items 
            (payroll_process_id, employee_id, novelty_id, quantity, unit_amount, total_amount, origin)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            &[
            &item.payroll_process_id,
            &item.employee_id,
            &item.novelty_id,
            &item.quantity,
            &item.unit_amount,
            &item.total_amount,
            &item.origin,
            ],
        ).await?;
    }

    // Step 2: Compile individual items into financial summary cards
    tx.execute(
        r#"
        INSERT INTO payroll_employee_summary (payroll_process_id, employee_id, gross_amount, deduction_amount, net_amount)
        SELECT 
            pi.payroll_process_id,
            pi.employee_id,
            SUM(CASE WHEN n.sign = 'C' THEN pi.total_amount ELSE 0 END) AS gross_amount,
            SUM(CASE WHEN n.sign = 'D' THEN pi.total_amount ELSE 0 END) AS deduction_amount,
            SUM(CASE WHEN n.sign = 'C' THEN pi.total_amount ELSE -pi.total_amount END) AS net_amount
        FROM payroll_items pi
        JOIN novelties n ON pi.novelty_id = n.id
        WHERE pi.payroll_process_id = $1
        GROUP BY pi.payroll_process_id, pi.employee_id
        ON CONFLICT (payroll_process_id, employee_id) DO UPDATE SET
            gross_amount = EXCLUDED.gross_amount,
            deduction_amount = EXCLUDED.deduction_amount,
            net_amount = EXCLUDED.net_amount
        "#,
        &[&process_id],
    ).await?;

    // Step 3: Advance payroll record status to processed state
    tx.execute(
        "UPDATE payroll_processes SET state = 'computed' WHERE id = $1",
        &[&process_id],
    ).await?;

    tx.commit().await?;
    Ok(())
}

/// Updates the state of an existing payroll process run
pub async fn update_payroll_process_status(
    process_id: i32,
    target_status: &str,
) -> Result<u64, db_config::DbError> {
    let conn = db_config::get_client().await?;

    // We only allow transition into paid/cancelled if the current state allows it
    let rows_affected = conn.execute(
        r#"
        UPDATE payroll_processes
        SET state = $1
        WHERE id = $2 AND state NOT IN ('paid', 'cancelled')
        "#,
        &[&target_status.to_string(), &process_id],
    ).await?;

    Ok(rows_affected)
}

pub async fn query_historical_payroll_data(
    process_id: i32,
) -> Result<Vec<EmployeeAggregate>, db_config::DbError> {
    let conn = db_config::get_client().await?;

    let sql = format!(
        r#"
        {}
        INNER JOIN payroll_employee_summary AS pes ON e.id = pes.employee_id AND pes.payroll_process_id = $1
        LEFT JOIN payroll_items AS pi ON pes.payroll_process_id = pi.payroll_process_id AND e.id = pi.employee_id
        LEFT JOIN novelties AS n ON pi.novelty_id = n.id
        LEFT JOIN payroll_processes AS pp ON pes.payroll_process_id = pp.id
        ORDER BY e.id ASC, n.sign DESC
        "#,
        EMPLOYEE_SELECT_BASE
    );

    let rows = conn.query(&sql, &[&process_id]).await?;
    Ok(rows_to_aggregates(rows))
}

pub async fn query_processes() -> Result<Vec<PayrollProcessSummaryDto>, db_config::DbError> {
    let conn = db_config::get_client().await?;
    let sql = format!("SELECT id, process_type, pay_date, cutoff_date, state, created_at FROM payroll_processes");
    let rows = conn.query(&sql, &[]).await?;
    Ok(rows_to_summary_dto(rows))
}

fn rows_to_summary_dto(rows: Vec<Row>) -> Vec<PayrollProcessSummaryDto> {
    let mut summaries: Vec<PayrollProcessSummaryDto> = Vec::new();
    for row in rows {
        summaries.push( PayrollProcessSummaryDto {
            id: row.get("id"),
            cutoff_date: row.get("cutoff_date"),
            state: row.get("state"),
            process_type: row.get("process_type"),
            pay_date: row.get("pay_date"),
        });

    }
    summaries
}
