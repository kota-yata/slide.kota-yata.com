<script lang="ts">
  import { SLIDES } from '$lib/constants';
  export let fileName: string;
</script>

<div class="root">
  <a href="/id/{fileName}">
    <img src="/slides/{fileName}.png" alt="thumbnail" />
  </a>
  <p>{SLIDES[fileName].date}</p>
</div>

<style>
  .root {
    width: 30vw;
    max-width: 600px;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  img {
    width: 100%;
    border: var(--border-color) 1px solid;
  }
  p {
    width: 100%;
    color: var(--tertiary-color);
    text-align: right;
    margin: 1px 0;
  }
</style>
