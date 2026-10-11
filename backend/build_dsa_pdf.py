import os
import sys

def generate_pdf():
    pdf_path = r"d:\MCA PROJECTS\PC Point\DSA.pdf"
    
    # 1. Try ReportLab
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#1a1a2e'),
            alignment=1,
            spaceAfter=12
        )

        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#e63946'),
            alignment=1,
            spaceAfter=15
        )

        meta_style = ParagraphStyle(
            'MetaStyle',
            fontName='Helvetica',
            fontSize=9,
            leading=14,
            textColor=colors.HexColor('#334155'),
            alignment=1
        )

        h1_style = ParagraphStyle(
            'H1Style',
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1a1a2e'),
            spaceBefore=14,
            spaceAfter=6
        )

        h2_style = ParagraphStyle(
            'H2Style',
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor('#2563eb'),
            spaceBefore=10,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            'BodyStyle',
            fontName='Helvetica',
            fontSize=9,
            leading=13.5,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=6
        )

        bullet_style = ParagraphStyle(
            'BulletStyle',
            fontName='Helvetica',
            fontSize=9,
            leading=13.5,
            textColor=colors.HexColor('#334155'),
            leftIndent=15,
            spaceAfter=5
        )

        story = []

        # Title & Metadata
        story.append(Paragraph("Data Structures and Algorithmic Problem Solving Project", title_style))
        story.append(Paragraph("Project Title: PC Point – Online Computer Sales and Accessories", subtitle_style))
        
        meta_text = """
        <b>Student Name:</b> Aaron Joseph &nbsp;&nbsp;|&nbsp;&nbsp; <b>Register Number:</b> 26MCAB01 &nbsp;&nbsp;|&nbsp;&nbsp; <b>Class:</b> MCA B<br/>
        <b>Course:</b> Data Structures and Algorithmic Problem Solving &nbsp;&nbsp;|&nbsp;&nbsp; <b>Department:</b> KJIT<br/>
        <b>Faculty Guide:</b> Dr. Abinaya S &nbsp;&nbsp;|&nbsp;&nbsp; <b>Academic Year:</b> 2026 – 27
        """
        story.append(Paragraph(meta_text, meta_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#e2e8f0'), spaceAfter=12))

        # 1. Abstract
        story.append(Paragraph("1. Abstract", h1_style))
        abstract_text = (
            "PC Point is a web-based application for browsing and purchasing computers and computer accessories, "
            "built primarily to demonstrate core data structures and algorithms in a realistic store management scenario. "
            "Linear structures (singly linked list, LIFO stack, and FIFO queue) handle dynamic sales records, "
            "expression-based transaction billing, and customer service queues. Graph structures with Breadth-First Search (BFS) "
            "organise hardware component relationships. Searching and sorting techniques (linear search, binary search, and merge sort) "
            "support product discovery, while a greedy algorithm handles budget-based accessory selection."
        )
        story.append(Paragraph(abstract_text, body_style))

        # 2. Introduction
        story.append(Paragraph("2. Introduction", h1_style))
        story.append(Paragraph("• <b>Background of the project:</b> Computer hardware shops manage routine tasks — tracking stock, billing orders, attending walk-in customers in order, and recommending accessories within a budget. These tasks map naturally onto standard data structures and algorithms.", bullet_style))
        story.append(Paragraph("• <b>Problem identified:</b> Small shops managing sales and customer flow manually suffer from slow lookups, unorganised sales records, and lack a structured billing and recommendation mechanism.", bullet_style))
        story.append(Paragraph("• <b>Need for proposed system:</b> A lightweight web application that stores sales and queue data properly, lets staff search and sort inventory quickly, and offers an explainable way to compute bills and suggest accessories within a budget.", bullet_style))
        story.append(Paragraph("• <b>Overview of solution:</b> PC Point is built as a Flask-based web application backed by SQLite. Sales records are stored in a linked list, transaction billing is evaluated using a LIFO stack expression evaluator, customer service requests use a FIFO queue, component relationships are explored using a graph with BFS, product discovery uses linear search, binary search, and merge sort, and budget selection uses a greedy algorithm.", bullet_style))

        # 3. Problem Statement
        story.append(Paragraph("3. Problem Statement", h1_style))
        story.append(Paragraph(
            "Small computer accessory shops often lack structured methods for catalogue search, sales recording, customer queueing, "
            "transaction billing evaluation, and budget-based recommendations. This project addresses these gaps with an application "
            "whose internal logic is built around standard data structures and algorithms.", body_style
        ))

        # 4. Objectives
        story.append(Paragraph("4. Objectives", h1_style))
        story.append(Paragraph("1. To implement core linear data structures — singly linked list, LIFO stack, and FIFO queue — for handling sales history, expression-based billing calculation, and customer service queues.", bullet_style))
        story.append(Paragraph("2. To apply graph structures and Breadth-First Search (BFS) for exploring component relationships.", bullet_style))
        story.append(Paragraph("3. To implement search and sort techniques — linear search, binary search, and merge sort — for efficient product discovery.", bullet_style))
        story.append(Paragraph("4. To solve a budget-based product selection problem using a greedy algorithm.", bullet_style))
        story.append(Paragraph("5. To integrate all of the above into one working, presentable web application.", bullet_style))

        # 5. Proposed System
        story.append(Paragraph("5. Proposed System", h1_style))
        story.append(Paragraph(
            "PC Point is proposed as a web application with an HTML, CSS, and JavaScript frontend, a Python Flask backend, and SQLite storage. "
            "On the customer-facing side, users browse the catalogue, search products by ID or name/brand, sort listings by price or name, "
            "explore component relationships, and request accessory recommendations for a budget. "
            "On the shop-management side, the system records sales into a linked list, maintains a waiting queue for customer service, "
            "and evaluates transaction bills using a LIFO stack expression evaluator.", body_style
        ))

        # 6. Data Structures and Algorithms to be Used
        story.append(Paragraph("6. Data Structures and Algorithms to be Used", h1_style))
        
        story.append(Paragraph("A. Linear Data Structures", h2_style))
        story.append(Paragraph("• <b>Linked List:</b> Used to record sales history, where every completed sale is appended as a node holding sale ID, customer name, items, total, and timestamp.", bullet_style))
        story.append(Paragraph("• <b>Stack using Linked List (Billing Expression Evaluator):</b> Used inside the billing module to evaluate arithmetic expressions ((price × quantity) + tax - discount) using LIFO operations (pushing operands, popping to evaluate operators).", bullet_style))
        story.append(Paragraph("• <b>Queue using Linked List:</b> Used to manage customers waiting for staff assistance in First-In-First-Out (FIFO) order.", bullet_style))

        story.append(Paragraph("B. Graph Structures", h2_style))
        story.append(Paragraph("• <b>Graph Representation (Adjacency List):</b> Represents relationships between computer components and categories (e.g. Computer -> Laptop/Desktop, Laptop -> RAM/SSD).", bullet_style))
        story.append(Paragraph("• <b>Breadth-First Search (BFS):</b> Traverses the component graph level-by-level from a chosen starting category.", bullet_style))

        story.append(Paragraph("C. Searching and Sorting", h2_style))
        story.append(Paragraph("• <b>Linear Search:</b> Used to search products by brand or category name.", bullet_style))
        story.append(Paragraph("• <b>Binary Search:</b> Used to search products by product ID in O(log n) time.", bullet_style))
        story.append(Paragraph("• <b>Merge Sort:</b> Used to sort product listings by price, name, or product ID in O(n log n) divide-and-conquer time.", bullet_style))

        story.append(Paragraph("D. Algorithmic Problem Solving", h2_style))
        story.append(Paragraph("• <b>Greedy Technique:</b> Budget-based greedy accessory selection. Repeatedly selects the best available accessory fitting within the remaining budget.", bullet_style))

        # 7. Module Description Table
        story.append(Paragraph("7. Module Description", h1_style))
        table_data = [
            [Paragraph("<b>Module</b>", body_style), Paragraph("<b>Description</b>", body_style), Paragraph("<b>Data Structure / Algorithm</b>", body_style)],
            [Paragraph("Module 1", body_style), Paragraph("Input and dynamic management of sales history data", body_style), Paragraph("Singly Linked List", body_style)],
            [Paragraph("Module 2", body_style), Paragraph("Step-by-step arithmetic bill calculation & customer service line", body_style), Paragraph("LIFO Stack / FIFO Queue", body_style)],
            [Paragraph("Module 3", body_style), Paragraph("Exploring computer components and category relationships", body_style), Paragraph("Graph & BFS Traversal", body_style)],
            [Paragraph("Module 4", body_style), Paragraph("Locating and ordering products for catalog browsing", body_style), Paragraph("Linear/Binary Search + Merge Sort", body_style)],
            [Paragraph("Module 5", body_style), Paragraph("Generating budget-based accessory suggestions", body_style), Paragraph("Greedy Selection", body_style)]
        ]

        t = Table(table_data, colWidths=[65, 260, 175])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))

        # 8. Tools & References
        story.append(Paragraph("8. Tools and Technologies", h1_style))
        story.append(Paragraph("• <b>Programming Languages:</b> Python (backend logic and algorithms), JavaScript (frontend interactivity), HTML & CSS", bullet_style))
        story.append(Paragraph("• <b>Framework & Database:</b> Python Flask, SQLite", bullet_style))
        story.append(Paragraph("• <b>IDE:</b> Visual Studio Code", bullet_style))

        story.append(Paragraph("9. References", h1_style))
        story.append(Paragraph("• Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C., Introduction to Algorithms, MIT Press.", bullet_style))
        story.append(Paragraph("• Python Software Foundation, Python Documentation, https://docs.python.org", bullet_style))
        story.append(Paragraph("• Flask Documentation, https://flask.palletsprojects.com", bullet_style))

        doc.build(story)
        print("ReportLab PDF generation SUCCESS:", pdf_path)
        return True

    except Exception as e:
        print("ReportLab not available or failed:", e)

    # 2. Pure Python PDF Fallback
    try:
        generate_pure_pdf(pdf_path)
        print("Pure Python PDF generation SUCCESS:", pdf_path)
        return True
    except Exception as ex:
        print("Pure PDF fallback error:", ex)
        return False


