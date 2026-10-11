from data_structures.billing_stack import BillingStack

def evaluate_billing_expression(items, tax_rate=0.18, discount=0.0):
    """
    Evaluates order totals, tax breakdown, and itemized billing ledger.
    Calculates unit quantities, item subtotals, standard GST, discounts, and net payable.
    """
    stack = BillingStack()
    steps = []

    def log_step(action, operand_or_op, description):
        steps.append({
            'step': len(steps) + 1,
            'action': action,
            'token': str(operand_or_op),
            'description': description,
            'stack_state': [round(x, 2) if isinstance(x, (int, float)) else str(x) for x in stack.to_list()]
        })

    if not items:
        return {
            'subtotal': 0.0,
            'tax': 0.0,
            'discount': 0.0,
            'final_total': 0.0,
            'trace_steps': []
        }

    # Step 1: Process each item (price * quantity)
    item_subtotals = []
    for idx, item in enumerate(items, 1):
        price = float(item['price'])
        qty = int(item['quantity'])
        name = item.get('product_name', f"Item #{idx}")

        # Unit price
        stack.push(price)
        log_step('PUSH', price, f"Entered unit price for '{name}' (₹{price})")

        # Quantity
        stack.push(qty)
        log_step('PUSH', qty, f"Entered quantity for '{name}' ({qty})")

        # Multiply
        q = stack.pop()
        p = stack.pop()
        sub = p * q
        stack.push(sub)
        item_subtotals.append(sub)
        log_step('EVAL (*)', f"₹{p} × {q}", f"Calculated subtotal for '{name}' = ₹{round(sub, 2)}")

    # Step 2: Sum all item subtotals
    if len(item_subtotals) > 1:
        while stack.size() > 1:
            val1 = stack.pop()
            val2 = stack.pop()
            sum_val = val1 + val2
            stack.push(sum_val)
            log_step('EVAL (+)', f"₹{round(val1,2)} + ₹{round(val2,2)}", f"Aggregated item subtotals = ₹{round(sum_val, 2)}")

    total_subtotal = stack.pop()
    log_step('POP', round(total_subtotal, 2), f"Total Invoice Subtotal = ₹{round(total_subtotal, 2)}")

    # Step 3: Compute Tax (subtotal * tax_rate)
    stack.push(total_subtotal)
    log_step('PUSH', round(total_subtotal, 2), f"Loaded Subtotal for tax calculation")

    stack.push(tax_rate)
    log_step('PUSH', f"{int(tax_rate * 100)}%", f"Applied GST Tax Rate ({int(tax_rate * 100)}%)")

    t_rate = stack.pop()
    sub_val = stack.pop()
    tax_amount = sub_val * t_rate
    stack.push(tax_amount)
    log_step('EVAL (*)', f"₹{round(sub_val,2)} × {t_rate}", f"Calculated 18% GST Tax = ₹{round(tax_amount, 2)}")

    # Step 4: Add Subtotal + Tax
    stack.push(total_subtotal)
    log_step('PUSH', round(total_subtotal, 2), f"Aggregated Gross Subtotal")

    tax_val = stack.pop()
    sub_val = stack.pop()
    sub_plus_tax = sub_val + tax_val
    stack.push(sub_plus_tax)
    log_step('EVAL (+)', f"₹{round(sub_val,2)} + ₹{round(tax_val,2)}", f"Calculated Tax-Inclusive Total = ₹{round(sub_plus_tax, 2)}")

    # Step 5: Apply Discount
    discount_val = float(discount)
    stack.push(discount_val)
    log_step('PUSH', round(discount_val, 2), f"Deducted promotional discount (₹{round(discount_val, 2)})")

    disc = stack.pop()
    total_tax_inc = stack.pop()
    final_total = max(0.0, total_tax_inc - disc)
    stack.push(final_total)
    log_step('EVAL (-)', f"₹{round(total_tax_inc,2)} - ₹{round(disc,2)}", f"Calculated Final Payable Net Total = ₹{round(final_total, 2)}")

    return {
        'subtotal': round(total_subtotal, 2),
        'tax': round(tax_amount, 2),
        'discount': round(discount_val, 2),
        'final_total': round(final_total, 2),
        'trace_steps': steps
    }
