import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseIworkDocument } from '../src/lib/keynote-renderer/index.ts';

const keynote = await readFile('static/keynotes/moq-meetup-japan.key');
const buffer = keynote.buffer.slice(keynote.byteOffset, keynote.byteOffset + keynote.byteLength);
const document = await parseIworkDocument(buffer, 'key');

assert.equal(document.scenes.length, 23);
assert.equal(document.scenes[1]?.blocks.find((block) => block.text.startsWith('Introduction'))?.paragraphs?.length, 6);
assert.deepEqual(
  document.scenes[1]?.blocks.find((block) => block.text.startsWith('Introduction'))?.paragraphs?.map((paragraph) => paragraph.level),
  [0, 0, 0, 0, 1, 1]
);
assert.equal(
  document.scenes.flatMap((scene) => scene.objects).filter((object) => object.kind === 'media').length,
  10
);
assert.ok(document.scenes.every((scene) => scene.background));
assert.ok(
  document.scenes
    .flatMap((scene) => scene.blocks)
    .flatMap((block) => block.paragraphs ?? [])
    .flatMap((paragraph) => paragraph.runs)
    .some((run) => run.fontSize || run.color || run.bold || run.italic)
);

console.log('Local Keynote renderer checks passed.');
