/**
 * PC Point - Products Page Logic
 * Real-world product catalog with search, filter, and sort
 */

let allProducts = [];
let filteredProducts = [];

// Category icons mapping
const CAT_ICONS = {
  'Laptop':      'fa-laptop',
  'Desktop':     'fa-desktop',
  'GPU':         'fa-display',
  'CPU':         'fa-microchip',
  'RAM':         'fa-memory',
  'SSD':         'fa-hard-drive',
  'Accessories': 'fa-computer-mouse'
};

function getCatIcon(cat) {
  return CAT_ICONS[cat] || 'fa-box';
}

function getStockBadge(stock) {
  if (stock <= 0) return `<span class="stock-badge out-of-stock"><span class="stock-dot"></span> Out of Stock</span>`;
  if (stock <= 5) return `<span class="stock-badge low-stock"><span class="stock-dot"></span> Only ${stock} left</span>`;
  return `<span class="stock-badge in-stock"><span class="stock-dot"></span> In Stock (${stock})</span>`;
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} found`;

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-3);">
        <i class="fa-solid fa-box-open" style="font-size:3rem;margin-bottom:1rem;display:block;opacity:0.3;"></i>
        <h3 style="color:var(--text-2);margin-bottom:0.5rem;">No products found</h3>
        <p>Try adjusting your filters or <button onclick="clearFilters()" class="btn btn-outline btn-sm" style="display:inline-flex;margin-top:0.5rem;">Clear Filters</button></p>
      </div>`;
    return;
  }

  grid.innerHTML = products.map((p, i) => `
    <div class="product-card reveal-scale" style="transition-delay:${Math.min(i * 0.05, 0.4)}s;">
      <div class="product-img-wrap">
        <i class="fa-solid ${getCatIcon(p.category)} product-category-icon"></i>
        ${p.stock === 0 ? '<span class="product-badge tag tag-red">Sold Out</span>' : ''}
        ${p.stock > 0 && p.stock <= 5 ? '<span class="product-badge tag tag-orange">Low Stock</span>' : ''}
      </div>
      <div class="product-body">
        <div class="product-brand">${escapeHtml(p.brand)}</div>
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-price">${formatCurrency(p.price)}</div>
        ${getStockBadge(p.stock)}
      </div>
      <div class="product-footer">
        <span class="tag tag-gray" style="font-size:0.72rem;">${escapeHtml(p.category)}</span>
        <button onclick="deleteProduct(${p.id})" class="btn btn-ghost btn-sm btn-delete-product" style="color:#dc2626;border-color:#fecaca;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  initScrollObserver();
  // Re-apply role restrictions after DOM rebuild
  if (typeof postRenderApplyRestrictions === 'function') {
    postRenderApplyRestrictions();
  }
}

async function loadProducts() {
  try {
    allProducts = await apiCall('/api/products');
    filteredProducts = [...allProducts];

    // Apply URL category filter if present
    const urlCat = new URLSearchParams(window.location.search).get('cat');
    const urlSearch = new URLSearchParams(window.location.search).get('search');

    if (urlCat) {
      // Tick the checkbox
      document.querySelectorAll('.cat-filter').forEach(cb => {
        if (cb.value === urlCat) cb.checked = true;
      });
      filteredProducts = allProducts.filter(p => p.category === urlCat);
      const titleEl = document.getElementById('page-title');
      const breadEl = document.getElementById('breadcrumb-cat');
      const subtitleEl = document.getElementById('page-subtitle');
      if (titleEl) titleEl.textContent = urlCat + 's';
      if (breadEl) breadEl.textContent = urlCat + 's';
      if (subtitleEl) subtitleEl.textContent = `Showing all ${urlCat} products in our inventory`;
    }

    if (urlSearch) {
      const q = urlSearch.toLowerCase();
      filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
      const si = document.getElementById('search-input');
      if (si) si.value = urlSearch;
    }

    renderProducts(filteredProducts);
  } catch (e) {
    showToast('Failed to load product catalog', 'error');
  }
}

function applyFilters() {
  const checkedCats = [...document.querySelectorAll('.cat-filter:checked')].map(cb => cb.value);
  const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

  filteredProducts = allProducts.filter(p => {
    const catMatch = checkedCats.length === 0 || checkedCats.includes(p.category);
    const nameMatch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
    return catMatch && nameMatch;
  });

  renderProducts(filteredProducts);
}

function clearFilters() {
  document.querySelectorAll('.cat-filter').forEach(cb => cb.checked = false);
  const si = document.getElementById('search-input');
  if (si) si.value = '';
  filteredProducts = [...allProducts];
  renderProducts(filteredProducts);
}

// Modal open/close
function openModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) { overlay.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) { overlay.style.display = 'none'; document.body.style.overflow = ''; }
}

async function deleteProduct(id) {
  if (!confirm(`Remove this product from inventory?`)) return;
  try {
    await apiCall(`/api/products/${id}`, 'DELETE');
    showToast('Product removed from inventory', 'success');
    loadProducts();
  } catch (e) {
    showToast('Could not remove product', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  // Category filter checkboxes
  document.querySelectorAll('.cat-filter').forEach(cb =>
    cb.addEventListener('change', applyFilters)
  );

  // Search bar
  document.getElementById('search-input')?.addEventListener('input', applyFilters);

  // Sort button
  document.getElementById('btn-sort')?.addEventListener('click', async () => {
    const sortVal = document.getElementById('sort-key').value;
    if (!sortVal) { renderProducts(filteredProducts); return; }

    const [key, order] = sortVal.split('_');
    const indicator = document.getElementById('search-trace-indicator');
    const traceText = document.getElementById('trace-text');

    try {
      const res = await apiCall(`/api/products/sort?key=${key}&order=${order}`);
      filteredProducts = res.products;
      renderProducts(filteredProducts);
      if (indicator && traceText) {
        indicator.style.display = 'inline-flex';
        traceText.textContent = `Sorted by ${key}`;
        setTimeout(() => { indicator.style.display = 'none'; }, 4000);
      }
      showToast(`Products sorted by ${key}`, 'success');
    } catch (e) {
      showToast('Sort failed', 'error');
    }
  });

  // Search by ID
  document.getElementById('btn-search-id')?.addEventListener('click', async () => {
    const id = document.getElementById('search-id').value;
    const statusDiv = document.getElementById('search-status');
    if (!id) return;

    statusDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
    try {
      const res = await apiCall(`/api/products/search?id=${id}`);
      if (res.found) {
        statusDiv.innerHTML = `<span style="color:var(--green);"><i class="fa-solid fa-check-circle"></i> Found: ${escapeHtml(res.product.name)} — ${formatCurrency(res.product.price)}</span>`;
        filteredProducts = [res.product];
        renderProducts(filteredProducts);
      } else {
        statusDiv.innerHTML = `<span style="color:var(--red);">No product with ID #${id}</span>`;
      }
    } catch(e) {
      statusDiv.innerHTML = '<span style="color:var(--red);">Search error</span>';
    }
  });

  // Add product button
  document.getElementById('btn-add-product')?.addEventListener('click', openModal);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Add product form submit
  document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
      await apiCall('/api/products', 'POST', {
        name:     document.getElementById('prod-name').value,
        category: document.getElementById('prod-category').value,
        brand:    document.getElementById('prod-brand').value,
        price:    parseFloat(document.getElementById('prod-price').value),
        stock:    parseInt(document.getElementById('prod-stock').value)
      });
      showToast('Product added to inventory!', 'success');
      closeModal();
      e.target.reset();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
      submitBtn.disabled = false;
    }
  });
});
