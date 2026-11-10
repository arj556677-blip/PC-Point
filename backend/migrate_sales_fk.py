"""
One-time migration: rebinds sales.customer_id FK to users(id).
SQLite does not support ALTER TABLE … MODIFY CONSTRAINT, so the standard
rename-and-recreate approach is used.  Run this script once against the
existing database, then delete it.
"""
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'pc_point.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Confirm the current FK target before touching anything
    cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sales'")
    row = cur.fetchone()
    if row:
        print("Current sales DDL:\n", row['sql'], "\n")

    # Step 1 – disable FK enforcement during the migration
    cur.execute("PRAGMA foreign_keys = OFF")

    # Step 2 – create the corrected table under a temporary name
    cur.execute('''
        CREATE TABLE IF NOT EXISTS sales_new (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            total       REAL    NOT NULL,
            date        TEXT    NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )
    ''')

    # Step 3 – copy every row from the old table
    cur.execute("INSERT INTO sales_new SELECT id, customer_id, total, date FROM sales")

    # Step 4 – drop the old table and rename
    cur.execute("DROP TABLE sales")
    cur.execute("ALTER TABLE sales_new RENAME TO sales")

    # Step 5 – re-enable FK enforcement
    cur.execute("PRAGMA foreign_keys = ON")

    conn.commit()
    conn.close()

    # Verify
    conn2 = sqlite3.connect(DB_PATH)
    conn2.row_factory = sqlite3.Row
    cur2 = conn2.cursor()
    cur2.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sales'")
    print("Updated sales DDL:\n", cur2.fetchone()['sql'])
    cur2.execute("SELECT COUNT(*) as n FROM sales")
    print(f"Rows preserved: {cur2.fetchone()['n']}")
    conn2.close()
    print("\nMigration complete.")

if __name__ == '__main__':
    migrate()
