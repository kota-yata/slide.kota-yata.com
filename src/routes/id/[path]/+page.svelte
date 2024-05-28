<script lang="ts">
  import type { SlideInterface } from "$lib/constants";
  import { onMount } from "svelte";

  export let data: {
    props: {
      path: string;
      metadata: SlideInterface;
    };
  };

  let width = 0;
  let height = 0;

  onMount(() => {
    // width = window.innerWidth > 300 ? window.innerWidth * 0.5 : 300;
    // height = width * 3 / 4;
    width = window.innerWidth;
    height = window.innerHeight;
  });
</script>

<svelte:head>
  <title>{data.props.metadata.title} | KOTA YATAGAI</title>
</svelte:head>


<iframe title="{data.props.metadata.title}" src="/slides/{data.props.path}.pdf" width="{width}px" height="{height}px"></iframe>
<!-- <div class="root"> -->
  <!-- <div class="meta">
    <h2>{data.props.metadata.title}</h2>
    <div class="description">{data.props.metadata.description}</div>
  </div> -->
<!-- </div> -->

<style>
  /* .root {
    margin-top: 2vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  } */
  /* .meta {
    margin-top: 2vh;
    width: 50vw;
    min-width: 300px;
  } */
  iframe {
    width: 100vw;
    height: 99vh;
    margin: 0;
    padding: 0;
    border: none;
  }
  
</style>
