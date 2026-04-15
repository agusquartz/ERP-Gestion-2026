//This file sets the database's pool config.
//It provides the rest of the app with a pool from which
//to get connections to PostgreSQL

use std::time::Duration; //For timeouts
//deadpool_postgres is the most important lib in this file. It gives the wrappers, the API for
//database interaction
use deadpool_postgres::{Manager, ManagerConfig, Pool, RecyclingMethod, Runtime}; 
//to make the pool of connections accessible to the whole app, we use OnceCell to ensure correct
//concurrent access
use once_cell::sync::OnceCell;
//the low level lib that actually talks with the database, deadpool is a wrapper around it, but we
//still import some structs for configs
use tokio_postgres::{Config, NoTls};

//This enum allows us to treat all errors from the database under a single type, instead of having
//to deal with the errors coming from every library we're using. 
#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("database pool not initialized")]
    NotInitialized,

    #[error("pool error: {0}")]
    Pool(#[from] deadpool_postgres::PoolError),

    #[error("postgres error: {0}")]
    Pg(#[from] tokio_postgres::Error),

    #[error("pool already initialized")]
    AlreadyInitialized,
    
    #[error("not found")]
    NotFound,

    #[error("{0}")]
    Other(String),
}    

//This struct simply groups all config params for the database
#[derive(Clone, Debug)]
pub struct DbParams {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub db_name: Option<String>,
    pub pool_max_size: usize,
}

//Global connection pool. This var shall be accesible for the whole of our application
static DB_POOL: OnceCell<Pool> = OnceCell::new();

//method to initialize our database, shall be called once, at the startup of our application
//Throws an error if you try to call it several times anyways
pub async fn init_global_pool(params: DbParams) -> Result<(), DbError> {
    let mut cfg = Config::new();
    cfg.host(&params.host);
    cfg.port(params.port);
    cfg.user(&params.user);
    cfg.password(&params.password);

    if let Some(db) = params.db_name {
        cfg.dbname(&db);
    }
    cfg.keepalives(true);
    cfg.keepalives_idle(Duration::from_secs(60));
    
    let mgr_config = ManagerConfig {
        recycling_method: RecyclingMethod::Verified,
    };

    let manager = Manager::from_config(cfg, NoTls, mgr_config);

    let pool = Pool::builder(manager)
        .max_size(params.pool_max_size)
        .runtime(Runtime::Tokio1)
        .build()
        .unwrap();

    DB_POOL.set(pool)
        .map_err(|_| DbError::AlreadyInitialized)?;

    Ok(())
}
//The function we will be actually using a lot. Every module will obtain a
//deadpool_postgres::Client instance, that allows you to query the database,
//using this function
pub async fn get_client() -> Result<deadpool_postgres::Client, DbError> {
    let pool = DB_POOL.get().ok_or(DbError::NotInitialized)?;
    Ok(pool.get().await?)
}


