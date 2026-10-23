/**
 * PC Point - Products Page Logic
 * Real-world product catalog with search, filter, and sort
 */

let allProducts = [];
let filteredProducts = [];
let cart = []; // Shopping cart items

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
    <div class="product-card reveal-scale" style="transition-delay:${Math.min(i * 0.05, 0.4)}s;cursor:pointer;" onclick="openProductDetail(${p.id})">
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
        <div style="display:flex;gap:0.4rem;align-items:center;">
          <button onclick="event.stopPropagation();addToCart(${p.id})" class="btn btn-primary btn-sm btn-buy-product" title="Add to Cart"
            ${p.stock === 0 ? 'disabled style="opacity:0.45;cursor:not-allowed;"' : ''}>
            <i class="fa-solid fa-cart-plus"></i>
          </button>
          <button onclick="event.stopPropagation();deleteProduct(${p.id})" class="btn btn-ghost btn-sm btn-delete-product" style="color:#dc2626;border-color:#fecaca;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
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

// ─── Add Product Modal ───
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

// ─── Product Detail / Purchase Modal ───
function openProductDetail(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const existing = document.getElementById('product-detail-overlay');
  if (existing) existing.remove();

  const inCart = cart.filter(c => c.id === id).reduce((s, c) => s + c.qty, 0);
  const overlay = document.createElement('div');
  overlay.id = 'product-detail-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.onclick = (e) => { if (e.target === overlay) closeProductDetail(); };

  const availableStock = p.stock - inCart;
  const icon = CAT_ICONS[p.category] || 'fa-box';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 25px 60px rgba(0,0,0,0.3);overflow:hidden;animation:slideUp 0.3s ease;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:1.5rem;position:relative;">
        <button onclick="closeProductDetail()" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:60px;height:60px;background:rgba(230,57,70,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fa-solid ${icon}" style="font-size:1.6rem;color:#e63946;"></i>
          </div>
          <div>
            <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(p.brand)} · ${escapeHtml(p.category)}</div>
            <h3 style="color:#fff;font-size:1.1rem;font-weight:700;margin:0.2rem 0 0;">${escapeHtml(p.name)}</h3>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div style="padding:1.5rem;">
        <!-- Price & Stock -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
          <div style="font-size:1.75rem;font-weight:800;color:#e63946;">${formatCurrency(p.price)}</div>
          <div>${getStockBadge(p.stock)}</div>
        </div>

        <!-- Info rows -->
        <div style="background:#f8fafc;border-radius:10px;padding:1rem;margin-bottom:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div><div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">Brand</div><div style="font-weight:600;color:#1e293b;">${escapeHtml(p.brand)}</div></div>
          <div><div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">Category</div><div style="font-weight:600;color:#1e293b;">${escapeHtml(p.category)}</div></div>
          <div><div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">Product ID</div><div style="font-weight:600;color:#1e293b;">#${p.id}</div></div>
          <div><div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">In Stock</div><div style="font-weight:600;color:${p.stock > 5 ? '#16a34a' : p.stock > 0 ? '#ea580c' : '#dc2626'};">${p.stock} units</div></div>
        </div>

        <!-- Quantity selector -->
        ${p.stock > 0 ? `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
          <label style="font-size:0.85rem;font-weight:600;color:#475569;flex-shrink:0;">Quantity:</label>
          <div style="display:flex;align-items:center;border:2px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <button onclick="changeDetailQty(-1)" style="background:#f1f5f9;border:none;padding:0.5rem 0.75rem;cursor:pointer;font-size:1rem;color:#475569;">−</button>
            <input id="detail-qty" type="number" value="1" min="1" max="${availableStock}" style="width:52px;text-align:center;border:none;outline:none;font-size:1rem;font-weight:700;padding:0.5rem 0;">
            <button onclick="changeDetailQty(1)" style="background:#f1f5f9;border:none;padding:0.5rem 0.75rem;cursor:pointer;font-size:1rem;color:#475569;">+</button>
          </div>
          <span style="font-size:0.78rem;color:#94a3b8;">(max ${availableStock})</span>
        </div>
        ` : ''}

        <!-- Cart summary if already in cart -->
        ${inCart > 0 ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:0.6rem 0.9rem;margin-bottom:1rem;font-size:0.83rem;color:#1d4ed8;"><i class="fa-solid fa-cart-shopping" style="margin-right:0.4rem;"></i>${inCart} already in your cart</div>` : ''}

        <!-- Action Buttons -->
        <div style="display:flex;gap:0.75rem;">
          <button onclick="addToCartFromDetail(${p.id})" class="btn btn-primary" style="flex:1;" ${p.stock === 0 ? 'disabled style="opacity:0.45;cursor:not-allowed;flex:1;"' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
          <button onclick="buyNow(${p.id})" class="btn btn-navy" style="flex:1;" ${p.stock === 0 ? 'disabled style="opacity:0.45;cursor:not-allowed;flex:1;"' : ''}>
            <i class="fa-solid fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
  const overlay = document.getElementById('product-detail-overlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
}

function changeDetailQty(delta) {
  const input = document.getElementById('detail-qty');
  if (!input) return;
  const max = parseInt(input.max) || 99;
  let val = parseInt(input.value) + delta;
  val = Math.max(1, Math.min(max, val));
  input.value = val;
}

// ─── Cart Functions ───
function addToCart(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p || p.stock === 0) { showToast('This item is out of stock', 'error'); return; }
  const existing = cart.find(c => c.id === productId);
  const inCartQty = existing ? existing.qty : 0;
  if (inCartQty >= p.stock) { showToast('No more stock available', 'error'); return; }
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, brand: p.brand, price: p.price, qty: 1, stock: p.stock });
  }
  updateCartBadge();
  showToast(`${p.name} added to cart!`, 'success');
}

