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
    width = window.innerWidth > 300 ? window.innerWidth * 0.5 : 300;
    height = width * 3 / 4;
  });
</script>

<svelte:head>
  <title>{data.props.metadata.title} | KOTA YATAGAI</title>
</svelte:head>

<div>
  <h1>{data.props.metadata.title}</h1>
  <iframe title="{data.props.metadata.title}" src="/slides/{data.props.path}.pdf" width="{width}px" height="{height}px"></iframe>
</div>
