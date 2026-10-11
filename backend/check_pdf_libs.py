import sys

libs = ['reportlab', 'fpdf', 'fitz', 'pypdf', 'weasyprint']
found = []
for lib in libs:
    try:
        __import__(lib)
        found.append(lib)
    except ImportError:
        pass

print("AVAILABLE_LIBS:", found)
