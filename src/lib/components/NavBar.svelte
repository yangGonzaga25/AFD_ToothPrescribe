<script lang="ts">
	import Nav from './Navigation.svelte';
	import routes from '$lib/NavRoutes';
	let opened = false;
	export let segment: string;
</script>
<header class={opened ? 'NavBar open' : 'NavBar'}>
	<div class="innerContainer">
		<div class="logo">
			<img src="/images/logo.png" alt="Tanya Grace Gonzaga" />
		</div>
		<div class="nav">
			<Nav bind:open={opened} />
		</div>
		<div class="buttons">
			{#each routes as route}
				<a class={`button ${segment === route.href ? 'selected' : ''}`} href={route.href}
					>{route.label}</a
				>
			{/each}
		</div>
	</div>
	<div class="responsiveButtons buttons">
		{#each routes as route}
			<a class={`button ${segment === route.href ? 'selected' : ''}`} href={route.href}
				>{route.label}</a
			>
		{/each}
	</div>
</header>
<main class="content" style:margin-top={opened ? '280px' : '75px'}>
	<!-- Main content goes here -->
</main>


<style>
	.content {
    transition: margin-top 0.2s ease; /* Smooth transition */
}
	
	/* Solid black background with full width */
	/* Add a glow effect to the header */
.NavBar {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 20px;
	height: 75px;
	background-color: rgba(0, 0, 0, 0.681); /* Solid black background */
	color: white;
	overflow: hidden;
	transition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1000; /* Ensuring it stays above other content */
	box-shadow: 0 0 15px rgba(8, 182, 226, 0.7), 0 0 30px rgba(8, 193, 226, 0.5); /* Glow effect */
	animation: glowPulse 2s infinite alternate;
}

@keyframes glowPulse {
	0% {
		box-shadow: 0 0 15px rgba(8, 186, 226, 0.7), 0 0 30px rgba(8, 168, 226, 0.5);
	}
	100% {
		box-shadow: 0 0 25px rgba(8, 200, 226, 0.9), 0 0 45px rgba(8, 131, 226, 0.7);
	}
}

.buttons .button {
	color: #4fbeee;
	position: relative;
	text-align: center;
	cursor: pointer;
	text-decoration: none;
	font-weight: 500;
	margin: 10px;
	transition: color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.buttons .button:hover {
	color: #089de2;
	box-shadow: 0 0 10px rgba(8, 113, 226, 0.649), 0 0 20px rgba(8, 150, 226, 0.8);
	animation: hoverGlow 1.5s infinite alternate;
}

@keyframes hoverGlow {
	0% {
		box-shadow: 0 0 10px rgba(48, 198, 215, 0.7), 0 0 20px rgba(8, 139, 226, 0.5);
	}
	100% {
		box-shadow: 0 0 20px rgba(8, 142, 226, 0.9), 0 0 35px rgba(8, 102, 226, 0.8);
	}
}

/* Other styles as per your original code */

	.logo img {
    padding-top: 8px;
    max-height: 4rem; /* Maintains height on larger screens */
    width: auto; /* Ensure it scales proportionately */
    height: auto; /* Maintain aspect ratio */
    max-width: 100%; /* Ensures it doesn’t overflow its container */
}
	/* Styling when the menu opens */
	.open {
		flex-direction: column !important;
		align-items: center !important;
		background-color: rgba(0, 0, 0, 0.674); /* Darker black background when open */
		height: 280px !important;
		transition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
	}

	.innerContainer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.innerContainer :global(a) {
		height: 30px;
		color: white;
	}

	.buttons {
		color:#4fbeee;
	display: none;
	justify-content: space-between;
	align-items: center;
	font-weight: 500;
	width: 80%; /* Responsive width */
	max-width: 50rem; /* Maximum width to maintain layout on large screens */
	flex-wrap: wrap; /* Ensures buttons wrap on smaller screens */
	padding:  -10rem;
	gap: -20px; /* Adds some padding on smaller screens */
}

.buttons .button {
	font-weight: 500;

	flex: 1; /* Distributes buttons evenly */
	text-align: center; /* Centers button text */
	margin: 0.5rem 1rem; /* Adds margin for spacing between buttons */
}



	.responsiveButtons {
		width: 100%;
		display: flex !important;
		flex-direction: column;
	}

	.responsiveButtons .button {
		width: 10%; /* Full width for small screens */
		text-align: center;
	}

	.buttons .button {
		padding: 0;
		cursor: pointer;
		transition: color 0.2s ease-in-out;
		text-decoration: none;
		position: relative;
		width: 100%;

		margin: 10px;
		color:#088be28b;
	}

	.button.selected {
		color:#63c7f2;
		font-size: large;
		font-weight: 1000;
	}

	.button:hover::after {
		content: '';
		background-color: #4fbeee(255, 255, 255, 0.7); 
		display: block;
		height: 3px;
		position: absolute;
		bottom: 0;
	}

	.button.selected:after {
		content: '';
		background-color: #4fbeee; 
		display: block;
		height: 3px;
		width: 100%;
		position: absolute;
		bottom: 0;
	}

	/* Responsive styles for large screens */
	@media (max-width: 900px) {
		
		.logo img {
			margin-top: -17px;
        max-height: 3.5rem; /* Reduce logo size on very small screens */
    }

	}
	@media (min-width: 900px) {
		.NavBar {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding: 20px 0;
		}
		.logo img {
			
        max-height: rem; /* Reduce logo size on very small screens */
    }

		.buttons {
			display: flex;
		}

		.NavBar .nav {
			display: none !important;
			position: relative; /* Change to relative */

		}

		.responsiveButtons {
			display: none !important;
			
		}
		.NavBar.open {
    height: auto; /* Allow automatic height when open */
}

.open {
    background-color: rgba(0, 0, 0, 0.674);
	
}

.content {
    transition: margin-top 0.2s ease; /* Smooth transition */
}
	}
	@media (max-width: 768px) {
    .NavBar {
        padding: 10px; /* Less padding on smaller screens */
    }
    .buttons, .responsiveButtons {
        justify-content: space-between; /* Space buttons evenly */
    
	}
	 .logo img {
		margin-top: 1px;

        max-height: 3rem; /* Reduce logo size on very small screens */
    }
	
}

@media (max-width: 480px) {
    .logo img {
        max-height: 3rem; /* Reduce logo size on very small screens */
    }
    .buttons .button {
	padding-left: -80px;
		background-color: #00000000; 
		height: 3px;
		width: 100%;
		bottom: 0;
	}
    
	.button.selected:after {
		content: '';
		background-color: #4fbeee; 
		display: block;
		height: 3px;
		width: 200%;
		position: absolute;
		bottom: 0;
	}
}
</style>
