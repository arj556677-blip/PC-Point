import os
import sys
import time
from datetime import timedelta
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory, session, redirect, url_for

# Add backend directory to path
sys.path.append(os.path.dirname(__file__))

from database import init_db, get_db
from data_structures.product_array import ProductArray
from data_structures.sales_linked_list import SalesLinkedList
from data_structures.customer_queue import CustomerQueue
from data_structures.component_graph import ComponentGraph
from algorithms.bfs import bfs_traversal
from algorithms.binary_search import binary_search
from algorithms.merge_sort import merge_sort
from algorithms.greedy import greedy_budget_selection
from data_structures.billing_stack import BillingStack
from algorithms.expression_evaluator import evaluate_billing_expression

# Create Flask App with Enhanced Security
app = Flask(__name__, static_folder=None)
app.secret_key = 'pcpoint_secret_key_2026_production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)  # 15 minutes max lifetime

# Session idle inactivity timeout (15 minutes) and absolute session lifetime (4 hours)
SESSION_IDLE_TIMEOUT = 900
MAX_SESSION_LIFETIME = 14400

@app.before_request
def enforce_session_security():
    """Validates session activity and terminates idle or stale sessions."""
    if 'user_id' in session:
        now = time.time()
        last_active = session.get('last_active')
        created_at = session.get('created_at')
        
        # If timestamps are missing (e.g. stale cookie from days ago) or timeouts exceeded, wipe session immediately
        if not last_active or not created_at or (now - last_active > SESSION_IDLE_TIMEOUT) or (now - created_at > MAX_SESSION_LIFETIME):
            session.clear()
        else:
            session['last_active'] = now

@app.after_request
def add_security_and_anticache_headers(response):
    """Prevents browser back/forward cache (bfcache) and proxies from storing sensitive user screens."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0, private'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # If unauthenticated, ensure no lingering session cookie remains in the client browser
    if 'user_id' not in session and 'session' in request.cookies:
        response.set_cookie('session', '', expires=0, max_age=0, path='/')
    return response

# Root directory paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
CSS_DIR = os.path.join(BASE_DIR, 'css')
JS_DIR = os.path.join(BASE_DIR, 'js')

# Initialize Data Structure State Instances
product_array = ProductArray()
sales_linked_list = SalesLinkedList()
customer_queue = CustomerQueue()
component_graph = ComponentGraph()

# ==========================================
# AUTH DECORATORS
# ==========================================
def login_required(f):
    """Requires any authenticated user (admin or customer)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required. Please sign in to continue.'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Requires admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required. Please sign in.'}), 401
        if session.get('role') != 'admin':
            return jsonify({'error': 'Admin access required. You do not have permission.'}), 403
        return f(*args, **kwargs)
    return decorated


def init_app_state():
    """Initializes Database and loads initial state into Data Structures."""
    init_db()
    
    # 1. Load Product Array from DB
    conn = get_db()
    products = conn.execute('SELECT * FROM products').fetchall()
    product_array.load_from_db(products)
    
    # 2. Load Sales Linked List from DB
    sales = conn.execute('SELECT * FROM sales ORDER BY id ASC').fetchall()
    for sale in sales:
        sale_dict = dict(sale)
        items = conn.execute('''
            SELECT si.*, p.name as product_name 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            WHERE si.sale_id = ?
        ''', (sale['id'],)).fetchall()
        sale_dict['items'] = [dict(it) for it in items]
        sales_linked_list.insert_at_head(sale_dict)
        
    conn.close()

    # 3. Build Component Graph
    component_graph.add_edge('Computer', 'Laptop')
    component_graph.add_edge('Computer', 'Desktop')
    component_graph.add_edge('Laptop', 'RAM')
    component_graph.add_edge('Laptop', 'SSD')
    component_graph.add_edge('Laptop', 'Display Panel')
    component_graph.add_edge('Desktop', 'GPU')
    component_graph.add_edge('Desktop', 'Monitor')
    component_graph.add_edge('Desktop', 'RAM')
    component_graph.add_edge('Desktop', 'SSD')
    component_graph.add_edge('Desktop', 'Motherboard')
    component_graph.add_edge('GPU', 'Monitor')
    component_graph.add_edge('RAM', 'Motherboard')
    # 4. Generate/Update DSA.pdf with updated scope
    try:
        import write_dsa_pdf
    except Exception as e:
        print("DSA.pdf update note:", e)

