import mysql.connector
from mysql.connector import pooling
import logging
from .config import settings

logger = logging.getLogger(__name__)

# Initialize connection pool
try:
    db_pool = pooling.MySQLConnectionPool(
        pool_name="payroll_pool",
        pool_size=2,
        host=settings.MYSQL_HOST,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE,
        port=settings.MYSQL_PORT
    )
    logger.info("MySQL Connection Pool initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing MySQL connection pool: {e}")
    db_pool = None

def get_db_connection():
    if db_pool is None:
        # Retry connection if pool failed to initialize (e.g. database does not exist yet)
        return mysql.connector.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE,
            port=settings.MYSQL_PORT
        )
    return db_pool.get_connection()

# FastAPI Database Dependency
def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

# Database Query Helper Functions
def execute_query(conn, query: str, params: tuple = None, fetch: str = "all"):
    """
    Executes a query and manages the cursor.
    fetch options:
      - 'all': returns all rows as list of dicts
      - 'one': returns single row as dict
      - 'none': commits transaction and returns lastrowid
    """
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch == "all":
            return cursor.fetchall()
        elif fetch == "one":
            return cursor.fetchone()
        elif fetch == "none":
            conn.commit()
            return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
