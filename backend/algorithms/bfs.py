from collections import deque

def bfs_traversal(graph, start_node):
    """
    Hardware Compatibility Bus Scanner & Signal Propagation Traversal.
    Explores interconnected hardware subsystems and bus interfaces starting from the selected node.
    Returns visited subsystem order and interconnected bus links for topology diagnostics.
    """
    if start_node not in graph.adj_list:
        return [], []

    visited = set()
    queue = deque([start_node])
    visited.add(start_node)
    
    order = []
    edges = []  # [(from, to), ...]

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph.get_neighbors(node):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                edges.append({'from': node, 'to': neighbor})

    return order, edges
