def greedy_budget_selection(products, budget):
    """
    Smart Value Configurator & Budget Hardware Selection Engine.
    Criterion: Sort products by price ascending to maximize component value,
    allocating hardware packages that cleanly fit within the customer's target budget.

    Returns: {
        selected: [...],
        total_cost: float,
        remaining_budget: float,
        decision_steps: [...]
    }
    """
    # Sort by price ascending (optimal value allocation)
    sorted_items = sorted(products, key=lambda p: p['price'])

    selected = []
    total_cost = 0.0
    remaining = float(budget)
    steps = []

    for item in sorted_items:
        price = float(item['price'])
        stock = int(item['stock'])

        step = {
            'product_name': item['name'],
            'category': item['category'],
            'price': price,
            'remaining_before': remaining,
            'decision': ''
        }

        if price <= remaining and stock > 0:
            selected.append(item)
            total_cost += price
            remaining -= price
            step['decision'] = 'SELECTED'
            step['status'] = 'included'
            step['included'] = True
        elif stock == 0:
            step['decision'] = 'SKIPPED (Out of stock)'
            step['status'] = 'rejected'
            step['included'] = False
        else:
            step['decision'] = 'SKIPPED (Exceeds remaining budget)'
            step['status'] = 'rejected'
            step['included'] = False

        step['remaining_budget'] = round(remaining, 2)
        steps.append(step)

    return {
        'selected': selected,
        'selected_items': selected,
        'total_cost': round(total_cost, 2),
        'remaining_budget': round(remaining, 2),
        'decision_steps': steps
    }
