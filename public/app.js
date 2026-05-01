const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchError = document.getElementById('searchError');
const walletTableBody = document.getElementById('walletTableBody');
const suggestionsEl = document.getElementById('suggestions');
const featureSplash = document.getElementById('featureSplash');
const paginationEl = document.getElementById('pagination');
const filterXEl = document.getElementById('filterX');
const lbTotalLabel = document.getElementById('lbTotalLabel');
const statWalletsEl = document.getElementById('statWallets');
const statTotalEl = document.getElementById('statTotal');
const statUpdatedEl = document.getElementById('statUpdated');

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const PAGE_SIZE = 100;

// =====================================================
// Encrypted data layer (intentionally compact identifiers).
// All wallet/history fetches go through this opaque module so the network
// transport, payload structure, and field semantics aren't readable from
// DevTools without reverse-engineering this script. The pepper string and
// derivation algorithm must match server.js.
// =====================================================
const _D = (() => {
  const _p = String.fromCharCode(97,56,120,46,107,51,121,46,118,49,46,114,51,119);
  let _t = null, _k = null, _exp = 0, _inflight = null;

  const _b64 = (s) => {
    const bin = atob(s);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  };
  const _sha = async (m) => new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m))
  );
  const _path = (a, b, c) => '/' + String.fromCharCode(95) + '/' + a + (b ? '/' + b : '') + (c || '');
  const _bootOnce = async () => {
    const r = await fetch(_path('k'), { cache: 'no-store' });
    if (!r.ok) throw new Error('boot');
    const j = await r.json();
    _t = j.t;
    _exp = Date.now() + (j.e || 600000) - 30000;
    _k = await _sha(_p + '|' + _t);
  };
  const _boot = () => {
    if (!_inflight) _inflight = _bootOnce().finally(() => { _inflight = null; });
    return _inflight;
  };
  const _ensure = async () => {
    if (!_t || !_k || Date.now() > _exp) await _boot();
  };
  const _dec = (txt) => {
    const c = _b64(txt);
    const o = new Uint8Array(c.length);
    for (let i = 0; i < c.length; i++) o[i] = c[i] ^ _k[i % _k.length];
    return JSON.parse(new TextDecoder().decode(o));
  };
  const _go = async (path, qs) => {
    await _ensure();
    const url = path + (qs ? '?' + qs + '&' : '?') + 't=' + _t;
    let r = await fetch(url, { cache: 'no-store' });
    if (r.status === 401) {
      _t = null;
      await _boot();
      r = await fetch(path + (qs ? '?' + qs + '&' : '?') + 't=' + _t, { cache: 'no-store' });
    }
    if (!r.ok) throw new Error('e' + r.status);
    return _dec(await r.text());
  };

  return {
    list: async () => (await _go(_path('d'))).map((w) => ({
      address: w.a,
      totalUSDC: w.t,
      lastTxAmount: w.l,
      lastTxHash: w.h,
      lastTxDate: w.d,
      txCount: w.c,
      username: w.u,
      xUsername: w.x,
    })),
    suggest: async (q) => (await _go(_path('s'), 'q=' + encodeURIComponent(q))).map((w) => ({
      username: w.u, xUsername: w.x, address: w.a, totalUSDC: w.t,
    })),
    history: async (addr) => {
      const r = await _go(_path('h', encodeURIComponent(addr)));
      return {
        address: r.a,
        days: (r.d || []).map((d) => ({ date: d.k, amount: d.v })),
        total: r.t,
      };
    },
  };
})();

// Tiny ephemeral toast used by share/copy actions.
const _toast = (msg) => {
  let el = document.getElementById('rw-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rw-toast';
    el.className = 'rw-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toast._t);
  _toast._t = setTimeout(() => el.classList.remove('show'), 1600);
};

const buildShareUrl = (address) =>
  `${location.origin}/rewards/${address.toLowerCase()}`;

const copyShareLink = async (address) => {
  const url = buildShareUrl(address);
  try {
    await navigator.clipboard.writeText(url);
    _toast('LINK COPIED');
  } catch {
    // Legacy fallback
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); _toast('LINK COPIED'); } catch { _toast('COPY FAILED'); }
    document.body.removeChild(ta);
  }
};

// --------------- Featured users config ---------------
const FEATURED_USERS = [
  { address: '0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b', displayName: 'CarOnPolymarket', avatar: 'avatars/car.png' },
  { address: '0xa4b366ad22fc0d06f1e934ff468e8922431a87b8', displayName: 'HolyMoses7', avatar: 'avatars/holymoses.jpg' },
  { address: '0xb7f55b6d32c2ee3768192d676cd66354f51fc669', displayName: 'BagCalls', avatar: 'avatars/bagcalls.jpg' },
  { address: '0x154794795d978c5890b3f69264311f0bd966d066', displayName: 'PMTraderAdam', avatar: 'avatars/pmtrader.png' },
  { address: '0x5bac37ae4b985011e34862ec14c3ae72ebbf8769', displayName: '0xBumblebee', avatar: 'avatars/bumblebee.jpg' },
  { address: '0x7b5887dcffa32af1ec155a8835c48b4e948aeb2b', displayName: 'senzer', avatar: 'avatars/senzer.jpg' },
  { address: '0x0f863d92dd2b960e3eb6a23a35fd92a91981404e', displayName: 'CUTNPASTE4', avatar: 'avatars/cutnpaste4.jpg' },
  { address: '0xf8041623faef5c3bdbeec3f4c18360a720b04c3d', displayName: 'adiix_official', avatar: 'avatars/adiix.jpg' },
];

// --------------- Helpers ---------------

const formatUSDC = (value) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const truncateAddress = (addr) =>
  `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const showError = (msg) => {
  searchError.textContent = msg;
  searchError.classList.remove('hidden');
};

const clearError = () => {
  searchError.classList.add('hidden');
};

// --------------- Autocomplete ---------------

let suggestIndex = -1;
let suggestItems = [];
let debounceTimer = null;

const hideSuggestions = () => {
  suggestionsEl.classList.add('hidden');
  suggestionsEl.innerHTML = '';
  suggestIndex = -1;
  suggestItems = [];
};

const showSuggestions = (items) => {
  suggestItems = items;
  suggestIndex = -1;
  suggestionsEl.innerHTML = '';

  if (items.length === 0) {
    hideSuggestions();
    return;
  }

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;

    const left = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'suggest-name';
    nameSpan.textContent = item.username || 'anon';

    // Show xUsername if it exists and differs from username
    if (item.xUsername && item.xUsername.toLowerCase() !== (item.username || '').toLowerCase()) {
      const xSpan = document.createElement('span');
      xSpan.className = 'suggest-xname';
      xSpan.textContent = ` @${item.xUsername}`;
      left.append(nameSpan, xSpan);
    } else {
      left.append(nameSpan);
    }

    const addrSpan = document.createElement('span');
    addrSpan.className = 'suggest-address';
    addrSpan.textContent = ` ${truncateAddress(item.address)}`;
    left.append(addrSpan);

    const amountSpan = document.createElement('span');
    amountSpan.className = 'suggest-amount';
    amountSpan.textContent = `$${formatUSDC(item.totalUSDC)}`;

    li.append(left, amountSpan);

    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      searchInput.value = item.address;
      hideSuggestions();
      handleSearch();
    });

    suggestionsEl.appendChild(li);
  });

  suggestionsEl.classList.remove('hidden');
};

const fetchSuggestions = async (query) => {
  try {
    const items = await _D.suggest(query);
    showSuggestions(items);
  } catch { /* ignore */ }
};

searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  if (val.length < 2) {
    hideSuggestions();
    return;
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(val), 150);
});

searchInput.addEventListener('keydown', (e) => {
  if (!suggestItems.length) {
    if (e.key === 'Enter') handleSearch();
    return;
  }

  const lis = suggestionsEl.querySelectorAll('li');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    suggestIndex = Math.min(suggestIndex + 1, suggestItems.length - 1);
    lis.forEach((li, i) => li.classList.toggle('active', i === suggestIndex));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    suggestIndex = Math.max(suggestIndex - 1, 0);
    lis.forEach((li, i) => li.classList.toggle('active', i === suggestIndex));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (suggestIndex >= 0 && suggestIndex < suggestItems.length) {
      searchInput.value = suggestItems[suggestIndex].address;
      hideSuggestions();
      handleSearch();
    } else {
      hideSuggestions();
      handleSearch();
    }
  } else if (e.key === 'Escape') {
    hideSuggestions();
  }
});

searchInput.addEventListener('blur', () => {
  setTimeout(hideSuggestions, 200);
});

// --------------- Search ---------------

const handleSearch = async () => {
  clearError();
  hideSuggestions();

  const query = searchInput.value.trim();
  if (!query) return;

  let address = query;

  if (!ADDRESS_RE.test(query)) {
    try {
      const items = await _D.suggest(query);
      if (items.length > 0) {
        address = items[0].address;
        searchInput.value = address;
      } else {
        showError('NO USER FOUND');
        return;
      }
    } catch {
      showError('NETWORK ERROR');
      return;
    }
  }

  openProfile(address.toLowerCase());
};

searchBtn.addEventListener('click', handleSearch);

// --------------- Leaderboard / Pagination / Filter ---------------

let allWallets = [];
let viewWallets = [];
let currentPage = 1;
let xOnly = false;

const renderRow = (wallet, rank) => {
  const tr = document.createElement('tr');
  tr.dataset.address = wallet.address;

  const tdRank = document.createElement('td');
  tdRank.className = 'col-rank';
  const pill = document.createElement('span');
  pill.className = 'rw-rank-pill' + (rank <= 3 ? ' rw-rank-pill--top' : '');
  pill.textContent = `#${rank}`;
  tdRank.appendChild(pill);

  const tdUser = document.createElement('td');
  tdUser.className = 'col-user';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'rw-user-name';
  const name = wallet.username || 'anon';
  nameSpan.textContent = name.length > 22 ? name.slice(0, 22) + '…' : name;
  if (name.length > 22) nameSpan.title = name;
  tdUser.appendChild(nameSpan);

  const tdAddr = document.createElement('td');
  tdAddr.className = 'col-addr';
  tdAddr.title = wallet.address;
  tdAddr.textContent = truncateAddress(wallet.address);

  const tdTotal = document.createElement('td');
  tdTotal.className = 'col-total';
  tdTotal.textContent = `$${formatUSDC(wallet.totalUSDC)}`;

  const tdLast = document.createElement('td');
  tdLast.className = 'col-last';
  tdLast.textContent = `$${formatUSDC(wallet.lastTxAmount)}`;

  const tdAct = document.createElement('td');
  tdAct.className = 'col-act';
  const links = document.createElement('div');
  links.className = 'rw-row-links';

  const pmLink = document.createElement('a');
  pmLink.href = `https://polymarket.com/profile/${wallet.address}`;
  pmLink.target = '_blank'; pmLink.rel = 'noopener';
  pmLink.className = 'rw-row-link rw-pm-link';
  pmLink.title = 'Polymarket Profile';
  pmLink.innerHTML = '<img src="/icons/polymarket-logo.png" alt="PM">';
  pmLink.addEventListener('click', (e) => e.stopPropagation());
  links.appendChild(pmLink);

  if (wallet.xUsername) {
    const xLink = document.createElement('a');
    xLink.href = `https://x.com/${encodeURIComponent(wallet.xUsername)}`;
    xLink.target = '_blank'; xLink.rel = 'noopener';
    xLink.className = 'rw-row-link rw-x-link';
    xLink.title = `@${wallet.xUsername}`;
    xLink.innerHTML = '<img src="/icons/x-logo.jpg" alt="X">';
    xLink.addEventListener('click', (e) => e.stopPropagation());
    links.appendChild(xLink);
  }

  // Per-rank share button: copies a stable deep link to this wallet's profile
  // so the recipient lands directly on the calendar regardless of rank shifts.
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'rw-row-link rw-share-link';
  shareBtn.title = 'Copy share link';
  shareBtn.setAttribute('aria-label', 'Copy share link');
  shareBtn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M9.5 2v1.5H12.19L6.72 8.97l1.06 1.06L13.25 4.5V7.19H14.75V2H9.5zM3 4.25A1.75 1.75 0 0 0 1.25 6v6.25A1.75 1.75 0 0 0 3 14h6.25A1.75 1.75 0 0 0 11 12.25v-3H9.5v3a.25.25 0 0 1-.25.25H3a.25.25 0 0 1-.25-.25V6a.25.25 0 0 1 .25-.25h3v-1.5H3z"/></svg>';
  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyShareLink(wallet.address);
  });
  links.appendChild(shareBtn);

  tdAct.appendChild(links);

  tr.append(tdRank, tdUser, tdAddr, tdTotal, tdLast, tdAct);
  tr.addEventListener('click', () => openProfile(wallet.address));
  return tr;
};

