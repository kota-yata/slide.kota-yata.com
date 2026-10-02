<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let canvas = $state<HTMLCanvasElement>(undefined!);
  let stage: HTMLElement;
  let renderedSlide = $state<HTMLDivElement>(undefined!);
  let keynoteHost = $state<HTMLDivElement>(undefined!);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let loading = $state(true);
  let failure = $state('');
  let pdfDocument: import('pdfjs-dist').PDFDocumentProxy | undefined;
  let loadingTask: import('pdfjs-dist').PDFDocumentLoadingTask | undefined;
  let renderTask: import('pdfjs-dist').RenderTask | undefined;
  let renderGeneration = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;

  interface KeynoteMedia {
    page: number;
    src: string;
    poster?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    loop: boolean;
    muted: boolean;
  }

  interface KeynoteManifest {
    pageCount: number;
    width: number;
    height: number;
    renderedPdf?: string;
    media: KeynoteMedia[];
    lists: Array<{
      page: number;
      text: string;
      items: Array<{
        text: string;
        level: number;
        marker: string;
        indent: number;
      }>;
    }>;
  }

  let keynoteManifest = $state<KeynoteManifest | undefined>();
  let keynoteInstance:
    | { unmount?: () => void; $destroy?: () => void | Promise<void> }
    | undefined;

  function pageFromHash(): number {
    const value = Number(window.location.hash.match(/^#(\d+)$/)?.[1]);
    if (!Number.isInteger(value) || value < 1) return 1;
    return Math.min(value, Math.max(totalPages, 1));
  }

  function updatePageHash(page: number, mode: 'push' | 'replace' = 'push'): void {
    const hash = page === 1 ? '' : `#${page}`;
    if (window.location.hash === hash) return;
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    if (mode === 'replace') window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }

  function initializePageFromHash(): void {
    currentPage = pageFromHash();
    updatePageHash(currentPage, 'replace');
  }

  function fitKeynoteFallback(): void {
    if (!keynoteManifest || !keynoteHost || !stage) return;

    const wrap = keynoteHost.querySelector<HTMLElement>('.iwork-scene-wrap');
    const scene = keynoteHost.querySelector<HTMLElement>('.iwork-scene');
    if (!wrap || !scene) return;

    const availableWidth = Math.max(stage.clientWidth - 24, 1);
    const availableHeight = Math.max(stage.clientHeight - 24, 1);
    const scale = Math.min(
      availableWidth / keynoteManifest.width,
      availableHeight / keynoteManifest.height
    );

    wrap.style.width = `${keynoteManifest.width * scale}px`;
    wrap.style.height = `${keynoteManifest.height * scale}px`;
    scene.style.width = `${keynoteManifest.width}px`;
    scene.style.height = `${keynoteManifest.height}px`;
    scene.style.transform = `scale(${scale})`;
    scene.querySelectorAll('[data-keynote-media]').forEach((element) => element.remove());

    scene.querySelectorAll('.iwork-object-media').forEach((element) => element.remove());

    for (const media of keynoteManifest.media.filter((item) => item.page === currentPage)) {
      const video = document.createElement('video');
      video.dataset.keynoteMedia = 'true';
      video.className = 'keynote-media-overlay';
      video.src = media.src;
      if (media.poster) video.poster = media.poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.loop = media.loop;
      video.muted = media.muted;
      Object.assign(video.style, {
        left: `${media.x}px`,
        top: `${media.y}px`,
        width: `${media.width}px`,
        height: `${media.height}px`
      });
      scene.appendChild(video);
    }
  }

  async function renderPage(): Promise<void> {
    if (data.slide.format === 'keynote' && !pdfDocument) {
      fitKeynoteFallback();
      return;
    }

    if (!pdfDocument || !canvas || !stage || !renderedSlide) return;

    const generation = ++renderGeneration;
    const previousRender = renderTask;
    renderTask = undefined;
    if (previousRender) {
      previousRender.cancel();
      try {
        await previousRender.promise;
      } catch (error) {
        if (!(error instanceof Error) || error.name !== 'RenderingCancelledException') throw error;
      }
    }
    if (generation !== renderGeneration) return;

    const page = await pdfDocument.getPage(currentPage);
    if (generation !== renderGeneration) return;
    const original = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(stage.clientWidth - 24, 1);
    const availableHeight = Math.max(stage.clientHeight - 24, 1);
    const scale = Math.min(availableWidth / original.width, availableHeight / original.height);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Canvas is not available');

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    renderedSlide.style.width = `${Math.floor(viewport.width)}px`;
    renderedSlide.style.height = `${Math.floor(viewport.height)}px`;

    renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
    });

    try {
      await renderTask.promise;
    } catch (error) {
      if (error instanceof Error && error.name !== 'RenderingCancelledException') throw error;
    } finally {
      if (generation === renderGeneration) renderTask = undefined;
    }
  }

  async function goToPage(page: number, updateUrl = true): Promise<void> {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) {
      if (updateUrl) updatePageHash(nextPage);
      return;
    }

    if (data.slide.format === 'keynote' && !pdfDocument) {
      keynoteHost.querySelectorAll('video').forEach((video) => video.pause());
      currentPage = nextPage;
      if (updateUrl) updatePageHash(currentPage);
      keynoteHost.querySelectorAll<HTMLButtonElement>('.iwork-nav button')[nextPage - 1]?.click();
      requestAnimationFrame(fitKeynoteFallback);
      return;
    }

    stage.querySelectorAll('video').forEach((video) => video.pause());
    currentPage = nextPage;
    if (updateUrl) updatePageHash(currentPage);
    await tick();
    await renderPage();
  }

  function handleHashChange(): void {
    if (!totalPages) return;
    const page = pageFromHash();
    updatePageHash(page, 'replace');
    void goToPage(page, false);
  }

  function handleKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'VIDEO'].includes(target.tagName))
    ) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault();
      void goToPage(currentPage + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void goToPage(currentPage - 1);
    }
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => void renderPage(), 100);
    });

    resizeObserver.observe(stage);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    void (async () => {
      try {
        if (data.slide.format === 'keynote') {
          const manifestResponse = await fetch(data.slide.keynoteManifestPath);

          if (!manifestResponse.ok) {
            throw new Error('Could not fetch the Keynote document');
          }

          keynoteManifest = (await manifestResponse.json()) as KeynoteManifest;
          await tick();

          if (keynoteManifest.renderedPdf) {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs',
              import.meta.url
            ).toString();
            loadingTask = pdfjs.getDocument({ url: keynoteManifest.renderedPdf });
            pdfDocument = await loadingTask.promise;
            totalPages = Math.min(keynoteManifest.pageCount, pdfDocument.numPages);
            initializePageFromHash();
            await renderPage();
          } else {
            const [keynoteResponse, renderer] = await Promise.all([
              fetch(data.slide.keynotePath),
              import('../../lib/keynote-renderer/index')
            ]);
            if (!keynoteResponse.ok) throw new Error('Could not fetch the Keynote document');
            totalPages = keynoteManifest.pageCount;
            initializePageFromHash();
            keynoteInstance = (await renderer.renderFileViewerIwork(
              await keynoteResponse.arrayBuffer(),
              keynoteHost,
              'key',
              undefined
            )) as typeof keynoteInstance;
            keynoteHost.querySelectorAll<HTMLButtonElement>('.iwork-nav button')[currentPage - 1]?.click();
            requestAnimationFrame(fitKeynoteFallback);
          }
        } else {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();
          loadingTask = pdfjs.getDocument({ url: data.slide.pdfPath });
          pdfDocument = await loadingTask.promise;
          totalPages = pdfDocument.numPages;
          initializePageFromHash();
          await renderPage();
        }
      } catch (error) {
        console.error(error);
        failure = `${data.slide.format === 'keynote' ? 'Keynote' : 'PDF'}を読み込めませんでした`;
      } finally {
        loading = false;
      }
    })();

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
      renderGeneration += 1;
      renderTask?.cancel();
      void loadingTask?.destroy();
      if (keynoteInstance?.unmount) keynoteInstance.unmount();
      else void keynoteInstance?.$destroy?.();
    };
  });
