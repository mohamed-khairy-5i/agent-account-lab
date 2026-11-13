import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeHash, getTrackedFiles } from './verify-manifest.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const manifestPath = resolve(rootDir, 'MANIFEST.sha256');

const trackedFiles = getTrackedFiles(rootDir);
trackedFiles.sort();

const lines: string[] = [];
let count = 0;

for (const relPath of trackedFiles) {
  const absPath = resolve(rootDir, relPath);
  if (!existsSync(absPath)) {
    console.warn(`⚠️ Tracked file not found on disk, skipping: ${relPath}`);
    continue;
  }
  const hash = computeHash(absPath);
  lines.push(`${hash}  ${relPath}`);
  count++;
}

writeFileSync(manifestPath, lines.join('\n') + '\n', 'utf8');
console.log(`✅ MANIFEST.sha256 successfully generated with ${count} tracked files.`);
