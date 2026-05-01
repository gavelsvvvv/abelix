import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3000;

// Infrastructure constants — required from .env so the contract addresses
// and API endpoints aren't baked into source / shipped to the browser bundle.
// 
// Dual-source support:
// - OLD_REWARD_ADDRESS + OLD_TOKEN_ADDRESS: historical data (USDC.e, before April 28, 2026)
// - NEW_REWARD_ADDRESS + NEW_TOKEN_ADDRESS: new CLOB data (pUSD, after April 28, 2026)
//
// Both pairs are optional but at least one must be configured.

const OLD_REWARD_ADDRESS = process.env.OLD_REWARD_ADDRESS?.toLowerCase();
const OLD_TOKEN_ADDRESS = process.env.OLD_TOKEN_ADDRESS?.toLowerCase();
const NEW_REWARD_ADDRESS = process.env.NEW_REWARD_ADDRESS?.toLowerCase();
const NEW_TOKEN_ADDRESS = process.env.NEW_TOKEN_ADDRESS?.toLowerCase();

// Fallback to legacy single-source config for backwards compatibility
const LEGACY_REWARD_ADDRESS = process.env.REWARD_ADDRESS?.toLowerCase();
const LEGACY_USDC_ADDRESS = process.env.USDC_ADDRESS?.toLowerCase();

const POLYGONSCAN_API = process.env.POLYGONSCAN_API ?? 'https://api.etherscan.io/v2/api';
const POLYMARKET_PROFILE_API = process.env.POLYMARKET_PROFILE_API ?? 'https://gamma-api.polymarket.com/profiles';
const CHAIN_ID = process.env.CHAIN_ID ?? '137';
const API_KEY = process.env.POLYGONSCAN_API_KEY;

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

// Build list of reward sources to fetch
const rewardSources = [];

if (OLD_REWARD_ADDRESS && ADDRESS_RE.test(OLD_REWARD_ADDRESS) && 
    OLD_TOKEN_ADDRESS && ADDRESS_RE.test(OLD_TOKEN_ADDRESS)) {
  rewardSources.push({
    name: 'OLD (USDC.e)',
    rewardAddress: OLD_REWARD_ADDRESS,
    tokenAddress: OLD_TOKEN_ADDRESS,
    decimals: 6,
  });
}

if (NEW_REWARD_ADDRESS && ADDRESS_RE.test(NEW_REWARD_ADDRESS) && 
    NEW_TOKEN_ADDRESS && ADDRESS_RE.test(NEW_TOKEN_ADDRESS)) {
  rewardSources.push({
    name: 'NEW (pUSD)',
    rewardAddress: NEW_REWARD_ADDRESS,
    tokenAddress: NEW_TOKEN_ADDRESS,
    decimals: 6,
  });
}

// Fallback: use legacy config if no dual-source configured
if (rewardSources.length === 0 && LEGACY_REWARD_ADDRESS && LEGACY_USDC_ADDRESS) {
  if (ADDRESS_RE.test(LEGACY_REWARD_ADDRESS) && ADDRESS_RE.test(LEGACY_USDC_ADDRESS)) {
    rewardSources.push({
      name: 'LEGACY',
      rewardAddress: LEGACY_REWARD_ADDRESS,
      tokenAddress: LEGACY_USDC_ADDRESS,
      decimals: 6,
    });
  }
}

const missingEnv = [];
if (!API_KEY) missingEnv.push('POLYGONSCAN_API_KEY');
if (rewardSources.length === 0) {
  missingEnv.push('No valid reward sources configured. Set either OLD_REWARD_ADDRESS+OLD_TOKEN_ADDRESS, NEW_REWARD_ADDRESS+NEW_TOKEN_ADDRESS, or REWARD_ADDRESS+USDC_ADDRESS');
}
if (missingEnv.length) {
  console.error(`FATAL: ${missingEnv.join('; ')}`);
  console.error('See .env.example for the required keys.');
  process.exit(1);
}

console.log(`Configured ${rewardSources.length} reward source(s):`);
for (const src of rewardSources) {
  console.log(`  - ${src.name}: ${src.rewardAddress} → token ${src.tokenAddress}`);
}

// Blacklist: team/internal wallets to exclude from public leaderboard
// Add addresses in lowercase
const WALLET_BLACKLIST = new Set([
  '0x2b7a4a818f0fd48cd419dfc81daa20c08429acce', // Team wallet (large $1M+ transactions)
].map(a => a.toLowerCase()));

console.log(`Blacklist: ${WALLET_BLACKLIST.size} wallet(s) excluded from leaderboard`);

