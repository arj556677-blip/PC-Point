class SaleNode:
    """A node in the sales linked list."""
    def __init__(self, sale_data):
        self.data = sale_data  # dict: {id, customer_id, customer_name, total, date, items}
        self.next = None

class SalesLinkedList:
    """
    Sales Order Stream & Transaction History Ledger.
    Maintains sequential chronology of completed customer purchases and itemized orders.
    """
    def __init__(self):
        self.head = None
        self._size = 0

    def insert_at_head(self, sale_data):
        """Prepend latest order to the active transaction stream."""
        node = SaleNode(sale_data)
        node.next = self.head
        self.head = node
        self._size += 1

    def traverse(self):
        """Traverse the linked list from head to tail."""
        current = self.head
        while current:
            yield current.data
            current = current.next

    def find_by_id(self, sale_id):
        """O(n) search in linked list."""
        for sale in self.traverse():
            if sale['id'] == sale_id:
                return sale
        return None

    def size(self):
        return self._size

    def to_list(self):
        return list(self.traverse())
