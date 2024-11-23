<script>
    // Optional: Add any global state management or other scripts needed for layout
</script>

<style>
    header, footer {
        background-color: rgba(255, 255, 255, 0.8); /* Slightly transparent white */
        color: #0f4c81; /* Blue text for header/footer */
        padding: 20px;
        text-align: center;
        position: relative;
    }
    nav {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 10px;
    }
    nav a {
        text-decoration: none;
        color: #0f4c81; /* Blue text */
        background-color: #ffd700; /* Yellow gold background */
        padding: 10px 20px;
        border-radius: 5px;
        transition: background-color 0.3s, color 0.3s;
    }
    nav a:hover {
        background-color: #0f4c81; /* Blue background on hover */
        color: #fff; /* White text on hover */
    }
    main {
        padding: 20px;
    }
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        background-image: url('/images/background.jpg'); /* Galaxy background */
        background-size: cover;
        background-position: center;
        color: #0f4c81; /* Blue text for better visibility */
    }
    /* Adding glow effect */
    h1, h2 {
        text-shadow: 0 0 20px rgba(15, 76, 129, 0.9), 0 0 30px rgba(255, 215, 0, 0.5); /* Blue and yellow glow */
    }
    /* Gradient animation keyframes */
    @keyframes gradientAnimation {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
</style>

<header>
    <h1>AFD ToothPrescribe</h1>
    <nav>
        <a href="/login">Log In</a>
    </nav>
</header>

<main>
    <slot></slot>
</main>

<footer>
    <p>© 2024 AF Domingo Dental Clinic</p>
</footer>
