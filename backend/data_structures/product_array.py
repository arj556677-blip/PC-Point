class ProductArray:
    """
    High-Performance In-Memory Product Inventory Cache.
    Provides rapid indexed retrieval and real-time stock management.
    """
    def __init__(self):
        self._items = []

    def load_from_db(self, rows):
        """Loads products from database row dicts into contiguous array."""
        self._items = [dict(row) for row in rows]

    def get_by_index(self, index):
        """O(1) Indexed access."""
        if 0 <= index < len(self._items):
            return self._items[index]
        return None

    def size(self):
        return len(self._items)

    def to_list(self):
        return list(self._items)

    def append(self, product):
        """Appends item to array."""
        self._items.append(product)

    def remove_by_id(self, product_id):
        self._items = [p for p in self._items if p['id'] != product_id]

    def update(self, product_id, updated_fields):
        for p in self._items:
            if p['id'] == product_id:
                p.update(updated_fields)
                return p
        return None