# Run App State Initialization
init_app_state()

# ==========================================
# STATIC FILE ROUTES
# ==========================================

@app.route('/')
def serve_home():
    return send_from_directory(FRONTEND_DIR, 'home.html')

@app.route('/dashboard')
def serve_dashboard():
    if session.get('role') != 'admin':
        return redirect('/login')
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/login')
def serve_login():
    return send_from_directory(FRONTEND_DIR, 'login.html')

@app.route('/logout')
def serve_logout():
    session.clear()
    resp = redirect('/login')
    resp.set_cookie('session', '', expires=0, max_age=0, path='/')
    return resp

@app.route('/<path:filename>')
def serve_frontend_files(filename):
    if filename.endswith('.css'):
        resp = send_from_directory(CSS_DIR, os.path.basename(filename))
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return resp
    elif filename.endswith('.js'):
        resp = send_from_directory(JS_DIR, os.path.basename(filename))
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return resp
    elif filename in ['index.html', 'sales.html']:
        if session.get('role') != 'admin':
            return redirect('/login')
        resp = send_from_directory(FRONTEND_DIR, filename)
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return resp
    elif os.path.exists(os.path.join(FRONTEND_DIR, filename)):
        resp = send_from_directory(FRONTEND_DIR, filename)
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return resp
    return jsonify({'error': 'File not found'}), 404

@app.after_request
def apply_no_cache_headers(response):
    """Ensures browsers always fetch fresh assets and verified auth session state."""
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ==========================================
# AUTH API ENDPOINTS
# ==========================================

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid email or password.'}), 401

    # Set secure session with idle tracking
    now = time.time()
    session.clear()
    session['user_id'] = user['id']
    session['user_name'] = user['name']
    session['user_email'] = user['email']
    session['role'] = user['role']
    session['created_at'] = now
    session['last_active'] = now
    session.permanent = False  # Session-only cookie (clears when browser tab/window is closed)

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters.'}), 400

    conn = get_db()
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'An account with this email already exists.'}), 409

    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        (name, email, password, 'customer')
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    # Auto-login after registration with idle tracking
    now = time.time()
    session.clear()
    session['user_id'] = new_id
    session['user_name'] = name
    session['user_email'] = email
    session['role'] = 'customer'
    session['created_at'] = now
    session['last_active'] = now
    session.permanent = False

    return jsonify({
        'message': 'Account created successfully',
        'user': {
            'id': new_id,
            'name': name,
            'email': email,
            'role': 'customer'
        }
    }), 201

@app.route('/api/auth/logout', methods=['POST', 'GET'])
def auth_logout():
    session.clear()
    response = jsonify({'message': 'Logged out successfully'})
    response.set_cookie('session', '', expires=0, max_age=0, path='/')
    return response

@app.route('/api/auth/session', methods=['GET'])
def auth_session():
    """Returns current session state with strict idle-timeout validation."""
    if 'user_id' in session:
        now = time.time()
        last_active = session.get('last_active')
        created_at = session.get('created_at')
        if not last_active or not created_at or (now - last_active > SESSION_IDLE_TIMEOUT) or (now - created_at > MAX_SESSION_LIFETIME):
            session.clear()
            response = jsonify({
                'authenticated': False,
                'user': None,
                'expired': True,
                'message': 'Your session has expired due to inactivity for your privacy.'
            })
            response.set_cookie('session', '', expires=0, max_age=0, path='/')
            return response

        session['last_active'] = now
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'name': session['user_name'],
                'email': session['user_email'],
                'role': session['role']
            }
        })
    return jsonify({'authenticated': False, 'user': None})

# Keep old login endpoint for backward compat
@app.route('/api/login', methods=['POST'])
def login_legacy():
    return auth_login()

# ==========================================
# API ENDPOINTS
# ==========================================

# --- 1. Dashboard Stats ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'total_products': product_array.size(),
        'total_sales': sales_linked_list.size(),
        'queue_length': customer_queue.size(),
        'graph_nodes': len(component_graph.get_all_nodes())
    })

