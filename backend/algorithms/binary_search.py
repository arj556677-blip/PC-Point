def binary_search(sorted_products, target_id):
    """
    Instant SKU Index Search on products indexed by Product ID.
    Returns (found_product, trace_steps) for fast lookup and audit logs.
    """
    low = 0
    high = len(sorted_products) - 1
    steps = []

    while low <= high:
        mid = (low + high) // 2
        mid_product = sorted_products[mid]
        mid_id = mid_product['id']

        comparison = 'equal' if mid_id == target_id else ('less' if mid_id < target_id else 'greater')
        steps.append({
            'low': low,
            'high': high,
            'mid': mid,
            'mid_id': mid_id,
            'mid_name': mid_product['name'],
            'comparison': comparison
        })

        if mid_id == target_id:
            return mid_product, steps
        elif mid_id < target_id:
            low = mid + 1
        else:
            high = mid - 1

    return None, steps
