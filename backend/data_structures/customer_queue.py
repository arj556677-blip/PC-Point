class QueueNode:
    """A node in the queue."""
    def __init__(self, data):
        self.data = data
        self.next = None

class CustomerQueue:
    """
    Customer Service & Consultation Priority Dispatcher.
    Maintains real-time ordering of customer support appointments and repair consultations.
    """
    def __init__(self):
        self.front = None
        self.rear = None
        self._size = 0

    def enqueue(self, customer_data):
        """Register new customer ticket to consultation waiting list."""
        node = QueueNode(customer_data)
        if self.rear:
            self.rear.next = node
        self.rear = node
        if not self.front:
            self.front = node
        self._size += 1

    def dequeue(self):
        """O(1) Dequeue from front."""
        if not self.front:
            return None
        data = self.front.data
        self.front = self.front.next
        if not self.front:
            self.rear = None
        self._size -= 1
        return data

    def peek(self):
        """View next customer without removing."""
        return self.front.data if self.front else None

    def to_list(self):
        result = []
        current = self.front
        while current:
            result.append(current.data)
            current = current.next
        return result

    def size(self):
        return self._size

    def is_empty(self):
        return self._size == 0
