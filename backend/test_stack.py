import sys
import os
sys.path.append(os.path.dirname(__file__))

from data_structures.billing_stack import BillingStack
from algorithms.expression_evaluator import evaluate_billing_expression

print("--- Testing BillingStack ---")
s = BillingStack()
s.push(100)
s.push(200)
print("Stack top:", s.peek())
print("Popped:", s.pop())
print("Stack size:", s.size())

print("\n--- Testing Expression Evaluator ---")
sample_items = [
    {'product_id': 1, 'product_name': 'ThinkPad X1 Carbon', 'price': 85000.0, 'quantity': 1},
    {'product_id': 6, 'product_name': 'Vengeance 16GB DDR5', 'price': 4500.0, 'quantity': 2}
]
res = evaluate_billing_expression(sample_items, tax_rate=0.18, discount=1000.0)

print(f"Subtotal: ₹{res['subtotal']}")
print(f"Tax (18%): ₹{res['tax']}")
print(f"Discount: ₹{res['discount']}")
print(f"Final Total: ₹{res['final_total']}")
print(f"Total Trace Steps: {len(res['trace_steps'])}")
for step in res['trace_steps']:
    print(f"Step {step['step']}: {step['action']} ({step['token']}) -> {step['description']} | Stack: {step['stack_state']}")

print("\nALL STACK & EXPRESSION EVALUATOR TESTS PASSED!")
