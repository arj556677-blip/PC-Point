/**
 * PC Point - Sales & Orders Module JS Logic
 */

let currentSales = [];

document.addEventListener('DOMContentLoaded', () => {
  loadSalesData();
  populateProductDropdown();
  setupFormListener();
});

async function loadSalesData() {
  try {
    currentSales = await apiCall('/api/sales');
    renderSalesChain(currentSales);
    renderSalesTable(currentSales);
  } catch (err) {
    showToast('Failed to load transaction history', 'error');
  }
}

async function populateProductDropdown() {
  try {
    const products = await apiCall('/api/products');
    const select = document.getElementById('sale-product');
    if (!select) return;

    if (!products || products.length === 0) {
      select.innerHTML = '<option value="">No products available</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Choose Hardware Item --</option>' +
      products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${formatCurrency(p.price)})</option>`).join('');
  } catch (err) {
    console.error('Failed to populate products:', err);
  }
}

function renderSalesChain(sales) {
  const container = document.getElementById('ll-chain-visualizer');
  if (!container) return;

  if (!sales || sales.length === 0) {
    container.innerHTML = `<div style="color: #94a3b8;">No recent orders.</div>`;
    return;
  }

  // Stream Start Badge
  let html = `<div style="background: var(--navy); color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 0.82rem;"><i class="fa-solid fa-bolt" style="color:var(--red);"></i> Latest Order</div>`;
  html += `<div class="ll-arrow">&rarr;</div>`;

  sales.forEach((sale, index) => {
    const isLatest = index === 0;
    const itemsText = sale.items ? sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ') : 'No items';
    const amount = sale.total !== undefined ? sale.total : (sale.total_amount || 0);

    html += `
      <div class="ll-node ${isLatest ? 'head' : ''}" style="cursor: pointer;" onclick="showSaleStackTrace(${sale.id})" title="Click to view Itemized Invoice">
        <div class="node-tag">${isLatest ? 'Current Active' : `Order #${index + 1}`}</div>
        <div class="node-data">${escapeHtml(sale.customer_name || 'Walk-in Customer')}</div>
        <div style="font-size: 0.8rem; color: var(--accent-red); font-weight: 700;">${formatCurrency(amount)}</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">${escapeHtml(itemsText)}</div>
        <div class="node-next">Prior &rarr; ${index < sales.length - 1 ? `[#ORD-${sales[index+1].id || index + 2}]` : 'Stream End'}</div>
      </div>
    `;

    if (index < sales.length - 1) {
      html += `<div class="ll-arrow">&rarr;</div>`;
    }
  });

  html += `<div class="ll-arrow">&rarr;</div>`;
  html += `<div style="background: #334155; color: #f8fafc; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.82rem;">Archived</div>`;

  container.innerHTML = html;
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('sales-tbody');
  const countBadge = document.getElementById('sales-count-badge');
  if (countBadge) countBadge.textContent = `${sales ? sales.length : 0} Orders`;

  if (!sales || sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transactions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map((sale, idx) => {
    const itemsText = sale.items ? sale.items.map(i => `${escapeHtml(i.product_name || 'Product')} (x${i.quantity})`).join(', ') : 'N/A';
    const amount = sale.total !== undefined ? sale.total : (sale.total_amount || 0);
    const dateStr = sale.date || sale.created_at || 'Just now';

    return `
      <tr>
        <td><strong>#ORD-${sale.id}</strong> ${idx === 0 ? '<span class="badge badge-red">Latest</span>' : ''}</td>
        <td style="font-weight: 600; color: var(--primary-navy);">${escapeHtml(sale.customer_name || 'Walk-in Customer')}</td>
        <td>${itemsText}</td>
        <td style="color: var(--accent-red); font-weight: 700;">${formatCurrency(amount)}</td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">${dateStr}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="showSaleStackTrace(${sale.id})" title="View Invoice Breakdown" style="padding: 3px 8px; font-size: 0.78rem;">
            <i class="fa-solid fa-file-invoice-dollar" style="color: var(--accent-red);"></i> Invoice
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function showSaleStackTrace(saleId) {
  const sale = currentSales.find(s => s.id === saleId);
  if (!sale) return;

  if (sale.stack_trace && sale.stack_trace.length > 0) {
    renderStackTrace({
      subtotal: sale.subtotal || sale.total,
      tax: sale.tax || 0,
      discount: sale.discount || 0,
      final_total: sale.total || sale.total_amount,
      trace_steps: sale.stack_trace
    });
    return;
  }

  // Re-evaluate on the fly if needed
  if (sale.items && sale.items.length > 0) {
    try {
      const evalRes = await apiCall('/api/billing/evaluate', 'POST', {
        items: sale.items,
        tax_rate: 0.18,
        discount: 0.0
      });
      renderStackTrace(evalRes);
    } catch (e) {
      showToast('Could not load invoice ledger for order #' + saleId, 'error');
    }
  }
}

async function previewOrderCalculation() {
  const productId = document.getElementById('sale-product')?.value;
  const quantity = parseInt(document.getElementById('sale-quantity')?.value || 1);

  if (!productId) {
    showToast('Please select a hardware product first', 'error');
    return;
  }

  try {
    const products = await apiCall('/api/products');
    const prod = products.find(p => p.id === parseInt(productId));
    if (!prod) {
      showToast('Selected product not found', 'error');
      return;
    }

    const evalRes = await apiCall('/api/billing/evaluate', 'POST', {
      items: [{ product_id: prod.id, product_name: prod.name, price: prod.price, quantity }],
      tax_rate: 0.18,
      discount: 0.0
    });

    renderStackTrace(evalRes);
  } catch (err) {
    showToast('Failed to evaluate invoice calculation: ' + err.message, 'error');
  }
}
window.previewBillingStack = previewOrderCalculation;

function renderStackTrace(evalRes) {
  const card = document.getElementById('billing-ledger-card') || document.getElementById('stack-eval-card');
  const container = document.getElementById('billing-ledger-container') || document.getElementById('stack-trace-container');
  if (!card || !container) return;

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });

  if (!evalRes || !evalRes.trace_steps) {
    container.innerHTML = `<div style="color:#94a3b8;">No calculation ledger available.</div>`;
    return;
  }

  let html = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-bottom:1rem;background:#f8fafc;padding:0.75rem;border-radius:8px;border:1px solid #e2e8f0;">
      <div><span style="font-size:0.75rem;color:#64748b;display:block;">Subtotal</span><strong style="color:#1e293b;">${formatCurrency(evalRes.subtotal)}</strong></div>
      <div><span style="font-size:0.75rem;color:#64748b;display:block;">GST Tax (18%)</span><strong style="color:#1e293b;">+${formatCurrency(evalRes.tax)}</strong></div>
      <div><span style="font-size:0.75rem;color:#64748b;display:block;">Discount</span><strong style="color:#1e293b;">-${formatCurrency(evalRes.discount)}</strong></div>
      <div><span style="font-size:0.75rem;color:#64748b;display:block;">Final Payable</span><strong style="color:#dc2626;font-size:1.05rem;">${formatCurrency(evalRes.final_total)}</strong></div>
    </div>
    <div style="font-weight:700;font-size:0.85rem;color:#334155;margin-bottom:0.4rem;">Transaction Ledger Audit Steps:</div>
  `;

  evalRes.trace_steps.forEach(s => {
    const isPush = s.action === 'PUSH' || s.action.includes('PUSH');
    const isEval = s.action.startsWith('EVAL') || s.action.includes('CALC');
    const badgeBg = isPush ? '#dbeafe' : (isEval ? '#fee2e2' : '#f1f5f9');
    const badgeColor = isPush ? '#1e40af' : (isEval ? '#991b1b' : '#334155');

    const ledgerItems = s.stack_state.map(st => `<span style="background:#1e293b;color:#38bdf8;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.78rem;">${st}</span>`).join(' &rarr; ');

    html += `
      <div style="display:flex;flex-direction:column;gap:0.25rem;padding:0.6rem 0.8rem;background:#fff;border:1px solid #e2e8f0;border-radius:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.75rem;font-weight:700;padding:2px 8px;border-radius:4px;background:${badgeBg};color:${badgeColor};">
            Step ${s.step}: ${s.action} (${escapeHtml(s.token)})
          </span>
          <span style="font-size:0.8rem;color:#64748b;">Ledger State: ${ledgerItems || '<em style="color:#cbd5e1;">[Empty]</em>'}</span>
        </div>
        <div style="font-size:0.82rem;color:#475569;margin-top:2px;">${escapeHtml(s.description)}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setupFormListener() {
  const form = document.getElementById('new-sale-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerName = document.getElementById('customer-name').value;
    const productId = document.getElementById('sale-product').value;
    const quantity = parseInt(document.getElementById('sale-quantity').value);

    if (!productId) {
      showToast('Please select a hardware product', 'error');
      return;
    }

    try {
      const res = await apiCall('/api/sales', 'POST', {
        customer_name: customerName,
        items: [{ product_id: parseInt(productId), quantity }],
        tax_rate: 0.18,
        discount: 0.0
      });

      showToast('Order recorded and itemized invoice generated!', 'success');
      if (res && res.sale && res.sale.stack_trace) {
        renderStackTrace({
          subtotal: res.sale.subtotal,
          tax: res.sale.tax,
          discount: res.sale.discount,
          final_total: res.sale.total,
          trace_steps: res.sale.stack_trace
        });
      }
      form.reset();
      loadSalesData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
