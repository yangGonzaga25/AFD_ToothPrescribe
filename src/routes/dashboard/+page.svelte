<script lang="ts">

    import Sidebar from '../sidenav/+page.svelte'; // Import the sidebar component
    import { Timestamp, getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
    import { initializeApp, getApps, getApp } from "firebase/app";
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';  // <-- Make sure you have this line to import onMount
    import { goto } from '$app/navigation';
    // Firebase initialization
    import { firebaseConfig } from "$lib/firebaseConfig";
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    import * as XLSX from 'xlsx';
    import { jsPDF } from 'jspdf'; // Import jsPDF
import autoTable from 'jspdf-autotable'; // Import autoTable
    
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

    let dateLabels: string[] = [];
let totalPatientsPerDay: number[] = []; // Line graph data (number of patients)
let newAppointmentsPerDay: number[] = []; // Bar graph data (number of appointments)
let averageNewAppointments: number = 0;
let averageTotalPatients: number = 0;
let patients: any[] = [];
let prescriptions: any[] = [];
let monthlyAppointments: any[] = [];
let openTable: 'patients' | 'appointments' | 'prescriptions' | 'monthlyAppointments' | null = null;
let exportType = "excel";


interface PrescriptionData {
    id?: string; // Optional if you don't want to require it
    medication: string;
    dosage: string;
    date: string;
    patientId: string; // Assuming you have a patientId field
}

interface PatientData {
    name: string;
    lastName: string;
    // Add other fields as necessary
}
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

    async function generateReport() {
    console.log("Fetching data for the report...");

    // Fetch data from Firebase
    await fetchAppointments();
    await fetchPatients();
    prescriptions = await fetchPrescriptionsData(); 

    console.log("Fetched Appointments:", appointments);
    console.log("Fetched Patients:", patients);
    console.log("Fetched Prescriptions:", prescriptions);

   // After data is fetched, download the report based on the selected type
   if (exportType === "pdf") {
        downloadPdfReport();  // Generate PDF if selected
    } else {
        downloadExcelReport();  // Generate Excel if selected
    }
}

async function downloadPdfReport() { 
    console.log("Generating PDF Report...");

    const doc = new jsPDF();

    // Fetch appointments and patient profiles in parallel
    const appointmentIdToDetails: { [key: string]: any } = {};  // To store appointment details by appointmentId
    const patientIdToName: { [key: string]: string } = {};  // To store patient name by patientId

    // Fetch all appointments
    const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
    appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        appointmentIdToDetails[doc.id] = appointment;  // Store the appointment by its ID
    });

    // Fetch all patient profiles
    const patientProfilesSnapshot = await getDocs(collection(db, "patientProfiles"));
    patientProfilesSnapshot.forEach((doc) => {
        const patient = doc.data();
        patientIdToName[patient.id] = `${patient.name} ${patient.lastName}`;  // Store the patient name by patientId
    });

    // Add title for the report
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Data Report Summary', 105, 10, { align: 'center' });

    // Add an empty line for spacing
    let y = 20;

    // Add Prescriptions Data
    if (prescriptions.length > 0) {
        console.log("Preparing Prescriptions Data...");
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Prescriptions', 10, y);  // Title for prescriptions section
        y += 10;

        const prescriptionData = prescriptions.flatMap((prescription) => {
            const appointment = appointmentIdToDetails[prescription.appointmentId];
            if (appointment) {
                const patientName = patientIdToName[appointment.patientId] || "Unknown"; 

                return (prescription.medicines || []).map((medicine: { medicine: any; dosage: any; instructions: any; }) => ({
                    "Patient Name": patientName,
                    "Medicine Name": medicine.medicine || "N/A",
                    "Dosage": medicine.dosage || "N/A",
                    "Instructions": medicine.instructions || "N/A",
                    "Prescriber": prescription.prescriber || "N/A",
                }));
            }
            return [];
        });

        if (prescriptionData.length > 0) {
            (doc as any).autoTable({
                head: [['Patient Name', 'Medicine Name', 'Dosage', 'Instructions', 'Prescriber']],
                body: prescriptionData.map((item) => [
                    item["Patient Name"],
                    item["Medicine Name"],
                    item["Dosage"],
                    item["Instructions"],
                    item["Prescriber"]
                ]),
                startY: y,
                theme: 'striped',
                headStyles: {
                    fillColor: [102, 204, 102],
                    textColor: [255, 255, 255],
                    fontSize: 12,
                },
                bodyStyles: {
                    fontSize: 10,
                    cellPadding: 5,
                },
            });
            y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;  // Type assertion here
        }
    }

    // Add Appointments Data
    if (appointments.length > 0) {
        console.log("Preparing Appointments Data...");
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Appointments', 10, y);  // Title for appointments section
        y += 10;

        (doc as any).autoTable({
            head: [['Patient Name', 'Date', 'Time', 'Service', 'Subservice', 'Status']],
            body: appointments.map((appointment) => {
                const patientName = patientIdToName[appointment.patientId] || "Unknown";
                return [
                    patientName,
                    appointment.date || "N/A",
                    appointment.time || "N/A",
                    appointment.service || "N/A",
                    appointment.subServices?.join(", ") || "N/A",
                    appointment.status || "N/A",
                ];
            }),
            startY: y,
            theme: 'striped',
            headStyles: {
                fillColor: [102, 133, 244],
                textColor: [255, 255, 255],
                fontSize: 12,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 5,
            },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;  // Type assertion here
    }

    // Add Patients Data
    if (patients.length > 0) {
        console.log("Preparing Patients Data...");
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Patients', 10, y);  // Title for patients section
        y += 10;

        (doc as any).autoTable({
            head: [['Name', 'Age', 'Birthday', 'Gender', 'Phone Number']],
            body: patients.map((patient) => [
                `${patient.name} ${patient.lastName}`,
                patient.age || "N/A",
                patient.birthday || "N/A",
                patient.gender || "N/A",
                patient.phone || "N/A",
            ]),
            startY: y,
            theme: 'striped',
            headStyles: {
                fillColor: [66, 133, 244],
                textColor: [255, 255, 255],
                fontSize: 12,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 5,
            },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;  // Type assertion here
    }

    // Save the PDF
    doc.save('Data_Report.pdf');
}

async function downloadExcelReport() {
    console.log("Generating Excel Report...");

    const workbook = XLSX.utils.book_new();

    // Fetch appointments and patient profiles in parallel
    const appointmentIdToDetails: { [key: string]: any } = {};  // To store appointment details by appointmentId
    const patientIdToName: { [key: string]: string } = {};  // To store patient name by patientId

    // Fetch all appointments
    const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
    appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        appointmentIdToDetails[doc.id] = appointment;  // Store the appointment by its ID
    });

    // Fetch all patient profiles
    const patientProfilesSnapshot = await getDocs(collection(db, "patientProfiles"));
    patientProfilesSnapshot.forEach((doc) => {
        const patient = doc.data();
        patientIdToName[patient.id] = `${patient.name} ${patient.lastName}`;  // Store the patient name by patientId
    });

    // Check if data exists in prescriptions
    if (prescriptions.length > 0) {
        console.log("Preparing Prescriptions Sheet...");
        const prescriptionData = prescriptions.flatMap((prescription) => {
            // Get the corresponding appointment by appointmentId
            const appointment = appointmentIdToDetails[prescription.appointmentId];
            if (appointment) {
                const patientName = patientIdToName[appointment.patientId] || "Unknown"; // Use patientId to get patient name

                // Map medicines in the prescription
                return (prescription.medicines || []).map((medicine: { medicine: any; dosage: any; instructions: any; }) => ({
                    "Patient Name": patientName,  // Use the derived patient name
                    "Medicine Name": medicine.medicine || "N/A",
                    "Dosage": medicine.dosage || "N/A",
                    "Instructions": medicine.instructions || "N/A",
                    "Prescriber": prescription.prescriber || "N/A",
                }));
            } else {
                console.log(`No appointment found for prescription with appointmentId: ${prescription.appointmentId}`);
                return []; // Skip this prescription if no appointment is found
            }
        });

        if (prescriptionData.length > 0) {
            const prescriptionSheet = XLSX.utils.json_to_sheet(prescriptionData);
            XLSX.utils.book_append_sheet(workbook, prescriptionSheet, "Prescriptions");
        } else {
            console.log("No valid prescription data found.");
        }
    } else {
        console.log("No data found in Prescriptions.");
    }

    // Check if data exists in appointments
    if (appointments.length > 0) {
        console.log("Preparing Appointments Sheet...");
        const appointmentSheet = XLSX.utils.json_to_sheet(
            appointments.map(appointment => {
                const patientName = patientIdToName[appointment.patientId] || "Unknown"; // Use patientId to get patient name

                return {
                    "Patient Name": patientName,  // Use the fetched patient name
                    "Date": appointment.date || "N/A",
                    "Time": appointment.time || "N/A",
                    "Service": appointment.service || "N/A",
                    "Subservice": appointment.subServices?.join(", ") || "N/A",
                    "Status": appointment.status || "N/A",
                };
            })
        );
        XLSX.utils.book_append_sheet(workbook, appointmentSheet, "Appointments");
    } else {
        console.log("No data found in Appointments.");
    }

    // Check if data exists in patients
    if (patients.length > 0) {
        console.log("Preparing Patients Sheet...");
        const patientSheet = XLSX.utils.json_to_sheet(
            patients.map(patient => ({
                "Name": `${patient.name} ${patient.lastName}` || "Unknown",
                "Age": patient.age || "N/A",
                "Birthday": patient.birthday || "N/A",
                "Gender": patient.gender || "N/A",
                "Phone Number": patient.phone || "N/A",
            }))
        );
        XLSX.utils.book_append_sheet(workbook, patientSheet, "Patients");
    } else {
        console.log("No data found in Patients.");
    }

    console.log("Writing Excel file...");
    XLSX.writeFile(workbook, "Data_Report.xlsx");
}



 // Function to open a specific table and close others
 function openTableHandler(table: 'patients' | 'appointments' | 'prescriptions' | 'monthlyAppointments') {
        if (openTable === table) {
            openTable = null; // Close the table if it's already open
        } else {
            openTable = table; // Open the selected table
        }
    }
    async function fetchPatients() {
    const patientsCollection = collection(db, "patientProfiles");
    const patientDocs = await getDocs(patientsCollection);
    patients = patientDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    openTableHandler('patients'); // Open patients table
}
    
    
async function fetchGraphData() {
    try {
        const appointmentsCollection = collection(db, "appointments");
        const appointmentDocs = await getDocs(appointmentsCollection);

        const appointmentCountByDate: Record<string, number> = {};
        const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
        const currentYear = new Date().getFullYear();

        // Loop through appointments and group them by date for the current month
        appointmentDocs.forEach((doc) => {
            const data = doc.data();
            const appointmentDate = new Date(data.date); // Assuming the date is stored in a field called "date"
            const appointmentMonth = appointmentDate.getMonth() + 1; // Get month (0-indexed)
            const appointmentYear = appointmentDate.getFullYear(); // Get year

            // Check if the appointment is in the current month and year
            if (appointmentMonth === currentMonth && appointmentYear === currentYear) {
                const dateString = appointmentDate.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
                if (appointmentCountByDate[dateString]) {
                    appointmentCountByDate[dateString]++;
                } else {
                    appointmentCountByDate[dateString] = 1;
                }
            }
        });

        // Now fill the data arrays for the charts
        dateLabels = Object.keys(appointmentCountByDate); // Dates are the labels
        newAppointmentsPerDay = Object.values(appointmentCountByDate); // Count of new appointments per day

        // Calculate cumulative total patients per day
        totalPatientsPerDay = [];
        let cumulativeTotal = 0;

        // Fetch patients for the current month
        const patientCollection = collection(db, "patientProfiles");
        const patientDocs = await getDocs(patientCollection);
        const patientCountByDate: Record<string, number> = {};

        // Loop through patients and group them by registration date for the current month
        patientDocs.forEach((doc) => {
            const data = doc.data();
            const registrationDate = new Date(data.registrationDate); // Assuming patients have a "registrationDate" field
            const registrationMonth = registrationDate.getMonth() + 1; // Get month (0-indexed)
            const registrationYear = registrationDate.getFullYear(); // Get year

            // Check if the registration is in the current month and year
            if (registrationMonth === currentMonth && registrationYear === currentYear) {
                const dateString = registrationDate.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
                if (patientCountByDate[dateString]) {
                    patientCountByDate[dateString]++;
                } else {
                    patientCountByDate[dateString] = 1;
                }
            }
        });

        // Calculate cumulative total patients per day
        dateLabels.forEach(date => {
            cumulativeTotal += patientCountByDate[date] || 0; // Add the number of patients registered on that date
            totalPatientsPerDay.push(cumulativeTotal); // Push the cumulative total to the array
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
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
async function fetchMonthlyAppointments() {
    try {
        const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
        const currentYear = new Date().getFullYear();

        const appointmentsCollection = collection(db, "appointments");
        const appointmentDocs = await getDocs(appointmentsCollection);

        // Filter appointments for the current month and year
        const filteredAppointments = appointmentDocs.docs.filter(appointmentDoc => {
            const data = appointmentDoc.data();
            const appointmentDate = new Date(data.date); // Assuming date is in a valid format
            return appointmentDate.getMonth() + 1 === currentMonth && appointmentDate.getFullYear() === currentYear;
        });

        // Fetch patient names for the filtered appointments
        monthlyAppointments = await Promise.all(filteredAppointments.map(async (appointmentDoc) => {
            const appointmentData = appointmentDoc.data();
            const patientId = appointmentData.patientId;

            const patientDocRef = doc(db, "patientProfiles", patientId);
            const patientDocSnap = await getDoc(patientDocRef);
            const patientData = patientDocSnap.data() as PatientData; // Cast to PatientData

            const patientName = patientData ? `${patientData.name} ${patientData.lastName}` : "Unknown Patient";

            return { id: appointmentDoc.id, ...appointmentData, patientName }; // Include patient name
        }));

       
    } catch (error) {
        console.error("Error fetching monthly appointments:", error);
    }
    openTableHandler('monthlyAppointments'); // Open monthly appointments table

}

async function fetchAppointmentsData() {
    const appointmentsCollection = collection(db, "appointments");
    const appointmentDocs = await getDocs(appointmentsCollection);
    appointments = appointmentDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    openTableHandler('appointments'); // Open appointments table
}

async function fetchPrescriptionsData() {
    console.log("Fetching prescriptions...");

    try {
        // Fetch prescriptions from the 'prescriptions' collection
        const prescriptionsSnapshot = await getDocs(collection(db, "prescriptions"));
        
        // Check if any prescriptions were fetched
        if (prescriptionsSnapshot.empty) {
            console.log("No prescriptions found!");
            return [];
        }

        // Map through the fetched documents to extract prescription data
        const prescriptions = prescriptionsSnapshot.docs.map(doc => {
            const data = doc.data();

            console.log("Prescription Data:", data);

            // Return the prescription details in a structured format
            return {
                id: doc.id,  // Prescription document ID
                appointmentId: data.appointmentId || 'No appointment ID',  // Handle missing appointmentId
                prescriber: data.prescriber || 'No prescriber',  // Handle missing prescriber
                medicines: data.medicines || [],  // Ensure medicines is an array even if empty
                createdAt: data.createdAt || 'No creation date',  // Handle missing createdAt
            };
        });

        console.log("Fetched Prescriptions:", prescriptions);
        return prescriptions;

    } catch (error) {
        console.error("Error fetching prescriptions:", error);
        return [];
    }
}


    // Fetch appointments and patient names
    async function fetchAppointments() {
    console.log("Fetching appointments..."); // Add this line

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

        openTableHandler('appointments'); // Open appointments table after fetching
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
        margin-left: 12.8rem;
        flex-grow: 1;
        padding-right: 1rem;
        padding-top: 0.3rem;
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
        margin-top: -0.6rem;
        margin-bottom: -0.7rem;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    flex: 1 1 calc(25% - 15px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #08B8F3, #005b80);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.card:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(2, 136, 209, 0.5);
    border: 1px solid #0288d1;
    transition: box-shadow 0.2s ease, border 0.2s ease;
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

    table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #00a2e8; /* Green background for header */
    color: white; /* White text for header */
}

tbody tr:nth-child(even) {
    background-color: #f2f2f2; /* Light gray for even rows */
}

tbody tr:hover {
    background-color: #ddd; /* Light gray on hover */
}


.download-button {
       background: linear-gradient(90deg, #08B8F3, #005b80);
        color: rgb(255, 255, 255);
        font-family: 'Roboto', sans-serif;
        font-weight: 550;
        padding: 0.5rem 1rem;
        border-radius: 0.3rem;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.582);
        display: flex;
        align-items: center;
        transition: background 0.3s ease, transform 0.2s ease;
        border: none;
        cursor: pointer;
        outline: none;
        margin-top: -2.2rem;
        margin-left: 4.2rem;
        margin-bottom: 1rem;
}

.download-button:hover {
    background: linear-gradient(90deg, #005b80, #08B8F3);
        transform: translateY(2px);}

</style>

<div class="dashboard">
    <div class="sidebar {isCollapsed ? 'collapsed' : ''}">
        <Sidebar {isCollapsed} {toggleSidebar} {logout} />
    </div>

    <div class="content">
        <div class="summary">
            <h2>Data Summary</h2>
            <select bind:value="{exportType}" class="download-select">
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
            </select>
            <button on:click="{generateReport}" class="download-button">Download Report</button>
            

        </div>
        <div class="cards">
           
            <button class="card" on:click="{fetchMonthlyAppointments}" type="button">
                <span class="icon fas fa-calendar-day"></span>
                <div class="text">
                    <h3>{stats.monthlyAppointments}</h3>
                    <p>This Month's Appointments</p>
                </div>
            </button>
            <button class="card" on:click="{fetchAppointments}" type="button">
                <span class="icon fas fa-calendar-alt"></span>
                <div class="text">
                    <h3>{stats.newAppointments}</h3>
                    <p>Total Appointments</p>
                </div>
            </button>
            <button class="card" on:click="{fetchPatients}" type="button" aria-label="View total patients">
                <span class="icon fas fa-users"></span>
                <div class="text">
                    <h3>{stats.totalPatients}</h3>
                    <p>Total Patients</p>
                </div>
            </button>
            
            <button class="card" on:click="{() => goto('/prescription')}" type="button" aria-label="View total prescriptions">
                <span class="icon fas fa-file-prescription"></span>
                <div class="text">
                    <h3>{stats.totalPrescriptions}</h3>
                    <p>Total Prescriptions</p>
                </div>
            </button>
            {#if openTable === 'patients'}
            <table>
                <thead>
                    <tr>
                        <th>Patient Name</th> <!-- Change the header to "Full Name" -->
                    </tr>
                </thead>
                <tbody>
                    {#each patients as patient}
                        <tr>
                            <td>{patient.name} {patient.lastName}</td> <!-- Concatenate name and lastName -->
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
        
        {#if openTable === 'monthlyAppointments'}
            <table>
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {#each monthlyAppointments as appointment}
                        <tr>
                            <td>{appointment.patientName}</td>
                            <td>{appointment.date}</td>
                            <td>{appointment.time}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
        
        {#if openTable === 'appointments'}
            <table>
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {#each appointments as appointment}
                        <tr>
                            <td>{appointment.patientName}</td>
                            <td>{appointment.date}</td>
                            <td>{appointment.time}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
        
        {#if openTable === 'prescriptions'}
    <table>
        <thead>
            <tr>
                <th>Patient Name</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            {#each prescriptions as prescription}
                <tr>
                    <td>{prescription.patientName}</td>
                    <td>{prescription.medication}</td>
                    <td>{prescription.dosage}</td>
                    <td>{prescription.date}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}  
            <div class="chart">
                <div>
                    <h2>New Appointments</h2>
                    <canvas id="barChart"></canvas>
                </div>
            </div>
            
        </div>
        
    </div>
</div>
