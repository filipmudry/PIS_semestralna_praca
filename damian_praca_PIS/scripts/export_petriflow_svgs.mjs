import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const modelerUrl = 'https://builder.netgrif.cloud/modeler';

const sources = [
  {
    in: 'models/petriflow/proces1_spustenie.xml',
    outSvg: 'schemy/petri/proces1-spustenie.svg',
    outPng: 'schemy/petri/proces1-spustenie.png'
  },
  {
    in: 'models/petriflow/proces2_monitorovanie.xml',
    outSvg: 'schemy/petri/proces2-monitorovanie.svg',
    outPng: 'schemy/petri/proces2-monitorovanie.png'
  },
  {
    in: 'models/petriflow/proces3_porucha.xml',
    outSvg: 'schemy/petri/proces3-porucha.svg',
    outPng: 'schemy/petri/proces3-porucha.png'
  }
];

function resolveFromRoot(relativePath) {
  return path.resolve(rootDir, relativePath);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function exportSvgAndPng(page, inPath, outSvgPath, outPngPath) {
  // Netgrif Builder uses a hidden file input (no stable id).
  await page.waitForSelector('input[type="file"]', { timeout: 60000 });
  const input =
    (await page.$('input[type="file"].hidden-button')) ||
    (await page.$('input[type="file"]'));
  if (!input) {
    throw new Error('File input not found');
  }

  await input.uploadFile(inPath);
  // Give the app a moment to parse and render the imported model.
  await page.waitForSelector('svg', { timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // The page can contain multiple SVGs (icons, etc.). Pick the main canvas SVG.
  const svgIndex = await page.$$eval('svg', (svgs) => {
    const candidates = svgs
      .map((s, idx) => ({
        idx,
        hasGrid: !!s.querySelector('pattern#canvas-grid'),
        hasArcs: !!s.querySelector('#svg_arcs, #arcs'),
        area: s.clientWidth * s.clientHeight
      }))
      .sort(
        (a, b) =>
          Number(b.hasGrid) - Number(a.hasGrid) ||
          Number(b.hasArcs) - Number(a.hasArcs) ||
          b.area - a.area
      );

    const best = candidates[0];
    if (!best) {
      throw new Error('Main canvas SVG not found');
    }
    return best.idx;
  });

  await page.$$eval(
    'svg',
    (svgs, idx) => {
      for (const s of svgs) s.removeAttribute('data-export-canvas');
      const target = svgs[idx];
      if (target) target.setAttribute('data-export-canvas', '1');
    },
    svgIndex
  );

  const svg = await page.$eval('svg[data-export-canvas="1"]', (el) => el.outerHTML);

  await ensureDir(outSvgPath);
  await fs.writeFile(outSvgPath, svg, 'utf8');

  const svgHandle = await page.$('svg[data-export-canvas="1"]');
  if (!svgHandle) {
    throw new Error('Main canvas SVG handle not found');
  }
  await ensureDir(outPngPath);
  await svgHandle.screenshot({ path: outPngPath });
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--ignore-certificate-errors']
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  // Load builder once. Re-navigation may trigger "unsaved changes" dialogs.
  await page.goto(modelerUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (const s of sources) {
    const inPath = resolveFromRoot(s.in);
    const outSvgPath = resolveFromRoot(s.outSvg);
    const outPngPath = resolveFromRoot(s.outPng);
    console.log(`Exporting ${s.in} -> ${s.outSvg}`);
    await exportSvgAndPng(page, inPath, outSvgPath, outPngPath);
  }
} finally {
  await browser.close();
}