const applyFilter = () => {
  viewWallets = xOnly ? allWallets.filter(w => !!w.xUsername) : allWallets.slice();
  currentPage = 1;
  renderPage();
};

const renderPage = () => {
  const totalPages = Math.max(1, Math.ceil(viewWallets.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = viewWallets.slice(start, start + PAGE_SIZE);

  walletTableBody.innerHTML = '';
  if (slice.length === 0) {
    walletTableBody.innerHTML = '<tr><td colspan="6" class="rw-loading">NO WALLETS MATCH FILTER</td></tr>';
  } else {
    const frag = document.createDocumentFragment();
    slice.forEach((w, i) => {
      const row = renderRow(w, w.__rank);
      // Stagger first ~24 rows; remainder appears immediately to keep paging snappy
      if (i < 24) {
        row.classList.add('rw-row-in');
        row.style.animationDelay = `${i * 28}ms`;
      }
      frag.appendChild(row);
    });
    walletTableBody.appendChild(frag);
  }

  if (lbTotalLabel) lbTotalLabel.textContent = `${viewWallets.length} WALLETS`;
  renderPagination(totalPages);
};

const renderPagination = (totalPages) => {
  paginationEl.innerHTML = '';

  const btns = document.createElement('div');
  btns.className = 'rw-page-btns';

  const mkBtn = (label, page, opts = {}) => {
    const b = document.createElement('button');
    b.className = 'rw-page-btn' + (opts.active ? ' rw-page-btn--active' : '');
    b.textContent = label;
    if (opts.disabled) b.disabled = true;
    b.addEventListener('click', () => goToPage(page));
    return b;
  };
  const mkEllipsis = () => {
    const s = document.createElement('span');
    s.className = 'rw-page-ellipsis';
    s.textContent = '…';
    return s;
  };

  btns.appendChild(mkBtn('« PREV', currentPage - 1, { disabled: currentPage <= 1 }));

  // Build window of pages: first, last, and ±2 around current
  const pages = new Set([1, totalPages, currentPage]);
  for (let i = -2; i <= 2; i++) {
    const p = currentPage + i;
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  let prev = 0;
  sorted.forEach((p) => {
    if (p - prev > 1) btns.appendChild(mkEllipsis());
    btns.appendChild(mkBtn(String(p), p, { active: p === currentPage }));
    prev = p;
  });

  btns.appendChild(mkBtn('NEXT »', currentPage + 1, { disabled: currentPage >= totalPages }));

  // Jump-to-page
  const jump = document.createElement('form');
  jump.className = 'rw-page-jump';
  jump.innerHTML = `
    <label for="jumpInput">JUMP</label>
    <input id="jumpInput" type="number" min="1" max="${totalPages}" placeholder="${currentPage}/${totalPages}">
    <button type="submit">GO</button>
  `;
  jump.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseInt(jump.querySelector('input').value, 10);
    if (Number.isFinite(v)) goToPage(v);
  });

  paginationEl.append(btns, jump);
};

const goToPage = (page) => {
  const totalPages = Math.max(1, Math.ceil(viewWallets.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, page), totalPages);
  renderPage();
  document.querySelector('.rw-leaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

if (filterXEl) {
  filterXEl.addEventListener('change', () => {
    xOnly = filterXEl.checked;
    applyFilter();
  });
}

// --------------- Featured background cards ---------------

const FEATURED_VARIANTS = ['', 'alt', 'ink'];

// ---- Reproducible layout seeding ----
// Each layout is fully determined by a 32-bit integer seed. A locked seed,
// once saved, persists across reloads so the chosen composition is frozen.
const LAYOUT_SEED_KEY = 'rw_layout_seed_v1';
const LAYOUT_LOCKED_FLAG = 'rw_layout_locked_v1';

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const generateSeed = () => (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0);

const readLockedSeed = () => {
  try {
    if (localStorage.getItem(LAYOUT_LOCKED_FLAG) !== '1') return null;
    const raw = localStorage.getItem(LAYOUT_SEED_KEY);
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? (n >>> 0) : null;
  } catch { return null; }
};

// Fixed theme seed 0xE992D5A9 - permanently locked
let layoutSeed = 0xE992D5A9;
let layoutRand = mulberry32(layoutSeed);
let lastWalletsForSplash = null;

const _doBuildFeatureSplash = (wallets) => {
  if (!featureSplash) return;
  // Re-seed RNG for every build so the same seed always yields the same layout.
  layoutRand = mulberry32(layoutSeed);
  const walletMap = new Map(wallets.map((w) => [w.address.toLowerCase(), w]));
  const fragment = document.createDocumentFragment();

  // Use top earners + curated featured users for variety
  const top = wallets.slice(0, 16).filter(w => w.username);
  const list = [];
  FEATURED_USERS.forEach(u => list.push({ ...u, fromFeatured: true }));
  top.forEach((w) => {
    if (!list.find(u => u.address.toLowerCase() === w.address.toLowerCase())) {
      list.push({
        address: w.address,
        displayName: w.username || truncateAddress(w.address),
        avatar: null,
      });
    }
  });

  // Cap to ~14 visible for composition
  const picks = list.slice(0, 14);
  const positions = scatterPositions(picks.length);

  // Pin specific cards into the lower-right column for an intentional composition.
  // BOZOS sits above, Senzer directly below it.
  // Anchor to the splash container's box (not the viewport) so positions stay
  // correct under browser zoom / different page widths.
  const splashRect = featureSplash.getBoundingClientRect();
  const pageW = splashRect.width > 100 ? splashRect.width : window.innerWidth;
  const pageH = Math.max(splashRect.height > 100 ? splashRect.height : 0, window.innerHeight * 1.6, document.body.scrollHeight || 1600);
  const rightX = Math.max(20, Math.min(pageW - 220, pageW - 180));
  const pinned = {
    bozos:  { left: rightX, top: pageH * 0.66, rotation: -4 },
    senzer: { left: rightX, top: pageH * 0.84, rotation: 5 },
  };
  picks.forEach((u, i) => {
    const key = (u.displayName || '').toLowerCase();
    if (key === 'bozos' && pinned.bozos) { positions[i] = pinned.bozos; }
    if (key === 'senzer' && pinned.senzer) { positions[i] = pinned.senzer; }
  });

  picks.forEach((u, i) => {
    const data = walletMap.get(u.address.toLowerCase());
    const total = data ? formatUSDC(data.totalUSDC) : '—';
    const last = data ? formatUSDC(data.lastTxAmount) : '—';
    fragment.appendChild(createSplashCard(u, total, last, positions[i], i));
  });

  featureSplash.innerHTML = '';
  featureSplash.appendChild(fragment);
};

// Wait for layout to stabilize before positioning cards
let _splashInitTimer = null;
let _splashRetryCount = 0;
const buildFeatureSplash = (wallets) => {
  if (!featureSplash) return;
  lastWalletsForSplash = wallets;
  _splashRetryCount = 0;
  
  // Clear any pending build
  if (_splashInitTimer) clearTimeout(_splashInitTimer);
  
  const tryBuild = () => {
    const rect = featureSplash.getBoundingClientRect();
    // If dimensions are too small, the page hasn't laid out yet - retry
    if (rect.width < 100 && _splashRetryCount < 10) {
      _splashRetryCount++;
      _splashInitTimer = setTimeout(tryBuild, 100);
      return;
    }
    _doBuildFeatureSplash(wallets);
  };
  
  // Use requestAnimationFrame + small delay to ensure layout is complete
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      _splashInitTimer = setTimeout(tryBuild, 50);
    });
  });
};

