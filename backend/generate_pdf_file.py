import os

def build_pdf_file():
    pdf_path = r"d:\MCA PROJECTS\PC Point\DSA.pdf"

    # Page 1 text stream
    p1_text = """BT
/F2 18 Tf
1 0 0 1 54 740 Tm
(Data Structures and Algorithmic Problem Solving Project) Tj
/F2 12 Tf
0 -22 Td
(Project Title: PC Point - Online Computer Sales and Accessories) Tj
/F1 9 Tf
0 -18 Td
(Student: Aaron Joseph  |  Register No: 26MCAB01  |  Class: MCA B  |  Dept: KJIT) Tj
0 -14 Td
(Course: Data Structures and Algorithmic Problem Solving  |  Year: 2026 - 27) Tj
0 -14 Td
(Faculty Guide: Dr. Abinaya S) Tj

0 -25 Td
/F2 13 Tf
(1. Abstract) Tj
/F1 9.5 Tf
0 -16 Td
(PC Point is a web-based application for browsing and purchasing computer hardware,) Tj
0 -14 Td
(built to demonstrate core data structures and algorithms in a store management scenario.) Tj
0 -14 Td
(Linear structures (Linked List, LIFO Stack, FIFO Queue) handle dynamic sales records,) Tj
0 -14 Td
(expression-based transaction billing, and customer service queues. Hardware component) Tj
0 -14 Td
(relationships are explored using a Graph with Breadth-First Search (BFS). Product discovery) Tj
0 -14 Td
(uses Linear Search, Binary Search, and Merge Sort, while budget accessory selection uses a) Tj
0 -14 Td
(Greedy algorithm.) Tj

0 -25 Td
/F2 13 Tf
(2. Introduction) Tj
/F1 9.5 Tf
0 -16 Td
(- Background: Computer shops handle stock tracking, billing, queues, and budget selection.) Tj
0 -14 Td
(- Problem Identified: Manual sales management causes slow lookups and unorganized records.) Tj
0 -14 Td
(- Need for System: Lightweight app to store sales/queue data and search inventory fast.) Tj
0 -14 Td
(- Proposed Solution: Flask web app backed by SQLite utilizing Linked Lists, LIFO Stacks,) Tj
0 -14 Td
(  FIFO Queues, Graphs with BFS, Search/Sort algorithms, and Greedy selection.) Tj

0 -25 Td
/F2 13 Tf
(3. Problem Statement) Tj
/F1 9.5 Tf
0 -16 Td
(Small computer accessory shops lack structured methods for catalog search, sales recording,) Tj
0 -14 Td
(customer queueing, transaction billing evaluation, and budget recommendations.) Tj
ET"""

    # Page 2 text stream
    p2_text = """BT
/F2 13 Tf
1 0 0 1 54 740 Tm
(4. Objectives) Tj
/F1 9.5 Tf
0 -16 Td
(1. Implement Linked List, LIFO Stack, and FIFO Queue for sales, billing, and queues.) Tj
0 -14 Td
(2. Apply Graph structures and Breadth-First Search (BFS) for component relationships.) Tj
0 -14 Td
(3. Implement Linear Search, Binary Search, and Merge Sort for product discovery.) Tj
0 -14 Td
(4. Solve budget-based accessory selection using a Greedy algorithm.) Tj
0 -14 Td
(5. Integrate all data structures and algorithms into a presentable web application.) Tj

0 -25 Td
/F2 13 Tf
(5. Proposed System) Tj
/F1 9.5 Tf
0 -16 Td
(PC Point features HTML/CSS/JS frontend, Python Flask backend, and SQLite database.) Tj
0 -14 Td
(Customer side: Browse catalog, search by ID/name, sort by price, explore graph, recommend.) Tj
0 -14 Td
(Management side: Record sales in Linked List, evaluate bills via LIFO Stack, process Queue.) Tj

0 -25 Td
/F2 13 Tf
(6. Data Structures and Algorithms to be Used) Tj
/F2 11 Tf
0 -18 Td
(A. Linear Data Structures) Tj
/F1 9.5 Tf
0 -15 Td
(- Linked List: Records sales transaction history dynamically.) Tj
0 -14 Td
(- Stack using Linked List: Billing Expression Evaluator ((price * qty) + tax - discount).) Tj
0 -14 Td
(- Queue using Linked List: Customer service line management (FIFO).) Tj

/F2 11 Tf
0 -18 Td
(B. Graph Structures) Tj
/F1 9.5 Tf
0 -15 Td
(- Graph (Adjacency List): Hardware component and category relationships.) Tj
0 -14 Td
(- Breadth-First Search (BFS): Level-by-level component graph traversal.) Tj

/F2 11 Tf
0 -18 Td
(C. Searching and Sorting) Tj
/F1 9.5 Tf
0 -15 Td
(- Linear Search: Search products by text (brand/category).) Tj
0 -14 Td
(- Binary Search: Search products by ID in O(log n) time.) Tj
0 -14 Td
(- Merge Sort: Sort listings by price, name, or ID in O(n log n) divide-and-conquer time.) Tj

/F2 11 Tf
0 -18 Td
(D. Algorithmic Problem Solving) Tj
/F1 9.5 Tf
0 -15 Td
(- Greedy Technique: Budget-based accessory selection algorithm.) Tj
ET"""

    # Page 3 text stream
    p3_text = """BT
/F2 13 Tf
1 0 0 1 54 740 Tm
(7. Module Description) Tj
/F1 9.5 Tf
0 -18 Td
(Module 1: Dynamic Sales History Management (Singly Linked List)) Tj
0 -14 Td
(Module 2: Step-by-step Bill Calculation & Customer Support Desk (LIFO Stack / FIFO Queue)) Tj
0 -14 Td
(Module 3: Hardware Component Relationships (Graph & BFS Traversal)) Tj
0 -14 Td
(Module 4: Product Discovery & Sorting (Linear/Binary Search + Merge Sort)) Tj
0 -14 Td
(Module 5: Budget Accessory Selection (Greedy Algorithm)) Tj

0 -25 Td
/F2 13 Tf
(8. Tools and Technologies) Tj
/F1 9.5 Tf
0 -16 Td
(- Programming Languages: Python (backend logic), JavaScript (interactivity), HTML & CSS) Tj
0 -14 Td
(- Framework & Database: Flask, SQLite) Tj
0 -14 Td
(- IDE: Visual Studio Code) Tj

0 -25 Td
/F2 13 Tf
(9. References) Tj
/F1 9.5 Tf
0 -16 Td
(- Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C., Introduction to Algorithms, MIT Press.) Tj
0 -14 Td
(- Python Software Foundation, Python Documentation, https://docs.python.org) Tj
0 -14 Td
(- Flask Documentation, https://flask.palletsprojects.com) Tj
ET"""

    objects = []
    
    # 1: Catalog
    # 2: Pages Root
    # 3: Page 1, 4: Content 1
    # 5: Page 2, 6: Content 2
    # 7: Page 3, 8: Content 3
    # 9: Font F1 (Helvetica), 10: Font F2 (Helvetica-Bold)

    objects.append("<< /Type /Catalog /Pages 2 0 R >>")
    objects.append("<< /Type /Pages /Count 3 /Kids [3 0 R 5 0 R 7 0 R] >>")
    
    objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>")
    objects.append(f"<< /Length {len(p1_text)} >>\nstream\n{p1_text}\nendstream")
    
    objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>")
    objects.append(f"<< /Length {len(p2_text)} >>\nstream\n{p2_text}\nendstream")
    
    objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 8 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>")
    objects.append(f"<< /Length {len(p3_text)} >>\nstream\n{p3_text}\nendstream")
    
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

    pdf_header = "%PDF-1.4\n"
    pdf_body = pdf_header
    offsets = []

    for idx, obj in enumerate(objects, 1):
        offsets.append(len(pdf_body.encode('latin1')))
        pdf_body += f"{idx} 0 obj\n{obj}\nendobj\n"

    xref_offset = len(pdf_body.encode('latin1'))
    xref_str = f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n"
    for off in offsets:
        xref_str += f"{off:010d} 00000 n \n"

    trailer_str = f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"

    final_pdf_content = pdf_body + xref_str + trailer_str

    with open(pdf_path, 'wb') as f:
        f.write(final_pdf_content.encode('latin1'))

    print("DSA.pdf GENERATED SUCCESSFULLY!")

if __name__ == '__main__':
    build_pdf_file()
