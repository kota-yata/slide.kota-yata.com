<script>
	import './styles.css';
</script>

<div class="app">
	<main>
		<slot />
	</main>

	<footer>
		<p>@ 2024 <a href="https://kota-yata.com">Kota Yatagai</a></p>
	</footer>
</div>

<style style="css">
	.app {
		width: 100vw;
		min-height: 100vh;
		margin: 0;
		padding: 0;
	}

	main {
		margin: 0;
		padding: 0;
		width: 100%;
	}

	footer {
		color: var(--tertiary-color);
		width: 100vw;
		text-align: center;
		bottom: 0;
	}
	footer > p > a {
		color: var(--tertiary-color);
	}
</style>
