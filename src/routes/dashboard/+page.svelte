<script>
    // @ts-ignore
    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component

    let isCollapsed = false;

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        // Redirect to the main landing page
        window.location.href = "/"; // Or replace with the correct landing page URL
    }
</script>

<style>
    body, html {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        height: 100%;
    }

    .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    .content {
        flex-grow: 1;
        background-color: #f8f8f8;
        padding: 20px;
        overflow: auto;
    }

    .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .cards {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }

    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        padding: 20px;
        flex: 1 1 300px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .card .icon {
        font-size: 2rem;
        color: #007bb5;
    }

    .card .text {
        text-align: right;
    }

    .card .text h3 {
        margin: 0;
        font-size: 1.2rem;
    }

    .card .text p {
        margin: 0;
        color: #555;
    }
</style>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} /> <!-- Use the Sidebar component -->

    <!-- Main Content -->
    <div class="content">
        <div class="content-header">
            <h1>Clinic Dashboard</h1>
        </div>

        <div class="cards">
            <div class="card">
                <span class="icon">📆</span>
                <div class="text">
                    <h3>2</h3>
                    <p>New Appointments</p>
                </div>
            </div>
            <div class="card">
                <span class="icon">👥</span>
                <div class="text">
                    <h3>4</h3>
                    <p>Total Patients</p>
                </div>
            </div>
            <div class="card">
                <span class="icon">👤</span>
                <div class="text">
                    <h3>6</h3>
                    <p>Today's Patients</p>
                </div>
            </div>
            <div class="card">
                <span class="icon">📅</span>
                <div class="text">
                    <h3>1</h3>
                    <p>Today's Appointments</p>
                </div>
            </div>
            <div class="card">
                <span class="icon">📜</span>
                <div class="text">
                    <h3>0</h3>
                    <p>Today's Prescriptions</p>
                </div>
            </div>
            <div class="card">
                <span class="icon">📜</span>
                <div class="text">
                    <h3>4</h3>
                    <p>Total Prescriptions</p>
                </div>
            </div>
        </div>
    </div>
</div>
