import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const manifestPath = resolve(rootDir, 'MANIFEST.sha256');

export function computeHash(filePath: string): string {
  const isBinary = /\.(gz|png|jpg|jpeg|ico|gif|webp)$/i.test(filePath);
  const fileBuffer = readFileSync(filePath);
  if (isBinary) {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
  // Standardize text files to LF line-endings matching git repo & Linux CI checkouts
  const normalized = fileBuffer.toString('utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(Buffer.from(normalized, 'utf8')).digest('hex');
}

/**
 * Returns list of tracked repository files subject to manifest integrity.
 * Excludes MANIFEST.sha256 itself (cannot contain its own hash) and ephemeral artifacts.
 */
export function getTrackedFiles(dir = rootDir): string[] {
  try {
    const gitFiles = execSync('git ls-files', { cwd: dir, encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim().replace(/\\/g, '/'))
      .filter(f => f.length > 0 && f !== 'MANIFEST.sha256');
    return gitFiles;
  } catch {
    // Fallback if git is unavailable: scan project files excluding ephemeral folders
    const IGNORED = ['.git', 'node_modules', 'dist', '.env', '.user_uploaded'];
    const files: string[] = [];

    function scan(current: string) {
      for (const item of readdirSync(current)) {
        if (IGNORED.some(ig => item === ig || item.startsWith('.'))) continue;
        const full = resolve(current, item);
        const st = statSync(full);
        if (st.isDirectory()) {
          scan(full);
        } else {
          const rel = relative(dir, full).replace(/\\/g, '/');
          if (rel !== 'MANIFEST.sha256') {
            files.push(rel);
          }
        }
      }
    }
    scan(dir);
    return files;
  }
}

export function verifyManifest(targetManifestPath = manifestPath, baseDir = rootDir) {
  if (!existsSync(targetManifestPath)) {
    return {
      success: false,
      error: `MANIFEST.sha256 not found at: ${targetManifestPath}`,
      passed: 0,
      mismatches: [],
      missingFromDisk: [],
      untrackedInManifest: []
    };
  }

  const lines = readFileSync(targetManifestPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const manifestMap = new Map<string, string>();
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const hash = parts[0];
    const path = parts.slice(1).join(' ').replace(/\\/g, '/');
    manifestMap.set(path, hash);
  }

  const mismatches: { path: string; expected: string; actual: string }[] = [];
  const missingFromDisk: string[] = [];
  let passed = 0;

  // Direction 1: Every entry in MANIFEST exists on disk and matches hash
  for (const [relPath, expectedHash] of manifestMap.entries()) {
    const absPath = resolve(baseDir, relPath);
    if (!existsSync(absPath)) {
      missingFromDisk.push(relPath);
      continue;
    }
    const actualHash = computeHash(absPath);
    if (actualHash === expectedHash) {
      passed++;
    } else {
      mismatches.push({ path: relPath, expected: expectedHash, actual: actualHash });
    }
  }

  // Direction 2: Completeness check - Every tracked repository file must be listed in MANIFEST
  const trackedFiles = getTrackedFiles(baseDir);
  const untrackedInManifest = trackedFiles.filter(f => !manifestMap.has(f));

  const success = mismatches.length === 0 && missingFromDisk.length === 0 && untrackedInManifest.length === 0;

  return {
    success,
    passed,
    mismatches,
    missingFromDisk,
    untrackedInManifest
  };
}

// Direct CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = verifyManifest();

  if (result.mismatches.length > 0) {
    console.error(`\n❌ HASH MISMATCHES (${result.mismatches.length}):`);
    for (const m of result.mismatches) {
      console.error(`  - ${m.path}`);
      console.error(`    Expected: ${m.expected}`);
      console.error(`    Actual:   ${m.actual}`);
    }
  }

  if (result.missingFromDisk.length > 0) {
    console.error(`\n❌ MISSING FROM DISK (${result.missingFromDisk.length}):`);
    for (const p of result.missingFromDisk) {
      console.error(`  - ${p}`);
    }
  }

  if (result.untrackedInManifest.length > 0) {
    console.error(`\n❌ UNTRACKED IN MANIFEST (${result.untrackedInManifest.length}):`);
    for (const p of result.untrackedInManifest) {
      console.error(`  - ${p}`);
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🔐 MANIFEST.sha256 Verification: ${result.passed} OK, ${result.mismatches.length} mismatches, ${result.missingFromDisk.length} missing, ${result.untrackedInManifest.length} untracked.`);
  console.log(`=======================================================`);

  if (!result.success) {
    process.exit(1);
  }
}
