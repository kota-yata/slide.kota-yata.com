import { execFile } from 'node:child_process';
import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { inspectIworkContainer, parseIworkDocument } from '../src/lib/keynote-renderer/index.ts';
import { KeynoteArchives, dechunk, splitObjectsAs, uncompress } from 'keynote-archives';

const execFileAsync = promisify(execFile);
const [, , sourceArgument, slugArgument] = process.argv;

if (!sourceArgument || !slugArgument) {
  console.error('Usage: npm run import:keynote -- <source.key> <slug>');
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugArgument)) {
  throw new Error('The slug must contain only lowercase letters, numbers, and hyphens.');
}

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourcePath = resolve(process.cwd(), sourceArgument);
const keynoteDirectory = join(projectRoot, 'static', 'keynotes');
const outputDirectory = join(keynoteDirectory, slugArgument);
const mediaDirectory = join(outputDirectory, 'media');
const keynoteOutputPath = join(keynoteDirectory, `${slugArgument}.key`);
const previewDirectory = join(projectRoot, 'static', 'previews');
const previewOutputPath = join(previewDirectory, `${slugArgument}.jpg`);
const renderedPdfPath = join(outputDirectory, 'slides.pdf');

await access(sourcePath);
await mkdir(keynoteDirectory, { recursive: true });
await mkdir(previewDirectory, { recursive: true });
await mkdir(mediaDirectory, { recursive: true });
await copyFile(sourcePath, keynoteOutputPath);

const escapeAppleScriptString = (value) => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

async function renderWithKeynote() {
  if (process.platform !== 'darwin') return undefined;

  const script = `
with timeout of 300 seconds
  tell application id "com.apple.Keynote"
    set sourceDocument to open POSIX file "${escapeAppleScriptString(sourcePath)}"
    set outputLines to {}
    repeat with sourcePage from 1 to count of slides of sourceDocument
      set nativePage to slide number of slide sourcePage of sourceDocument
      set end of outputLines to ((sourcePage as text) & ":" & (nativePage as text))
    end repeat
    export sourceDocument to POSIX file "${escapeAppleScriptString(renderedPdfPath)}" as PDF
    close sourceDocument saving no
  end tell
  set AppleScript's text item delimiters to ","
  return outputLines as text
end timeout`;

  try {
    const { stdout } = await execFileAsync('/usr/bin/osascript', ['-e', script], {
      maxBuffer: 1024 * 1024
    });
    const pageBySourcePage = new Map(
      stdout.trim().split(',').flatMap((entry) => {
        const [sourcePage, nativePage] = entry.split(':').map(Number);
        return Number.isInteger(sourcePage) && Number.isInteger(nativePage) && nativePage > 0
          ? [[sourcePage, nativePage]]
          : [];
      })
    );
    return {
      pageBySourcePage,
      pageCount: pageBySourcePage.size,
      path: `/keynotes/${slugArgument}/slides.pdf`
    };
  } catch (error) {
    console.warn('Could not export a layout-faithful PDF with Keynote; the browser renderer will be used as a fallback.');
    return undefined;
  }
}

const keynoteBuffer = await readFile(sourcePath);
const arrayBuffer = keynoteBuffer.buffer.slice(
  keynoteBuffer.byteOffset,
  keynoteBuffer.byteOffset + keynoteBuffer.byteLength
);
const [documentModel, container] = await Promise.all([
  parseIworkDocument(arrayBuffer, 'key'),
  inspectIworkContainer(arrayBuffer)
]);
const nativeRendering = await renderWithKeynote();

const previewEntry = container.zip.file('preview.jpg');
if (previewEntry) {
  await writeFile(previewOutputPath, await previewEntry.async('nodebuffer'));
}

async function parseIwa(name) {
  const entry = container.zip.file(name);
  if (!entry) return [];

  const bytes = await entry.async('uint8array');
  const chunks = [];
  let totalLength = 0;

  for await (const compressedChunk of dechunk(bytes)) {
    const chunk = await uncompress(compressedChunk.data);
    chunks.push(chunk);
    totalLength += chunk.length;
  }

  const uncompressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    uncompressed.set(chunk, offset);
    offset += chunk.length;
  }

  const messages = [];

  for await (const object of splitObjectsAs(uncompressed, KeynoteArchives)) {
    for (const message of object.messages) {
      messages.push({
        identifier: object.identifier?.toString(),
        type: message.info.type,
        data: message.data
      });
    }
  }

  return messages;
}

