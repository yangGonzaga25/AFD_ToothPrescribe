<script lang="ts">
   import Sidebar from '../sidenav/+page.svelte'; // Import the Sidebar component
import { onMount } from 'svelte';
import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { EditSolid, TrashBinSolid } from 'flowbite-svelte-icons'; // Import Flowbite icons

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);  // Initialize Firestore

let isCollapsed = false;

function toggleSidebar() {
    isCollapsed = !isCollapsed;
}

function logout() {
    window.location.href = "/"; // Redirect to main landing page
}

type Patient = {
    id: string;
    name: string;
    address: string;
    phone: string;
    age: number;
    // Add other relevant fields as necessary
};

let patients: Patient[] = []; // Explicitly define the type of patients
let searchTerm = '';
let isLoading = true;
let error: string | null = null; // Explicitly define the type of error

// Fetch user data from Firebase Firestore
async function fetchPatients() {
    try {
        const querySnapshot = await getDocs(collection(db, "patientProfiles")); // 'patients' is the Firestore collection name
        patients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            address: doc.data().address,
            phone: doc.data().phone,
            age: doc.data().age
        }));
    } catch (err) {
        error = (err as Error).message; // Type assertion to Error
    } finally {
        isLoading = false;
    }
}

// Call fetchPatients on component mount
onMount(() => {
    fetchPatients();
});

// Function to filter patients based on search term
function filterPatients() {
    return patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.age.toString().includes(searchTerm)
    );
}

// Function to edit a patient's details
async function editPatient(id: string) {
    console.log(`Editing patient with ID: ${id}`);
    // Redirect or show an edit form here, for example:
    // window.location.href = `/editPatient/${id}`;
    // Or, you could open a modal and update the patient details.
}

// Function to delete a patient
// Function to delete a patient
async function deletePatient(id: string) {
    try {
        // Delete the patient from Firestore
        await deleteDoc(doc(db, "patientProfiles", id));
        console.log(`Patient with ID: ${id} deleted successfully`);
        
        // Directly remove the deleted patient from the local 'patients' array
        patients = patients.filter(patient => patient.id !== id);
    } catch (err) {
        console.error("Error deleting patient:", err);
    }
}


</script>

<style>
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
        margin-left: -10rem; /* Move to the left */
        transition: margin-left 0.3s ease;
    }

    .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .table-container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        padding: 20px;
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th, td {
        padding: 12px 15px;
        border: 1px solid #ddd;
    }

    th {
        background-color: #f4f4f4;
        font-weight: bold;
    }

    .search-bar {
        margin-bottom: 15px;
        width: 98.35%;
    }

    .search-input {
        width: 100%;
        padding: 8px;
        border-radius: 5px;
        border: 1px solid #ddd;
        font-size: 1rem;
    }

    .pagination {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }

    .pagination button {
        margin: 0 5px;
        padding: 5px 10px;
        border: 1px solid #ddd;
        background-color: white;
        cursor: pointer;
    }

    .pagination button:hover {
        background-color: #f4f4f4;
    }
</style>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <!-- Main Content -->
    <div class="content" style="margin-left: {isCollapsed ? '-1rem' : '-2.4em'};">
        {#if isLoading}
            <p>Loading patients...</p>
        {:else if error}
            <p style="color: red;">{error}</p>
        {:else}
            <div class="content-header">
                <h1>Patient List</h1>
            </div>
            <div class="search-bar">
                <input
                    type="text"
                    class="search-input"
                    placeholder="Search"
                    bind:value={searchTerm}
                />
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Patient Name</th>
                            <th>Patient Address</th>
                            <th>Phone Number</th>
                            <th>Patient Age</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filterPatients() as patient (patient.id)}
                        <tr>
                            <td>{patient.id}</td>
                            <td>{patient.name}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.age}</td>
                            <td>
                                <!-- Edit and Delete buttons with Flowbite icons -->
                                <button class="action-btn" on:click={() => editPatient(patient.id)}>
                                    <EditSolid class="text-blue-500" /> 
                                </button>
                                <button class="action-btn" on:click={() => deletePatient(patient.id)}>
                                    <TrashBinSolid class="text-red-500" /> 
                                </button>
                                
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
                <div class="pagination">
                    <button disabled>&laquo;</button>
                    <button>1</button>
                    <button>2</button>
                    <button>3</button>
                    <button>&raquo;</button>
                </div>
            </div>
        {/if}
    </div>
</div>
