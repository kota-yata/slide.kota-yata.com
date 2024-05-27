<script lang="ts">
  import PDFThumbnail from '$lib/components/PDFThumbnail.svelte';
  import { SLIDES } from '$lib/constants';

  const entries = Object.entries(SLIDES);

</script>

<svelte:head>
  <title>Slide Gallery | KOTA YATAGAI</title>
</svelte:head>

<div class="root">
  <h1>Kota's Slide Gallery</h1>
  <div class="gallery">
    {#each entries as [fileName, _]}
      <div class="thumbnail"><PDFThumbnail {fileName} /></div>
    {/each}
  </div>
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  h1 {
    margin: 5vh 0;
  }
  .gallery {
    width: 95%;
    max-width: 2000px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }
  .thumbnail {
    margin-bottom: 2vh;
  }
</style>
