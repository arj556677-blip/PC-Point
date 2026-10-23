/**
 * PC Point - Custom PC Builder & Smart Hardware Optimizer JS Logic
 * Supports:
 * 1. Smart Budget Value Builder (Live Allocation & Pricing Ledger)
 * 2. Interactive Manual PC Part Picker (Custom Rig Configurator with Order Creation)
 */

let allInventory = [];
let lastRecommendedBuild = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupBudgetControls();
  setupRecommendationForm();
  await loadManualBuilderInventory();
});

/* ==========================================================================
   1. TAB SWITCHING
   ========================================================================== */
function switchBuilderTab(tab) {
  const autoSection = document.getElementById('section-auto-builder');
  const manualSection = document.getElementById('section-manual-builder');
  const autoBtn = document.getElementById('tab-btn-auto');
  const manualBtn = document.getElementById('tab-btn-manual');

  if (tab === 'auto') {
    if (autoSection) autoSection.style.display = 'block';
    if (manualSection) manualSection.style.display = 'none';
    if (autoBtn) {
      autoBtn.className = 'btn btn-primary';
    }
    if (manualBtn) {
      manualBtn.className = 'btn btn-secondary';
    }
  } else {
    if (autoSection) autoSection.style.display = 'none';
    if (manualSection) manualSection.style.display = 'block';
    if (autoBtn) {
      autoBtn.className = 'btn btn-secondary';
    }
    if (manualBtn) {
      manualBtn.className = 'btn btn-primary';
    }
    updateCustomRigCalculation();
  }
}

/* ==========================================================================
   2. SMART BUDGET OPTIMIZER & CONFIGURATOR
   ========================================================================== */
