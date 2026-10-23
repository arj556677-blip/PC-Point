/**
 * PC Point - Customer Service Queue Module JS Logic
 */

let currentQueue = [];

document.addEventListener('DOMContentLoaded', () => {
  loadQueueData();
  setupQueueListeners();
});

async function loadQueueData() {
  try {
    const res = await apiCall('/api/queue');
    currentQueue = Array.isArray(res) ? res : (res.queue || []);
    renderQueueStrip(currentQueue);
    updateFrontCustomerCard(currentQueue);
  } catch (err) {
    const strip = document.getElementById('queue-visualizer-strip');
    if (strip) {
      strip.innerHTML = `<div style="color: var(--text-muted); text-align: center; width: 100%; padding: 1.5rem;"><i class="fa-solid fa-lock" style="margin-right: 0.5rem; color: var(--accent-red);"></i>Admin authentication required to view customer service queue.</div>`;
    }
  }
}

function renderQueueStrip(queue) {
  const strip = document.getElementById('queue-visualizer-strip');
  const countBadge = document.getElementById('queue-length-badge');
  if (countBadge) countBadge.textContent = `${queue ? queue.length : 0} Pending Tickets`;

  if (!queue || queue.length === 0) {
    strip.innerHTML = `<div style="color: var(--text-muted); text-align: center; width: 100%; padding: 1rem;">Support ticket queue is currently empty.</div>`;
    return;
  }

  strip.innerHTML = queue.map((cust, index) => {
    const isFront = index === 0;
    const isRear = index === queue.length - 1;

    let pointerBadge = '';
    if (isFront && isRear) {
      pointerBadge = `<span class="queue-pointer pointer-front" style="top: -12px; background: #16a34a;">NEXT & ONLY</span>`;
    } else if (isFront) {
      pointerBadge = `<span class="queue-pointer pointer-front" style="background: #16a34a;">NEXT IN LINE</span>`;
    } else if (isRear) {
      pointerBadge = `<span class="queue-pointer pointer-rear">LATEST QUEUED</span>`;
    }

    return `
      <div class="queue-item ${isFront ? 'front' : ''} ${isRear ? 'rear' : ''}">
        ${pointerBadge}
        <div style="font-size: 0.75rem; color: var(--text-muted);">Appointment #${index + 1}</div>
        <div style="font-weight: 700; color: var(--primary-navy); margin: 2px 0;">${escapeHtml(cust.name || cust.customer_name)}</div>
        <div style="font-size: 0.75rem; color: var(--accent-red); font-weight: 600;">${escapeHtml(cust.issue || cust.service || 'Support')}</div>
      </div>
    `;
  }).join('');
}

function updateFrontCustomerCard(queue) {
  const nameEl = document.getElementById('current-front-name');
  const serviceEl = document.getElementById('current-front-service');

  if (!queue || queue.length === 0) {
    if (nameEl) nameEl.textContent = 'No pending tickets';
    if (serviceEl) serviceEl.textContent = 'All scheduled customer consultations are currently completed.';
    return;
  }

  const front = queue[0];
  if (nameEl) nameEl.textContent = front.name || front.customer_name;
  if (serviceEl) serviceEl.textContent = front.issue || front.service || 'Service consultation';
}

function setupQueueListeners() {
  const form = document.getElementById('enqueue-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cust-name').value;
      const service = document.getElementById('cust-service').value;
      const phone = document.getElementById('cust-phone')?.value || '9876543210';

      try {
        await apiCall('/api/queue', 'POST', { name, issue: service, phone });
        showToast(`Support ticket booked for "${name}"`, 'success');
        form.reset();
        const phoneInput = document.getElementById('cust-phone');
        if (phoneInput) phoneInput.value = '9876543210';
        loadQueueData();
      } catch (err) {
        showToast('Failed to create ticket', 'error');
      }
    });
  }

  const btnDequeue = document.getElementById('btn-dequeue');
  if (btnDequeue) {
    btnDequeue.addEventListener('click', async () => {
      if (!currentQueue || currentQueue.length === 0) {
        showToast('No pending appointments in queue.', 'info');
        return;
      }

      try {
        const res = await apiCall('/api/queue/serve', 'POST');
        const served = res.served_customer || res.served || {};
        const servedName = served.name || served.customer_name || 'Customer';
        showToast(`Consultation completed for "${servedName}"`, 'success');
        loadQueueData();
      } catch (err) {
        showToast('Failed to call next ticket', 'error');
      }
    });
  }
}
