import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const manifestPath = resolve(rootDir, 'MANIFEST.sha256');

function computeHash(filePath: string): string {
  const isBinary = /\.(gz|png|jpg|jpeg|ico|gif|webp)$/i.test(filePath);
  const fileBuffer = readFileSync(filePath);
  if (isBinary) {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
  // Standardize text files to LF line-endings matching git repo & Linux CI checkouts
  const normalized = fileBuffer.toString('utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(Buffer.from(normalized, 'utf8')).digest('hex');
}

if (!existsSync(manifestPath)) {
  console.error(`❌ MANIFEST.sha256 not found at: ${manifestPath}`);
  process.exit(1);
}

const lines = readFileSync(manifestPath, 'utf8')
  .split('\n')
  .filter(l => l.trim().length > 0);

const updatedLines: string[] = [];
let updatedCount = 0;

for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) continue;
  const originalHash = parts[0];
  const relativePath = parts.slice(1).join(' ');
  const absolutePath = resolve(rootDir, relativePath);

  if (!existsSync(absolutePath)) {
    console.warn(`⚠️ File not found, skipping: ${relativePath}`);
    updatedLines.push(line);
    continue;
  }

  const currentHash = computeHash(absolutePath);
  if (currentHash !== originalHash) {
    updatedCount++;
    console.log(`🔄 Updated: ${relativePath}`);
  }
  updatedLines.push(`${currentHash}  ${relativePath}`);
}

writeFileSync(manifestPath, updatedLines.join('\n') + '\n', 'utf8');
console.log(`✅ MANIFEST.sha256 successfully updated (${updatedCount} files updated, ${updatedLines.length} total).`);
