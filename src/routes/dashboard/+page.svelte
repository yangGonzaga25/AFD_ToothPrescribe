<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component
    import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
    import { initializeApp, getApps, getApp } from "firebase/app";

    // Firebase initialization
    import { firebaseConfig } from "$lib/firebaseConfig";
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let isCollapsed = false;

    // Define a type for the stats
    type Stats = {
        newAppointments: number;
        totalPatients: number;
        todaysPatients: number;
        todaysAppointments: number;
        todaysPrescriptions: number;
        totalPrescriptions: number;
    };

    // Initialize stats with default values
    let stats: Stats = {
        newAppointments: 0,
        totalPatients: 0,
        todaysPatients: 0,
        todaysAppointments: 0,
        todaysPrescriptions: 0,
        totalPrescriptions: 0,
    };

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; // Redirect to landing page
    }

    // Helper function to get today's date in 'YYYY-MM-DD' format
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Fetch data from Firestore
    async function fetchDashboardData() {
        try {
            // Fetch all appointments
            const appointmentsCollection = collection(db, "appointments");
            const appointmentDocs = await getDocs(appointmentsCollection);

            // Update stats with the count of all appointments
            stats.newAppointments = appointmentDocs.size;

            // Fetch today's appointments
            const today = getTodayDate();
            const todaysAppointmentsQuery = query(appointmentsCollection, where("date", "==", today));
            const todaysAppointmentsDocs = await getDocs(todaysAppointmentsQuery);

            // Update stats with today's appointments count
            stats.todaysAppointments = todaysAppointmentsDocs.size;

            console.log(`Total Appointments: ${stats.newAppointments}`);
            console.log(`Today's Appointments: ${stats.todaysAppointments}`);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Fetch data on component mount
    fetchDashboardData();
</script>

<!-- svelte-ignore css_unused_selector -->
<style>
    body {
        margin: 0;
        padding: 0;
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
        color: black !important;
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
    .icon {
    font-size: 2rem;
    color: black;
    }

</style>
<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <!-- Main Content -->
    <div class="content">
        <div class="content-header">
            <h1>Clinic Dashboard</h1>
        </div>

        <div class="cards">
            <div class="card">
                <span class="icon fas fa-calendar-alt"></span>
                <div class="text">
                    <h3>{stats.newAppointments}</h3>
                    <p>New Appointments</p>
                </div>
            </div>
            <div class="card">
                <span class="icon fas fa-users"></span>
                <div class="text">
                    <h3>{stats.totalPatients}</h3>
                    <p>Total Patients</p>
                </div>
            </div>
            <div class="card">
                <span class="icon fas fa-user"></span>
                <div class="text">
                    <h3>{stats.todaysPatients}</h3>
                    <p>Today's Patients</p>
                </div>
            </div>
            <div class="card">
                <span class="icon fas fa-calendar-check"></span>
                <div class="text">
                    <h3>{stats.todaysAppointments}</h3>
                    <p>Today's Appointments</p>
                </div>
            </div>
            <div class="card">
                <span class="icon fas fa-prescription"></span>
                <div class="text">
                    <h3>{stats.todaysPrescriptions}</h3>
                    <p>Today's Prescriptions</p>
                </div>
            </div>
            <div class="card">
                <span class="icon fas fa-file-prescription"></span>
                <div class="text">
                    <h3>{stats.totalPrescriptions}</h3>
                    <p>Total Prescriptions</p>
                </div>
            </div>
        </div>        
    </div>
</div>
