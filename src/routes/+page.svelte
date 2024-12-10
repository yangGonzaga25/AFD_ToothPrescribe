<script>
    // Optional: Add any global state management or other scripts needed for layout
</script>

<style>
    header {
        display: flex;
        justify-content: flex-end;
        padding: 20px;
        position: fixed; /* Fixed header */
        top: 0;
        right: 0;
        width: 100%;
        background-color: rgba(17, 28, 95, 0); /* Ensure header background is consistent */
        z-index: 1000; /* Keep header on top */
    }

    nav {
        display: flex;
        gap: 25px; /* Add space between the links */
    }

    nav a {
        text-decoration: none;
        color: #000; /* Black text for the login */
        font-weight: bold;
        font-size: 1rem;
    }

    main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px; /* Adjusted padding */
        height: 100vh; /* Fill screen height */
        box-sizing: border-box;
    }

    .left-section {
        flex: 1; /* Allow text section to take up remaining space */
        max-width: 50%;
    }

    .left-section h1 {
        font-size: 3rem; /* Adjust font size */
        color: #ffd700; /* Yellow-gold text */
        margin-bottom: 15px;
        font-weight: bold;
        line-height: 1.2;
    }

    .left-section p {
        font-size: 1.3rem; /* Reduced font size for description */
        color: #555; /* Slightly grey text for description */
        max-width: 100%;
    }

    .right-section {
        flex: 1; /* Allow image section to take up remaining space */
        display: flex;
        justify-content: center; /* Center the image */
        align-items: center;
        margin: 0; /* Remove any margin */
        padding: 0; /* Remove any padding */
        width: 100%; /* Ensure it takes full width */
        height: 100%; /* Ensure it takes full height */
    }

    .right-section img {
        width: auto; /* Allow width to adjust automatically */
        height: 90vh; /* Set height to 90% of the viewport height */
        max-width: 100%; /* Ensure it doesn't exceed the container width */
        max-height: none; /* Remove max-height restriction */
        object-fit: contain; /* Maintain aspect ratio */
        padding: 0; /* Remove padding */
        margin: 0; /* Remove margin */
    }
</style>



<header>
    <nav>
        <a href="/login">Dentist Login</a>
    </nav>
</header>

<main>
    <div class="left-section">
        <h1>Dental Patient Records and Prescription Management System for Streamlined Dental Care and Treatment Tracking</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    </div>
    <div class="right-section">
        <img src="/images/logo(landing).png" alt="Landing Logo" />
    </div>
</main>