function addToCartFromDetail(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p || p.stock === 0) return;
  const qtyInput = document.getElementById('detail-qty');
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
  const existing = cart.find(c => c.id === productId);
  const inCartQty = existing ? existing.qty : 0;
  const canAdd = Math.min(qty, p.stock - inCartQty);
  if (canAdd <= 0) { showToast('No more stock available', 'error'); return; }
  if (existing) {
    existing.qty += canAdd;
  } else {
    cart.push({ id: p.id, name: p.name, brand: p.brand, price: p.price, qty: canAdd, stock: p.stock });
  }
  updateCartBadge();
  showToast(`${canAdd}x ${p.name} added to cart!`, 'success');
  closeProductDetail();
  openCartDrawer();
}

async function buyNow(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p || p.stock === 0) return;
  const qtyInput = document.getElementById('detail-qty');
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
  // Set cart to only this item
  cart = [{ id: p.id, name: p.name, brand: p.brand, price: p.price, qty: Math.min(qty, p.stock), stock: p.stock }];
  updateCartBadge();
  closeProductDetail();
  // Wait for session to be confirmed before checking auth
  await sessionReady;
  if (!window.pcSession?.authenticated) {
    showAuthPromptModal();
    return;
  }
  proceedToCheckout();
}

function updateCartBadge() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  let badge = document.getElementById('cart-badge');
  let btn = document.getElementById('cart-btn');
  if (!btn) return;
  if (badge) badge.textContent = total;
  btn.style.display = total > 0 ? 'flex' : 'none';
}

// ─── Cart Drawer ───
function openCartDrawer() {
  let drawer = document.getElementById('cart-drawer');
  if (!drawer) {
    drawer = buildCartDrawer();
    document.body.appendChild(drawer);
  }
  renderCartDrawer();
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) drawer.classList.remove('open');
  document.body.style.overflow = '';
}

