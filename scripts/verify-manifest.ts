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
    const gitFiles = execSync('git ls-files --cached --others --exclude-standard', { cwd: dir, encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim().replace(/\\/g, '/'))
      .filter(f => f.length > 0 && f !== 'MANIFEST.sha256');
    return gitFiles;
  } catch {
    // Fallback if git is unavailable: scan project files excluding known build/vcs folders
    const IGNORED_NAMES = new Set(['.git', 'node_modules', 'dist', '.env', '.user_uploaded', '.DS_Store', 'Thumbs.db']);
    const files: string[] = [];

    function scan(current: string) {
      for (const item of readdirSync(current)) {
        if (IGNORED_NAMES.has(item)) continue;
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
      mismatches: [] as { path: string; expected: string; actual: string }[],
      missingFromDisk: [] as string[],
      untrackedInManifest: [] as string[],
      untrackedExtraInManifest: [] as string[],
      duplicatePaths: [] as string[],
      invalidFormatLines: [] as string[]
    };
  }

  const lines = readFileSync(targetManifestPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const SHA256_LINE_REGEX = /^[a-f0-9]{64}\s\s?.+$/i;
  const invalidFormatLines: string[] = [];
  const duplicatePaths: string[] = [];
  const manifestMap = new Map<string, string>();

  for (const line of lines) {
    if (!SHA256_LINE_REGEX.test(line)) {
      invalidFormatLines.push(line);
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const hash = parts[0];
    const path = parts.slice(1).join(' ').replace(/\\/g, '/');
    if (manifestMap.has(path)) {
      duplicatePaths.push(path);
    }
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
  const trackedSet = new Set(trackedFiles);
  const untrackedInManifest = trackedFiles.filter(f => !manifestMap.has(f));
  const untrackedExtraInManifest = Array.from(manifestMap.keys()).filter(f => !trackedSet.has(f));

  const success = mismatches.length === 0 &&
    missingFromDisk.length === 0 &&
    untrackedInManifest.length === 0 &&
    untrackedExtraInManifest.length === 0 &&
    duplicatePaths.length === 0 &&
    invalidFormatLines.length === 0;

  return {
    success,
    passed,
    mismatches,
    missingFromDisk,
    untrackedInManifest,
    untrackedExtraInManifest,
    duplicatePaths,
    invalidFormatLines
  };
}

// Direct CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = verifyManifest();

  if (result.invalidFormatLines.length > 0) {
    console.error(`\n❌ INVALID MANIFEST FORMAT LINES (${result.invalidFormatLines.length}):`);
    for (const l of result.invalidFormatLines) {
      console.error(`  - "${l}"`);
    }
  }

  if (result.duplicatePaths.length > 0) {
    console.error(`\n❌ DUPLICATE PATHS IN MANIFEST (${result.duplicatePaths.length}):`);
    for (const p of result.duplicatePaths) {
      console.error(`  - ${p}`);
    }
  }

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

  if (result.untrackedExtraInManifest.length > 0) {
    console.error(`\n❌ EXTRA ORPHANED ENTRIES IN MANIFEST (${result.untrackedExtraInManifest.length}):`);
    for (const p of result.untrackedExtraInManifest) {
      console.error(`  - ${p}`);
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🔐 MANIFEST.sha256 Verification: ${result.passed} OK, ${result.mismatches.length} mismatches, ${result.missingFromDisk.length} missing, ${result.untrackedInManifest.length} untracked, ${result.untrackedExtraInManifest.length} extra.`);
  console.log(`=======================================================`);

  if (!result.success) {
    process.exit(1);
  }
}
