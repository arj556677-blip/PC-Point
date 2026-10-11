import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'pc_point.db')

def get_db():
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and seeds initial data if empty."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            brand TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0
        )
    ''')

    # 2. Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    ''')

    # 3. Sales table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            total REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')

    # 4. Sale Items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')

    # 5. Users table (auth)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer'
        )
    ''')

    # Seed products if empty
    cursor.execute('SELECT COUNT(*) as count FROM products')
    if cursor.fetchone()['count'] == 0:
        seed_products = [
            ('ThinkPad X1 Carbon', 'Laptop', 'Lenovo', 85000.0, 10),
            ('MacBook Air M3', 'Laptop', 'Apple', 114900.0, 8),
            ('ROG Strix G16', 'Laptop', 'ASUS', 95000.0, 6),
            ('OptiPlex 7020 Desktop', 'Desktop', 'Dell', 52000.0, 12),
            ('iMac 24" M3', 'Desktop', 'Apple', 134900.0, 5),
            ('Vengeance 16GB DDR5', 'RAM', 'Corsair', 4500.0, 30),
            ('Fury Beast 8GB DDR4', 'RAM', 'Kingston', 2200.0, 40),
            ('970 EVO Plus 1TB SSD', 'SSD', 'Samsung', 6500.0, 25),
            ('WD Black SN770 500GB SSD', 'SSD', 'Western Digital', 3800.0, 20),
            ('GeForce RTX 4060 Ti', 'GPU', 'NVIDIA', 32000.0, 8),
            ('Radeon RX 7600', 'GPU', 'AMD', 24000.0, 10),
            ('UltraSharp U2723QE 27"', 'Monitor', 'Dell', 38000.0, 7),
            ('ProDisplay XDR 32"', 'Monitor', 'Apple', 459900.0, 2),
            ('MX Keys S Wireless Keyboard', 'Keyboard', 'Logitech', 9500.0, 15),
            ('Huntsman V3 Pro Keyboard', 'Keyboard', 'Razer', 12000.0, 10),
            ('MX Master 3S Mouse', 'Mouse', 'Logitech', 8500.0, 18),
            ('DeathAdder V3 Gaming Mouse', 'Mouse', 'Razer', 5500.0, 20),
            ('USB-C 7-in-1 Hub', 'Accessory', 'Anker', 2500.0, 35)
        ]
        cursor.executemany(
            'INSERT INTO products (name, category, brand, price, stock) VALUES (?, ?, ?, ?, ?)',
            seed_products
        )

    # Seed customers if empty
    cursor.execute('SELECT COUNT(*) as count FROM customers')
    if cursor.fetchone()['count'] == 0:
        seed_customers = [
            ('Aaron Joseph', '9876543210'),
            ('Rahul Sharma', '9812345678'),
            ('Priya Nair', '9745612389'),
            ('Anish Kumar', '9654123789')
        ]
        cursor.executemany(
            'INSERT INTO customers (name, phone) VALUES (?, ?)',
            seed_customers
        )

    # Seed users if empty
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        seed_users = [
            ('Admin', 'admin@pcpoint.in', 'admin123', 'admin'),
            ('Rahul Sharma', 'rahul@pcpoint.in', 'customer123', 'customer'),
            ('Priya Nair', 'priya@pcpoint.in', 'customer123', 'customer'),
        ]
        cursor.executemany(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            seed_users
        )

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
