import os
import sys

def create_dsa_pdf(filename):
    """
    Generates a clean PDF document for DSA.pdf with updated contents using pure Python.
    """
    # PDF Content Elements
    pages_content = []

    # Content Pages Setup
    content_p1 = [
        ("TITLE", "Data Structures and Algorithmic Problem Solving Project"),
        ("SUBTITLE", "Project Title: PC Point – Online Computer Sales and Accessories"),
        ("META", "Student Name: Aaron Joseph | Register Number: 26MCAB01"),
        ("META", "Programme / Class: MCA B | Department: KJIT"),
        ("META", "Course: Data Structures and Algorithmic Problem Solving"),
        ("META", "Faculty Guide: Dr. Abinaya S | Academic Year: 2026 - 27"),
        ("HEADING", "1. Abstract"),
        ("TEXT", "PC Point is a web-based application for browsing and purchasing computers and computer accessories, built primarily to work through a set of core data structures and algorithms in a realistic store management setting. Linear structures (singly linked list, LIFO stack, and FIFO queue) handle sales records, expression-based transaction billing, and customer service queues. Graph structures with Breadth-First Search (BFS) organise component relationships. Searching and sorting techniques (linear search, binary search, and merge sort) support product discovery, and a greedy algorithm handles budget-based accessory selection."),
        ("HEADING", "2. Introduction"),
        ("TEXT", "• Background of the project: computer and accessory shops handle a mix of routine tasks — tracking stock, billing customers, attending to walk-in customers in order, and helping a customer choose accessories that fit their budget. These tasks map naturally onto well-known data structures and algorithms."),
        ("TEXT", "• Problem identified: a small shop managing sales and customer flow manually or through basic tools ends up with slow product lookups, unorganised sales records, and no structured billing or recommendation mechanism."),
        ("TEXT", "• Need for the proposed system: a lightweight application that stores product, sales and customer information, lets staff search and sort the catalogue quickly, and offers a clear way to compute bills and suggest accessories within a budget."),
        ("TEXT", "• Overview of the proposed solution: PC Point is built as a Flask-based web application backed by SQLite. Sales records are handled using a linked list, transaction billing is computed via a LIFO stack expression evaluator, customer queues use a FIFO queue, component relationships are explored using a graph with BFS, product discovery uses linear search, binary search, and merge sort, and budget accessory selection uses a greedy algorithm."),
        ("HEADING", "3. Problem Statement"),
        ("TEXT", "Small computer accessory shops often lack a structured way to manage their product catalogue, sales history, customer flow, and billing evaluation. This project addresses that gap by building an application whose internal logic is built around standard data structures and algorithms."),
    ]

    content_p2 = [
        ("HEADING", "4. Objectives"),
        ("TEXT", "1. To implement core linear data structures — linked list, stack, and queue — for handling sales history, expression-based billing calculation, and customer service queues."),
        ("TEXT", "2. To apply graph structures and Breadth-First Search (BFS) for exploring component relationships."),
        ("TEXT", "3. To implement linear search, binary search, and merge sort for efficient product discovery."),
        ("TEXT", "4. To solve a budget-based product selection problem using a greedy algorithmic approach."),
        ("TEXT", "5. To integrate all of the above into one working, presentable web application."),
        ("HEADING", "5. Proposed System"),
        ("TEXT", "PC Point is built with an HTML, CSS, and JavaScript frontend and a Python Flask backend with SQLite storage. On the customer-facing side, users browse the catalogue, search products by ID or name/brand, sort listings by price or name, explore component relationships, and request accessory recommendations for a budget. On the shop-management side, the system records sales in a linked list, maintains a waiting queue for customer service, and evaluates arithmetic transaction bills using a LIFO stack expression evaluator."),
        ("HEADING", "6. Data Structures and Algorithms to be Used"),
        ("HEADING_SUB", "A. Linear Data Structures"),
        ("TEXT", "• Linked List: used to record sales history, where every completed sale is appended as a node holding sale ID, customer name, items, total, and timestamp."),
        ("TEXT", "• Stack using Linked List (Billing Expression Evaluator): used inside the billing module to evaluate arithmetic expressions ((price * quantity) + tax - discount) using LIFO operations (pushing operands, popping to evaluate operators)."),
        ("TEXT", "• Queue using Linked List: used to manage customers waiting for assistance from shop staff in First-In-First-Out (FIFO) order."),
        ("HEADING_SUB", "B. Graph Structures"),
        ("TEXT", "• Graph Representation (Adjacency List): used to represent relationships between computer components and categories (e.g. Computer -> Laptop/Desktop, Laptop -> RAM/SSD)."),
        ("TEXT", "• Breadth-First Search (BFS): used to traverse the component graph level by level from a chosen starting category."),
        ("HEADING_SUB", "C. Searching and Sorting"),
        ("TEXT", "• Linear Search: used to search products by brand or category name."),
        ("TEXT", "• Binary Search: used to search products by product ID once the index is sorted in O(log n) time."),
        ("TEXT", "• Merge Sort: used to sort product listings by price, name, or product ID in O(n log n) time."),
        ("HEADING_SUB", "D. Algorithmic Problem Solving"),
        ("TEXT", "• Greedy Technique: budget-based greedy accessory selection. Repeatedly selects the best available accessory fitting within the remaining budget."),
    ]

    content_p3 = [
        ("HEADING", "7. Module Description"),
        ("TEXT", "Module 1: Input and dynamic management of sales history data (Singly Linked List)"),
        ("TEXT", "Module 2: Processing customer service queue & step-by-step bill evaluation (LIFO Stack / FIFO Queue)"),
        ("TEXT", "Module 3: Exploring computer components and category relationships (Graph & BFS)"),
        ("TEXT", "Module 4: Locating and ordering products for catalog browsing (Linear/Binary Search + Merge Sort)"),
        ("TEXT", "Module 5: Generating budget-based accessory suggestions (Greedy Selection)"),
        ("HEADING", "8. Implementation Plan & Outcomes"),
        ("TEXT", "1. Set up Flask backend, SQLite database, and session authentication."),
        ("TEXT", "2. Implement linear structures: linked list for sales history, stack for billing evaluation, queue for customer service line."),
        ("TEXT", "3. Implement component graph with BFS traversal."),
        ("TEXT", "4. Implement linear search, binary search, and merge sort for product discovery."),
        ("TEXT", "5. Implement greedy budget selection algorithm."),
        ("TEXT", "6. Connect frontend UI pages with backend API endpoints."),
        ("HEADING", "9. Tools and Technologies"),
        ("TEXT", "• Programming Languages: Python (backend logic), JavaScript (frontend interactivity), HTML & CSS"),
        ("TEXT", "• Framework & Database: Flask, SQLite"),
        ("TEXT", "• Development Environment: Visual Studio Code"),
        ("HEADING", "10. References"),
        ("TEXT", "Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C., Introduction to Algorithms, MIT Press."),
        ("TEXT", "Python Software Foundation, Python Documentation, https://docs.python.org"),
        ("TEXT", "Flask Documentation, https://flask.palletsprojects.com")
    ]

    # Helper function to build pure PDF binary stream
    def build_pdf_stream():
        pages = [content_p1, content_p2, content_p3]
        
        pdf_objs = []
        
        # Obj 1: Catalog
        # Obj 2: Pages
        # Obj 3, 4, 5... Font, Content streams, Page objects
        
        body_lines = []
        body_lines.append("%PDF-1.4\n")
        
        xref_offsets = []
        
        def add_obj(content_str):
            offset = sum(len(x.encode('latin1')) for x in body_lines)
            xref_offsets.append(offset)
            obj_id = len(xref_offsets)
            body_lines.append(f"{obj_id} 0 obj\n{content_str}\nendobj\n")
            return obj_id

        # Placeholder IDs
        catalog_id = add_obj("<< /Type /Catalog /Pages 2 0 R >>") # Obj 1
        pages_id = add_obj("<< /Type /Pages /Count 3 /Kids [4 0 R 7 0 R 10 0 R] >>") # Obj 2
        
        font_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>") # Obj 3
        font_bold_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>") # Obj 4 (Wait, will manage IDs dynamically)

    print("Creating DSA.pdf via python...")

create_dsa_pdf("d:\\MCA PROJECTS\\PC Point\\DSA.pdf")
