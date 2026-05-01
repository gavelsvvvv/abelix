import 'dotenv/config';
import https from 'https';
import { writeFileSync } from 'fs';

// Polymarket leaderboard endpoint. Hostname is configurable via .env so the
// upstream IP/host isn't hard-coded into the repo. We resolve via DNS by
// default — the legacy IP-pin path is only used if API_IP is set explicitly
// (e.g. when DNS is unreliable in a deployment environment).
const API_HOST = process.env.POLYMARKET_DATA_HOST ?? 'data-api.polymarket.com';
const API_IP = process.env.POLYMARKET_DATA_IP ?? null;
const BATCH_SIZE = Number(process.env.LEADERBOARD_BATCH_SIZE ?? 10);
const DELAY_MS = Number(process.env.LEADERBOARD_DELAY_MS ?? 300);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchProfile = (address) =>
  new Promise((resolve) => {
    const path = `/v1/leaderboard?timePeriod=all&orderBy=VOL&limit=1&offset=0&category=overall&user=${address}`;
    const opts = API_IP
      ? {
          hostname: API_IP,
          port: 443,
          path,
          method: 'GET',
          headers: { Host: API_HOST },
          servername: API_HOST,
        }
      : {
          hostname: API_HOST,
          port: 443,
          path,
          method: 'GET',
        };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0] ?? null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });

const main = async () => {
  console.log('Fetching wallet list from local server…');
  const res = await fetch('http://localhost:3000/api/wallets');
  const wallets = await res.json();
  console.log(`Got ${wallets.length} wallets. Fetching Polymarket profiles…\n`);

  const results = [];
  let done = 0;

  for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
    const batch = wallets.slice(i, i + BATCH_SIZE);
    const profiles = await Promise.all(batch.map((w) => fetchProfile(w.address)));

    for (let j = 0; j < batch.length; j++) {
      const wallet = batch[j];
      const profile = profiles[j];
      results.push({
        rank: done + j + 1,
        address: wallet.address,
        totalRewards: Math.round(wallet.totalUSDC * 100) / 100,
        lastReward: Math.round(wallet.lastTxAmount * 100) / 100,
        payouts: wallet.txCount,
        polymarketRank: profile?.rank ?? '—',
        username: profile?.userName ?? '—',
        volume: profile?.vol ? Math.round(profile.vol) : 0,
        pnl: profile?.pnl ? Math.round(profile.pnl * 100) / 100 : 0,
        profileImage: profile?.profileImage || '',
        xUsername: profile?.xUsername || '',
      });
    }

    done += batch.length;
    process.stdout.write(`\r  ${done}/${wallets.length} wallets processed`);
    if (i + BATCH_SIZE < wallets.length) await sleep(DELAY_MS);
  }

  console.log('\n\nDone! Saving results…');
  writeFileSync('leaderboard.json', JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} entries to leaderboard.json`);

  // Print top 30
  console.log('\n=== TOP 30 BY REWARDS ===\n');
  console.log(
    'Rank'.padEnd(6) +
      'Address'.padEnd(44) +
      'Rewards'.padStart(12) +
      'Volume'.padStart(14) +
      'PnL'.padStart(14) +
      '  Username'
  );
  console.log('─'.repeat(110));
  for (const r of results.slice(0, 30)) {
    console.log(
      String(r.rank).padEnd(6) +
        r.address.padEnd(44) +
        `$${r.totalRewards.toLocaleString()}`.padStart(12) +
        `$${r.volume.toLocaleString()}`.padStart(14) +
        `$${r.pnl.toLocaleString()}`.padStart(14) +
        `  ${r.username}`
    );
  }
};

main().catch(console.error);
