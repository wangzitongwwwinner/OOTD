import { readFile, writeFile } from 'node:fs/promises';

const [outputPath] = process.argv.slice(2);
if (!outputPath) throw new Error('Build output path is required');

const source = await readFile(outputPath, 'utf8');
await writeFile(outputPath, source.replace(/[ \t]+$/gm, ''), 'utf8');