function setPresetBudget(amount) {
  const range = document.getElementById('budget-range');
  const number = document.getElementById('budget-number');
  const display = document.getElementById('budget-val-display');

  if (range) range.value = amount;
  if (number) number.value = amount;
  if (display) display.textContent = formatCurrency(amount);

  // Update active pill
  document.querySelectorAll('.preset-budget-btn').forEach(btn => {
    const text = btn.textContent || '';
    if (text.includes('40K') && amount === 40000) btn.classList.add('active');
    else if (text.includes('60K') && amount === 60000) btn.classList.add('active');
    else if (text.includes('1L') && amount === 100000) btn.classList.add('active');
    else if (text.includes('1.8L') && amount === 180000) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

function setupBudgetControls() {
  const range = document.getElementById('budget-range');
  const number = document.getElementById('budget-number');
  const display = document.getElementById('budget-val-display');

  if (range && number) {
    range.addEventListener('input', () => {
      number.value = range.value;
      if (display) display.textContent = formatCurrency(parseFloat(range.value));
    });

    number.addEventListener('input', () => {
      range.value = number.value;
      if (display) display.textContent = formatCurrency(parseFloat(number.value) || 0);
    });
  }
}

function setupRecommendationForm() {
  const form = document.getElementById('recommendation-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const budget = parseFloat(document.getElementById('budget-number').value) || 0;

    // Selected categories
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]:checked');
    const selectedCats = Array.from(categoryCheckboxes).map(c => c.value);

    const resultsContainer = document.getElementById('recommendation-results');
    if (resultsContainer) resultsContainer.style.display = 'block';

    try {
      const res = await apiCall('/api/recommend', 'POST', {
        budget: budget,
        categories: selectedCats
      });

      renderRecommendationResults(res, budget);
      showToast(`Optimal custom build calculated for ${formatCurrency(budget)}`, 'success');
      
      if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      showToast('Build calculation failed. Please check inputs.', 'error');
    }
  });
}

function renderRecommendationResults(data, targetBudget) {
  const selectedItems = data.selected || data.selected_items || data.selected_products || data.items || [];
  lastRecommendedBuild = selectedItems;

  const totalCost = data.total_cost || data.total_price || 0;
  const remainingBudget = data.remaining_budget !== undefined ? data.remaining_budget : (targetBudget - totalCost);
  const steps = data.decision_steps || data.trace || [];

  // Summary Banner
  const totalCostEl = document.getElementById('res-total-cost');
  if (totalCostEl) totalCostEl.textContent = `Total Build Price: ${formatCurrency(totalCost)}`;

  const utilPercent = targetBudget > 0 ? ((totalCost / targetBudget) * 100).toFixed(1) : 0;
  const utilEl = document.getElementById('res-budget-utilization');
  if (utilEl) utilEl.textContent = `Budget Utilized: ${utilPercent}% of ${formatCurrency(targetBudget)}`;

  const countEl = document.getElementById('res-item-count');
  if (countEl) countEl.textContent = selectedItems.length;

  const remainingEl = document.getElementById('res-remaining-budget');
  if (remainingEl) remainingEl.textContent = formatCurrency(Math.max(0, remainingBudget));

  // Table
  const tbody = document.getElementById('recommendation-tbody');
  if (tbody) {
    if (selectedItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hardware components fit within the selected budget threshold. Try increasing your target budget.</td></tr>`;
    } else {
      tbody.innerHTML = selectedItems.map(item => `
        <tr>
          <td><strong>#PART-${item.id}</strong></td>
          <td style="font-weight: 700; color: var(--primary-navy);">${escapeHtml(item.name)}</td>
          <td><span class="badge badge-navy">${escapeHtml(item.category)}</span></td>
          <td style="color: var(--accent-red); font-weight: 700;">${formatCurrency(item.price)}</td>
          <td>${item.stock} units in stock</td>
          <td><span class="badge badge-green"><i class="fa-solid fa-check"></i> Included in Build</span></td>
        </tr>
      `).join('');
    }
  }

  // Decision trace steps
  const traceDiv = document.getElementById('value-allocation-trace') || document.getElementById('greedy-decision-trace');
  if (traceDiv) {
    if (steps.length === 0) {
      traceDiv.innerHTML = `<div style="color: var(--text-muted);">Smart engine evaluated inventory. ${selectedItems.length} items chosen to maximize total build performance.</div>`;
    } else {
      traceDiv.innerHTML = steps.map((s, idx) => {
        const isAccepted = s.status === 'included' || s.included === true || s.decision === 'SELECTED';
        const badgeColor = isAccepted ? '#16a34a' : '#e63946';
        const badgeBg = isAccepted ? '#dcfce7' : '#fee2e2';
        const badgeText = isAccepted ? 'ACCEPTED' : 'SKIPPED';

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.8rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:0.85rem;">
            <div>
              <strong style="color:var(--primary-navy);">Step ${idx + 1}: ${escapeHtml(s.product_name || s.name || 'Component')}</strong>
              <span style="color:#64748b;margin-left:0.5rem;">(${escapeHtml(s.category || '')} — ${formatCurrency(s.price || 0)})</span>
              <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${escapeHtml(s.decision || '')}</div>
            </div>
            <div style="text-align:right;">
              <span style="background:${badgeBg};color:${badgeColor};font-weight:700;padding:2px 8px;border-radius:4px;font-size:0.75rem;">
                ${badgeText}
              </span>
              <div style="font-size:0.75rem;color:#64748b;margin-top:3px;">Left: ${formatCurrency(s.remaining_budget || 0)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (typeof initScrollObserver === 'function') {
    initScrollObserver();
  }
}

async function orderCurrentBuild() {
  if (!lastRecommendedBuild || lastRecommendedBuild.length === 0) {
    showToast('No components selected in build to order', 'error');
    return;
  }

  const authUser = typeof window.getAuthSession === 'function' ? await window.getAuthSession() : window.pcSession;
  if (!authUser || !authUser.authenticated) {
    showToast('Authorization required. Please sign in to purchase.', 'error');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/recommendation.html&auth=customer';
    }, 1200);
    return;
  }

  const itemsPayload = lastRecommendedBuild.map(it => ({
    product_id: it.id,
    quantity: 1
  }));

  try {
    const res = await apiCall('/api/sales', 'POST', {
      customer_name: (window.pcSession?.user?.name) || 'Custom Build Customer',
      items: itemsPayload,
      tax_rate: 0.18,
      discount: 0.0
    });

    showToast('Custom PC order created successfully! Thank you.', 'success');
    if (window.pcSession?.user?.role === 'admin') {
      setTimeout(() => { window.location.href = 'sales.html'; }, 1200);
    }
  } catch (e) {
    showToast('Failed to place build order: ' + e.message, 'error');
  }
}

/* ==========================================================================
   3. INTERACTIVE MANUAL PC PART PICKER
   ========================================================================== */
async function loadManualBuilderInventory() {
  try {
    allInventory = await apiCall('/api/products');
    populateSlotOptions();
  } catch (e) {
    console.error('Failed to load products for manual builder:', e);
  }
}

function populateSlotOptions() {
  const baseSelect = document.getElementById('slot-base');
  const gpuSelect = document.getElementById('slot-gpu');
  const ramSelect = document.getElementById('slot-ram');
  const ssdSelect = document.getElementById('slot-ssd');
  const monSelect = document.getElementById('slot-monitor');
  const perSelect = document.getElementById('slot-peripheral');

  if (!baseSelect) return;

  // Filter items by categories
  const bases = allInventory.filter(p => p.category === 'Desktop' || p.category === 'Laptop');
  const gpus = allInventory.filter(p => p.category === 'GPU');
  const rams = allInventory.filter(p => p.category === 'RAM');
  const ssds = allInventory.filter(p => p.category === 'SSD');
  const monitors = allInventory.filter(p => p.category === 'Monitor');
  const peripherals = allInventory.filter(p => p.category === 'Keyboard' || p.category === 'Mouse' || p.category === 'Accessory');

  const populate = (sel, items, defaultLabel) => {
    if (!sel) return;
    sel.innerHTML = `<option value="">${defaultLabel}</option>` +
      items.map(p => `<option value="${p.id}" data-price="${p.price}" data-name="${escapeHtml(p.name)}" data-cat="${escapeHtml(p.category)}">
        ${escapeHtml(p.name)} — ${formatCurrency(p.price)} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})
      </option>`).join('');
  };

  populate(baseSelect, bases, '-- Choose Base PC / Chassis (Required) --');
  populate(gpuSelect, gpus, '-- Choose Graphics Card (Optional) --');
  populate(ramSelect, rams, '-- Choose Memory (Optional) --');
  populate(ssdSelect, ssds, '-- Choose NVMe Storage (Optional) --');
  populate(monSelect, monitors, '-- Choose Monitor (Optional) --');
  populate(perSelect, peripherals, '-- Choose Keyboard / Mouse (Optional) --');
}

function updateCustomRigCalculation() {
  const slotIds = ['slot-base', 'slot-gpu', 'slot-ram', 'slot-ssd', 'slot-monitor', 'slot-peripheral'];
  let total = 0;
  const selected = [];

  slotIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) {
      const prod = allInventory.find(p => p.id === parseInt(el.value));
      if (prod) {
        selected.push(prod);
        total += prod.price;
      }
    }
  });

  const totalDisplay = document.getElementById('rig-total-display');
  if (totalDisplay) totalDisplay.textContent = formatCurrency(total);

  const listContainer = document.getElementById('rig-selected-list');
  const orderBtn = document.getElementById('btn-order-rig');
  const compatBadge = document.getElementById('rig-compat-badge');

  if (listContainer) {
    if (selected.length === 0) {
      listContainer.innerHTML = `<em>No parts selected yet. Pick hardware components to start your custom build.</em>`;
      if (orderBtn) orderBtn.disabled = true;
    } else {
      listContainer.innerHTML = selected.map(s => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;">
          <span><strong>${escapeHtml(s.name)}</strong> <small style="color:#64748b;">(${escapeHtml(s.category)})</small></span>
          <strong style="color:var(--accent-red);">${formatCurrency(s.price)}</strong>
        </div>
      `).join('');
      if (orderBtn) orderBtn.disabled = false;
    }
  }

  // Compatibility Check
  const hasBase = !!document.getElementById('slot-base')?.value;
  if (compatBadge) {
    if (selected.length > 0 && !hasBase) {
      compatBadge.className = 'badge badge-orange';
      compatBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Select Base PC';
    } else {
      compatBadge.className = 'badge badge-green';
      compatBadge.innerHTML = '<i class="fa-solid fa-check"></i> 100% Compatible via Bus';
    }
  }
}

