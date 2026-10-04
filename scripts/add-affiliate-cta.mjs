/**
 * One-shot codemod: inserts the AffiliateCTA component into every en-US page
 * that already carries an InContentAd slot (50 state hubs + 400 salary-amount
 * pages + 3 main US calculator pages = 453 files).
 *
 * - Adds `import AffiliateCTA from '<relative path>';` after the InContentAd import.
 * - Renders `<AffiliateCTA locale="en-US" />` right after the InContentAd block.
 * - Idempotent: files already containing AffiliateCTA are skipped.
 * - The component renders NOTHING until affiliate URLs are configured via
 *   PUBLIC_AFF_* env vars, so this is safe to deploy immediately.
 *
 * Run: node scripts/add-affiliate-cta.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PAGES = join(ROOT, 'src/pages/en-us');
const COMPONENT = join(ROOT, 'src/components/ads/AffiliateCTA.astro');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry === 'index.astro') out.push(p);
  }
  return out;
}

const files = walk(PAGES);
let updated = 0;
let skipped = 0;
const problems = [];

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  if (src.includes('AffiliateCTA')) {
    skipped++;
    continue;
  }
  if (!/^import InContentAd from '[^']+';$/m.test(src)) {
    skipped++;
    problems.push(`${file} — no InContentAd import`);
    continue;
  }
  const usages = src.match(/<InContentAd slotId="[^"]*" \/>/g) ?? [];
  if (usages.length !== 1) {
    skipped++;
    problems.push(`${file} — expected 1 InContentAd usage, found ${usages.length}`);
    continue;
  }

  let rel = relative(dirname(file), COMPONENT).split(sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;

  src = src.replace(
    /^import InContentAd from '[^']+';$/m,
    (m) => `${m}\nimport AffiliateCTA from '${rel}';`,
  );

  const usageBlock = /(<InContentAd slotId="[^"]*" \/>\n    <\/div>)/;
  if (!usageBlock.test(src)) {
    skipped++;
    problems.push(`${file} — InContentAd usage block pattern not matched`);
    continue;
  }
  src = src.replace(
    usageBlock,
    '$1\n\n    <div class="mt-8">\n      <AffiliateCTA locale="en-US" />\n    </div>',
  );

  writeFileSync(file, src);
  updated++;
}

console.log(`updated=${updated} skipped=${skipped} total=${files.length}`);
for (const p of problems) console.log('PROBLEM: ' + p);
