<script lang="ts">
    import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte'; 
    import Sidebar from '../sidenav/+page.svelte'; // Import the Sidebar component
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Firebase Firestore functions
    import { goto } from '$app/navigation'; // To programmatically navigate
    import { EyeOutline } from 'flowbite-svelte-icons';
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    let isCollapsed = false;
    let patients: any[] = [];
    let prescribedPatients: any[] = [];
    let searchTerm = '';  // Holds the search term entered by the user
    let filteredPatients: any[] = [];
    
    let showModal = false; // Controls the visibility of the modal
    let currentPrescription: any = {}; // Stores the prescription details to be displayed in the modal

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; // Redirect to main landing page
    }
    
    // Fetch all patients from Firestore
    async function fetchPatients() {
    try {
        const querySnapshot = await getDocs(collection(db, "patientProfiles"));
        patients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            lastName: doc.data().lastName,
            address: doc.data().address,
            phone: doc.data().phone,
            age: doc.data().age,
            instructions: doc.data().instructions || '',
            medication: doc.data().medication || ''
        }));
        filteredPatients = [...patients];
    } catch (error) {
        console.error("Error fetching patients:", error);
    }
}

    // Fetch prescribed patients and map to patient profiles
   // Fetch prescribed patients and map to patient profiles
   async function fetchPrescribedPatients() {
    const prescriptionsSnapshot = await getDocs(collection(db, "prescriptions"));
    const prescriptions = prescriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        patientId: doc.data().patientId,
        instructions: doc.data().instructions || '',
        medications: doc.data().medication || '',
        dateVisited: doc.data().dateVisited || '',
        prescriber: doc.data().prescriber || '',
        qtyRefills: doc.data().qtyRefills || ''
    }));

    // Fetch patient details from another collection (assuming you have a patients collection)
    const patientsSnapshot = await getDocs(collection(db, "patientProfiles"));
    const patients = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,           // Assuming 'name' is the first name
        lastName: doc.data().lastName,   // Assuming 'lastName' is the last name
        address: doc.data().address,
        phone: doc.data().phone,
        age: doc.data().age
    }));

    // Match prescriptions to patients by ID and map their details
    prescribedPatients = prescriptions.map(prescription => {
        const patient = patients.find(p => p.id === prescription.patientId);
        return {
            id: prescription.id,
            fullName: `${patient?.name || ''} ${patient?.lastName || ''}`,  // Concatenating first and last name
            address: patient?.address || 'Unknown',
            phone: patient?.phone || 'Unknown',
            age: patient?.age || 'Unknown',
            instructions: prescription.instructions,
            medications: prescription.medications,
            dateVisited: prescription.dateVisited,
            prescriber: prescription.prescriber,
            qtyRefills: prescription.qtyRefills
        };
    });
}



    // Filter patients based on search term
    function filterPatients() {
        if (searchTerm.trim() === '') {
            filteredPatients = []; // Hide table if search is empty
        } else {
            filteredPatients = patients.filter(patient =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.phone.includes(searchTerm) ||
                patient.age.toString().includes(searchTerm)
            );
        }
    }

    // Fetch patients and prescribed patients on mount
    onMount(async () => {
        await fetchPatients();
        await fetchPrescribedPatients();
    });

    function addPrescription(id: string | undefined) {
    // Check if the patient is already prescribed
    const isPrescribed = prescribedPatients.some(patient => patient.id === id);
    if (isPrescribed) {
        alert("This patient has already been prescribed.");
    } else {
        if (id) {
            goto(`/add-prescription1/${id}`);
        }
    }
}


    function openPrescriptionModal(patient: any) {
        currentPrescription = patient;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        currentPrescription = {};
    }
</script>

