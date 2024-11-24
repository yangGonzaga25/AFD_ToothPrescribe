<script>
    export let isCollapsed = false;
    export let toggleSidebar;
    export let logout;
</script>

<style>
    .layout {
        display: flex;
        height: 100vh; /* Full viewport height */
        overflow: hidden;
    }
    /* Sidebar styles */
    .sidebar {
        position: fixed; /* Sidebar fixed at top-left */
        top: 0;         /* Align to the top */
        left: 0;        /* Align to the left */
        background-color: #00a2e8;
        color: white;
        width: 11.6rem;
        height: 100vh;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        z-index: 1000; /* Ensure it stays above other content */
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Add a shadow for a sleek effect */
    }

    .sidebar.collapsed {
        width: 4.22rem;
    }

    .sidebar-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
    }
    .sidebar-header .circle-background {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white; /* White circle background */
    width: 80px; /* Adjust size as needed */
    height: 80px;
    border-radius: 50%; /* Makes the div a perfect circle */
    padding: 10px;
}
.sidebar.collapsed .circle-background {
        width: 30px; /* Match icon size */
        height: 30px;
        background-color: transparent;
        padding: 0;
    }
    .sidebar.collapsed .circle-background img {
        width: 30px;
        height: 30px;
        border-radius: 0; /* Remove border-radius if unnecessary for smaller icon */
    }
    .sidebar-header img {
        width: 60px;
        height: 60px;
    }

    .sidebar-header span {
        margin-top: 10px;
        font-size: 1rem;
        white-space: nowrap;
        text-align: center;
    }

    .sidebar-menu {
        list-style: none;
        padding-top: 3rem;
        margin: 0;
        flex-grow: 1;
    }

    .sidebar-menu li {
        display: flex;
        align-items: center;
        padding-top: 1.2rem;
        padding-left: 20px;
        cursor: pointer;
    }

    .sidebar-menu li:hover {
        background-color: #007bb5;
    }

    .sidebar-menu li .icon {
        width: 30px;
        height: 30px;
        margin-right: 15px;
        margin-top: 0;
    }

    .sidebar-menu li .text {
        font-size: 1rem;
        transition: opacity 0.3s ease;
        white-space: nowrap;
    }

    .sidebar.collapsed .text {
        opacity: 0;
        pointer-events: none;
    }
    .sidebar.collapsed .logout-btn span {
        display: none; /* Hide text when collapsed */
    }

    .logout-btn {
    background-color: #00a2e8;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 10px 20px;
    margin: 20px auto;
    border-radius: 25px;
    width: 90%;
    text-align: center;
    transition: background-color 0.3s ease, padding 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logout-btn:hover {
    background-color: #007bb5;
}

.logout-btn img.logout-icon {
    width: 20px;
    height: 20px;
    transition: width 0.3s ease, height 0.3s ease;
}

.logout-btn img.logout-icon.collapsed {
    width: 3rem; /* Larger size when collapsed */
    height: 3rem;
}

.sidebar.collapsed .logout-btn {
    width: auto;
    padding: 10px; /* Adjust padding for icon-only state */
    justify-content: center;
}


    .toggle-btn {
        cursor: pointer;
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        padding: 10px;
        text-align: center;
    }
    .content.shifted {
        margin-left: 14rem; /* Matches sidebar width */
    }

    .content.shifted.collapsed {
        margin-left: 5rem; /* Matches collapsed sidebar width */
    }
</style>

<div class="layout">
<div class="sidebar {isCollapsed ? 'collapsed' : ''}">
    <div class="sidebar-header">
        <div class="circle-background">
            <img src={isCollapsed ? "/images/icon-person.png" : "/images/logo(landing).png"} alt="Logo" />
        </div>
        {#if !isCollapsed}
        <span>&lt;user_name&gt;</span> 
        {/if}
    </div>
    <ul class="sidebar-menu">
        <li>
            <a href="/dashboard">
                <img class="icon" src="/images/icon-dashboard.png" alt="Dashboard Icon" />
                <span class="text">Dashboard</span>
            </a>
        </li>
        <li>
            <a href="/patient-list">
                <img class="icon" src="/images/icon-patient.png" alt="Patient Icon" />
                <span class="text">Patient List</span>
            </a>
        </li>
        <li>
            <a href="/prescription">
                <img class="icon" src="/images/icon-prescriptions.png" alt="Prescriptions Icon" />
                <span class="text">Prescriptions</span>
            </a>
        </li>
        <li>
            <a href="/medicine-list">
                <img class="icon" src="/images/icon-medicines.png" alt="Medicines Icon" />
                <span class="text">Medicines List</span>
            </a>
        </li>
    </ul>
    <button class="logout-btn" on:click={logout}>
        {#if isCollapsed}
            <img src="/images/logout-icon.png" alt="Logout Icon" class="logout-icon collapsed" />
        {:else}
            Logout
        {/if}
    </button>
    
    <button class="toggle-btn" on:click={toggleSidebar}>
        {isCollapsed ? '➡️' : '⬅️'}
    </button>
    </div>
    <div class="content {isCollapsed ? 'shifted collapsed' : 'shifted'}">
        <slot /> <!-- Slot for the main content -->
    </div>

</div>