const PAGE_SIZE = 10000;
const FETCH_DELAY_MS = 200;
const CACHE_REFRESH_MS = 30 * 60 * 1000;
const PROFILE_TTL_MS = 60 * 60 * 1000;

/** @type {Map<string, { totalUSDC: number, lastTxAmount: number, lastTxHash: string, lastTxDate: string, txCount: number }>} */
let walletCache = new Map();

/** @type {Map<string, Map<string, number>>} address -> ('YYYY-MM-DD' -> amount) */
let dailyCache = new Map();

/** @type {Map<string, { data: object, fetchedAt: number }>} */
const profileCache = new Map();

let cacheReady = false;

/** @type {Map<string, string>} address -> username */
const usernameMap = new Map();
/** @type {Map<string, string>} address -> xUsername */
const xUsernameMap = new Map();

const loadUsernames = () => {
  const filePath = join(__dirname, 'leaderboard.json');
  if (!existsSync(filePath)) return;
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    for (const entry of data) {
      if (entry.address && entry.username) {
        usernameMap.set(entry.address.toLowerCase(), entry.username);
      }
      if (entry.address && entry.xUsername) {
        xUsernameMap.set(entry.address.toLowerCase(), entry.xUsername);
      }
    }
    console.log(`Loaded ${usernameMap.size} usernames from leaderboard.json`);
  } catch (err) {
    console.error('Failed to load leaderboard.json:', err.message);
  }
};

loadUsernames();