<style>
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');
    
    .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    input {
        width: 100%;
        padding: 8px;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    table, th, td {
        border: 1px solid #ddd;
    }

    th, td {
        padding: 8px;
        text-align: left;
    }

    button {
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background-color: #45a049;
    }

    /* Modal styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 5px;
        max-width: 600px;
        width: 100%;
    }

    .close-btn {
        background-color: red;
        color: white;
        padding: 8px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
    }

    .close-btn:hover {
        background-color: darkred;
    }
    
</style>
<div class="dashboard" style="display: flex; flex-direction: row;">
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />
  
    <div style="padding: 40px; width: 100%; max-width: 50rem; height: 600px; margin: 100px auto; margin-top: 30px; border-radius: 0.5rem; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background-color: white; overflow-y: auto;">

        <style>
            /* Hide the scrollbar */
            div[style*="overflow-y: auto"]::-webkit-scrollbar {
                display: none;
            }
        </style>

        <!-- Header -->
        <div class="flex justify-between items-start">
            <div class="flex items-center">
                <img src="/images/logo(landing).png" alt="Sun with dental logo" class="w-24 h-18 mr-4" />
                <div>
                    <h1 class="font-bold text-lg">AF DOMINIC</h1>
                    <p class="text-sm">DENTAL CLINIC</p>
                    <p class="text-sm">#46 12th Street, Corner Gordon Ave New Kalalake</p>
                    <p class="text-sm">afdominicdentalclinic@gmail.com</p>
                    <p class="text-sm">0932 984 9554</p>
                </div>
            </div>
        </div>

        <!-- Search Bar -->
        <input type="text" placeholder="Search Patients..." bind:value={searchTerm} on:input={filterPatients} />

        <!-- Patient Table (Filtered) -->
        {#if searchTerm.trim() !== '' && filteredPatients.length > 0}
            <h3>All Patients</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredPatients as patient (patient.id)}
                        <tr>
                            <td>{patient.name}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.age}</td>
                            <td><button on:click={() => addPrescription(patient.id)}>Add Prescription</button></td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else if searchTerm.trim() !== ''}
            <p>No patients found matching the search term.</p>
        {/if}

        <!-- Prescribed Patients Table -->
        <h3>Prescribed Patients</h3>
        {#if prescribedPatients.length === 0}
            <p>No prescribed patients found.</p>
        {:else}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Prescription</th>
                    </tr>
                </thead>
                <tbody>
                    {#each prescribedPatients as patient (patient.id)}
                        <tr>
                            <td>{patient.fullName}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.age}</td>
                            <td> <button 
                                on:click={() => openPrescriptionModal(patient)} 
                                class="flex items-center bg-none border-none cursor-pointer text-blue-500 hover:text-700"
                              >
                                <EyeOutline class="w-5 h-5 mr-1" /> <!-- Icon with small margin-right -->
                                <span>View</span> <!-- Text -->
                              </button></td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>

{#if showModal}
    <div class="modal">
        <div class="modal-content">
            <h2>Prescription for {currentPrescription.fullName}</h2>  <!-- Displaying full name -->
            <p><strong>address: </strong> {currentPrescription.address}</p>
            <p><strong>age:</strong> {currentPrescription.age}</p>
            <p><strong>phone:</strong> {currentPrescription.phone}</p>

            <!-- Prescription Details Table -->
            <Table class="mt-2">
                <TableHead>
                    <TableHeadCell>Date Visited</TableHeadCell>
                    <TableHeadCell>Medication</TableHeadCell>
                    <TableHeadCell>Instructions</TableHeadCell>
                    <TableHeadCell>Qty/Refills</TableHeadCell>
                    <TableHeadCell>Prescriber</TableHeadCell>
                </TableHead>
                <TableBody>
                    <TableBodyRow>
                        <TableBodyCell style="text-align: center;">{currentPrescription.dateVisited || 'Not available'}</TableBodyCell>
                        <TableBodyCell style="text-align: center;">{currentPrescription.medications || 'Not available'}</TableBodyCell>
                        <TableBodyCell style="text-align: center;">{currentPrescription.instructions || 'Not available'}</TableBodyCell>
                        <TableBodyCell style="text-align: center;">{currentPrescription.qtyRefills || 'Not available'}</TableBodyCell>
                        <TableBodyCell style="text-align: center;">{currentPrescription.prescriber || 'Not available'}</TableBodyCell>
                    </TableBodyRow>
                </TableBody>
            </Table>

            <button class="close-btn" on:click={closeModal}>Close</button>
        </div>
    </div>
{/if}