function buildCartDrawer() {
  const drawer = document.createElement('div');
  drawer.id = 'cart-drawer';
  drawer.style.cssText = `
    position:fixed;top:0;right:0;height:100vh;width:100%;max-width:420px;
    background:#fff;z-index:4000;box-shadow:-8px 0 40px rgba(0,0,0,0.2);
    transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);
    display:flex;flex-direction:column;
  `;
  // backdrop
  const back = document.createElement('div');
  back.id = 'cart-backdrop';
  back.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3999;display:none;';
  back.onclick = closeCartDrawer;
  document.body.appendChild(back);

  // inject open style
  const style = document.createElement('style');
  style.textContent = '#cart-drawer.open{transform:translateX(0)!important;} #cart-drawer.open ~ * #cart-backdrop, #cart-backdrop{display:block;}';
  document.head.appendChild(style);

  drawer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;background:#1a1a2e;">
      <div style="display:flex;align-items:center;gap:0.6rem;">
        <i class="fa-solid fa-cart-shopping" style="color:#e63946;font-size:1.1rem;"></i>
        <span style="font-weight:700;font-size:1rem;color:#fff;">Your Cart</span>
        <span id="cart-item-count" style="background:#e63946;color:#fff;border-radius:99px;font-size:0.72rem;font-weight:700;padding:2px 8px;">0</span>
      </div>
      <button onclick="closeCartDrawer()" style="background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div id="cart-items" style="flex:1;overflow-y:auto;padding:1rem 1.5rem;"></div>
    <div id="cart-footer" style="border-top:1px solid #e2e8f0;padding:1.25rem 1.5rem;background:#f8fafc;"></div>
  `;
  return drawer;
}

function renderCartDrawer() {
  const itemsEl = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');
  const countEl = document.getElementById('cart-item-count');
  const back = document.getElementById('cart-backdrop');
  if (back) back.style.display = 'block';

  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  if (countEl) countEl.textContent = totalItems;

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:#94a3b8;">
        <i class="fa-solid fa-cart-shopping" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:1rem;"></i>
        <p style="font-weight:600;">Your cart is empty</p>
        <p style="font-size:0.85rem;">Click on any product to add it</p>
      </div>`;
    if (footerEl) footerEl.innerHTML = '';
    return;
  }

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.9rem 0;border-bottom:1px solid #f1f5f9;">
      <div style="width:44px;height:44px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i class="fa-solid ${CAT_ICONS[allProducts.find(p=>p.id===item.id)?.category]||'fa-box'}" style="color:#e63946;"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.85rem;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.name)}</div>
        <div style="font-size:0.78rem;color:#64748b;">${escapeHtml(item.brand)} · ${formatCurrency(item.price)} each</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.3rem;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <button onclick="updateCartQty(${idx}, -1)" style="background:#f8fafc;border:none;padding:0.3rem 0.55rem;cursor:pointer;font-size:0.9rem;color:#475569;">−</button>
        <span style="font-size:0.9rem;font-weight:700;padding:0 0.4rem;min-width:20px;text-align:center;">${item.qty}</span>
        <button onclick="updateCartQty(${idx}, 1)" style="background:#f8fafc;border:none;padding:0.3rem 0.55rem;cursor:pointer;font-size:0.9rem;color:#475569;">+</button>
      </div>
      <div style="font-weight:700;color:#1e293b;font-size:0.88rem;min-width:70px;text-align:right;">${formatCurrency(item.price * item.qty)}</div>
      <button onclick="removeFromCart(${idx})" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.85rem;padding:0.25rem;">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');

  if (footerEl) {
    footerEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:0.85rem;color:#64748b;">
        <span>${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
        <span>Subtotal: <strong style="color:#1e293b;">${formatCurrency(totalPrice)}</strong></span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;font-size:0.78rem;color:#94a3b8;">
        <span>GST (18%)</span><span>${formatCurrency(totalPrice * 0.18)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:1.25rem;font-size:1.05rem;font-weight:800;color:#1e293b;border-top:2px solid #e2e8f0;padding-top:0.75rem;">
        <span>Total</span><span style="color:#e63946;">${formatCurrency(totalPrice * 1.18)}</span>
      </div>
      <button onclick="proceedToCheckout()" class="btn btn-primary" style="width:100%;font-size:1rem;padding:0.8rem;">
        <i class="fa-solid fa-credit-card"></i> Proceed to Checkout
      </button>
      <button onclick="cart=[];updateCartBadge();renderCartDrawer();" class="btn btn-ghost btn-sm" style="width:100%;margin-top:0.5rem;color:#94a3b8;">Clear Cart</button>
    `;
  }
}

function updateCartQty(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty = Math.max(1, Math.min(cart[idx].stock, cart[idx].qty + delta));
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  updateCartBadge();
  renderCartDrawer();
}

async function proceedToCheckout() {
  if (cart.length === 0) return;

  // Wait for session to be confirmed before checking auth
  await sessionReady;

  // Authorization check: only authorized users can purchase
  if (!window.pcSession?.authenticated) {
    showAuthPromptModal();
    return;
  }

  const existing = document.getElementById('checkout-modal');
  if (existing) existing.remove();

  const totalPrice = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  const totalWithTax = totalPrice * 1.18;
  const defaultName = (window.pcSession?.user?.name) || '';

  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:5000;display:flex;align-items:center;justify-content:center;padding:1rem;';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:440px;overflow:hidden;animation:slideUp 0.3s ease;">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:1.25rem 1.5rem;">
        <h3 style="color:#fff;margin:0;font-size:1.1rem;"><i class="fa-solid fa-receipt" style="margin-right:0.5rem;"></i>Order Summary</h3>
      </div>
      <div style="padding:1.5rem;">
        <div style="max-height:200px;overflow-y:auto;margin-bottom:1rem;">
          ${cart.map(c => `
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">
              <span style="color:#475569;">${escapeHtml(c.name)} × ${c.qty}</span>
              <span style="font-weight:600;">${formatCurrency(c.price * c.qty)}</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#64748b;margin-bottom:0.35rem;"><span>Subtotal</span><span>${formatCurrency(totalPrice)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#64748b;margin-bottom:0.75rem;"><span>GST (18%)</span><span>${formatCurrency(totalPrice * 0.18)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;color:#16a34a;border-top:2px solid #e2e8f0;padding-top:0.75rem;margin-bottom:1.25rem;"><span>Total Payable</span><span>${formatCurrency(totalWithTax)}</span></div>
        <div style="margin-bottom:1.25rem;">
          <label style="font-size:0.83rem;font-weight:600;color:#475569;display:block;margin-bottom:0.4rem;">Customer Name</label>
          <input id="checkout-customer" type="text" class="form-control" placeholder="Enter customer name" value="${escapeHtml(defaultName)}" style="width:100%;" />
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button onclick="document.getElementById('checkout-modal').remove()" class="btn btn-ghost" style="flex:1;">Cancel</button>
          <button onclick="confirmPurchase()" class="btn btn-primary" style="flex:1;background:#16a34a;border-color:#16a34a;">
            <i class="fa-solid fa-check"></i> Confirm Order
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function confirmPurchase() {
  if (!window.pcSession?.authenticated) {
    document.getElementById('checkout-modal')?.remove();
    showAuthPromptModal();
    return;
  }

  const customerName = (document.getElementById('checkout-customer')?.value || '').trim() || (window.pcSession?.user?.name) || 'Customer';
  const btn = document.querySelector('#checkout-modal button[onclick="confirmPurchase()"]');
  if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...'; btn.disabled = true; }

  try {
    const itemsPayload = cart.map(item => ({
      product_id: item.id,
      quantity: item.qty
    }));

    const res = await apiCall('/api/sales', 'POST', {
      customer_name: customerName,
      items: itemsPayload,
      tax_rate: 0.18,
      discount: 0.0
    });

    // Clean up checkout modal and cart
    document.getElementById('checkout-modal')?.remove();
    closeCartDrawer();
    cart = [];
    updateCartBadge();
    loadProducts(); // Refresh stock

    // Show nice confirmation modal
    showOrderSuccessModal(res?.sale || { customer_name: customerName });
  } catch (e) {
    if (e.message && (e.message.toLowerCase().includes('authentication') || e.message.toLowerCase().includes('sign in') || e.message.toLowerCase().includes('permission'))) {
      document.getElementById('checkout-modal')?.remove();
      showAuthPromptModal();
      return;
    }
    showToast('Order failed: ' + e.message, 'error');
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i> Confirm Order'; btn.disabled = false; }
  }
}

function showAuthPromptModal() {
  const existing = document.getElementById('auth-prompt-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'auth-prompt-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:6000;display:flex;align-items:center;justify-content:center;padding:1rem;';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;width:100%;max-width:440px;text-align:center;padding:2.25rem 2rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);animation:slideUp 0.3s ease;">
      <div style="width:72px;height:72px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;box-shadow:0 0 0 8px #fee2e2;">
        <i class="fa-solid fa-user-shield" style="font-size:2rem;color:#e63946;"></i>
      </div>
      <h3 style="margin:0 0 0.5rem;font-size:1.35rem;color:#0f172a;">Sign In Required to Purchase</h3>
      <p style="color:#64748b;font-size:0.92rem;margin:0 0 1.75rem;line-height:1.5;">
        Only registered and authorized users can purchase hardware products. Please sign in or create an account to complete your order.
      </p>

      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <a href="/login.html?redirect=/products.html&auth=customer" class="btn btn-primary" style="padding:0.85rem;font-size:0.98rem;display:flex;align-items:center;justify-content:center;gap:0.6rem;text-decoration:none;border-radius:10px;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Purchase
        </a>
        <a href="/login.html?redirect=/products.html&tab=register" class="btn" style="padding:0.85rem;font-size:0.95rem;background:#f8fafc;border:1px solid #cbd5e1;color:#1e293b;display:flex;align-items:center;justify-content:center;gap:0.6rem;text-decoration:none;border-radius:10px;font-weight:600;">
          <i class="fa-solid fa-user-plus"></i> Create Customer Account
        </a>
        <button onclick="document.getElementById('auth-prompt-modal').remove()" style="background:transparent;border:none;color:#94a3b8;font-size:0.88rem;cursor:pointer;margin-top:0.5rem;padding:0.25rem;">
          Continue Browsing
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function showOrderSuccessModal(sale) {
  const existing = document.getElementById('order-success-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'order-success-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:6000;display:flex;align-items:center;justify-content:center;padding:1rem;';

  const orderNum = sale.id ? `#ORD-${String(sale.id).padStart(4, '0')}` : '#CONFIRMED';
  const total = sale.total ? formatCurrency(sale.total) : 'Paid';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;width:100%;max-width:440px;text-align:center;padding:2rem 1.75rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);animation:slideUp 0.35s ease;">
      <div style="width:70px;height:70px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
        <i class="fa-solid fa-check" style="font-size:2rem;color:#16a34a;"></i>
      </div>
      <h3 style="margin:0 0 0.5rem;font-size:1.4rem;color:#0f172a;">Order Placed Successfully!</h3>
      <p style="color:#64748b;font-size:0.9rem;margin:0 0 1.25rem;">Thank you, <strong style="color:#0f172a;">${escapeHtml(sale.customer_name || 'Customer')}</strong>. Your hardware order has been registered.</p>
      
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:left;font-size:0.875rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="color:#64748b;">Order Ref:</span>
          <strong style="color:#0f172a;">${orderNum}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="color:#64748b;">Date:</span>
          <span style="color:#0f172a;">${sale.date || 'Just now'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;padding-top:0.5rem;margin-top:0.5rem;">
          <strong style="color:#0f172a;">Total Amount:</strong>
          <strong style="color:#16a34a;font-size:1.05rem;">${total}</strong>
        </div>
      </div>

      <button onclick="document.getElementById('order-success-modal').remove()" class="btn btn-primary" style="width:100%;padding:0.75rem;font-size:0.95rem;background:#16a34a;border-color:#16a34a;">
        <i class="fa-solid fa-bag-shopping" style="margin-right:0.4rem;"></i> Continue Shopping
      </button>
    </div>
  `;

  document.body.appendChild(modal);
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