async function orderCustomRig() {
  const slotIds = ['slot-base', 'slot-gpu', 'slot-ram', 'slot-ssd', 'slot-monitor', 'slot-peripheral'];
  const items = [];

  slotIds.forEach(id => {
    const val = document.getElementById(id)?.value;
    if (val) {
      items.push({
        product_id: parseInt(val),
        quantity: 1
      });
    }
  });

  if (items.length === 0) {
    showToast('Please select at least one component for your rig', 'error');
    return;
  }

  const authUser = typeof window.getAuthSession === 'function' ? await window.getAuthSession() : window.pcSession;
  if (!authUser || !authUser.authenticated) {
    showToast('Authorization required. Please sign in to purchase.', 'error');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/recommendation.html&auth=customer';
    }, 1200);
    return;
  }

  try {
    const res = await apiCall('/api/sales', 'POST', {
      customer_name: (window.pcSession?.user?.name) || 'Custom Rig Builder',
      items: items,
      tax_rate: 0.18,
      discount: 0.0
    });

    showToast('Custom Rig order placed successfully! Thank you.', 'success');
    if (window.pcSession?.user?.role === 'admin') {
      setTimeout(() => { window.location.href = 'sales.html'; }, 1200);
    }
  } catch (err) {
    showToast('Failed to order custom rig: ' + err.message, 'error');
  }
}
