<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component
    import { getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
    import { initializeApp, getApps, getApp } from "firebase/app";

    // Firebase initialization
    import { firebaseConfig } from "$lib/firebaseConfig";
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let isCollapsed = false;
    let showModal = false;
    let showDoneModal = false;
    let modalMessage = "";
    let selectedAppointmentId: string | null = null;
    let actionType: "accept" | "decline" | "edit" | null; // Updated to include "edit"
    let selectedDoneAppointmentId: string | null = null;

    // Define a type for the stats
    type Stats = { newAppointments: number; totalPatients: number; todaysPatients: number; todaysAppointments: number; todaysPrescriptions: number; totalPrescriptions: number; };


    // Initialize stats with default values
    let stats: Stats = { newAppointments: 0, totalPatients: 0, todaysPatients: 0, todaysAppointments: 0, todaysPrescriptions: 0, totalPrescriptions: 0 };


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

    function openDoneModal(id: string) {
        selectedDoneAppointmentId = id;
        showDoneModal = true;
    }

       // Function to confirm the action of marking the appointment as Done
       async function confirmDoneAction() {
        if (selectedDoneAppointmentId) {
            try {
                const appointmentDoc = doc(db, "appointments", selectedDoneAppointmentId);
                const appointmentDocSnap = await getDoc(appointmentDoc);
                if (!appointmentDocSnap.exists()) {
                    console.error('Appointment not found:', selectedDoneAppointmentId);
                    return;
                }

                const appointmentData = appointmentDocSnap.data();
                if (appointmentData?.status !== 'Accepted') {
                    console.error('Appointment cannot be marked as Done, status is not Accepted');
                    return;
                }

                await updateDoc(appointmentDoc, { status: "Completed" });
                fetchAppointments(); // Re-fetch the appointments after update
            } catch (error) {
                console.error("Error marking appointment as Done:", error);
            }
        }
        closeDoneModal();
    }

    function closeDoneModal() {
        showDoneModal = false;
        selectedDoneAppointmentId = null;
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
            const patientsCollection = collection(db, "patients");
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

            console.log(`New Appointments: ${stats.newAppointments}`);
            console.log(`Today's Appointments: ${stats.todaysAppointments}`);
            console.log(`Total Patients: ${stats.totalPatients}`);
            console.log(`Today's Patients: ${stats.todaysPatients}`);
            console.log(`Today's Prescriptions: ${stats.todaysPrescriptions}`);
            console.log(`Total Prescriptions: ${stats.totalPrescriptions}`);
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
                const patientId = appointmentData.patientId; // assuming each appointment has a patientId

                // Correctly use getDoc to fetch the patient document using the patientId
                const patientDocRef = doc(db, "patientProfiles", patientId); // Create a document reference
                const patientDocSnap = await getDoc(patientDocRef); // Fetch the document snapshot

                // Now you can safely access the data from the snapshot
                const patientData = patientDocSnap.data(); // .data() returns the document data
                const patientName = patientData ? `${patientData.name} ${patientData.lastName}` : "Unknown Patient";

                return { id: docSnapshot.id, ...appointmentData, patientName };
            }));

            isViewingAppointments = true; // Set to true when viewing appointments
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    }

// Trigger modal confirmation
function openModal(id: string, action: "accept" | "decline" | "edit") {
        selectedAppointmentId = id;
        actionType = action;

        if (action === "edit") {
            // For editing, show options to accept or decline based on the current status
            modalMessage = "Are you sure you want to change the appointment status?";
        } else {
            modalMessage = action === "accept" ? "Are you sure you want to accept this appointment?" :
                           action === "decline" ? "Are you sure you want to decline this appointment?" : 
                           "Are you sure you want to reset this appointment to Pending?";
        }

        showModal = true;
    }


        // Confirm action after modal
    async function confirmAction() {
        if (selectedAppointmentId && actionType) {
            if (actionType === "accept") {
                await updateAppointmentStatus(selectedAppointmentId, "Accepted");
            } else if (actionType === "decline") {
                await updateAppointmentStatus(selectedAppointmentId, "Declined");
            } else if (actionType === "edit") {
                // If the action is "edit", we can either accept or decline
                await updateAppointmentStatus(selectedAppointmentId, "Pending");
            }
        }
        closeModal();
    }

    // Close modal
    function closeModal() {
        showModal = false;
        selectedAppointmentId = null;
        actionType = null;
    }

    // Update appointment status and refetch data
    async function updateAppointmentStatus(id: string, status: string) {
        const appointmentDoc = doc(db, "appointments", id);
        await updateDoc(appointmentDoc, { status });
        fetchAppointments(); // Re-fetch appointments after update
    }

    // Check if appointment is already accepted or declined
    function isEditable(status: string) {
        return status === "Accepted" || status === "Declined";
    }

