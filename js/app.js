/**
 * PC Point - Shared Application Utilities, Session Manager & Scroll Animation Engine
 * Comprehensive Privacy & Navigation Protection System
 */

// ============================================================
// GLOBAL SESSION & PRIVACY STATE
// ============================================================
let pcSession = { authenticated: false, user: null };
window.pcSession = pcSession;

let _sessionReadyResolve;
// Resolves once initSession() has finished — other scripts can await this
const sessionReady = new Promise(res => { _sessionReadyResolve = res; });
window.sessionReady = sessionReady;

let idleTimer = null;
let shieldTimer = null;
let shieldCountdownInterval = null;

const INACTIVITY_SHIELD_MS = 10 * 60 * 1000; // 10 minutes: Privacy Shield blurs screen
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;      // 15 minutes: Session automatically terminated

document.addEventListener('DOMContentLoaded', async () => {
  await initSession();
  if (typeof _sessionReadyResolve === 'function') {
    _sessionReadyResolve(pcSession);
  }
  checkPageSecurity();
  initScrollObserver();
  initScrollProgress();
  initMobileDrawer();
  setActiveNavLink();
  applyRoleRestrictions();
  initSessionNavigation();
  initBfcacheProtection();
});

/* ==========================================================================
   SESSION MANAGER — Strictly verifies auth state on every page load
   ========================================================================== */
async function initSession() {
  try {
    const res = await fetch('/api/auth/session', { 
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    });
    const data = await res.json();
    if (data.expired) {
      pcSession = { authenticated: false, user: null };
      window.pcSession = pcSession;
      showToast('Session expired due to inactivity for your privacy.', 'info');
      if (isProtectedPage()) {
        redirectToLogin('timeout=1');
        return;
      }
    } else if (data.authenticated) {
      pcSession = data;
      window.pcSession = data;
    } else {
      pcSession = { authenticated: false, user: null };
      window.pcSession = pcSession;
      if (isProtectedPage()) {
        redirectToLogin('restricted=1');
        return;
      }
    }
  } catch (e) {
    pcSession = { authenticated: false, user: null };
    window.pcSession = pcSession;
  }
  updateNavForSession();
  if (pcSession.authenticated) {
    startIdleMonitoring();
  } else {
    stopIdleMonitoring();
  }
}

/**
 * Universal helper to retrieve verified authentication state.
 */
window.getAuthSession = async function() {
  if (window.pcSession?.authenticated) return window.pcSession;
  if (typeof pcSession !== 'undefined' && pcSession?.authenticated) return pcSession;
  if (window.sessionReady) {
    try { await window.sessionReady; } catch (_) {}
  }
  if (window.pcSession?.authenticated) return window.pcSession;
  try {
    const res = await fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    });
    const data = await res.json();
    if (data && data.authenticated) {
      pcSession = data;
      window.pcSession = data;
      return data;
    }
  } catch (err) {}
  return { authenticated: false, user: null };
};

/**
 * Checks if the current page requires admin credentials.
 */
function isProtectedPage() {
  const p = window.location.pathname.toLowerCase();
  return p.includes('index.html') || p.includes('sales.html') || p === '/dashboard';
}

/**
 * Securely redirects to login with DOM wiping and history replacement.
 */
