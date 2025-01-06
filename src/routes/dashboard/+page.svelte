<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component
    import { Timestamp, getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
    import { initializeApp, getApps, getApp } from "firebase/app";
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';  // <-- Make sure you have this line to import onMount

    // Firebase initialization
    import { firebaseConfig } from "$lib/firebaseConfig";
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const today = getTodayDate();
const todayTimestamp = Timestamp.fromDate(new Date(today));

    let isCollapsed = false;

    // Define a type for the stats
    type Stats = {
        newAppointments: number;
        totalPatients: number;
        todaysPatients: number;
        todaysAppointments: number;
        todaysPrescriptions: number;
        totalPrescriptions: number;
        monthlyAppointments: number; 

    };

    // Initialize stats with default values
    let stats: Stats = {
        newAppointments: 0,
        totalPatients: 0,
        todaysPatients: 0,
        todaysAppointments: 0,
        todaysPrescriptions: 0,
        totalPrescriptions: 0,
        monthlyAppointments: 0, 
    };

    // State to hold the appointments
    let appointments: any[] = [];

    // State to handle the current view for appointments
    let isViewingAppointments = false;

    let appointmentData = [];
    let dateLabels: string[] = [];
let totalPatientsPerDay: number[] = []; // Line graph data (number of patients)
let newAppointmentsPerDay: number[] = []; // Bar graph data (number of appointments)
let averageNewAppointments: number = 0;
let averageTotalPatients: number = 0;


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

    function calculateAverages() {
    const totalDays = dateLabels.length;
    if (totalDays > 0) {
        averageNewAppointments = newAppointmentsPerDay.reduce((a, b) => a + b, 0) / totalDays;
        averageTotalPatients = totalPatientsPerDay.reduce((a, b) => a + b, 0) / totalDays;
    }
}
    // Helper function to get today's date in 'YYYY-MM-DD' format
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function fetchGraphData() {
    try {
        const appointmentsCollection = collection(db, "appointments");
        const patientCollection = collection(db, "patientProfiles");

        const appointmentDocs = await getDocs(appointmentsCollection);
        const patientDocs = await getDocs(patientCollection);

        const appointmentCountByDate: Record<string, number> = {};
        const patientCountByDate: Record<string, number> = {};

        // Loop through appointments and group them by date
        appointmentDocs.forEach((doc) => {
            const data = doc.data();
            const date = data.date; // Assuming the date is stored in a field called "date"
            if (appointmentCountByDate[date]) {
                appointmentCountByDate[date]++;
            } else {
                appointmentCountByDate[date] = 1;
            }
        });

        // Loop through patients and group them by registration date
        patientDocs.forEach((doc) => {
            const data = doc.data();
            const date = data.registrationDate; // Assuming patients have a "registrationDate" field
            if (patientCountByDate[date]) {
                patientCountByDate[date]++;
            } else {
                patientCountByDate[date] = 1;
            }
        });

        // Now fill the data arrays for the charts
        dateLabels = Object.keys(appointmentCountByDate); // Dates are the labels
        newAppointmentsPerDay = Object.values(appointmentCountByDate); // Count of new appointments per day

        // Calculate cumulative total patients per day
        totalPatientsPerDay = [];
        let cumulativeTotal = 0;
        const sortedDates = Object.keys(patientCountByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        sortedDates.forEach(date => {
            cumulativeTotal += patientCountByDate[date] || 0; // Add the number of patients registered on that date
            totalPatientsPerDay.push(cumulativeTotal); // Push the cumulative total to the array
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
    calculateAverages();
}


function createCharts() {
    // Sort dateLabels in ascending order based on date
    const sortedDates = dateLabels.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Bar Chart for New Appointments
    new Chart(document.getElementById('barChart') as HTMLCanvasElement, {
        type: 'bar', // Specify the chart type
        data: {
            labels: sortedDates, // Use sorted date as labels
            datasets: [{
                label: 'New Appointments',
                data: newAppointmentsPerDay,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Ensure that only whole numbers are shown
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value; // Only return whole numbers
                            }
                        }
                    }
                }
            }
        }
    });

        // Line Chart for Patients
        new Chart(document.getElementById('lineChart') as HTMLCanvasElement, {
        type: 'line', // Specify the chart type
        data: {
            labels: sortedDates, // Use the sorted date labels
            datasets: [{
                label: 'Total Patients',
                data: totalPatientsPerDay,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Ensure that only whole numbers are shown
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value; // Only return whole numbers
                            }
                        }
                    }
                }
            }
        }
    });
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
        console.log("Today's date for query:", today); // Log today's date

        const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
        const currentYear = new Date().getFullYear();

        // Fetch all appointments
        const appointmentsCollection = collection(db, "appointments");
        const appointmentDocs = await getDocs(appointmentsCollection);
        stats.newAppointments = appointmentDocs.size;

      // Fetch today's appointments
      const todaysAppointmentsQuery = query(appointmentsCollection, where("date", "==", today));
        const todaysAppointmentsDocs = await getDocs(todaysAppointmentsQuery);
        
        // Log the count and the dates of the fetched appointments
        stats.todaysAppointments = todaysAppointmentsDocs.size; // This line fetches today's appointments
        console.log("Today's appointments count:", stats.todaysAppointments);
        
        todaysAppointmentsDocs.forEach(doc => {
            console.log("Appointment date:", doc.data().date); // Log each appointment date
        });


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

        // Fetch monthly appointments
        const monthlyAppointmentsDocs = await getDocs(appointmentsCollection);
        stats.monthlyAppointments = monthlyAppointmentsDocs.docs.filter(doc => {
            const data = doc.data();
            const appointmentDate = new Date(data.date); // Assuming date is in a valid format
            return appointmentDate.getMonth() + 1 === currentMonth && appointmentDate.getFullYear() === currentYear;
        }).length; // Count the number of appointments for the current month
    
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
    
    onMount(async () => {
    // Fetch dashboard data from Firebase
    await fetchDashboardData();

    // Fetch the data for graphs
    await fetchGraphData();

    // Create the charts
    createCharts();
  });

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
        margin-top: -15px;
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
        flex: 1 1 calc(25% - 15px); /* Adjust width to fit 4 cards with gap */
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        box-sizing: border-box; /* Include padding in width */
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
    .chart {
        margin-top: -2rem;
        margin-left: 20px; /* Adjust this value to move the content to the left */
        width: 78%; /* Adjust the width as needed */
        height: 300px; /* Adjust the height to make it shorter */
        padding: 20px; /* Adds padding inside the container */
    }



</style>

<div class="dashboard">
    <div class="sidebar {isCollapsed ? 'collapsed' : ''}">
        <Sidebar {isCollapsed} {toggleSidebar} {logout} />
    </div>

    <div class="content">
        <div class="summary">
            <h2>Data Summary</h2>
        </div>
        <div class="cards">
            <button class="card" on:click="{toggleAppointments}" type="button">
                <span class="icon fas fa-calendar-alt"></span>
                <div class="text">
                    <h3>{stats.newAppointments}</h3>
                    <p>Total Appointments</p>
                </div>
            </button>
            <div class="card">
                <span class="icon fas fa-calendar-day"></span> <!-- New card for today's appointments -->
                <div class="text">
                    <h3>{stats.monthlyAppointments}</h3>
                    <p>This Month's Appointments</p>
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
                <span class="icon fas fa-file-prescription"></span>
                <div class="text">
                    <h3>{stats.totalPrescriptions}</h3>
                    <p>Total Prescriptions</p>
                </div>
            </div>
           
          

            <div class="chart">
                <div>
                    <h2>New Appointments</h2>
                    <canvas id="barChart"></canvas>
                </div>
            </div>
            
        </div>
        
    </div>
</div>
