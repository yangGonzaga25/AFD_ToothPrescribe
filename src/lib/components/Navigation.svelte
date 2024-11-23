<script>
	export let open = false;
</script>

<button
	aria-label="menu-nav-button"
	class="text-gray-500 hover:text-gray-700 cursor-pointer border-none focus:outline-none"
	class:open
	on:click={() => (open = !open)}
>
	<svg width="32" height="24">
		<line id="top" x1="0" y1="2" x2="32" y2="2" />
		<line id="middle" x1="0" y1="12" x2="32" y2="12" />
		<line id="bottom" x1="0" y1="22" x2="32" y2="22" />
	</svg>
</button>

<style>
	/* Button Styling */
	button {
		color: white;
		background: transparent;
		
		border: none;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 20;
		padding: 0.5rem;
		transition: background-color 0.3s ease-in-out;
	}
	.logo img {
		padding-top: 8px;
		max-height: 3rem; /* Adjust for smaller screens */
	}
	/* Icon Sizing */
	svg {
		min-height: 2.4rem;
		width: 3.2rem;
		transition: transform 0.3s ease-in-out;
	}

	svg line {
		stroke: currentColor;
		stroke-width: 0.3rem;
		transition: transform 0.3s ease-in-out;
	}

	/* Open/Close Transform */
	.open svg {
		transform: scale(0.7);
	}

	.open #top {
		transform: translate(0.6rem, 0) rotate(45deg);
	}

	.open #middle {
		stroke-dasharray: 0;
		stroke-dashoffset: 0;
		animation: fade 1s ease-in alternate forwards;
	}

	@keyframes fade {
		to {
			stroke-dashoffset: 1000;
			stroke-dasharray: 1000;
		}
	}

	.open #bottom {
		transform: translate(-1.2rem, 0.9rem) rotate(-45deg);
	}

	/* Background Color when Collapsible */
	

	/* Responsive Adjustments */
	@media (max-width: 768px) {
		button {
			padding: 0.4rem;
		}

		svg {
			min-height: 2rem;
			width: 2.8rem;
		}

		svg line {
			stroke-width: 0.2rem;
		}
	}

	@media (max-width: 480px) {
		button {
			padding: 0.3rem;
		}

		svg {
			min-height: 1.8rem;
			width: 2.4rem;
		}

		svg line {
			stroke-width: 0.18rem;
		}
	}
</style>