function redirectToLogin(queryParam = '') {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;flex-direction:column;gap:1rem;text-align:center;padding:2rem;">
      <i class="fa-solid fa-shield-halved" style="font-size:3.5rem;color:#e63946;"></i>
      <h2 style="font-size:1.6rem;margin:0;">Protected Security Zone</h2>
      <p style="color:#94a3b8;max-width:400px;margin:0;">This screen contains private data. Unauthorized access is restricted. Redirecting to secure portal...</p>
    </div>
  `;
  const url = queryParam ? `/login.html?${queryParam}` : '/login.html';
  window.location.replace(url);
}

/**
 * Enforces page access rules: non-admins cannot access admin dashboard or sales history.
 */
function checkPageSecurity() {
  if (isProtectedPage()) {
    if (!pcSession.authenticated || pcSession.user?.role !== 'admin') {
      redirectToLogin('restricted=1');
      return false;
    }
  }
  return true;
}

/**
 * Protects against Back-Forward Cache (bfcache) and page restores exposing private user info.
 */
function initBfcacheProtection() {
  // Check whenever page is displayed (back/forward button, tab switch, bfcache restore)
  window.addEventListener('pageshow', async function(event) {
    await initSession();
    checkPageSecurity();
    applyRoleRestrictions();
  });

  // Re-verify session when returning from another background tab
  document.addEventListener('visibilitychange', async function() {
    if (document.visibilityState === 'visible') {
      await initSession();
      checkPageSecurity();
    }
  });
}

/**
 * Activity monitor:
 * 1. Shows Privacy Shield after 10 min inactivity to blur private info from onlookers.
 * 2. Fully terminates session after 15 min total inactivity.
 */
function startIdleMonitoring() {
  resetIdleTimers();
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(evt => {
    window.removeEventListener(evt, handleUserActivity);
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });
}

function stopIdleMonitoring() {
  if (idleTimer) clearTimeout(idleTimer);
  if (shieldTimer) clearTimeout(shieldTimer);
  if (shieldCountdownInterval) clearInterval(shieldCountdownInterval);
  hidePrivacyShield();
}

function handleUserActivity() {
  if (!pcSession.authenticated) return;
  // If privacy shield is not currently active, keep resetting timers
  const overlay = document.getElementById('pc-privacy-shield-overlay');
  if (!overlay) {
    resetIdleTimers();
  }
}

function resetIdleTimers() {
  if (!pcSession.authenticated) return;
  if (idleTimer) clearTimeout(idleTimer);
  if (shieldTimer) clearTimeout(shieldTimer);

  // Inactivity Privacy Shield timer (10 minutes)
  shieldTimer = setTimeout(() => {
    showPrivacyShield();
  }, INACTIVITY_SHIELD_MS);

  // Inactivity Total Session Termination timer (15 minutes)
  idleTimer = setTimeout(() => {
    handleLogout(true);
  }, IDLE_TIMEOUT_MS);
}

/**
 * Renders the frosted-glass Privacy Shield to protect screen from bystanders/intruders.
 */
function showPrivacyShield() {
  if (!pcSession.authenticated || document.getElementById('pc-privacy-shield-overlay')) return;

  const user = pcSession.user || { name: 'User', role: 'Member' };
  const overlay = document.createElement('div');
  overlay.id = 'pc-privacy-shield-overlay';
  overlay.className = 'privacy-shield-overlay';

  let remainingSec = Math.floor((IDLE_TIMEOUT_MS - INACTIVITY_SHIELD_MS) / 1000); // 300s = 5 min

  overlay.innerHTML = `
    <div class="privacy-shield-modal">
      <div class="privacy-shield-icon-wrap">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h3 class="privacy-shield-title">Privacy Shield Active</h3>
      <p class="privacy-shield-desc">
        Inactivity detected. Your screen is locked and blurred to protect your logged-in credentials and order history from intruders.
      </p>
      <div class="privacy-shield-user-info">
        <span><i class="fa-solid fa-user-shield" style="color:#f87171;margin-right:0.4rem;"></i> ${escapeHtml(user.name)}</span>
        <span style="text-transform:capitalize;font-weight:700;color:#38bdf8;">${escapeHtml(user.role)}</span>
      </div>
      <div class="privacy-countdown-bar">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>Auto-terminating in: <strong id="privacy-shield-timer">${formatTimeSeconds(remainingSec)}</strong></span>
      </div>
      <div class="privacy-shield-actions">
        <button id="btn-unlock-privacy" class="btn btn-primary">
          <i class="fa-solid fa-key"></i> Resume Session
        </button>
        <button onclick="handleLogout()" class="btn btn-ghost" style="color:#ef4444;border-color:rgba(239,68,68,0.4);">
          <i class="fa-solid fa-right-from-bracket"></i> Logout Now
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Live countdown timer
  shieldCountdownInterval = setInterval(() => {
    remainingSec--;
    const timerEl = document.getElementById('privacy-shield-timer');
    if (timerEl) timerEl.textContent = formatTimeSeconds(remainingSec);
    if (remainingSec <= 0) {
      clearInterval(shieldCountdownInterval);
      handleLogout(true);
    }
  }, 1000);

  // Resume button listener
  document.getElementById('btn-unlock-privacy')?.addEventListener('click', () => {
    hidePrivacyShield();
    resetIdleTimers();
    showToast('Session unlocked. Welcome back!', 'success');
  });
}

function hidePrivacyShield() {
  const overlay = document.getElementById('pc-privacy-shield-overlay');
  if (overlay) overlay.remove();
  if (shieldCountdownInterval) clearInterval(shieldCountdownInterval);
}

/**
 * Manually lock screen for privacy with one click.
 */
function lockScreenNow() {
  showPrivacyShield();
}

