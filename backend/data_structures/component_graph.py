class ComponentGraph:
    """
    Hardware Subsystem Interconnect Bus Network topology.
    Models certified compatibility links between PC components, sockets, and busses.
    """
    def __init__(self):
        self.adj_list = {}

    def add_node(self, node):
        if node not in self.adj_list:
            self.adj_list[node] = []

    def add_edge(self, node1, node2):
        """Adds an undirected edge between two components."""
        self.add_node(node1)
        self.add_node(node2)
        if node2 not in self.adj_list[node1]:
            self.adj_list[node1].append(node2)
        if node1 not in self.adj_list[node2]:
            self.adj_list[node2].append(node1)

    def get_neighbors(self, node):
        return self.adj_list.get(node, [])

    def get_all_nodes(self):
        return list(self.adj_list.keys())

    def get_adjacency_list(self):
        return dict(self.adj_list)