// Rebuild splash on viewport resize (browser zoom included) so absolutely
// positioned cards stay anchored relative to the actual page width.
let _splashResizeT = null;
window.addEventListener('resize', () => {
  if (!lastWalletsForSplash) return;
  if (_splashResizeT) clearTimeout(_splashResizeT);
  _splashResizeT = setTimeout(() => _doBuildFeatureSplash(lastWalletsForSplash), 120);
}, { passive: true });

const scatterPositions = (count) => {
  // Distribute across full page with controlled jitter; place around content edges.
  // Anchor to splash container box (not viewport) so card positions remain
  // valid when the browser is zoomed in / out or the window resized.
  const rect = featureSplash ? featureSplash.getBoundingClientRect() : { width: 0, height: 0 };
  // Use window dimensions as fallback if rect is 0 (page not yet laid out)
  const W = rect.width > 100 ? rect.width : window.innerWidth;
  const H = Math.max(rect.height > 100 ? rect.height : 0, window.innerHeight * 1.6, document.body.scrollHeight || 1600);
  const positions = [];
  const cols = 4, rows = Math.ceil(count / cols);
  let n = 0;
  for (let r = 0; r < rows && n < count; r++) {
    for (let c = 0; c < cols && n < count; c++) {
      const baseX = ((c + 0.5) / cols) * W;
      const baseY = ((r + 0.5) / rows) * H;
      const jitterX = (layoutRand() - 0.5) * (W / cols) * 0.6;
      const jitterY = (layoutRand() - 0.5) * (H / rows) * 0.5;
      // Bias outward to keep center column readable
      const sideBias = (c < cols / 2 ? -1 : 1) * (W * 0.06);
      positions.push({
        left: Math.max(20, Math.min(W - 220, baseX + jitterX + sideBias)),
        top: Math.max(120, baseY + jitterY),
        rotation: -10 + layoutRand() * 20,
      });
      n++;
    }
  }
  return positions;
};

const createSplashCard = (user, total, last, pos, index) => {
  const card = document.createElement('div');
  const variant = FEATURED_VARIANTS[index % FEATURED_VARIANTS.length];
  card.className = 'featured-card' + (variant ? ` ${variant}` : '');
  card.style.top = `${pos.top}px`;
  card.style.left = `${pos.left}px`;
  card.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;

  const head = document.createElement('div');
  head.className = 'fc-head';
  
  const createPlaceholder = () => {
    const ph = document.createElement('div');
    ph.className = 'fc-avatar';
    ph.style.display = 'flex';
    ph.style.alignItems = 'center';
    ph.style.justifyContent = 'center';
    ph.style.fontFamily = "'Archivo Black', sans-serif";
    ph.style.fontSize = '22px';
    ph.textContent = (user.displayName || '?').slice(0, 1).toUpperCase();
    return ph;
  };
  
  if (user.avatar) {
    const img = document.createElement('img');
    img.src = user.avatar; img.alt = ''; img.className = 'fc-avatar';
    img.onerror = () => {
      img.replaceWith(createPlaceholder());
    };
    head.appendChild(img);
  } else {
    head.appendChild(createPlaceholder());
  }
  const ident = document.createElement('div');
  ident.style.minWidth = '0';
  const name = document.createElement('div');
  name.className = 'fc-name';
  const dn = user.displayName || 'anon';
  // CSS handles ellipsis on overflow; keep a generous safety cap for very long names.
  name.textContent = dn.length > 24 ? dn.slice(0, 24) + '…' : dn;
  name.title = dn;
  const tag = document.createElement('div');
  tag.className = 'fc-tag';
  tag.textContent = truncateAddress(user.address);
  ident.append(name, tag);
  head.appendChild(ident);

  const stat = document.createElement('div');
  stat.className = 'fc-stat';
  stat.textContent = `$${total}`;

  const sub = document.createElement('div');
  sub.className = 'fc-sub';
  sub.textContent = `LAST $${last}`;

  card.append(head, stat, sub);
  return card;
};

// --------------- Layout control panel ---------------
// Tiny, discreet floating control to shuffle/lock the background card layout.
// Lives in the bottom-right corner. Collapsed to a single dot until clicked.

const formatSeedHex = (s) => '0x' + (s >>> 0).toString(16).padStart(8, '0').toUpperCase();

const setLayoutSeed = (seed, { rebuild = true } = {}) => {
  layoutSeed = (seed >>> 0);
  if (rebuild && lastWalletsForSplash) {
    buildFeatureSplash(lastWalletsForSplash);
  }
  refreshLayoutPanel();
};

const lockCurrentLayout = () => {
  try {
    localStorage.setItem(LAYOUT_SEED_KEY, String(layoutSeed >>> 0));
    localStorage.setItem(LAYOUT_LOCKED_FLAG, '1');
  } catch { /* storage unavailable */ }
  refreshLayoutPanel();
};

const unlockLayout = () => {
  try {
    localStorage.removeItem(LAYOUT_LOCKED_FLAG);
    localStorage.removeItem(LAYOUT_SEED_KEY);
  } catch { /* storage unavailable */ }
  refreshLayoutPanel();
};

const isLayoutLocked = () => {
  try { return localStorage.getItem(LAYOUT_LOCKED_FLAG) === '1'; } catch { return false; }
};

let layoutPanelEls = null;

const buildLayoutPanel = () => {
  const root = document.createElement('div');
  root.id = 'layoutPanel';
  root.setAttribute('aria-label', 'Background layout controls');
  root.style.cssText = [
    'position:fixed', 'right:12px', 'bottom:12px', 'z-index:9999',
    'font-family:"JetBrains Mono", monospace', 'font-size:11px',
    'color:#e5e7eb', 'user-select:none',
  ].join(';');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.title = 'Layout controls';
  toggle.textContent = '⚙';
  toggle.style.cssText = [
    'all:unset', 'cursor:pointer', 'display:block', 'margin-left:auto',
    'width:22px', 'height:22px', 'line-height:22px', 'text-align:center',
    'border-radius:50%', 'background:rgba(17,24,39,0.55)',
    'border:1px solid rgba(255,255,255,0.12)', 'opacity:0.45',
    'transition:opacity 0.15s', 'font-size:12px',
  ].join(';');
  toggle.addEventListener('mouseenter', () => { toggle.style.opacity = '1'; });
  toggle.addEventListener('mouseleave', () => { toggle.style.opacity = '0.45'; });

  const panel = document.createElement('div');
  panel.style.cssText = [
    'display:none', 'margin-top:6px', 'padding:10px 12px',
    'background:rgba(17,24,39,0.92)', 'border:1px solid rgba(255,255,255,0.14)',
    'border-radius:8px', 'min-width:230px',
    'box-shadow:0 6px 24px rgba(0,0,0,0.35)',
  ].join(';');

  const title = document.createElement('div');
  title.textContent = 'BACKGROUND LAYOUT';
  title.style.cssText = 'font-size:10px;letter-spacing:0.12em;color:#9ca3af;margin-bottom:6px';

  const status = document.createElement('div');
  status.style.cssText = 'font-size:10px;color:#9ca3af;margin-bottom:6px';

  const seedRow = document.createElement('div');
  seedRow.style.cssText = 'display:flex;gap:6px;margin-bottom:8px';
  const seedInput = document.createElement('input');
  seedInput.type = 'text';
  seedInput.spellcheck = false;
  seedInput.style.cssText = [
    'flex:1', 'min-width:0', 'background:#0b1220', 'color:#e5e7eb',
    'border:1px solid rgba(255,255,255,0.14)', 'border-radius:4px',
    'padding:4px 6px', 'font-family:inherit', 'font-size:11px',
  ].join(';');
  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.textContent = 'Use';
  applyBtn.style.cssText = btnStyle();

  seedRow.append(seedInput, applyBtn);

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
  const shuffleBtn = document.createElement('button');
  shuffleBtn.type = 'button';
  shuffleBtn.textContent = 'Shuffle';
  shuffleBtn.style.cssText = btnStyle();
  const lockBtn = document.createElement('button');
  lockBtn.type = 'button';
  lockBtn.style.cssText = btnStyle();
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copy seed';
  copyBtn.style.cssText = btnStyle();

  actions.append(shuffleBtn, lockBtn, copyBtn);
  panel.append(title, status, seedRow, actions);
  root.append(toggle, panel);

  toggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  shuffleBtn.addEventListener('click', () => {
    if (isLayoutLocked()) unlockLayout();
    setLayoutSeed(generateSeed());
  });

  lockBtn.addEventListener('click', () => {
    if (isLayoutLocked()) unlockLayout(); else lockCurrentLayout();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(formatSeedHex(layoutSeed));
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy seed'; }, 1200);
    } catch { /* ignore */ }
  });

  applyBtn.addEventListener('click', () => {
    const raw = seedInput.value.trim();
    if (!raw) return;
    const n = raw.toLowerCase().startsWith('0x') ? parseInt(raw, 16) : parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    setLayoutSeed(n);
  });

  document.body.appendChild(root);
  layoutPanelEls = { root, panel, status, seedInput, lockBtn };
};

function btnStyle() {
  return [
    'all:unset', 'cursor:pointer', 'padding:4px 8px',
    'background:rgba(255,255,255,0.06)', 'color:#e5e7eb',
    'border:1px solid rgba(255,255,255,0.14)', 'border-radius:4px',
    'font-family:inherit', 'font-size:11px', 'letter-spacing:0.04em',
  ].join(';');
}

const refreshLayoutPanel = () => {
  if (!layoutPanelEls) return;
  const locked = isLayoutLocked();
  layoutPanelEls.status.innerHTML =
    `Seed: <span style="color:#e5e7eb">${formatSeedHex(layoutSeed)}</span> · ` +
    `<span style="color:${locked ? '#34d399' : '#fbbf24'}">${locked ? 'LOCKED' : 'unlocked'}</span>`;
  layoutPanelEls.seedInput.value = formatSeedHex(layoutSeed);
  layoutPanelEls.lockBtn.textContent = locked ? 'Unlock' : 'Lock current';
};