function formatTimeSeconds(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Update all navigation bars to reflect current auth state.
 */
function updateNavForSession() {
  document.querySelectorAll('.nav-actions').forEach(actionsDiv => {
    const signInLink = actionsDiv.querySelector('a[href="/login.html"], a[href="login.html"], a[href="/login"], .session-user-menu');
    
    if (pcSession.authenticated && pcSession.user) {
      const user = pcSession.user;
      const isAdmin = user.role === 'admin';
      const icon = isAdmin ? 'fa-user-shield' : 'fa-user';
      const roleBadge = isAdmin ? 'Admin' : 'Customer';
      
      const userMenuHtml = `
        <div class="session-user-menu" style="display:flex;align-items:center;gap:0.4rem;">
          <span class="session-user-badge" style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;font-weight:600;color:var(--text-2,#64748b);">
            <i class="fa-solid ${icon}" style="color:${isAdmin ? 'var(--red,#e63946)' : 'var(--blue,#3b82f6)'};"></i>
            <span class="session-user-name" style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(user.name)}</span>
            <span style="font-size:0.7rem;padding:2px 6px;border-radius:4px;background:${isAdmin ? '#fee2e2' : '#dbeafe'};color:${isAdmin ? '#dc2626' : '#2563eb'};">${roleBadge}</span>
          </span>
          <button onclick="lockScreenNow()" class="btn btn-ghost btn-sm" title="Lock Screen for Privacy" style="font-size:0.75rem;padding:0.3rem 0.55rem;color:#64748b;border-color:#e2e8f0;">
            <i class="fa-solid fa-lock"></i>
          </button>
          <button onclick="handleLogout()" class="btn btn-ghost btn-sm" style="font-size:0.75rem;padding:0.3rem 0.55rem;color:#dc2626;border-color:#fecaca;">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      `;
      
      if (signInLink) {
        signInLink.outerHTML = userMenuHtml;
      }
    } else {
      // Revert to clean guest Sign In button if unauthenticated
      if (signInLink && signInLink.classList.contains('session-user-menu')) {
        signInLink.outerHTML = `
          <a href="/login.html" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-user"></i> Sign In
          </a>
        `;
      }
    }
  });

  // Admin nav icon buttons
  document.querySelectorAll('.nav-icon-btn[href="/login.html"], .nav-icon-btn[href="login.html"], .nav-icon-btn[href="/login"], .admin-logout-btn').forEach(btn => {
    if (pcSession.authenticated && pcSession.user) {
      btn.outerHTML = `
        <button onclick="handleLogout()" class="nav-icon-btn admin-logout-btn" title="Sign Out (${escapeHtml(pcSession.user.name)})" style="color:#dc2626;background:none;border:none;cursor:pointer;">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      `;
    }
  });
}

/**
 * Traps browser back/forward history so intruders cannot navigate back into authenticated views.
 */
function initSessionNavigation() {
  const currentPage = window.location.pathname.toLowerCase();
  
  // On login page: disallow back-button from returning to prior logged-in screens
  if (currentPage === '/login.html' || currentPage === '/login' || currentPage.endsWith('login.html')) {
    if (pcSession.authenticated) {
      const dest = pcSession.user?.role === 'admin' ? '/index.html' : '/';
      window.location.replace(dest);
      return;
    }
    // Trap history so back button stays on login page
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', function() {
        window.history.pushState(null, '', window.location.href);
      });
    }
    return;
  }

  // On protected admin/order pages: disallow navigating away without re-validating session
  if (isProtectedPage()) {
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', function() {
        window.history.pushState(null, '', window.location.href);
      });
    }
  }
}

/**
 * Logout handler — clears server session, destroys local caches, and replaces history entry.
 * Using location.replace prevents the browser Back button from navigating back to this page.
 */