// --------------- Data fetching ---------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchBatch = async (rewardAddress, tokenAddress, startBlock) => {
  const params = new URLSearchParams({
    chainid: CHAIN_ID,
    module: 'account',
    action: 'tokentx',
    address: rewardAddress,
    contractaddress: tokenAddress,
    apikey: API_KEY,
    page: '1',
    offset: String(PAGE_SIZE),
    startblock: String(startBlock),
    endblock: '99999999',
    sort: 'asc',
  });

  const url = `${POLYGONSCAN_API}?${params}`;
  console.log(`    Fetching: ${POLYGONSCAN_API} (block ${startBlock}+)`);
  
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`    API error ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`PolygonScan responded with status ${res.status}`);
  }
  const json = await res.json();

  if (json.status !== '1' || !Array.isArray(json.result)) {
    const msg = json.message || json.result || 'Unknown error';
    console.log(`    API response: status=${json.status}, message=${msg}`);
    if (String(msg) === 'No transactions found') return [];
    throw new Error(`PolygonScan API error: ${msg}`);
  }
  console.log(`    Got ${json.result.length} transactions`);
  return json.result;
};

const fetchTransactionsForSource = async (source) => {
  const allTxs = [];
  let startBlock = 0;

  console.log(`  Fetching from ${source.name}...`);

  while (true) {
    const results = await fetchBatch(source.rewardAddress, source.tokenAddress, startBlock);
    
    // Tag transactions with source info for later processing
    for (const tx of results) {
      tx._source = source.name;
      tx._rewardAddress = source.rewardAddress;
      tx._decimals = source.decimals;
    }
    
    allTxs.push(...results);

    if (results.length < PAGE_SIZE) break;

    const lastBlock = Number(results[results.length - 1].blockNumber);
    startBlock = lastBlock + 1;
    await sleep(FETCH_DELAY_MS);
  }

  console.log(`  ${source.name}: ${allTxs.length} transactions`);
  return allTxs;
};

const fetchAllTransactions = async () => {
  const allTxs = [];

  for (const source of rewardSources) {
    const sourceTxs = await fetchTransactionsForSource(source);
    allTxs.push(...sourceTxs);
    
    // Small delay between sources to avoid rate limiting
    if (rewardSources.indexOf(source) < rewardSources.length - 1) {
      await sleep(FETCH_DELAY_MS * 2);
    }
  }

  // Sort all transactions by timestamp for correct chronological order
  allTxs.sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));

  return allTxs;
};

const buildCache = (txs) => {
  const map = new Map();
  const daily = new Map();

  // Build set of all valid reward addresses for filtering
  const rewardAddresses = new Set(rewardSources.map(s => s.rewardAddress));

  for (const tx of txs) {
    const fromLower = tx.from.toLowerCase();
    
    // Only process outgoing transactions from one of our reward addresses
    if (!rewardAddresses.has(fromLower)) continue;

    const rawValue = Number(tx.value);
    const rawTimestamp = Number(tx.timeStamp);
    if (!Number.isFinite(rawValue) || !Number.isFinite(rawTimestamp)) continue;

    const to = tx.to.toLowerCase();
    const decimals = tx._decimals ?? 6;
    const amount = rawValue / Math.pow(10, decimals);
    const dateObj = new Date(rawTimestamp * 1000);
    const date = dateObj.toISOString();
    const dayKey = date.slice(0, 10); // YYYY-MM-DD (UTC)
    const source = tx._source ?? 'UNKNOWN';

    // Daily aggregation with source info
    let dayMap = daily.get(to);
    if (!dayMap) { dayMap = new Map(); daily.set(to, dayMap); }
    
    // Store daily data with source breakdown
    const dayEntry = dayMap.get(dayKey) ?? { total: 0, sources: {} };
    dayEntry.total += amount;
    dayEntry.sources[source] = (dayEntry.sources[source] ?? 0) + amount;
    dayMap.set(dayKey, dayEntry);

    // Wallet totals
    const existing = map.get(to);
    if (existing) {
      existing.totalUSDC += amount;
      existing.txCount += 1;
      if (date > existing.lastTxDate) {
        existing.lastTxAmount = amount;
        existing.lastTxHash = tx.hash;
        existing.lastTxDate = date;
        existing.lastSource = source;
      }
    } else {
      map.set(to, {
        totalUSDC: amount,
        lastTxAmount: amount,
        lastTxHash: tx.hash,
        lastTxDate: date,
        txCount: 1,
        lastSource: source,
      });
    }
  }

  return { map, daily };
};

let lastError = null;
let lastRefresh = null;

const refreshCache = async () => {
  try {
    console.log('Refreshing transaction cache…');
    const txs = await fetchAllTransactions();
    console.log(`Fetched ${txs.length} total transactions`);
    const newCache = buildCache(txs);
    walletCache = newCache.map;
    dailyCache = newCache.daily;
    cacheReady = true;
    lastRefresh = new Date().toISOString();
    lastError = null;
    console.log(`Cache refreshed: ${walletCache.size} wallets from ${txs.length} transactions`);
  } catch (err) {
    lastError = err.message;
    console.error('Cache refresh failed:', err.message);
    console.error('Full error:', err);
    if (!cacheReady) {
      console.error('No cached data available — retrying in 30 seconds');
      setTimeout(refreshCache, 30_000);
    }
  }
};

// --------------- Middleware ---------------

app.use(express.static(join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

// --------------- Opaque session-bound API ---------------
// Endpoints are intentionally short and non-descriptive. Responses are XOR-
// encrypted with a key derived from the per-session token. This is a casual
// obfuscation layer — it prevents non-experts from reading the data shape,
// the wallet list, or the source of the referral data via DevTools/network.

const PEPPER = 'a8x.k3y.v1.r3w';
const TOKEN_TTL_MS = 30 * 60 * 1000;
/** @type {Map<string, number>} token -> expiry ms */
const sessionTokens = new Map();

const purgeTokens = () => {
  const now = Date.now();
  for (const [t, exp] of sessionTokens) {
    if (exp < now) sessionTokens.delete(t);
  }
};
setInterval(purgeTokens, 60_000).unref?.();

const deriveKey = (token) =>
  crypto.createHash('sha256').update(`${PEPPER}|${token}`).digest();

const xorEncode = (plaintext, key) => {
  const buf = Buffer.from(plaintext, 'utf8');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out.toString('base64');
};

const requireToken = (req) => {
  const t = req.query.t;
  if (typeof t !== 'string' || t.length !== 32) return null;
  const exp = sessionTokens.get(t);
  if (!exp || exp < Date.now()) return null;
  return t;
};

const sendEnc = (res, token, payload) => {
  const key = deriveKey(token);
  res.setHeader('Cache-Control', 'no-store');
  res.type('text/plain').send(xorEncode(JSON.stringify(payload), key));
};

// Hand out a session token. Key is never sent — derived deterministically
// on both sides from the token + a pepper baked into both bundles.
app.get('/_/k', (_req, res) => {
  const token = crypto.randomBytes(16).toString('hex');
  sessionTokens.set(token, Date.now() + TOKEN_TTL_MS);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ t: token, e: TOKEN_TTL_MS });
});

// Status endpoint for debugging
app.get('/_/status', (_req, res) => {
  res.json({
    cacheReady,
    walletCount: walletCache.size,
    lastRefresh,
    lastError,
    sources: rewardSources.map(s => ({ name: s.name, address: s.rewardAddress })),
    apiKeyPresent: !!API_KEY,
    apiKeyPrefix: API_KEY ? API_KEY.slice(0, 8) + '...' : null,
  });
});

// Encrypted leaderboard
app.get('/_/d', (req, res) => {
  const token = requireToken(req);
  if (!token) return res.status(401).end();
  if (!cacheReady) return res.status(503).end();

  const wallets = [...walletCache.entries()]
    .filter(([address, data]) => {
      // Exclude blacklisted wallets (team/internal)
      if (WALLET_BLACKLIST.has(address)) return false;
      // Exclude wallets with single transactions > $500k (likely team payouts)
      if (data.lastTxAmount > 500_000) return false;
      return true;
    })
    .map(([address, data]) => ({
      a: address,
      t: data.totalUSDC,
      l: data.lastTxAmount,
      h: data.lastTxHash,
      d: data.lastTxDate,
      c: data.txCount,
      u: usernameMap.get(address) ?? null,
      x: xUsernameMap.get(address) ?? null,
    }))
    .sort((a, b) => b.t - a.t);

  sendEnc(res, token, wallets);
});

// Encrypted suggestions
app.get('/_/s', (req, res) => {
  const token = requireToken(req);
  if (!token) return res.status(401).end();

  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (!q || q.length < 2 || !cacheReady) return sendEnc(res, token, []);

  const seen = new Set();
  const results = [];
  const push = (address) => {
    if (seen.has(address) || results.length >= 8) return;
    seen.add(address);
    const w = walletCache.get(address);
    results.push({
      u: usernameMap.get(address) ?? null,
      x: xUsernameMap.get(address) ?? null,
      a: address,
      t: w?.totalUSDC ?? 0,
    });
  };
  for (const [address, username] of usernameMap) {
    if (results.length >= 8) break;
    if (username.toLowerCase().includes(q)) push(address);
  }
  if (results.length < 8) {
    for (const [address, xUser] of xUsernameMap) {
      if (results.length >= 8) break;
      if (xUser.toLowerCase().includes(q)) push(address);
    }
  }
  if (q.startsWith('0x') && results.length < 8) {
    for (const [address] of walletCache) {
      if (results.length >= 8) break;
      if (address.startsWith(q)) push(address);
    }
  }
  sendEnc(res, token, results);
});

// Encrypted per-wallet day-history (PNL calendar source)
// Now includes source breakdown for old vs new rewards
app.get('/_/h/:a', (req, res) => {
  const token = requireToken(req);
  if (!token) return res.status(401).end();
  if (!cacheReady) return res.status(503).end();

  const address = req.params.a?.trim().toLowerCase();
  if (!address || !ADDRESS_RE.test(address)) return res.status(400).end();

  const dayMap = dailyCache.get(address);
  if (!dayMap) return sendEnc(res, token, { a: address, d: [], t: 0, sources: rewardSources.map(s => s.name) });

  const days = [...dayMap.entries()]
    .map(([date, entry]) => ({
      k: date,
      v: entry.total,
      s: entry.sources, // source breakdown: { 'OLD (USDC.e)': 5.2, 'NEW (pUSD)': 3.1 }
    }))
    .sort((a, b) => (a.k < b.k ? -1 : 1));
  
  const total = days.reduce((s, d) => s + d.v, 0);
  
  sendEnc(res, token, { 
    a: address, 
    d: days, 
    t: total,
    sources: rewardSources.map(s => s.name),
  });
});

// Block legacy descriptive endpoints so casual scraping returns nothing.
app.all(['/api/wallets', '/api/search', '/api/suggest', '/api/history/:a', '/api/profile/:a'],
  (_req, res) => res.status(404).end());

// SPA fallback: any GET that wasn't matched above and that isn't an API/asset
// request gets index.html, so the client-side router can render the requested
// route (including the in-app 404 page for unknown paths). The status code is
// set to 404 for unknown paths so crawlers see the correct signal.
app.get(/.*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  // Don't intercept API / opaque-data routes — those handle their own status.
  if (req.path.startsWith('/api/') || req.path.startsWith('/_/')) return next();
  // Static assets are served above; if we got here, the file wasn't found.
  // Treat anything with a file extension as a missing asset (return 404 raw)
  // and anything without an extension as a SPA route.
  if (/\.[a-z0-9]{2,5}$/i.test(req.path)) return res.status(404).end();

  const knownRoute = req.path === '/' ||
    /^\/(home|rewards)\/?$/i.test(req.path) ||
    /^\/rewards\/0x[a-fA-F0-9]{40}\/?$/i.test(req.path);

  res.status(knownRoute ? 200 : 404)
     .sendFile(join(__dirname, 'public', 'index.html'));
});

// --------------- Start ---------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  refreshCache();
  setInterval(refreshCache, CACHE_REFRESH_MS);
});
