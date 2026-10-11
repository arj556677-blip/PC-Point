class StackNode:
    """A node in the stack linked list."""
    def __init__(self, value):
        self.value = value
        self.next = None


class BillingStack:
    """
    Transaction Calculation Ledger Engine using sequential state management.
    Used for reliable arithmetic invoice evaluation, taxes, discounts, and item breakdowns.
    """
    def __init__(self):
        self.top = None
        self._size = 0

    def push(self, value):
        """Append calculation value into ledger state."""
        node = StackNode(value)
        node.next = self.top
        self.top = node
        self._size += 1

    def pop(self):
        """Extract latest operand from ledger state."""
        if self.is_empty():
            raise IndexError("Ledger state is empty")
        val = self.top.value
        self.top = self.top.next
        self._size -= 1
        return val

    def peek(self):
        """View value at top of stack without removing."""
        if self.is_empty():
            return None
        return self.top.value

    def is_empty(self):
        return self.top is None

    def size(self):
        return self._size

    def to_list(self):
        """Return stack contents from top to bottom."""
        result = []
        curr = self.top
        while curr:
            result.append(curr.value)
            curr = curr.next
        return result
