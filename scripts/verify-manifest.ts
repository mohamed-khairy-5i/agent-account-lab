import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const manifestPath = resolve(rootDir, 'MANIFEST.sha256');

function computeHash(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  return createHash('sha256').update(fileBuffer).digest('hex');
}

if (!existsSync(manifestPath)) {
  console.error(`❌ MANIFEST.sha256 not found at: ${manifestPath}`);
  process.exit(1);
}

const lines = readFileSync(manifestPath, 'utf8')
  .split('\n')
  .filter(l => l.trim().length > 0);

let passed = 0;
let failed = 0;

for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) continue;
  const expectedHash = parts[0];
  const relativePath = parts.slice(1).join(' ');
  const absolutePath = resolve(rootDir, relativePath);

  if (!existsSync(absolutePath)) {
    console.error(`❌ MISSING: ${relativePath}`);
    failed++;
    continue;
  }

  const actualHash = computeHash(absolutePath);
  if (actualHash === expectedHash) {
    passed++;
  } else {
    console.error(`❌ MISMATCH: ${relativePath}`);
    console.error(`   Expected: ${expectedHash}`);
    console.error(`   Actual:   ${actualHash}`);
    failed++;
  }
}

console.log(`\n=======================================================`);
console.log(`🔐 MANIFEST.sha256 Verification: ${passed} OK, ${failed} failed.`);
console.log(`=======================================================`);

if (failed > 0) {
  process.exit(1);
}
