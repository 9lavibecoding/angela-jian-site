// 檢查腳本共用的結果收集與輸出。
// 任何一條 FAIL 就以 exit code 1 結束，方便串在部署前面當閘門。
const rows = [];

export function section(name) { rows.push({ type: 'section', name }); }
export function pass(name, detail = '') { rows.push({ s: 'PASS', name, detail }); }
export function fail(name, detail = '') { rows.push({ s: 'FAIL', name, detail }); }
export function warn(name, detail = '') { rows.push({ s: 'WARN', name, detail }); }
export function assert(cond, name, detail = '') { cond ? pass(name, detail) : fail(name, detail); }

export function finish(title) {
  const C = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m', off: '\x1b[0m' };
  const MARK = { PASS: '✓', FAIL: '✗', WARN: '!' };
  console.log(`\n${title}`);
  for (const r of rows) {
    if (r.type === 'section') { console.log(`\n  ${r.name}`); continue; }
    console.log(`    ${C[r.s]}${MARK[r.s]}${C.off} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  }
  const n = (s) => rows.filter((r) => r.s === s).length;
  const failed = n('FAIL');
  console.log(`\n  ${n('PASS')} 通過 / ${n('WARN')} 警告 / ${failed} 失敗\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// .env 是選用的：CI 或線上檢查沒有 .env 也要能跑。
export function loadEnv(path = '.env') {
  try { process.loadEnvFile(path); return true; } catch { return false; }
}