// Layout panel removed - using fixed seed 0xE992D5A9

// --------------- Leaderboard load ---------------

let _pendingDeepLink = null;

const loadLeaderboard = async () => {
  try {
    const wallets = await _D.list();
    // Attach permanent rank from initial sort
    wallets.forEach((w, i) => { w.__rank = i + 1; });
    allWallets = wallets;

    buildFeatureSplash(wallets);

    if (statWalletsEl) statWalletsEl.textContent = wallets.length.toLocaleString('en-US');
    if (statTotalEl) {
      const total = wallets.reduce((s, w) => s + (w.totalUSDC || 0), 0);
      statTotalEl.textContent = `$${formatUSDC(total)}`;
    }
    if (statUpdatedEl) statUpdatedEl.textContent = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

    applyFilter();

    // Honor any deep link queued by the router (e.g. shared profile URL)
    if (_pendingDeepLink) {
      const addr = _pendingDeepLink;
      _pendingDeepLink = null;
      openProfile(addr);
    }
  } catch {
    walletTableBody.innerHTML = '<tr><td colspan="6" class="rw-loading">NETWORK ERROR. RETRYING…</td></tr>';
    setTimeout(loadLeaderboard, 5000);
  }
};

loadLeaderboard();

// --------------- Profile modal + PNL calendar ---------------

const profileModal = document.getElementById('profileModal');
const pmRank = document.getElementById('pmRank');
const pmTitle = document.getElementById('pmTitle');
const pmAddr = document.getElementById('pmAddr');
const pmLinks = document.getElementById('pmLinks');
const pmTotal = document.getElementById('pmTotal');
const pmCount = document.getElementById('pmCount');
const pmLast = document.getElementById('pmLast');
const pmLastDate = document.getElementById('pmLastDate');
const calMonthEl = document.getElementById('calMonth');
const calMonthTotalEl = document.getElementById('calMonthTotal');
const calGridEl = document.getElementById('calGrid');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');

let calCurrent = { year: 0, month: 0 }; // month: 0-11 (UTC)
let calDays = []; // [{date,amount}]
let calMin = null, calMax = null;

const openProfile = async (address) => {
  const wallet = allWallets.find((w) => w.address.toLowerCase() === address) || { address };
  pmRank.textContent = wallet.__rank ? `#${wallet.__rank}` : '#—';
  // Truncate username to 20 characters
  let displayName = wallet.username || truncateAddress(address);
  if (displayName.length > 20) {
    displayName = displayName.slice(0, 20) + '…';
  }
  pmTitle.textContent = displayName;
  pmAddr.textContent = truncateAddress(address);

  pmLinks.innerHTML = '';
  const pm = document.createElement('a');
  pm.href = `https://polymarket.com/profile/${address}`;
  pm.target = '_blank'; pm.rel = 'noopener';
  pm.innerHTML = '<img src="/icons/polymarket-logo.png" alt=""> POLYMARKET';
  pmLinks.appendChild(pm);
  if (wallet.xUsername) {
    const x = document.createElement('a');
    x.href = `https://x.com/${encodeURIComponent(wallet.xUsername)}`;
    x.target = '_blank'; x.rel = 'noopener';
    x.innerHTML = `<img src="/icons/x-logo.jpg" alt=""> @${wallet.xUsername}`;
    pmLinks.appendChild(x);
  }

  const shareA = document.createElement('a');
  shareA.href = '#';
  shareA.className = 'rw-pm-share';
  shareA.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M9.5 2v1.5H12.19L6.72 8.97l1.06 1.06L13.25 4.5V7.19H14.75V2H9.5zM3 4.25A1.75 1.75 0 0 0 1.25 6v6.25A1.75 1.75 0 0 0 3 14h6.25A1.75 1.75 0 0 0 11 12.25v-3H9.5v3a.25.25 0 0 1-.25.25H3a.25.25 0 0 1-.25-.25V6a.25.25 0 0 1 .25-.25h3v-1.5H3z"/></svg> SHARE';
  shareA.addEventListener('click', async (e) => {
    e.preventDefault();
    const modalCard = document.querySelector('.rw-modal-card');
    if (!modalCard || typeof html2canvas === 'undefined') {
      _toast('SHARE NOT AVAILABLE');
      return;
    }
    
    const origText = shareA.innerHTML;
    shareA.innerHTML = 'COPYING...';
    shareA.style.pointerEvents = 'none';
    
    // Temporarily disable styles that cause dim screenshots
    const origStyles = {
      boxShadow: modalCard.style.boxShadow,
      animation: modalCard.style.animation,
      filter: modalCard.style.filter,
    };
    modalCard.style.boxShadow = 'none';
    modalCard.style.animation = 'none';
    modalCard.style.filter = 'none';
    
    try {
      const canvas = await html2canvas(modalCard, {
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: true,
      });
      
      // Restore original styles
      modalCard.style.boxShadow = origStyles.boxShadow;
      modalCard.style.animation = origStyles.animation;
      modalCard.style.filter = origStyles.filter;
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          _toast('CAPTURE FAILED');
          shareA.innerHTML = origText;
          shareA.style.pointerEvents = '';
          return;
        }
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          _toast('IMAGE COPIED!');
        } catch (err) {
          _toast('CLIPBOARD ERROR');
        }
        
        shareA.innerHTML = origText;
        shareA.style.pointerEvents = '';
      }, 'image/png', 1.0);
    } catch (err) {
      modalCard.style.boxShadow = origStyles.boxShadow;
      modalCard.style.animation = origStyles.animation;
      modalCard.style.filter = origStyles.filter;
      _toast('CAPTURE FAILED');
      shareA.innerHTML = origText;
      shareA.style.pointerEvents = '';
    }
  });
  pmLinks.appendChild(shareA);

  // Reflect open profile in URL so the page is shareable / bookmarkable.
  try {
    history.replaceState(null, '', `/rewards/${address.toLowerCase()}`);
  } catch { /* ignore */ }

  pmTotal.textContent = wallet.totalUSDC != null ? `$${formatUSDC(wallet.totalUSDC)}` : '—';
  pmCount.textContent = wallet.txCount != null ? wallet.txCount : '—';
  pmLast.textContent = wallet.lastTxAmount != null ? `$${formatUSDC(wallet.lastTxAmount)}` : '—';
  pmLastDate.textContent = formatDate(wallet.lastTxDate);

  profileModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Load history
  calDays = [];
  calGridEl.innerHTML = '<div class="rw-loading" style="grid-column: span 7; padding: 30px;">LOADING HISTORY…</div>';
  try {
    const data = await _D.history(address);
    if (data) {
      calDays = data.days || [];
      const amounts = calDays.map(d => d.amount);
      calMin = amounts.length ? Math.min(...amounts) : 0;
      calMax = amounts.length ? Math.max(...amounts) : 0;
      // Set initial month to most recent reward (or current month)
      if (calDays.length > 0) {
        const last = calDays[calDays.length - 1].date;
        calCurrent = { year: parseInt(last.slice(0, 4), 10), month: parseInt(last.slice(5, 7), 10) - 1 };
      } else {
        const now = new Date();
        calCurrent = { year: now.getUTCFullYear(), month: now.getUTCMonth() };
      }
      renderCalendar();
    } else {
      calGridEl.innerHTML = '<div class="rw-loading" style="grid-column: span 7; padding: 30px;">NO HISTORY</div>';
    }
  } catch {
    calGridEl.innerHTML = '<div class="rw-loading" style="grid-column: span 7; padding: 30px;">NETWORK ERROR</div>';
  }
};

const closeProfile = () => {
  if (profileModal.classList.contains('hidden')) return;
  profileModal.classList.add('rw-modal--closing');
  setTimeout(() => {
    profileModal.classList.add('hidden');
    profileModal.classList.remove('rw-modal--closing');
    document.body.style.overflow = '';
  }, 160);
  // Drop the per-profile fragment so refreshing won't re-open the modal.
  if (/^\/rewards\/0x[a-fA-F0-9]{40}/i.test(location.pathname)) {
    try { history.replaceState(null, '', '/rewards'); } catch { /* ignore */ }
  }
};

profileModal.addEventListener('click', (e) => {
  if (e.target.dataset.close !== undefined) closeProfile();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !profileModal.classList.contains('hidden')) closeProfile();
});

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DOW = ['MO','TU','WE','TH','FR','SA','SU'];

const renderCalendar = () => {
  const { year, month } = calCurrent;
  calMonthEl.textContent = `${MONTH_NAMES[month]} ${year}`;

  // Build map for quick lookup
  const byDay = new Map();
  let monthTotal = 0;
  calDays.forEach(({ date, amount }) => {
    if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      byDay.set(date, amount);
      monthTotal += amount;
    }
  });
  calMonthTotalEl.textContent = `$${formatUSDC(monthTotal)}`;

  // First day of month (UTC)
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Make Monday=0
  const startDow = (first.getUTCDay() + 6) % 7;

  calGridEl.innerHTML = '';

  // Header row
  DOW.forEach(d => {
    const h = document.createElement('div');
    h.className = 'rw-cal-dow';
    h.textContent = d;
    calGridEl.appendChild(h);
  });

  // Leading empty
  for (let i = 0; i < startDow; i++) {
    const c = document.createElement('div');
    c.className = 'rw-cal-cell rw-cal-cell--empty';
    calGridEl.appendChild(c);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const amt = byDay.get(dateKey);
    const cell = document.createElement('div');
    cell.className = 'rw-cal-cell';
    let level = 0;
    if (amt && calMax > 0) {
      const ratio = amt / calMax;
      level = ratio > 0.66 ? 4 : ratio > 0.33 ? 3 : ratio > 0.1 ? 2 : 1;
    }
    if (level) cell.dataset.level = String(level);

    const day = document.createElement('div');
    day.className = 'rw-cal-day';
    day.textContent = String(d);
    const a = document.createElement('div');
    a.className = 'rw-cal-amt';
    a.textContent = amt ? `$${amt >= 1000 ? (amt/1000).toFixed(1) + 'K' : amt.toFixed(0)}` : '';

    cell.append(day, a);
    calGridEl.appendChild(cell);
  }
};