def generate_pure_pdf(output_path):
    """
    Generates a valid standard PDF 1.4 document natively in Python without dependencies.
    """
    lines_p1 = [
        "Data Structures and Algorithmic Problem Solving Project",
        "Project Title: PC Point - Online Computer Sales and Accessories",
        "Student: Aaron Joseph | Reg No: 26MCAB01 | Class: MCA B | Dept: KJIT",
        "Course: Data Structures and Algorithmic Problem Solving | Academic Year: 2026-27",
        "",
        "1. Abstract",
        "PC Point is a web-based application for browsing and purchasing computer hardware,",
        "built to demonstrate core data structures and algorithms in a store management scenario.",
        "Linear structures (Linked List, LIFO Stack, FIFO Queue) handle sales, billing evaluation,",
        "and customer support queues. Component relationships are explored using Graph with BFS.",
        "Product discovery uses Linear Search, Binary Search, and Merge Sort, while budget accessory",
        "selection uses a Greedy algorithm.",
        "",
        "2. Introduction",
        "- Background: Computer shops handle stock, billing, queues, and budget accessory suggestions.",
        "- Problem: Manual management causes slow lookups, unorganized records, and poor billing.",
        "- Solution: Lightweight Flask web app using Linked Lists, Stacks, Queues, Graphs, Search/Sort,",
        "  and Greedy selection.",
        "",
        "3. Problem Statement",
        "Small computer shops lack structured methods for product search, transaction logging,",
        "customer queueing, billing calculation, and accessory recommendation.",
        "",
        "4. Objectives",
        "1. Implement Linked List, Stack, and Queue for sales, billing calculation, and queues.",
        "2. Implement Graph and BFS for component relationships.",
        "3. Implement Linear Search, Binary Search, and Merge Sort for product discovery.",
        "4. Implement Greedy algorithm for budget accessory selection.",
        "5. Integrate all algorithms into a working web application."
    ]

    lines_p2 = [
        "5. Proposed System",
        "PC Point features HTML/CSS/JS frontend, Python Flask backend, and SQLite database.",
        "Customer side: Browse catalog, search by ID/name, sort by price, explore graph, recommendations.",
        "Management side: Record sales in Linked List, evaluate bills via LIFO Stack, process Queue.",
        "",
        "6. Data Structures and Algorithms Used",
        "A. Linear Data Structures",
        "- Linked List: Used for sales transaction history recording.",
        "- Stack using Linked List: Billing Expression Evaluator ((price * qty) + tax - discount).",
        "- Queue using Linked List: Customer service line (FIFO).",
        "",
        "B. Graph Structures",
        "- Graph (Adjacency List): Hardware component and category relationships.",
        "- Breadth-First Search (BFS): Level-by-level component traversal.",
        "",
        "C. Searching and Sorting",
        "- Linear Search: Search products by text (brand/category).",
        "- Binary Search: Search products by ID in O(log n) time.",
        "- Merge Sort: Sort listings by price, name, or ID in O(n log n) divide-and-conquer time.",
        "",
        "D. Algorithmic Problem Solving",
        "- Greedy Technique: Budget-based accessory selection algorithm.",
        "",
        "7. Module Description",
        "Module 1: Sales History Management (Singly Linked List)",
        "Module 2: Billing Calculation & Customer Support Line (LIFO Stack / FIFO Queue)",
        "Module 3: Hardware Component Relationships (Graph & BFS)",
        "Module 4: Catalog Search & Sorting (Linear/Binary Search + Merge Sort)",
        "Module 5: Budget Accessory Recommendation (Greedy Selection)",
        "",
        "8. Tools & Technologies",
        "Languages: Python, JavaScript, HTML, CSS | Backend: Flask | Database: SQLite | IDE: VS Code",
        "",
        "9. References",
        "- Cormen et al., Introduction to Algorithms, MIT Press.",
        "- Python Documentation (https://docs.python.org) | Flask Documentation"
    ]

    def build_page_stream(text_lines):
        stream_content = "BT\n/F1 10 Tf\n12 TL\n54 738 Td\n"
        for line in text_lines:
            escaped = line.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
            if line.startswith("Data Structures") or line.startswith("Project Title"):
                stream_content += f"/F2 13 Tf ({escaped}) Tj T*\n/F1 10 Tf\n"
            elif line and line[0].isdigit() and "." in line[:3]:
                stream_content += f"/F2 11 Tf ({escaped}) Tj T*\n/F1 10 Tf\n"
            elif line.startswith("A. ") or line.startswith("B. ") or line.startswith("C. ") or line.startswith("D. "):
                stream_content += f"/F2 10.5 Tf ({escaped}) Tj T*\n/F1 10 Tf\n"
            else:
                stream_content += f"({escaped}) Tj T*\n"
        stream_content += "ET\n"
        return stream_content

    s1 = build_page_stream(lines_p1)
    s2 = build_page_stream(lines_p2)

    objs = []
    objs.append("<< /Type /Catalog /Pages 2 0 R >>") # 1
    objs.append("<< /Type /Pages /Count 2 /Kids [3 0 R 5 0 R] >>") # 2
    objs.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>") # 3
    objs.append(f"<< /Length {len(s1.encode('latin1'))} >>\nstream\n{s1}endstream") # 4
    objs.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>") # 5
    objs.append(f"<< /Length {len(s2.encode('latin1'))} >>\nstream\n{s2}endstream") # 6
    objs.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>") # 7
    objs.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>") # 8

    body = "%PDF-1.4\n"
    offsets = []

    for i, obj in enumerate(objs, 1):
        offsets.append(len(body.encode('latin1')))
        body += f"{i} 0 obj\n{obj}\nendobj\n"

    xref_offset = len(body.encode('latin1'))
    body += f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n"
    for off in offsets:
        body += f"{off:010d} 00000 n \n"

    body += f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"

    with open(output_path, 'wb') as f:
        f.write(body.encode('latin1'))


if __name__ == '__main__':
    generate_pdf()