# --- 2. Products API (Array) ---
@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(product_array.to_list())

@app.route('/api/products', methods=['POST'])
@admin_required
def add_product():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO products (name, category, brand, price, stock) VALUES (?, ?, ?, ?, ?)',
        (data['name'], data['category'], data['brand'], float(data['price']), int(data['stock']))
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    new_product = {
        'id': new_id,
        'name': data['name'],
        'category': data['category'],
        'brand': data['brand'],
        'price': float(data['price']),
        'stock': int(data['stock'])
    }
    product_array.append(new_product)
    return jsonify({'message': 'Product added', 'product': new_product}), 201

@app.route('/api/products/<int:prod_id>', methods=['DELETE'])
@admin_required
def delete_product(prod_id):
    conn = get_db()
    conn.execute('DELETE FROM products WHERE id = ?', (prod_id,))
    conn.commit()
    conn.close()
    product_array.remove_by_id(prod_id)
    return jsonify({'message': 'Product deleted'})

# --- 3. Catalog Sorting & SKU Lookup Engine ---
@app.route('/api/products/sort', methods=['GET'])
def sort_products():
    key = request.args.get('key', 'id')
    order = request.args.get('order', 'asc')
    reverse = (order == 'desc')

    sorted_list, comparisons = merge_sort(product_array.to_list(), key=key, reverse=reverse)
    return jsonify({
        'engine': 'High-Speed Catalog Sorter',
        'key': key,
        'order': order,
        'comparisons': comparisons,
        'products': sorted_list
    })

@app.route('/api/products/search', methods=['GET'])
def search_product():
    prod_id = request.args.get('id', type=int)
    if not prod_id:
        return jsonify({'error': 'Product ID required'}), 400

    sorted_by_id, _ = merge_sort(product_array.to_list(), key='id')
    result, trace = binary_search(sorted_by_id, prod_id)

    return jsonify({
        'engine': 'Instant SKU Index Search',
        'target_id': prod_id,
        'found': result is not None,
        'product': result,
        'trace_steps': trace
    })

# --- 4. Sales Orders & Itemized Billing API ---
@app.route('/api/billing/evaluate', methods=['POST'])
def evaluate_bill():
    """Evaluates transaction invoice breakdown and tax ledger."""
    data = request.json or {}
    items = data.get('items', [])
    tax_rate = float(data.get('tax_rate', 0.18))
    discount = float(data.get('discount', 0.0))
    result = evaluate_billing_expression(items, tax_rate=tax_rate, discount=discount)
    return jsonify(result)

@app.route('/api/sales', methods=['GET'])
@admin_required
def get_sales():
    return jsonify(sales_linked_list.to_list())

@app.route('/api/sales', methods=['POST'])
@login_required
def record_sale():
    data = request.json or {}
    customer_name = (data.get('customer_name') or '').strip() or session.get('user_name') or 'Customer'
    items = data.get('items', [])
    if not items and data.get('product_id'):
        items = [{'product_id': int(data['product_id']), 'quantity': int(data.get('quantity', 1))}]
    tax_rate = float(data.get('tax_rate', 0.18))
    discount = float(data.get('discount', 0.0))

    if not items:
        return jsonify({'error': 'No items in sale'}), 400

    conn = get_db()
    cursor = conn.cursor()

    processed_items = []

    for item in items:
        prod_id = item['product_id']
        qty = item['quantity']
        prod = next((p for p in product_array.to_list() if p['id'] == prod_id), None)
        if not prod or prod['stock'] < qty:
            conn.close()
            item_name = prod['name'] if prod else f'product ID {prod_id}'
            return jsonify({'error': f'Insufficient stock for {item_name}'}), 400

        processed_items.append({
            'product_id': prod_id,
            'product_name': prod['name'],
            'quantity': qty,
            'price': prod['price']
        })

    # Evaluate total using Itemized Billing Engine
    billing_eval = evaluate_billing_expression(processed_items, tax_rate=tax_rate, discount=discount)
    total_amount = billing_eval['final_total']

    from datetime import datetime
    date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    user_id = session.get('user_id', 1)
    cursor.execute('INSERT INTO sales (customer_id, total, date) VALUES (?, ?, ?)', (user_id, total_amount, date_str))
    sale_id = cursor.lastrowid

    for pit in processed_items:
        cursor.execute(
            'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            (sale_id, pit['product_id'], pit['quantity'], pit['price'])
        )
        cursor.execute('UPDATE products SET stock = stock - ? WHERE id = ?', (pit['quantity'], pit['product_id']))
        prod_match = next((p for p in product_array.to_list() if p['id'] == pit['product_id']), None)
        if prod_match:
            product_array.update(pit['product_id'], {'stock': max(0, prod_match['stock'] - pit['quantity'])})

    conn.commit()
    conn.close()

    sale_record = {
        'id': sale_id,
        'customer_name': customer_name,
        'total': total_amount,
        'subtotal': billing_eval['subtotal'],
        'tax': billing_eval['tax'],
        'discount': billing_eval['discount'],
        'date': date_str,
        'items': processed_items,
        'stack_trace': billing_eval['trace_steps'],
        'calculation_ledger': billing_eval['trace_steps']
    }
    sales_linked_list.insert_at_head(sale_record)

    return jsonify({'message': 'Order recorded successfully', 'sale': sale_record}), 201