</script>

<svelte:head>
  <title>{data.slide.title} | Kota's Slide Gallery</title>
  <meta name="description" content={`${data.slide.title}のスライド`} />
</svelte:head>

<main class="viewer">
  <div class="toolbar">
    <a href="/" class="back" aria-label="スライド一覧に戻る">←</a>
    <p title={data.slide.title}>{data.slide.title}</p>
    <span class="counter" aria-live="polite">
      {totalPages ? `${currentPage} / ${totalPages}` : '—'}
    </span>
  </div>

  <section
    class="stage"
    bind:this={stage}
    aria-label="スライドビューア"
    aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"
  >
    {#if loading}
      <p class="status">Loading…</p>
    {:else if failure}
      <div class="status error">
        <p>{failure}</p>
        <a href={data.slide.format === 'pdf' ? data.slide.pdfPath : data.slide.keynotePath}>
          {data.slide.format === 'pdf' ? 'PDF' : 'Keynoteファイル'}を直接開く
        </a>
      </div>
    {/if}
    {#if data.slide.format === 'pdf' || keynoteManifest?.renderedPdf}
      <div
        bind:this={renderedSlide}
        class="rendered-slide"
        class:hidden={loading || Boolean(failure)}
      >
        <canvas bind:this={canvas}></canvas>
        {#if data.slide.format === 'keynote' && keynoteManifest}
          {#each keynoteManifest.media.filter((item) => item.page === currentPage) as media (media.src)}
            <video
              class="keynote-media-overlay"
              src={media.src}
              poster={media.poster}
              controls
              playsinline
              preload="metadata"
              loop={media.loop}
              muted={media.muted}
              style={`left:${media.x / keynoteManifest.width * 100}%;top:${media.y / keynoteManifest.height * 100}%;width:${media.width / keynoteManifest.width * 100}%;height:${media.height / keynoteManifest.height * 100}%`}
            ></video>
          {/each}
        {/if}
      </div>
    {:else}
      <div
        bind:this={keynoteHost}
        class="keynote-host"
        class:hidden={loading || Boolean(failure)}
      ></div>
    {/if}

    <button
      class="nav previous"
      type="button"
      aria-label="前のスライド"
      disabled={currentPage <= 1}
      onclick={() => void goToPage(currentPage - 1)}
    >
      ‹
    </button>
    <button
      class="nav next"
      type="button"
      aria-label="次のスライド"
      disabled={!totalPages || currentPage >= totalPages}
      onclick={() => void goToPage(currentPage + 1)}
    >
      ›
    </button>
  </section>

  <div class="hint" aria-hidden="true">← → / Enter / Space</div>
</main>

<style>
  .viewer {
    position: fixed;
    inset: 0;
    overflow: hidden;
    color: #f7f7f7;
    background: #111;
  }

  .stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .rendered-slide {
    position: relative;
    overflow: hidden;
    flex: none;
    background: white;
    box-shadow: 0 16px 60px rgba(0, 0, 0, 0.38);
  }

  .rendered-slide.hidden {
    visibility: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    background: white;
  }

  .keynote-host {
    width: 100%;
    height: 100%;
  }

  .keynote-host.hidden {
    visibility: hidden;
  }

  :global(.keynote-host .iwork-viewer) {
    display: block !important;
    width: 100%;
    height: 100%;
    background: #111 !important;
  }

  :global(.keynote-host .iwork-nav),
  :global(.keynote-host .iwork-notes) {
    display: none !important;
  }

  :global(.keynote-host .iwork-stage) {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 0 !important;
    overflow: hidden !important;
    background: #111;
  }

  :global(.keynote-host .iwork-scene-wrap) {
    margin: 0 !important;
  }

  :global(.keynote-host .iwork-scene) {
    box-shadow: 0 16px 60px rgba(0, 0, 0, 0.38);
  }

  .keynote-media-overlay,
  :global(.keynote-host .keynote-media-overlay) {
    position: absolute;
    z-index: 100;
    object-fit: cover;
    background: #000;
  }


  .toolbar {
    position: absolute;
    z-index: 3;
    top: 0;
    left: 0;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px 44px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.72), transparent);
    pointer-events: none;
  }

  .toolbar p {
    overflow: hidden;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .back {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    color: white;
    background: rgba(25, 25, 25, 0.72);
    text-decoration: none;
    pointer-events: auto;
  }

  .back:focus-visible,
  .nav:focus-visible {
    outline: 2px solid white;
    outline-offset: 3px;
  }

  .counter {
    min-width: 64px;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .nav {
    position: absolute;
    z-index: 2;
    top: 50%;
    width: 56px;
    height: 88px;
    border: 0;
    color: white;
    background: rgba(0, 0, 0, 0.28);
    font-size: 3rem;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
    transition: background 160ms ease, opacity 160ms ease;
  }

  .nav:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.58);
  }

  .nav:disabled {
    opacity: 0;
    pointer-events: none;
  }

  .previous {
    left: 0;
    border-radius: 0 10px 10px 0;
  }

  .next {
    right: 0;
    border-radius: 10px 0 0 10px;
  }

  .status {
    color: #bdbdbd;
    font-size: 0.9rem;
  }

  .status.error {
    position: relative;
    z-index: 4;
    text-align: center;
  }

  .status.error a {
    color: white;
  }

  .hint {
    position: absolute;
    z-index: 3;
    right: 16px;
    bottom: 14px;
    padding: 6px 9px;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.62);
    background: rgba(0, 0, 0, 0.46);
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    pointer-events: none;
  }

  @media (max-width: 680px) {
    .toolbar {
      padding: 8px 10px 36px;
    }

    .toolbar p {
      font-size: 0.78rem;
    }

    .nav {
      top: auto;
      bottom: 14px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.62);
      font-size: 2.25rem;
      transform: none;
    }

    .previous {
      left: 14px;
    }

    .next {
      right: 14px;
    }

    .hint {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nav {
      transition: none;
    }
  }
</style>