const documentMessages = await parseIwa('Index/Document.iwa');
const stylesheetMessages = await parseIwa('Index/DocumentStylesheet.iwa');
const presentation = documentMessages.find(({ type }) => type === 2)?.data;
const slideNodes = new Map(
  documentMessages
    .filter(({ type, identifier }) => type === 4 && identifier)
    .map(({ identifier, data }) => [identifier, data])
);
const slideIdentifiers = [];
const visitedNodes = new Set();

function appendSlideNode(reference) {
  const nodeIdentifier = reference?.identifier?.toString();
  if (!nodeIdentifier || visitedNodes.has(nodeIdentifier)) return;
  visitedNodes.add(nodeIdentifier);

  const node = slideNodes.get(nodeIdentifier);
  const slideIdentifier = node?.slide?.identifier?.toString();
  if (slideIdentifier) slideIdentifiers.push(slideIdentifier);
  for (const child of node?.children ?? []) appendSlideNode(child);
}

for (const reference of presentation?.slideTree?.slides ?? []) appendSlideNode(reference);
appendSlideNode(presentation?.slideTree?.rootSlideNode);

const slideIndexByIdentifier = new Map(
  slideIdentifiers.map((identifier, index) => [identifier, index + 1])
);
const listStyleMessages = new Map(
  stylesheetMessages
    .filter(({ type, identifier }) => type === 2023 && identifier)
    .map(({ identifier, data }) => [identifier, data])
);
const dataEntryNames = Object.keys(container.zip.files).filter((name) => name.startsWith('Data/'));

function resolveListStyle(identifier, visited = new Set()) {
  if (!identifier || visited.has(identifier)) return undefined;
  visited.add(identifier);

  const data = listStyleMessages.get(identifier);
  if (!data) return undefined;

  const parentIdentifier = data?.super?.parent?.identifier?.toString();
  const parent = resolveListStyle(parentIdentifier, visited);
  return {
    strings: data.strings?.length ? data.strings : parent?.strings ?? [],
    indents: data.indents?.length ? data.indents : parent?.indents ?? []
  };
}

function activeEntry(entries, characterIndex) {
  return (entries ?? []).reduce(
    (active, entry) => Number(entry.characterIndex ?? 0) <= characterIndex ? entry : active,
    undefined
  );
}

function extractListBlocks(messages, page) {
  return messages.flatMap(({ type, data }) => {
    if (type !== 2001) return [];

    const text = (Array.isArray(data?.text) ? data.text.join('') : String(data?.text ?? ''))
      .replaceAll('\ufffc', '')
      .trim();
    if (!text.includes('\n')) return [];

    let characterIndex = 0;
    const items = text.split('\n').map((line) => {
      const listEntry = activeEntry(data?.tableListStyle?.entries, characterIndex);
      const paragraphEntry = activeEntry(data?.tableParaData?.entries, characterIndex);
      const level = Math.max(0, Number(paragraphEntry?.first ?? 0));
      const listStyle = resolveListStyle(listEntry?.object?.identifier?.toString());
      const marker = listStyle?.strings?.[level] ?? '';
      const indent = Number(listStyle?.indents?.[level] ?? level * 48);
      characterIndex += line.length + 1;
      return { text: line, level, marker, indent };
    });

    return items.some(({ marker }) => marker) ? [{ page, text, items }] : [];
  });
}

function findDataEntry(identifier, extensions) {
  const suffix = new RegExp(`-${identifier}\\.(${extensions.join('|')})$`, 'i');
  return dataEntryNames.find((name) => suffix.test(name));
}