# --- 5. Customer Service Desk API ---
@app.route('/api/queue', methods=['GET'])
def get_queue():
    return jsonify({
        'queue': customer_queue.to_list(),
        'size': customer_queue.size()
    })

@app.route('/api/queue', methods=['POST'])
@admin_required
def enqueue_customer():
    data = request.json
    from datetime import datetime
    customer = {
        'name': data['name'],
        'phone': data['phone'],
        'issue': data.get('issue', 'General Inquiry'),
        'timestamp': datetime.now().strftime('%H:%M:%S')
    }
    customer_queue.enqueue(customer)
    return jsonify({'message': 'Customer added to queue', 'customer': customer, 'queue_size': customer_queue.size()})

@app.route('/api/queue', methods=['DELETE'])
@app.route('/api/queue/serve', methods=['POST'])
@admin_required
def serve_customer():
    customer = customer_queue.dequeue()
    if not customer:
        return jsonify({'message': 'Queue is empty'}), 400
    return jsonify({'message': 'Customer served', 'served_customer': customer, 'remaining_queue': customer_queue.size()})

# --- 6. Hardware Compatibility Bus API ---
@app.route('/api/components', methods=['GET'])
def get_components():
    return jsonify({
        'nodes': component_graph.get_all_nodes(),
        'adjacency_list': component_graph.get_adjacency_list()
    })

@app.route('/api/components/compatibility-scan', methods=['GET'])
@app.route('/api/components/bfs', methods=['GET'])
def run_bfs():
    start = request.args.get('start', 'Computer')
    order, edges = bfs_traversal(component_graph, start)
    return jsonify({
        'scan_type': 'Component Compatibility Bus Scan',
        'start_node': start,
        'visited_order': order,
        'edges': edges
    })

# --- 7. Smart Build Recommendation API ---
@app.route('/api/recommend', methods=['POST'])
def recommend_accessories():
    data = request.json or {}
    budget = float(data.get('budget', 0))
    categories = data.get('categories', [])
    category = data.get('category', 'all')

    all_products = product_array.to_list()
    if categories and isinstance(categories, list) and len(categories) > 0:
        cats_lower = [c.lower() for c in categories]
        filtered = [p for p in all_products if p['category'].lower() in cats_lower]
    elif category != 'all':
        filtered = [p for p in all_products if p['category'].lower() == category.lower()]
    else:
        filtered = all_products

    result = greedy_budget_selection(filtered, budget)
    return jsonify(result)

@app.route('/api/admin/generate-pdf', methods=['GET', 'POST'])
def trigger_generate_pdf():
    """Generates and updates DSA.pdf using backend process."""
    try:
        import build_dsa_pdf
        success = build_dsa_pdf.generate_pdf()
        if success:
            return jsonify({'message': 'DSA.pdf successfully updated!', 'file': 'DSA.pdf'})
        else:
            return jsonify({'error': 'Failed to generate PDF'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting PC Point Backend on http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=True)