async function handleLogout(isTimeout = false) {
  try {
    await fetch('/api/auth/logout', { 
      method: 'POST', 
      credentials: 'same-origin',
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
  } catch (e) {
    // Ignore errors, clear client state anyway
  }

  pcSession = { authenticated: false, user: null };
  window.pcSession = pcSession;
  stopIdleMonitoring();

  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch (e) {}

  // Overwrite current history entry so browser Back button cannot navigate to this screen
  const dest = isTimeout ? '/login.html?timeout=1' : '/login.html?logout=1';
  window.location.replace(dest);
}

/**
 * Apply role-based UI restrictions.
 * - Guests & customers: hide/disable all CRUD buttons (add, delete, forms)
 * - Admin: full access
 */
function applyRoleRestrictions() {
  const isAdmin = pcSession.authenticated && pcSession.user?.role === 'admin';
  
  if (isAdmin) return; // Admin gets full access — no restrictions

  // ── Products Page ──
  // Hide "Add New Product" button and modal
  const addProductBtn = document.getElementById('btn-add-product');
  if (addProductBtn) addProductBtn.style.display = 'none';
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) modalOverlay.style.display = 'none';

  // Hide delete buttons on product cards (initially rendered ones)
  document.querySelectorAll('.btn-delete-product').forEach(btn => btn.style.display = 'none');

  // ── Sales Page ──
  // Hide "New Transaction" button in the page header
  const newTransBtn = document.getElementById('btn-new-transaction');
  if (newTransBtn) newTransBtn.style.display = 'none';

  // Hide the sale form card
  const saleForm = document.getElementById('new-sale-form');
  if (saleForm) {
    const saleCard = saleForm.closest('.card');
    if (saleCard) {
      saleCard.style.display = 'none';
      // Insert admin-only notice
      const notice = document.createElement('div');
      notice.className = 'card reveal-left';
      notice.style.cssText = 'margin-bottom:2.5rem;border-left:4px solid #94a3b8;background:#f8fafc;';
      notice.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;">
          <i class="fa-solid fa-lock" style="font-size:1.2rem;color:#94a3b8;"></i>
          <div>
            <strong style="color:var(--navy,#1a1a2e);">Admin Only</strong>
            <p style="font-size:0.85rem;color:var(--text-muted,#64748b);margin:0;">Recording new orders requires admin privileges. Sign in as admin to manage transactions.</p>
          </div>
        </div>
      `;
      saleCard.parentNode.insertBefore(notice, saleCard);
    }
  }

  // ── Queue Page ──
  // Hide the enqueue form card
  const enqueueForm = document.getElementById('enqueue-form');
  if (enqueueForm) {
    const enqueueCard = enqueueForm.closest('.card');
    if (enqueueCard) {
      enqueueCard.style.display = 'none';
      // Insert admin-only notice
      const notice = document.createElement('div');
      notice.className = 'card reveal-left';
      notice.style.cssText = 'border-left:4px solid #94a3b8;background:#f8fafc;';
      notice.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;">
          <i class="fa-solid fa-lock" style="font-size:1.2rem;color:#94a3b8;"></i>
          <div>
            <strong style="color:var(--navy,#1a1a2e);">Admin Only</strong>
            <p style="font-size:0.85rem;color:var(--text-muted,#64748b);margin:0;">Creating and serving support tickets requires admin privileges.</p>
          </div>
        </div>
      `;
      enqueueCard.parentNode.insertBefore(notice, enqueueCard);
    }
  }

  // Hide serve/dequeue button
  const dequeueBtn = document.getElementById('btn-dequeue');
  if (dequeueBtn) {
    dequeueBtn.style.display = 'none';
  }
}

/**
 * Called AFTER products are rendered to re-hide delete buttons for non-admin.
 * Products.js calls renderProducts() which rebuilds the grid — so we need to re-apply.
 */
function postRenderApplyRestrictions() {
  const isAdmin = pcSession.authenticated && pcSession.user?.role === 'admin';
  if (!isAdmin) {
    document.querySelectorAll('button[onclick^="deleteProduct"]').forEach(btn => {
      btn.style.display = 'none';
    });
  }
}

/* ==========================================================================
   1. SCROLL ANIMATION OBSERVER ENGINE
   ========================================================================== */
function initScrollObserver() {
  const animatedElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  
  if (!('IntersectionObserver' in window)) {
    animatedElements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  });

  animatedElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   2. SCROLL PROGRESS INDICATOR
   ========================================================================== */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (windowHeight <= 0) return;
    const progress = (window.scrollY / windowHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileDrawer() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-drawer');
  const drawerClose = document.getElementById('drawer-close');
  const backdrop = document.getElementById('backdrop');

  if (!hamburgerBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
}

/* Set Active Class on current Page Navigation link */
function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link, .drawer-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (currentPath === '/' && href === '/')) ) {
      link.classList.add('active');
    }
  });
}

/* ==========================================================================
   4. API UTILITIES & FETCH WRAPPER
   ========================================================================== */
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || json.message || 'API request failed');
    }

    return json;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    showToast(error.message, 'error');
    throw error;
  }
}

/* ==========================================================================
   5. UI NOTIFICATIONS (TOASTS)
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: '#16a34a',
    error: '#e63946',
    info: '#1a1a2e'
  };

  toast.style.cssText = `
    background-color: ${bgColors[type] || bgColors.info};
    color: #ffffff;
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  `;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   6. FORMATTING HELPERS
   ========================================================================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