async function acceptAppointment(id: string) {
    try {
        const appointmentDoc = doc(db, "appointments", id);
        const appointmentDocSnap = await getDoc(appointmentDoc);
        if (!appointmentDocSnap.exists()) {
            console.error('Appointment not found:', id);
            return;
        }

        const appointmentData = appointmentDocSnap.data();
        if (appointmentData?.status !== 'Pending') {
            console.error('Appointment cannot be accepted, status is not Pending');
            return;
        }

        await updateDoc(appointmentDoc, { status: "Accepted" });
        fetchAppointments(); // Re-fetch the appointments after update
    } catch (error) {
        console.error("Error accepting appointment:", error);
    }
}

async function declineAppointment(id: string) {
    try {
        const appointmentDoc = doc(db, "appointments", id);
        const appointmentDocSnap = await getDoc(appointmentDoc);
        if (!appointmentDocSnap.exists()) {
            console.error('Appointment not found:', id);
            return;
        }

        const appointmentData = appointmentDocSnap.data();
        if (appointmentData?.status !== 'Pending') {
            console.error('Appointment cannot be declined, status is not Pending');
            return;
        }

        await updateDoc(appointmentDoc, { status: "Declined" });
        fetchAppointments(); // Re-fetch the appointments after update
    } catch (error) {
        console.error("Error declining appointment:", error);
    }
}
async function markAsDone(id: string) {
    try {
        const appointmentDoc = doc(db, "appointments", id);
        await updateDoc(appointmentDoc, { status: "Completed" });
        fetchAppointments(); // Optional: re-fetch if not using real-time updates
    } catch (error) {
        console.error("Error marking appointment as Done:", error);
    }
}



fetchAppointments();
    // Fetch data on component mount
    fetchDashboardData();
</script>
<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        text-align: center;
    }

    .button {
        padding: 5px 10px;
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
    }

    .button.decline {
        background-color: #dc3545;
    }
    .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    .content {
        flex-grow: 1;
        padding: 20px;
        overflow: auto;
    }

    .appointment-list {
        margin-top: 20px;
    }

    .appointment-item {
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .appointment-item .actions {
        display: flex;
        gap: 10px;
    }

    .button {
        padding: 5px 10px;
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
    }

    .button.decline {
        background-color: #dc3545;
    }

   .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    .content {
        flex-grow: 1;
     
        padding: 20px;
        overflow: auto;
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

    .cards :hover {
        transform: scale(1.05); /* Slightly enlarge the item on hover */
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

    .appointment-list {
        margin-top: 20px;
    }

    .appointment-item {
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .appointment-item .actions {
        display: flex;
        gap: 10px;
    }

    .button {
        padding: 5px 10px;
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
    }

    .button.decline {
        background-color: #dc3545;
    }

</style>
<div class="dashboard">
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />
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
   
        <!-- Appointments Section -->
        {#if isViewingAppointments}
            <div class="appointment-list">
                {#each appointments as appointment (appointment.id)}
                <div class="appointment-item">
                    <p>Date: {appointment.date}</p>
                    <p>Time: {appointment.time}</p>
                    <p>Service: {appointment.service}</p>
                    <p>Patient: {appointment.patientName}</p>
                    <p>
                      Status: 
                      {#if appointment.status === 'Completed'}
                        <span class="text-green-600 font-semibold">Completed</span>
                      {:else if appointment.status === 'Accepted'}
                        <span class="text-blue-600 font-semibold">Accepted</span>
                      {:else if appointment.status === 'Declined'}
                        <span class="text-red-600 font-semibold">Declined</span>
                      {:else if appointment.status === 'Pending'}
                        <span class="text-yellow-600 font-semibold">Pending</span>
                      {:else}
                        <span class="text-gray-600 font-semibold">{appointment.status}</span>
                      {/if}
                    </p>
                    <div class="actions">
                      {#if appointment.status !== "Completed"}
                        {#if isEditable(appointment.status)}
                          <button class="button" on:click={() => openModal(appointment.id, "edit")}>Edit</button>
                        {:else}
                          <button class="button" on:click={() => openModal(appointment.id, "accept")}>Accept</button>
                          <button class="button decline" on:click={() => openModal(appointment.id, "decline")}>Decline</button>
                        {/if}
                        {#if appointment.status === "Accepted"}
                          <button class="button" on:click={() => openDoneModal(appointment.id)}>Done</button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                  {/each}

            </div>
        {/if}
    </div>
    {#if showDoneModal}
    <div class="modal">
        <div class="modal-content">
            <p>Are you sure you want to mark the appointment as done?</p>
            <button class="button" on:click={confirmDoneAction}>Yes, Mark as Done</button>
            <button class="button decline" on:click={closeDoneModal}>Cancel</button>
        </div>
    </div>
{/if}
    {#if showModal}
        <div class="modal">
            <div class="modal-content">
                <p>{modalMessage}</p>
                <button class="button" on:click={confirmAction}>Confirm</button>
                <button class="button decline" on:click={closeModal}>Cancel</button>
            </div>
        </div>
    {/if}
</div>