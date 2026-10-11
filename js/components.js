/**
 * PC Point - PC Component Compatibility & Bus Explorer JS Logic
 * Commercial Hardware Interconnect & Subsystem Bus Diagnostic
 */

let graphAdjacency = {};

document.addEventListener('DOMContentLoaded', () => {
  loadGraphData();
  setupCompatibilityScanListener();
});

async function loadGraphData() {
  try {
    const res = await apiCall('/api/components');
    graphAdjacency = res.adjacency_list || res;
    renderGraphAdjacency(graphAdjacency);
    populateStartDropdown(graphAdjacency);
  } catch (err) {
    showToast('Failed to load component bus topology', 'error');
  }
}

function selectQuickNode(nodeName) {
  // Update active pill button
  document.querySelectorAll('#quick-node-pills .preset-budget-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-node') === nodeName);
  });

  const select = document.getElementById('bfs-start-node');
  if (select) {
    select.value = nodeName;
  }

  // Trigger scan automatically
  runHardwareCompatibilityScan();
}

function populateStartDropdown(graph) {
  const select = document.getElementById('bfs-start-node');
  if (!select || !graph) return;

  const nodes = Object.keys(graph);
  if (nodes.length > 0) {
    select.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
  }
}

function renderGraphAdjacency(graph) {
  const container = document.getElementById('graph-adjacency-grid');
  const countBadge = document.getElementById('node-count-badge');
  if (!container) return;

  const nodes = Object.keys(graph || {});
  if (countBadge) {
    countBadge.textContent = `${nodes.length} Verified Bus Subsystems`;
  }

  if (!graph || nodes.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No subsystem hardware nodes detected.</div>`;
    return;
  }

  const nodeIcons = {
    'Computer': 'fa-desktop',
    'Laptop': 'fa-laptop',
    'Desktop': 'fa-tower-cell',
    'CPU': 'fa-microchip',
    'GPU': 'fa-display',
    'RAM': 'fa-memory',
    'SSD': 'fa-hard-drive',
    'Motherboard': 'fa-diagram-project',
    'Display Panel': 'fa-tv',
    'Monitor': 'fa-desktop'
  };

  container.innerHTML = Object.entries(graph).map(([node, neighbors]) => {
    const icon = nodeIcons[node] || 'fa-cubes';
    const neighborBadges = neighbors && neighbors.length > 0 
      ? neighbors.map(n => `<span class="hw-chip" onclick="selectQuickNode('${n}')" style="cursor: pointer;" title="Inspect compatibility"><i class="fa-solid fa-link"></i> ${n}</span>`).join('')
      : '<span style="font-size: 0.8rem; color: var(--text-muted);">Terminal Subsystem</span>';

    return `
      <div class="graph-card reveal-scale" id="graph-node-${node.replace(/\s+/g, '-')}" onclick="selectQuickNode('${node}')" style="cursor: pointer;" title="Click to test compatibility bus from ${node}">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <h3 style="font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--primary-navy);">
            <i class="fa-solid ${icon}" style="color: var(--accent-red);"></i> ${escapeHtml(node)}
          </h3>
          <span class="badge badge-navy">${neighbors ? neighbors.length : 0} Bus Links</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Direct Hardware Interconnects:</p>
        <div class="graph-neighbors">
          ${neighborBadges}
        </div>
      </div>
    `;
  }).join('');

  if (typeof initScrollObserver === 'function') {
    initScrollObserver();
  }
}

function setupCompatibilityScanListener() {
  const btnRun = document.getElementById('btn-run-bfs');
  if (btnRun) {
    btnRun.addEventListener('click', runHardwareCompatibilityScan);
  }
}

async function runHardwareCompatibilityScan() {
  const startSelect = document.getElementById('bfs-start-node');
  const startNode = startSelect ? startSelect.value : 'Computer';
  const resultBox = document.getElementById('bfs-result-box');
  const chipsDiv = document.getElementById('bfs-sequence-chips');
  const traceDiv = document.getElementById('bfs-level-trace');
  const statusBadge = document.getElementById('scan-status-badge');

  if (!startNode) return;

  if (statusBadge) {
    statusBadge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Bus Route...`;
  }

  try {
    const res = await apiCall(`/api/components/bfs?start=${encodeURIComponent(startNode)}`);
    if (resultBox) resultBox.style.display = 'block';

    // Reset previous active circuit highlights
    document.querySelectorAll('.graph-card').forEach(c => c.classList.remove('circuit-active'));

    if (chipsDiv) chipsDiv.innerHTML = '';
    if (traceDiv) traceDiv.innerHTML = `<strong>Bus Interconnect Traversal Sequence (Starting from ${startNode}):</strong><br>`;

    const visited = res.visited_order || res.visited || [];
    const edges = res.edges || [];

    visited.forEach((n, idx) => {
      setTimeout(() => {
        if (chipsDiv) {
          const chip = document.createElement('span');
          chip.className = 'badge badge-green';
          chip.style.fontSize = '0.88rem';
          chip.style.padding = '0.35rem 0.75rem';
          chip.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${idx + 1}. ${n}`;
          chipsDiv.appendChild(chip);
        }

        const cardId = `graph-node-${n.replace(/\s+/g, '-')}`;
        const card = document.getElementById(cardId);
        if (card) {
          card.classList.add('circuit-active');
        }
      }, idx * 200);
    });

    if (edges.length > 0) {
      setTimeout(() => {
        let edgeText = '<div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed #cbd5e1;"><strong>Verified Hardware Interconnect Links:</strong><div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">';
        edges.forEach(e => {
          edgeText += `<span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; color: #1e293b;">${e[0]} &rarr; ${e[1]}</span>`;
        });
        edgeText += '</div></div>';
        if (traceDiv) traceDiv.innerHTML += edgeText;
        if (statusBadge) {
          statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Complete & Verified`;
        }
      }, visited.length * 200 + 50);
    }

    showToast(`Compatibility bus scan complete from "${startNode}"`, 'success');
  } catch (err) {
    if (statusBadge) {
      statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Scan Issue`;
    }
    showToast('Subsystem bus scan could not be completed', 'error');
  }
}
