import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { layoutProcess } from 'bpmn-auto-layout';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const sources = [
  {
    in: 'models/bpmn/proces1_spustenie.bpmn',
    out: 'models/bpmn/layouted/proces1_spustenie.bpmn'
  },
  {
    in: 'models/bpmn/proces2_monitorovanie.bpmn',
    out: 'models/bpmn/layouted/proces2_monitorovanie.bpmn'
  },
  {
    in: 'models/bpmn/proces3_porucha.bpmn',
    out: 'models/bpmn/layouted/proces3_porucha.bpmn'
  }
];

for (const s of sources) {
  const inPath = path.join(rootDir, s.in);
  const outPath = path.join(rootDir, s.out);
  const xml = await fs.readFile(inPath, 'utf8');
  const layouted = await layoutProcess(xml);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, layouted, 'utf8');
  console.log(`Layouted ${s.in} -> ${s.out}`);
}
