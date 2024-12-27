<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component
    import { getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
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

    // State to hold the appointments
    let appointments: any[] = [];

    // State to handle the current view for appointments
    let isViewingAppointments = false;

    interface Patient {
        name: string;       // First name
        lastName: string;   // Last name
    }

    // Toggle the sidebar collapse
    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    // Log out function
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

    function toggleAppointments() {
        isViewingAppointments = !isViewingAppointments; // Toggle the view on/off
        if (isViewingAppointments) {
            fetchAppointments(); // Fetch appointments if we are viewing them
        }
    }

    // Fetch data from Firestore
    async function fetchDashboardData() {
        try {
            const today = getTodayDate();

            // Fetch all appointments
            const appointmentsCollection = collection(db, "appointments");
            const appointmentDocs = await getDocs(appointmentsCollection);
            stats.newAppointments = appointmentDocs.size;

            // Fetch today's appointments
            const todaysAppointmentsQuery = query(appointmentsCollection, where("date", "==", today));
            const todaysAppointmentsDocs = await getDocs(todaysAppointmentsQuery);
            stats.todaysAppointments = todaysAppointmentsDocs.size;

            // Fetch total patients
            const patientsCollection = collection(db, "patientProfiles");
            const patientDocs = await getDocs(patientsCollection);
            stats.totalPatients = patientDocs.size;

            // Fetch today's patients
            const todaysPatientsQuery = query(patientsCollection, where("registrationDate", "==", today));
            const todaysPatientsDocs = await getDocs(todaysPatientsQuery);
            stats.todaysPatients = todaysPatientsDocs.size;

            // Fetch prescriptions
            const prescriptionsCollection = collection(db, "prescriptions");
            const prescriptionDocs = await getDocs(prescriptionsCollection);
            stats.totalPrescriptions = prescriptionDocs.size;

            // Fetch today's prescriptions
            const todaysPrescriptionsQuery = query(prescriptionsCollection, where("date", "==", today));
            const todaysPrescriptionsDocs = await getDocs(todaysPrescriptionsQuery);
            stats.todaysPrescriptions = todaysPrescriptionsDocs.size;
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Fetch appointments and patient names
    async function fetchAppointments() {
        try {
            const appointmentsCollection = collection(db, "appointments");
            const appointmentDocs = await getDocs(appointmentsCollection);

            // Store all appointment data with the patient name
            appointments = await Promise.all(appointmentDocs.docs.map(async (docSnapshot) => {
                const appointmentData = docSnapshot.data();
                const patientId = appointmentData.patientId;

                const patientDocRef = doc(db, "patientProfiles", patientId);
                const patientDocSnap = await getDoc(patientDocRef);
                const patientData = patientDocSnap.data();
                const patientName = patientData ? `${patientData.name} ${patientData.lastName}` : "Unknown Patient";

                return { id: docSnapshot.id, ...appointmentData, patientName };
            }));
            isViewingAppointments = true;
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    }

    // Fetch data on component mount
    fetchDashboardData();
</script>

<style>
    .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    .sidebar {
        width: 250px;
        
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        transition: width 0.3s;
        z-index: 1000;
    }

    .sidebar.collapsed {
        width: 80px;
    }

    .content {
        margin-left: 220px;
        flex-grow: 1;
        padding: 20px;
        overflow: auto;
        transition: margin-left 0.3s;
    }

    .sidebar.collapsed + .content {
        margin-left: 80px;
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
        cursor: pointer;
    }

    .card .icon {
        font-size: 2rem;
        color: black;
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
    <div class="sidebar {isCollapsed ? 'collapsed' : ''}">
        <Sidebar {isCollapsed} {toggleSidebar} {logout} />
    </div>

    <div class="content">
        <div class="cards">
            <button class="card" on:click="{toggleAppointments}" type="button">
                <span class="icon fas fa-calendar-alt"></span>
                <div class="text">
                    <h3>{stats.newAppointments}</h3>
                    <p>New Appointments</p>
                </div>
            </button>
            <div class="card">
                <span class="icon fas fa-users"></span>
                <div class="text">
                    <h3>{stats.totalPatients}</h3>
                    <p>Total Patients</p>
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