calPrev?.addEventListener('click', () => {
  let { year, month } = calCurrent;
  month--;
  if (month < 0) { month = 11; year--; }
  calCurrent = { year, month };
  renderCalendar();
});
calNext?.addEventListener('click', () => {
  let { year, month } = calCurrent;
  month++;
  if (month > 11) { month = 0; year++; }
  calCurrent = { year, month };
  renderCalendar();
});


// =====================================================
// Page routing (Home / Rewards) + Halftone hero engine
// =====================================================
(() => {
  const pages = {
    home: document.getElementById('page-home'),
    rewards: document.getElementById('page-rewards'),
    'not-found': document.getElementById('page-404'),
  };

  // Path-based routing (History API). Supported routes:
  //   /                    → home
  //   /home                → home
  //   /rewards             → rewards
  //   /rewards/0xADDRESS   → rewards + open profile modal
  // Anything else → 404 page.
  const DEEP_LINK_RE = /^\/rewards\/(0x[a-fA-F0-9]{40})\/?$/i;
  const KNOWN_PATH_RE = /^\/(home|rewards)\/?$/i;
  let currentPage = null;
  let loaderSwapTimer = 0;
  let loaderHideTimer = 0;
  let lastHandledPath = location.pathname || '/';

  const queueOrOpenProfile = (addr) => {
    if (allWallets && allWallets.length > 0) {
      openProfile(addr);
    } else {
      _pendingDeepLink = addr;
    }
  };

  const showPage = (name) => {
    if (!pages[name]) return;
    if (name !== 'rewards' && profileModal && !profileModal.classList.contains('hidden')) {
      profileModal.classList.add('hidden');
      profileModal.classList.remove('rw-modal--closing');
      document.body.style.overflow = '';
    }
    Object.entries(pages).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    document.querySelectorAll('.top-nav .nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === name);
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
    currentPage = name;
    
    // Rebuild featured cards when switching to rewards page
    if (name === 'rewards' && lastWalletsForSplash) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => _doBuildFeatureSplash(lastWalletsForSplash), 100);
        });
      });
    }
  };

  // ----- Page transition preloader -----
  const loaderEl = document.getElementById('pageLoader');
  const loaderLabel = document.getElementById('pageLoaderLabel');
  const LOADER_LABELS = { home: 'HOME', rewards: 'REWARDS', 'not-found': '404' };
  const LOADER_MIN_MS = 920;

  const parseRoute = () => {
    const path = location.pathname || '/';
    if (path === '/' || /^\/home\/?$/i.test(path)) {
      return { page: 'home', profile: null };
    }
    const deep = path.match(DEEP_LINK_RE);
    if (deep) return { page: 'rewards', profile: deep[1].toLowerCase() };
    if (/^\/rewards\/?$/i.test(path)) return { page: 'rewards', profile: null };
    return { page: 'not-found', profile: null };
  };

  const pathForPage = (name) => (name === 'home' ? '/' : `/${name === 'not-found' ? '404' : name}`);

  const navigateWithLoader = (target, options = {}) => {
    if (!pages[target]) return;
    const { updateUrl = true, replace = false, afterShow = null, urlOverride = null } = options;
    if (updateUrl) {
      const nextPath = urlOverride ?? pathForPage(target);
      if (location.pathname !== nextPath) {
        const method = replace ? 'replaceState' : 'pushState';
        history[method](null, '', nextPath);
      }
      lastHandledPath = nextPath;
    }

    const finish = () => {
      showPage(target);
      if (typeof afterShow === 'function') afterShow();
    };

    if (currentPage === target) {
      finish();
      return;
    }

    if (!loaderEl) {
      finish();
      return;
    }
    if (loaderLabel) {
      loaderLabel.textContent = LOADER_LABELS[target] || 'LOADING';
    }
    window.clearTimeout(loaderSwapTimer);
    window.clearTimeout(loaderHideTimer);

    // Restart the SVG draw animation reliably by toggling the class.
    loaderEl.classList.remove('is-active');
    // Force reflow so the next add re-triggers CSS animations.
    void loaderEl.offsetWidth;
    loaderEl.classList.add('is-active');
    loaderEl.setAttribute('aria-hidden', 'false');

    loaderSwapTimer = window.setTimeout(() => {
      finish();
      loaderHideTimer = window.setTimeout(() => {
        loaderEl.classList.remove('is-active');
        loaderEl.setAttribute('aria-hidden', 'true');
      }, 180);
    }, LOADER_MIN_MS);
  };

  document.querySelectorAll('[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = link.dataset.page;
      if (!target) return;
      // Honor modifier-clicks / middle-click / non-left buttons so users can
      // open routes in a new tab the normal way.
      if (e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigateWithLoader(target);
    });
  });

  const routeFromLocation = (useLoader) => {
    const path = location.pathname || '/';
    if (useLoader && path === lastHandledPath) return;
    lastHandledPath = path;
    const route = parseRoute();
    // For unknown paths, surface the original path on the 404 page.
    if (route.page === 'not-found') {
      const codeEl = document.getElementById('nf-path');
      if (codeEl) codeEl.textContent = path;
    }
    const afterShow = route.profile ? () => queueOrOpenProfile(route.profile) : null;
    if (useLoader) {
      navigateWithLoader(route.page, { updateUrl: false, afterShow });
    } else {
      showPage(route.page);
      if (afterShow) afterShow();
    }
  };

  routeFromLocation(false);

  // Allow back/forward to swap profile / page
  window.addEventListener('popstate', () => routeFromLocation(true));

  // ----- Animated particle field (Home hero) -----
  const canvas = document.getElementById('heroLines');
  if (canvas) initHeroLines(canvas, pages);
})();

/**
 * Particle-dust animation (newmixcoffee-style).
 * The SVG logo icon + "ABELIX" text are rendered to an offscreen canvas,
 * pixel data sampled into particles. Particles start scattered (dust cloud)
 * and assemble via spring physics. Mouse pushes them; they reassemble.
 */
