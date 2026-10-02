<script lang="ts">
  import { slides } from '../lib/slides';
</script>

<svelte:head>
  <title>Kota's Slide Gallery</title>
  <meta name="description" content="Kota Yatagaiのスライドギャラリー" />
</svelte:head>

<div class="page">
  <header>
    <p class="eyebrow">KOTA YATAGAI</p>
    <h1>Slide Gallery</h1>
  </header>

  <main aria-label="スライド一覧">
    <div class="gallery">
      {#each slides as slide}
        <a class="card" href="/{slide.slug}/" aria-label={`${slide.title}を開く`}>
          <div class="preview">
            <img src={slide.previewImagePath} alt="" loading="lazy" />
            {#if slide.format === 'keynote'}
              <span class="format">KEY</span>
            {/if}
            <span class="open-mark" aria-hidden="true">↗</span>
          </div>
          <h2>{slide.title}</h2>
        </a>
      {/each}
    </div>
  </main>

  <footer>© {new Date().getFullYear()} Kota Yatagai</footer>
</div>

<style>
  .page {
    width: min(1200px, calc(100% - 40px));
    margin: 0 auto;
    min-height: 100vh;
  }

  header {
    padding: clamp(48px, 8vw, 96px) 0 clamp(32px, 5vw, 64px);
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #696965;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.16em;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.25rem, 6vw, 5rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(28px, 4vw, 56px) clamp(20px, 3vw, 40px);
  }

  .card {
    display: block;
    text-decoration: none;
  }

  .preview {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    background: #deded9;
    border: 1px solid #d5d5d0;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 240ms ease, filter 240ms ease;
  }

  .open-mark {
    position: absolute;
    right: 12px;
    bottom: 12px;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    color: white;
    background: rgba(15, 15, 15, 0.88);
    font-size: 1.1rem;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .format {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 5px 8px;
    border-radius: 4px;
    color: white;
    background: rgba(15, 15, 15, 0.82);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  h2 {
    margin: 14px 0 0;
    font-size: clamp(1rem, 1.8vw, 1.2rem);
    line-height: 1.55;
    letter-spacing: -0.015em;
  }

  .card:hover img,
  .card:focus-visible img {
    transform: scale(1.015);
    filter: brightness(0.93);
  }

  .card:hover .open-mark,
  .card:focus-visible .open-mark {
    opacity: 1;
    transform: translateY(0);
  }

  .card:focus-visible {
    outline: 3px solid #171717;
    outline-offset: 6px;
  }

  footer {
    padding: 72px 0 32px;
    color: #74746f;
    font-size: 0.875rem;
  }

  @media (max-width: 680px) {
    .page {
      width: min(100% - 24px, 1200px);
    }

    header {
      padding-top: 40px;
    }

    .gallery {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .open-mark {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    img,
    .open-mark {
      transition: none;
    }
  }
</style>
