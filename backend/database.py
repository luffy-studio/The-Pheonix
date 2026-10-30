from dotenv import load_dotenv
import os
import sqlite3
import json
import uuid
import socket
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Load .env from backend folder or current working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# Env vars
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or SUPABASE_KEY

def is_host_resolvable(url: Optional[str]) -> bool:
    """Check if the Supabase domain can be resolved by DNS"""
    if not url or "placeholder" in url:
        return False
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or url
        socket.gethostbyname(hostname)
        return True
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Resilient Local SQLite Database (Used when cloud Supabase is unavailable)
# ---------------------------------------------------------------------------
class QueryResult:
    def __init__(self, data: Any = None, count: Optional[int] = None):
        self.data = data if data is not None else []
        self.count = count if count is not None else len(self.data)

class LocalTableQuery:
    def __init__(self, db_path: str, table_name: str):
        self.db_path = db_path
        self.table_name = table_name
        self._select_cols = "*"
        self._count = None
        self._eq_filters: Dict[str, Any] = {}
        self._order_col: Optional[str] = None
        self._order_desc: bool = False
        self._limit_val: Optional[int] = None
        self._action = "select"
        self._insert_data: Optional[Any] = None

    def select(self, cols: str = "*", count: Optional[str] = None):
        self._action = "select"
        self._select_cols = cols
        self._count = count
        return self

    def insert(self, data: Any):
        self._action = "insert"
        self._insert_data = data
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, column: str, value: Any):
        self._eq_filters[column] = value
        return self

    def order(self, column: str, desc: bool = False):
        self._order_col = column
        self._order_desc = desc
        return self

    def limit(self, val: int):
        self._limit_val = val
        return self

    def execute(self) -> QueryResult:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            if self._action == "insert":
                records = self._insert_data if isinstance(self._insert_data, list) else [self._insert_data]
                inserted_rows = []

                for item in records:
                    item_copy = dict(item)
                    for k, v in item_copy.items():
                        if isinstance(v, (dict, list)):
                            item_copy[k] = json.dumps(v)

                    columns = list(item_copy.keys())
                    placeholders = ["?"] * len(columns)
                    sql = f"INSERT OR REPLACE INTO {self.table_name} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                    cursor.execute(sql, list(item_copy.values()))
                    inserted_rows.append(item)

                conn.commit()
                return QueryResult(data=inserted_rows, count=len(inserted_rows))

            elif self._action == "delete":
                where_clauses = []
                params = []
                for col, val in self._eq_filters.items():
                    where_clauses.append(f"{col} = ?")
                    params.append(val)

                where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                sql = f"DELETE FROM {self.table_name}{where_sql}"
                cursor.execute(sql, params)
                affected = cursor.rowcount
                conn.commit()
                return QueryResult(data=[], count=affected)

            else:  # select
                where_clauses = []
                params = []
                for col, val in self._eq_filters.items():
                    where_clauses.append(f"{col} = ?")
                    params.append(val)

                where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
                order_sql = ""
                if self._order_col:
                    direction = "DESC" if self._order_desc else "ASC"
                    order_sql = f" ORDER BY {self._order_col} {direction}"

                limit_sql = f" LIMIT {self._limit_val}" if self._limit_val is not None else ""

                sql = f"SELECT * FROM {self.table_name}{where_sql}{order_sql}{limit_sql}"
                cursor.execute(sql, params)
                rows = cursor.fetchall()

                result_data = []
                for row in rows:
                    d = dict(row)
                    for k, v in d.items():
                        if isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                            try:
                                d[k] = json.loads(v)
                            except Exception:
                                pass
                    result_data.append(d)

                total_count = len(result_data)
                if self._count == "exact":
                    count_sql = f"SELECT COUNT(*) FROM {self.table_name}{where_sql}"
                    cursor.execute(count_sql, params)
                    total_count = cursor.fetchone()[0]

                return QueryResult(data=result_data, count=total_count)

        finally:
            conn.close()

class LocalDatabaseClient:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_schema()

    def _init_schema(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Faculty_Clg (
                faculty_id TEXT PRIMARY KEY,
                User_id TEXT,
                details TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Subjects_Clg (
                subject_id TEXT PRIMARY KEY,
                User_id TEXT,
                details TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Classes_Clg (
                class_id TEXT PRIMARY KEY,
                User_id TEXT,
                details TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Timetables_Clg (
                timetable_id TEXT PRIMARY KEY,
                User_id TEXT,
                details TEXT,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS subjects (
                id TEXT PRIMARY KEY,
                Subject_Code TEXT,
                Subject_Name TEXT,
                Department TEXT,
                Credits INTEGER,
                Subject_Type TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_faculty_userid ON Faculty_Clg(User_id);
            CREATE INDEX IF NOT EXISTS idx_subjects_userid ON Subjects_Clg(User_id);
            CREATE INDEX IF NOT EXISTS idx_classes_userid ON Classes_Clg(User_id);
            CREATE INDEX IF NOT EXISTS idx_timetables_userid ON Timetables_Clg(User_id);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """)
        conn.commit()
        conn.close()

    def table(self, table_name: str) -> LocalTableQuery:
        return LocalTableQuery(self.db_path, table_name)


# ---------------------------------------------------------------------------
# Client Initialization (Cloud Supabase or Resilient Local Fallback)
# ---------------------------------------------------------------------------
LOCAL_DB_PATH = os.path.join(BASE_DIR, "data", "the_phoenix.db")
local_client = LocalDatabaseClient(LOCAL_DB_PATH)

supabase_online = is_host_resolvable(SUPABASE_URL)

if supabase_online and SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        logger.info(f"Connecting to Cloud Supabase: {SUPABASE_URL}")
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Cloud Supabase client ({e}). Using local database.")
        supabase_admin = local_client
        supabase = local_client
else:
    logger.info("ℹ️ Cloud Supabase endpoint unreachable or offline. Using local resilient SQLite database.")
    supabase_admin = local_client
    supabase = local_client