function initHeroLines(canvas, pages) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, DPR = 1;

  // --- Particle pool (SoA layout) ---
  let px, py, tx, ty, vx, vy;
  let pSize, pAlpha, pFriction, pEase;
  let pColor32;                       // premultiplied-against-white packed ABGR (Uint32)
  let pKick;                          // 0..1, how recently the particle was disturbed by the cursor
  let count = 0;

  // Direct-pixel render buffer (single putImageData per frame — much faster
  // than calling fillRect/fillStyle per particle).
  let imgBuf = null;       // ImageData covering the full canvas
  let img32 = null;        // Uint32Array view over imgBuf.data
  let bufW = 0, bufH = 0;  // canvas pixel dimensions of the buffer
  const BG32 = 0xFFFFFFFF; // opaque white in little-endian ABGR

  // Mouse state
  let mouseX = -9999, mouseY = -9999;
  let prevMouseX = -9999, prevMouseY = -9999;
  let mouseVX = 0, mouseVY = 0;       // smoothed cursor velocity (drag vector)
  let hasMouse = false;
  // Cursor field: sand-like — weak radial push, gentle directional drag,
  // mild swirl. Particles get "kicked" and stay disturbed for ~2–3s
  // before the spring pulls them back into formation.
  const HOLE_RADIUS = 120;
  const HOLE_PUSH = 0.10;             // radial repulsion (just enough to part the sand)
  const HOLE_DRAG = 0.22;             // grains follow the cursor's motion vector — the trail
  const HOLE_SWIRL = 0.10;            // mild tangential flow around the cursor
  const MAX_CURSOR_V = 18;            // cap smoothed cursor velocity to avoid launches
  const KICK_DECAY = 0.988;           // ~2.5–3s linger before full return at 60fps
  const KICK_SPRING_DAMP = 0.85;      // how much spring is suppressed when fully kicked

  // Animation phase: 2–3s sand assembly on page load. The intro ease starts
  // the spring near zero so the initial inertial drift dominates, then ramps
  // up so the spring catches the grains and holds them in formation.
  // Animation phase: starts on the first frame the home page is actually
  // visible (not at script-load), so the assembly always plays end-to-end
  // regardless of how long fonts/images took to load.
  let birthTime = 0;
  const ASSEMBLE_DURATION = 550;

  // Preloaded SVG image
  let logoImg = null;
  let logoLoaded = false;
  const USE_MIX_REVEAL = true;
  let mixSrc = null;
  let stripeH = 5;
  let stripeCount = 0;
  let stripeStartX = null;
  let stripeStartY = null;
  let stripePhase = null;
  let stripeAmp = null;
  let mixBounds = null;
  let fracturePieces = [];

  // Load the SVG logo as an Image so we can draw it on the offscreen canvas
  const loadLogo = () => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { logoImg = img; logoLoaded = true; resolve(); };
    img.onerror = () => { logoLoaded = false; resolve(); }; // degrade to text-only
    img.src = '/icons/logo.svg';
  });

  const buildMixArtwork = (maskCanvas) => {
    mixSrc = document.createElement('canvas');
    mixSrc.width = W;
    mixSrc.height = H;

    const mc = mixSrc.getContext('2d');
    mc.clearRect(0, 0, W, H);
    mc.drawImage(maskCanvas, 0, 0);
    mc.globalCompositeOperation = 'source-in';
    const g = mc.createLinearGradient(W * 0.18, 0, W * 0.82, 0);
    g.addColorStop(0, '#0000FE');
    g.addColorStop(0.55, '#1a25ff');
    g.addColorStop(1, '#0000FE');
    mc.fillStyle = g;
    mc.fillRect(0, 0, W, H);
    mc.globalCompositeOperation = 'source-over';

    stripeH = W < 520 ? 3 : 5;
    stripeCount = Math.ceil(H / stripeH);
    stripeStartX = new Float32Array(stripeCount);
    stripeStartY = new Float32Array(stripeCount);
    stripePhase = new Float32Array(stripeCount);
    stripeAmp = new Float32Array(stripeCount);

    const maxSlide = W < 520 ? 52 : 150;
    const maxLift = W < 520 ? 10 : 24;
    for (let i = 0; i < stripeCount; i++) {
      const band = i / Math.max(1, stripeCount - 1);
      const direction = band < 0.5 ? -1 : 1;
      stripeStartX[i] = direction * (24 + Math.random() * maxSlide) + (Math.random() - 0.5) * maxSlide * 0.5;
      stripeStartY[i] = (Math.random() - 0.5) * maxLift;
      stripePhase[i] = Math.random() * Math.PI * 2;
      stripeAmp[i] = 0.6 + Math.random() * (W < 520 ? 1.4 : 2.6);
    }

    fracturePieces = [];
    const b = mixBounds || { x: W * 0.2, y: H * 0.34, w: W * 0.6, h: H * 0.24 };
    const bx = Math.max(0, Math.floor(b.x));
    const by = Math.max(0, Math.floor(b.y));
    const bw = Math.max(1, Math.min(W - bx, Math.ceil(b.w)));
    const bh = Math.max(1, Math.min(H - by, Math.ceil(b.h)));
    const srcData = mc.getImageData(0, 0, W, H).data;
    const alphaAt = (x, y) => srcData[(Math.max(0, Math.min(H - 1, y | 0)) * W + Math.max(0, Math.min(W - 1, x | 0))) * 4 + 3];
    const areaCount = Math.round((bw * bh) / (W < 520 ? 520 : 2600));
    const pieceCount = Math.max(W < 520 ? 34 : 64, Math.min(W < 520 ? 58 : 104, areaCount));
    let attempts = 0;

    while (fracturePieces.length < pieceCount && attempts < pieceCount * 120) {
      attempts++;
      const cx = bx + Math.random() * bw;
      const cy = by + Math.random() * bh;
      if (alphaAt(cx, cy) < 38) continue;

      const baseSize = W < 520 ? 6.5 : 11;
      const size = baseSize + Math.random() * (W < 520 ? 15 : 30);
      const sides = Math.random() < 0.58 ? 3 : Math.random() < 0.86 ? 4 : 5;
      const angle = Math.random() * Math.PI * 2;
      const pts = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (let p = 0; p < sides; p++) {
        const a = angle + (p / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.36;
        const rx = size * (0.52 + Math.random() * 0.52);
        const ry = size * (0.36 + Math.random() * 0.72);
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;
        pts.push([x, y]);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }

      const pad = 3;
      const sx = Math.max(0, Math.floor(cx + minX - pad));
      const sy = Math.max(0, Math.floor(cy + minY - pad));
      const ex = Math.min(W, Math.ceil(cx + maxX + pad));
      const ey = Math.min(H, Math.ceil(cy + maxY + pad));
      const sw = Math.max(1, ex - sx);
      const sh = Math.max(1, ey - sy);

      fracturePieces.push({
        cx,
        cy,
        sx,
        sy,
        sw,
        sh,
        pts,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * (W < 520 ? 0.34 : 0.42),
        power: 0.72 + Math.random() * 0.9,
      });
    }
  };

  /** Render logo + text to offscreen canvas, sample pixels → particles */
  const buildParticles = () => {
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const oc = off.getContext('2d');

    // --- Layout: Logo icon LEFT of "ABELIX" text, on a single horizontal row ---
    // The logo SVG glyph (a stylised "A"/peak) occupies only the central
    // portion of its 235×216 viewBox: roughly x ∈ [48, 172], y ∈ [62, 166].
    // We treat the visible glyph as the layout-relevant box.
    const SVG_VB_W = 235, SVG_VB_H = 216;
    const GLYPH_X = 48, GLYPH_Y = 62, GLYPH_W = 124, GLYPH_H = 104;

    const targetFontSize = Math.min(W * (W < 520 ? 0.12 : 0.20), H * 0.34, 240);
    const fontFamily = "'Inter Tight', 'Arial Black', sans-serif";
    const maxCompositionW = W * (W < 520 ? 0.55 : 0.86);

    let textFontSize = targetFontSize;
    let textW = 0;
    let glyphRenderW = 0, glyphRenderH = 0; // visible glyph size in px
    let logoBoxW = 0, logoBoxH = 0;          // full SVG drawImage box
    let gap = 0, totalW = 0;

    for (let attempt = 0; attempt < 6; attempt++) {
      oc.font = `900 ${textFontSize}px ${fontFamily}`;
      textW = oc.measureText('ABELIX').width;

      if (logoLoaded) {
        // Glyph height ≈ text cap-height (≈ 0.72 of fontSize).
        glyphRenderH = textFontSize * 0.85;
        // Scale full SVG box accordingly
        logoBoxH = glyphRenderH * (SVG_VB_H / GLYPH_H);
        logoBoxW = logoBoxH * (SVG_VB_W / SVG_VB_H);
        glyphRenderW = logoBoxW * (GLYPH_W / SVG_VB_W);
      } else {
        glyphRenderW = glyphRenderH = logoBoxW = logoBoxH = 0;
      }

      gap = logoLoaded ? Math.round(textFontSize * 0.12) : 0;
      totalW = glyphRenderW + gap + textW;
      if (totalW <= maxCompositionW) break;
      textFontSize *= maxCompositionW / totalW;
    }

    oc.font = `900 ${textFontSize}px ${fontFamily}`;
    oc.textAlign = 'left';
    oc.textBaseline = 'alphabetic';

    // Composition origin: glyph's visible left edge sits at startX
    const startX = (W - totalW) / 2;
    const rowCenterY = H * 0.46;
    const textBaselineY = rowCenterY + textFontSize * 0.34;
    // Logo box is offset so the glyph's visible top-left lands at (startX, glyphTopY)
    const glyphTopY = rowCenterY - glyphRenderH / 2;
    const logoBoxX = startX - logoBoxW * (GLYPH_X / SVG_VB_W);
    const logoBoxY = glyphTopY - logoBoxH * (GLYPH_Y / SVG_VB_H);

    // Draw SVG logo (mask its native colour to white for sampling)
    if (logoLoaded && logoImg) {
      oc.save();
      oc.drawImage(logoImg, logoBoxX, logoBoxY, logoBoxW, logoBoxH);
      oc.globalCompositeOperation = 'source-in';
      oc.fillStyle = '#fff';
      oc.fillRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH);
      oc.globalCompositeOperation = 'source-over';
      oc.restore();
    }

    // Draw "ABELIX" text immediately right of the visible glyph
    oc.fillStyle = '#fff';
    oc.fillText('ABELIX', startX + glyphRenderW + gap, textBaselineY);

    const boundsPad = Math.max(14, textFontSize * 0.1);
    const contentH = Math.max(glyphRenderH, textFontSize * 0.88);
    const boundsX = Math.max(0, startX - boundsPad);
    const boundsY = Math.max(0, rowCenterY - contentH * 0.5 - boundsPad);
    mixBounds = {
      x: boundsX,
      y: boundsY,
      w: Math.min(W - boundsX, totalW + boundsPad * 2),
      h: Math.min(H - boundsY, contentH + boundsPad * 2),
    };

    buildMixArtwork(off);
    if (USE_MIX_REVEAL) {
      count = 1;
      return;
    }

    const imgData = oc.getImageData(0, 0, W, H).data;

    // --- Sand-grain sampling ---
    // Ultra-tight packing: sample every pixel on big screens, emit nearly all.
    const baseGap = W < 520 ? 2 : W < 1100 ? 2 : 1;

    // Build list of valid pixel positions first, then optionally cap.
    // Use Float32 staging buffers to avoid intermediate JS objects.
    const stageCap = 160000;
    const stageX = new Float32Array(stageCap);
    const stageY = new Float32Array(stageCap);
    let stageN = 0;

    for (let y = 0; y < H; y += baseGap) {
      for (let x = 0; x < W; x += baseGap) {
        const a = imgData[(y * W + x) * 4 + 3];
        if (a > 50 && stageN < stageCap) {
          // Emission probability tied to alpha — preserves anti-aliased edges
          // and creates the natural fuzzy halo around glyph contours.
          const emit = a / 255;
          // Near-1 emission for tight sand packing
          if (Math.random() < Math.min(1, emit * 1.05)) {
            stageX[stageN] = x;
            stageY[stageN] = y;
            stageN++;
          }
        }
      }
    }

    // --- Edge dust: extra particles slightly offset from edges ---
    // Detect edge pixels by checking if a sampled pixel has a neighbour with
    // significantly lower alpha; emit a few outward-jittered satellites.
    const EDGE_JITTER = 3.5;
    const edgeStageCap = 50000;
    const edgeX = new Float32Array(edgeStageCap);
    const edgeY = new Float32Array(edgeStageCap);
    let edgeN = 0;

    for (let y = baseGap; y < H - baseGap; y += baseGap) {
      for (let x = baseGap; x < W - baseGap; x += baseGap) {
        const c = imgData[(y * W + x) * 4 + 3];
        if (c < 200) continue;
        const l = imgData[(y * W + (x - baseGap)) * 4 + 3];
        const r = imgData[(y * W + (x + baseGap)) * 4 + 3];
        const t = imgData[((y - baseGap) * W + x) * 4 + 3];
        const b = imgData[((y + baseGap) * W + x) * 4 + 3];
        const minN = Math.min(l, r, t, b);
        if (minN < 100 && edgeN < edgeStageCap - 4) {
          // 3 satellite particles per edge pixel for fuzzy halo
          for (let s = 0; s < 3; s++) {
            edgeX[edgeN] = x + (Math.random() - 0.5) * EDGE_JITTER * 2;
            edgeY[edgeN] = y + (Math.random() - 0.5) * EDGE_JITTER * 2;
            edgeN++;
          }
        }
      }
    }

    const totalN = stageN + edgeN;

    // Performance cap. With render-order trick (edge first, body last) and
    // premultiplied colors, 60K particles render in ~1–2ms via putImageData.
    const MAX_PARTICLES = 60000;
    let n = totalN;
    let keepRatio = 1;
    if (totalN > MAX_PARTICLES) {
      keepRatio = MAX_PARTICLES / totalN;
      n = MAX_PARTICLES;
    }

    count = n;

    // Allocate flat arrays
    px = new Float32Array(n);
    py = new Float32Array(n);
    tx = new Float32Array(n);
    ty = new Float32Array(n);
    vx = new Float32Array(n);
    vy = new Float32Array(n);
    pSize = new Float32Array(n);
    pAlpha = new Float32Array(n);
    pFriction = new Float32Array(n);
    pEase = new Float32Array(n);
    pColor32 = new Uint32Array(n);
    pKick = new Float32Array(n);

    let idx = 0;

    // Helper: write one particle from a target (sx, sy)
    const writeParticle = (sx, sy, isEdge) => {
      tx[idx] = sx;
      ty[idx] = sy;

      // Scatter each grain across the canvas, then let it flow into place.
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.sqrt(Math.random()) * Math.max(W, H) * (W < 520 ? 0.16 : 0.28);
      const sx0 = sx + Math.cos(angle) * dist;
      const sy0 = sy + Math.sin(angle) * dist;
      px[idx] = sx0;
      py[idx] = sy0;

      const dx = sx - sx0;
      const dy = sy - sy0;
      const dlen = Math.hypot(dx, dy) || 1;
      const radial = 6.0 + Math.random() * 3.0;
      const tang = (Math.random() - 0.5) * 0.8;
      vx[idx] = (dx / dlen) * radial + (-dy / dlen) * tang;
      vy[idx] = (dy / dlen) * radial + ( dx / dlen) * tang;

      // Fine sand: most particles tiny, occasional larger grain
      const r = Math.random();
      if (r < 0.88) {
        pSize[idx] = 0.6 + Math.random() * 0.5;   // 0.6–1.1 px (fine sand)
      } else if (r < 0.98) {
        pSize[idx] = 1.1 + Math.random() * 0.6;   // 1.1–1.7 px
      } else {
        pSize[idx] = 1.7 + Math.random() * 0.8;   // rare 1.7–2.5 px grains
      }
      // Body grains are nearly opaque so they paint over edge halo cleanly;
      // edge dust stays light to give the fuzzy aura.
      pAlpha[idx] = isEdge
        ? 0.25 + Math.random() * 0.40
        : 0.85 + Math.random() * 0.15;

      // Sand-like settle: gentle spring + medium friction so the motion is
      // a long, visible glide — not a snap.
      pFriction[idx] = 0.58 + Math.random() * 0.08;
      pEase[idx] = 0.20 + Math.random() * 0.08;

      // Colour mix
      const cr = Math.random();
      let cR, cG, cB;
      if (cr < 0.80) {
        cR = 0; cG = 0; cB = 254;
      } else if (cr < 0.94) {
        cR = 60; cG = 70; cB = 255;
      } else {
        cR = 14; cG = 13; cB = 13;
      }
      // Premultiply against the white background so each particle becomes a
      // single opaque pixel write — no per-pixel alpha blending needed.
      const a = pAlpha[idx];
      const ia = 1 - a;
      const fR = (255 * ia + cR * a) | 0;
      const fG = (255 * ia + cG * a) | 0;
      const fB = (255 * ia + cB * a) | 0;
      // Little-endian byte order in the Uint32 view: 0xAABBGGRR
      pColor32[idx] = (0xFF << 24) | (fB << 16) | (fG << 8) | fR;

      idx++;
    };

    // Edge satellites are written FIRST so that body particles render on
    // top of them in the direct-pixel buffer (last-writer-wins). This keeps
    // glyph interiors crisp while still letting the soft halo show through
    // at the edges.
    for (let i = 0; i < edgeN && idx < n; i++) {
      if (keepRatio < 1 && Math.random() > keepRatio) continue;
      writeParticle(edgeX[i], edgeY[i], true);
    }
    // Body samples last — these overwrite edge dust where they overlap.
    for (let i = 0; i < stageN && idx < n; i++) {
      if (keepRatio < 1 && Math.random() > keepRatio) continue;
      writeParticle(stageX[i], stageY[i], false);
    }

    // Trim count if we wrote fewer than expected (after rejections)
    count = idx;
  };

  // --- Ambient floating dust ---
  // Small, slowly drifting particles that create atmosphere around the text.
  const AMBIENT_COUNT = 50;
  let ambX, ambY, ambVX, ambVY, ambSize, ambAlpha, ambPhase;

  const buildAmbient = () => {
    ambX = new Float32Array(AMBIENT_COUNT);
    ambY = new Float32Array(AMBIENT_COUNT);
    ambVX = new Float32Array(AMBIENT_COUNT);
    ambVY = new Float32Array(AMBIENT_COUNT);
    ambSize = new Float32Array(AMBIENT_COUNT);
    ambAlpha = new Float32Array(AMBIENT_COUNT);
    ambPhase = new Float32Array(AMBIENT_COUNT);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      ambX[i] = Math.random() * W;
      ambY[i] = Math.random() * H;
      ambVX[i] = (Math.random() - 0.5) * 0.3;
      ambVY[i] = (Math.random() - 0.5) * 0.2;
      ambSize[i] = 0.8 + Math.random() * 1.5;
      ambAlpha[i] = 0.06 + Math.random() * 0.14;
      ambPhase[i] = Math.random() * Math.PI * 2;
    }
  };

  const resize = () => {
    // Cap DPR at 1 — the particle look is sand-on-paper, retina sharpness
    // wastes 4× the pixel work for no visual gain. Huge perf win.
    DPR = 1;
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.floor(rect.width));
    H = Math.max(1, Math.floor(rect.height));
    canvas.width = W;
    canvas.height = H;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Allocate the direct-pixel buffer at canvas resolution.
    bufW = W; bufH = H;
    imgBuf = ctx.createImageData(bufW, bufH);
    img32 = new Uint32Array(imgBuf.data.buffer);
    birthTime = 0; // restart assembly on resize — set on next visible frame
    buildParticles();
    buildAmbient();
  };

  const ensureVisibleSize = () => {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(1, Math.floor(rect.width));
    const nextH = Math.max(1, Math.floor(rect.height));
    if (nextW > 1 && nextH > 1 && (nextW !== W || nextH !== H)) {
      resize();
    }
  };

  // --- Pointer tracking ---
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const ny = e.clientY - r.top;
    if (hasMouse) {
      // Smoothed velocity (low-pass)
      mouseVX = mouseVX * 0.7 + (nx - mouseX) * 0.3;
      mouseVY = mouseVY * 0.7 + (ny - mouseY) * 0.3;
      // Clamp so a fast flick can't launch particles off-screen.
      if (mouseVX >  MAX_CURSOR_V) mouseVX =  MAX_CURSOR_V;
      if (mouseVX < -MAX_CURSOR_V) mouseVX = -MAX_CURSOR_V;
      if (mouseVY >  MAX_CURSOR_V) mouseVY =  MAX_CURSOR_V;
      if (mouseVY < -MAX_CURSOR_V) mouseVY = -MAX_CURSOR_V;
    }
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = nx;
    mouseY = ny;
    hasMouse = true;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', () => {
    hasMouse = false;
    mouseX = -9999;
    mouseY = -9999;
    mouseVX = 0;
    mouseVY = 0;
  }, { passive: true });

  const drawMixReveal = (now, introT, introEase) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (!mixSrc || !stripeStartX) return;

    const tSec = (now - birthTime) / 1000;
    const settle = 1 - introEase;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    if (introT < 1) {
      ctx.globalAlpha = reduceMotion ? 1 : Math.min(1, 0.26 + introT * 1.35);
      for (let i = 0; i < stripeCount; i++) {
        const y = i * stripeH;
        const h = Math.min(stripeH, H - y);
        const idleWave = Math.sin(tSec * 5.2 + stripePhase[i]) * stripeAmp[i] * (0.12 + settle * 0.88);
        const dx = stripeStartX[i] * settle + idleWave;
        const dy = stripeStartY[i] * settle;
        ctx.drawImage(mixSrc, 0, y, W, h, dx, y + dy, W, h);
      }

      if (introT > 0.32) {
        ctx.globalAlpha = Math.min(0.72, (introT - 0.32) / 0.68);
        ctx.drawImage(mixSrc, 0, 0);
      }
    } else {
      ctx.globalAlpha = 1;
      ctx.drawImage(mixSrc, 0, 0);
    }

    // ---- Original hover shatter (static fracturePieces) ----
    if (hasMouse && introT > 0.72 && fracturePieces.length) {
      const speed = Math.min(36, Math.hypot(mouseVX, mouseVY));
      const radius = (W < 520 ? 86 : 154) + speed * (W < 520 ? 0.75 : 1.2);
      const hits = [];
      let hitPower = 0;

      for (const piece of fracturePieces) {
        const dx = piece.cx - mouseX;
        const dy = piece.cy - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist >= radius) continue;
        const k = 1 - dist / radius;
        const force = Math.pow(k, 1.72) * (0.94 + Math.sin(tSec * 4.4 + piece.phase) * 0.06);
        hits.push({ piece, dx, dy, dist, force });
        hitPower += force;
      }

      if (hits.length) {
        const active = Math.min(1, hitPower / (W < 520 ? 5 : 8));
        const tracePiece = (piece) => {
          const pts = piece.pts;
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.closePath();
        };

        ctx.globalAlpha = 1;
        ctx.filter = 'none';

        ctx.save();
        const glow = ctx.createRadialGradient(mouseX, mouseY, radius * 0.08, mouseX, mouseY, radius * 0.76);
        glow.addColorStop(0, `rgba(0,0,254,${0.045 * active})`);
        glow.addColorStop(0.58, `rgba(0,0,254,${0.025 * active})`);
        glow.addColorStop(1, 'rgba(0,0,254,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(mouseX - radius, mouseY - radius, radius * 2, radius * 2);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,254,0.2)';
        ctx.lineWidth = W < 520 ? 0.7 : 1;
        for (const hit of hits) {
          const { piece, force } = hit;
          ctx.save();
          ctx.translate(piece.cx, piece.cy);
          ctx.beginPath();
          tracePiece(piece);
          ctx.globalAlpha = Math.min(0.96, 0.3 + force * 0.72);
          ctx.fill();
          ctx.globalAlpha = 0.08 + force * 0.18;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        ctx.save();
        ctx.lineCap = 'square';
        for (const hit of hits) {
          const { piece, dx, dy, dist, force } = hit;
          const nx = dist > 0.001 ? dx / dist : Math.cos(piece.phase);
          const ny = dist > 0.001 ? dy / dist : Math.sin(piece.phase);
          const push = (W < 520 ? 28 : 52) * force * piece.power + speed * 0.42 * force;
          const shimmer = Math.sin(tSec * 5.5 + piece.phase) * (W < 520 ? 1.4 : 2.4) * force;
          const txp = piece.cx + nx * push + mouseVX * 0.42 * force + Math.cos(piece.phase) * shimmer;
          const typ = piece.cy + ny * push + mouseVY * 0.2 * force + Math.sin(piece.phase * 1.7) * shimmer;
          const rotation = piece.spin * force + Math.sin(tSec * 4.2 + piece.phase) * 0.045 * force;

          ctx.save();
          ctx.globalAlpha = 0.12 + force * 0.12;
          ctx.strokeStyle = 'rgba(0,0,254,0.34)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(piece.cx, piece.cy);
          ctx.lineTo(txp, typ);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.translate(txp, typ);
          ctx.rotate(rotation);
          ctx.beginPath();
          tracePiece(piece);
          ctx.clip();
          ctx.globalAlpha = Math.min(1, 0.72 + force * 0.32);
          ctx.shadowColor = `rgba(0,0,254,${0.22 * force})`;
          ctx.shadowBlur = 9 + force * 14;
          ctx.drawImage(
            mixSrc,
            piece.sx,
            piece.sy,
            piece.sw,
            piece.sh,
            piece.sx - piece.cx,
            piece.sy - piece.cy,
            piece.sw,
            piece.sh
          );
          ctx.restore();

          ctx.save();
          ctx.translate(txp, typ);
          ctx.rotate(rotation);
          ctx.beginPath();
          tracePiece(piece);
          ctx.globalAlpha = 0.12 + force * 0.24;
          ctx.strokeStyle = 'rgba(0,0,254,0.48)';
          ctx.lineWidth = W < 520 ? 0.7 : 0.9;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.24 + active * 0.2;
        ctx.strokeStyle = 'rgba(0,0,254,0.46)';
        ctx.fillStyle = 'rgba(0,0,254,0.18)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 13; i++) {
          const a = tSec * 1.7 + i * 2.399;
          const orbit = radius * (0.14 + (i % 6) * 0.055);
          const x = mouseX + Math.cos(a) * orbit + mouseVX * 0.18 * active;
          const y = mouseY + Math.sin(a * 1.13) * orbit * 0.5 + mouseVY * 0.08 * active;
          const s = (W < 520 ? 3.2 : 4.8) + (i % 3) * 1.6;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.sin(tSec + i) * 0.3);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.78, s * 0.6);
          ctx.lineTo(-s * 0.72, s * 0.55);
          ctx.closePath();
          if (i % 2 === 0) ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      mouseVX *= 0.92;
      mouseVY *= 0.92;
    }

    ctx.restore();
  };

  // --- Draw loop ---
  const draw = (now) => {
    if (!pages.home.classList.contains('active')) {
      requestAnimationFrame(draw);
      return;
    }

    ensureVisibleSize();

    // Defer the intro clock until particles have actually been built.
    // loadLogo() is async, so 'count' is 0 for the first few frames; if we
    // started the timer immediately, introEase would burn through with
    // nothing on screen and the assembly would look skipped.
    if (birthTime === 0) {
      if (count === 0) {
        requestAnimationFrame(draw);
        return;
      }
      birthTime = now;
    }

    // Intro envelope: spring strength ramps in immediately and tapers off.
    // ease-out-quart — strong pull from the very first frame so the dust
    // visibly starts flowing the moment the page appears, then settles.
    const elapsed = now - birthTime;
    const introT = reduceMotion ? 1 : Math.min(elapsed / ASSEMBLE_DURATION, 1);
    const introEase = 1 - Math.pow(1 - introT, 4);

    // (Background is filled inside the direct-pixel buffer below.)

    // Decay mouse velocity each frame so the drag pull fades when cursor stops.
    mouseVX *= 0.85;
    mouseVY *= 0.85;

    if (USE_MIX_REVEAL) {
      drawMixReveal(now, introT, introEase);
      requestAnimationFrame(draw);
      return;
    }

    const hr = HOLE_RADIUS;
    const hr2 = hr * hr;
    // Gate the cursor field by intro progress so it can't fight the assembly.
    // While the spring is still ramping up (introEase < 1), the cursor force
    // is proportionally weaker. Once assembled, full strength.
    const cursorGain = introEase * introEase;
    const push = HOLE_PUSH * cursorGain;
    const drag = HOLE_DRAG * cursorGain;
    const swirl = HOLE_SWIRL * cursorGain;
    const kickDecay = KICK_DECAY;
    const kickDamp = KICK_SPRING_DAMP;
    const mx = mouseX;
    const my = mouseY;
    const mvx = mouseVX;
    const mvy = mouseVY;
    const hasM = hasMouse;

    for (let i = 0; i < count; i++) {
      // Decay this particle's "disturbed" state — sand slowly resettles.
      // During intro, pin kick to zero so the cursor can't suppress the
      // spring and freeze the assembly.
      let kick = introEase < 1 ? 0 : pKick[i] * kickDecay;

      // Cursor field: weak radial push, strong directional drag, gentle swirl.
      // Particles "remember" being touched (pKick) so they linger as a trail.
      if (hasM) {
        const dx = mx - px[i];
        const dy = my - py[i];
        const d2 = dx * dx + dy * dy;
        if (d2 < hr2 && d2 > 0.5) {
          const d = Math.sqrt(d2);
          const k = 1 - d / hr;             // 0 at edge, 1 at center
          const k2 = k * k;

          // Refresh kick state — grain is now disturbed.
          if (k > kick) kick = k;

          // Soft radial push (parts the sand)
          const f = push * k2;
          vx[i] -= (dx / d) * f;
          vy[i] -= (dy / d) * f;

          // Mild tangential swirl
          const sw = swirl * k;
          vx[i] += (-dy / d) * sw;
          vy[i] += ( dx / d) * sw;

          // Cursor-drag: grains carried along the cursor's motion (the trail)
          vx[i] += mvx * drag * k;
          vy[i] += mvy * drag * k;
        }
      }

      pKick[i] = kick;

      // Spring toward target. Suppressed while the grain is freshly kicked,
      // so disturbed sand lingers in its displaced position before drifting back.
      const easeI = pEase[i] * introEase * (1 - kick * kickDamp);
      vx[i] += (tx[i] - px[i]) * easeI;
      vy[i] += (ty[i] - py[i]) * easeI;

      // Friction
      vx[i] *= pFriction[i];
      vy[i] *= pFriction[i];

      // Integrate
      px[i] += vx[i];
      py[i] += vy[i];
    }

    // --- Direct-pixel render: single putImageData per frame ---
    // Fill buffer with opaque white, then plant each particle as 1\u20133 pixels.
    // Premultiplied colors mean no per-pixel blending math.
    if (img32) {
      const buf = img32;
      const bw = bufW, bh = bufH;
      buf.fill(BG32);

      for (let i = 0; i < count; i++) {
        const xi = px[i] | 0;
        const yi = py[i] | 0;
        if (xi < 0 || yi < 0 || xi >= bw || yi >= bh) continue;
        const c = pColor32[i];
        const base = yi * bw + xi;
        buf[base] = c;
        // Larger grains: 2\u00d72 block. Skip the fancy 3\u00d73 case \u2014 cost > benefit.
        if (pSize[i] >= 1.4) {
          if (xi + 1 < bw) buf[base + 1] = c;
          if (yi + 1 < bh) {
            buf[base + bw] = c;
            if (xi + 1 < bw) buf[base + bw + 1] = c;
          }
        }
      }

      ctx.putImageData(imgBuf, 0, 0);
    }

    // --- Ambient floating dust (subtle blue tint on white) ---
    const tSec = (now - birthTime) / 1000;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      ambX[i] += ambVX[i] + Math.sin(tSec * 0.3 + ambPhase[i]) * 0.15;
      ambY[i] += ambVY[i] + Math.cos(tSec * 0.2 + ambPhase[i]) * 0.1;
      if (ambX[i] < -10) ambX[i] = W + 10;
      if (ambX[i] > W + 10) ambX[i] = -10;
      if (ambY[i] < -10) ambY[i] = H + 10;
      if (ambY[i] > H + 10) ambY[i] = -10;

      ctx.globalAlpha = ambAlpha[i] * (0.7 + 0.3 * Math.sin(tSec * 0.8 + ambPhase[i]));
      ctx.fillStyle = '#0000FE';
      const s = ambSize[i];
      ctx.beginPath();
      ctx.arc(ambX[i], ambY[i], s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Soft horizontal vignette (white edges)
    const gH = ctx.createLinearGradient(0, 0, W, 0);
    gH.addColorStop(0, 'rgba(255,255,255,0.7)');
    gH.addColorStop(0.18, 'rgba(255,255,255,0)');
    gH.addColorStop(0.82, 'rgba(255,255,255,0)');
    gH.addColorStop(1, 'rgba(255,255,255,0.7)');
    ctx.fillStyle = gH;
    ctx.fillRect(0, 0, W, H);

    const gV = ctx.createLinearGradient(0, 0, 0, H);
    gV.addColorStop(0, 'rgba(255,255,255,0.5)');
    gV.addColorStop(0.2, 'rgba(255,255,255,0)');
    gV.addColorStop(0.8, 'rgba(255,255,255,0)');
    gV.addColorStop(1, 'rgba(255,255,255,0.5)');
    ctx.fillStyle = gV;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  };

  // Load logo, then init
  loadLogo().then(() => {
    resize();
    window.addEventListener('resize', resize, { passive: true });

    if (reduceMotion && !USE_MIX_REVEAL) {
      for (let i = 0; i < count; i++) {
        px[i] = tx[i];
        py[i] = ty[i];
      }
      draw(performance.now() + ASSEMBLE_DURATION);
    } else {
      requestAnimationFrame(draw);
    }
  });
}