async function copyOrConvertMovie(entryName, identifier) {
  const entry = container.zip.file(entryName);
  if (!entry) return undefined;

  const originalExtension = extname(entryName).toLowerCase();
  const safeBaseName = basename(entryName, originalExtension).replace(/[^a-zA-Z0-9._-]/g, '-');

  if (originalExtension === '.mov' && process.platform === 'darwin') {
    const convertedName = `${safeBaseName}.mp4`;
    const convertedPath = join(mediaDirectory, convertedName);
    try {
      await access(convertedPath);
      return `/keynotes/${slugArgument}/media/${convertedName}`;
    } catch {
      // Convert below when this asset identifier has not been imported yet.
    }
  }

  const originalPath = join(mediaDirectory, `${safeBaseName}${originalExtension}`);
  await writeFile(originalPath, await entry.async('nodebuffer'));

  if (originalExtension === '.mov' && process.platform === 'darwin') {
    const convertedName = `${safeBaseName}.mp4`;
    const convertedPath = join(mediaDirectory, convertedName);
    try {
      await execFileAsync('/usr/bin/avconvert', [
        '--source', originalPath,
        '--preset', 'PresetPassthrough',
        '--output', convertedPath,
        '--replace'
      ]);
      await rm(originalPath);
      return `/keynotes/${slugArgument}/media/${convertedName}`;
    } catch (error) {
      console.warn(`Could not convert movie ${identifier} to MP4; keeping the original MOV file.`);
    }
  }

  return `/keynotes/${slugArgument}/media/${safeBaseName}${originalExtension}`;
}

const media = [];
const lists = [];
for (const slideIdentifier of slideIdentifiers) {
  const preferredName = `Index/Slide-${slideIdentifier}.iwa`;
  const fallbackName = container.zip.file(preferredName) ? preferredName : 'Index/Slide.iwa';
  const messages = await parseIwa(fallbackName);
  const page = slideIndexByIdentifier.get(slideIdentifier);
  if (page) lists.push(...extractListBlocks(messages, page));

  for (const { type, data } of messages) {
    if (type !== 3007) continue;

    const parentIdentifier = data?.super?.parent?.identifier?.toString() ?? slideIdentifier;
    const page = slideIndexByIdentifier.get(parentIdentifier);
    const movieIdentifier = data?.movieData?.identifier?.toString();
    if (!page || !movieIdentifier) continue;

    const movieEntryName = findDataEntry(movieIdentifier, ['mov', 'mp4', 'm4v']);
    if (!movieEntryName) continue;

    const posterIdentifier = data?.posterImageData?.identifier?.toString();
    const posterEntryName = posterIdentifier
      ? findDataEntry(posterIdentifier, ['png', 'jpg', 'jpeg', 'webp'])
      : undefined;
    let poster;

    if (posterEntryName) {
      const posterExtension = extname(posterEntryName).toLowerCase();
      const posterName = `poster-${posterIdentifier}${posterExtension}`;
      const posterEntry = container.zip.file(posterEntryName);
      if (posterEntry) {
        await writeFile(join(mediaDirectory, posterName), await posterEntry.async('nodebuffer'));
        poster = `/keynotes/${slugArgument}/media/${posterName}`;
      }
    }

    const geometry = data?.super?.geometry;
    media.push({
      page,
      src: await copyOrConvertMovie(movieEntryName, movieIdentifier),
      poster,
      x: Number(geometry?.position?.x ?? 0),
      y: Number(geometry?.position?.y ?? 0),
      width: Number(geometry?.size?.width ?? documentModel.scenes[page - 1]?.width ?? 1920),
      height: Number(geometry?.size?.height ?? documentModel.scenes[page - 1]?.height ?? 1080),
      loop: Number(data?.loopOption ?? 0) !== 0,
      muted: Number(data?.volume ?? 1) === 0
    });
  }
}

const remapVisiblePages = (items) => nativeRendering
  ? items.flatMap((item) => {
      const page = nativeRendering.pageBySourcePage.get(item.page);
      return page ? [{ ...item, page }] : [];
    })
  : items;

const visibleMedia = remapVisiblePages(media);
const visibleLists = remapVisiblePages(lists);

const manifest = {
  title: documentModel.title,
  pageCount: nativeRendering?.pageCount ?? documentModel.scenes.length,
  width: Number(presentation?.size?.width ?? documentModel.scenes[0]?.width ?? 1920),
  height: Number(presentation?.size?.height ?? documentModel.scenes[0]?.height ?? 1080),
  renderedPdf: nativeRendering?.path,
  media: visibleMedia,
  lists: visibleLists
};

await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Imported ${manifest.pageCount} visible slides, ${visibleMedia.length} movie placements, and ${visibleLists.length} list blocks from ${sourcePath}`
);
