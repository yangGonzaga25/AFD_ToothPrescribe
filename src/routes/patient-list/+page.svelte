<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the Sidebar component
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
    import { EditSolid,EyeOutline, TrashBinSolid } from 'flowbite-svelte-icons'; // Import Flowbite icons
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);  // Initialize Firestore

    let isCollapsed = false;
    let currentPage = 1;
    let patientsPerPage = 10;

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; // Redirect to main landing page
    }

    type Patient = {
        lastName: any;
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
                lastName: doc.data().lastName || '',
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

    // Get patients for the current page
    function getPaginatedPatients() {
        const filteredPatients = filterPatients();
        const startIndex = (currentPage - 1) * patientsPerPage;
        const endIndex = startIndex + patientsPerPage;
        return filteredPatients.slice(startIndex, endIndex);
    }

    // Function to change the current page
    function goToPage(page: number) {
        if (page < 1 || page > totalPages()) return;
        currentPage = page;
    }

    // Function to calculate total pages
    function totalPages() {
        return Math.ceil(filterPatients().length / patientsPerPage);
    }

    // Function to edit a patient's details
    async function editPatient(id: string) {
        console.log(`Editing patient with ID: ${id}`);
        // Redirect or show an edit form here
    }

    // Function to delete a patient
    async function deletePatient(id: string) {
        try {
            await deleteDoc(doc(db, "patientProfiles", id));
            console.log(`Patient with ID: ${id} deleted successfully`);
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
    overflow: hidden; /* Prevent internal scrollbars on the dashboard */
    }
    .content {
    flex-grow: 1;
    background-color: #f8f8f8;
    padding: 20px;
    overflow: scroll; /* Allow content to scroll */
    margin-left: -10rem;
    transition: margin-left 0.3s ease;
    max-height: 100vh; /* Prevent content from overflowing beyond viewport */
}   
    /* Hide the scrollbar */
.content::-webkit-scrollbar {
    display: none; /* Hide scrollbar */
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
    .view-button {
    display: flex;                /* Use flexbox to align items */
    align-items: center;          /* Vertically center the items */
    padding: 6px 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    }

    .view-button:hover {
        background-color: #45a049;
    }

    .view-button span {
        margin-left: 4px;             /* Add some space between the icon and the text */
    }

    
</style>

<div class="dashboard">
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <div class="content" style="margin-left: {isCollapsed ? '-1rem' : '-2.4em'};">
        {#if isLoading}
            <p>Loading patients...</p>
        {:else if error}
            <p style="color: red;">{error}</p>
        {:else}
            <div style="padding: 40px; width: 100%; max-width: 50rem; margin: auto; margin-top: 50px; border-radius: 0.5rem; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background-color: white;">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center">
                        <img src="/images/logo(landing).png" alt="Logo" class="w-24 h-18 mr-4" />
                        <div>
                            <h1 class="font-bold text-lg">AF DOMINIC</h1>
                            <p class="text-sm">DENTAL CLINIC</p>
                            <p class="text-sm">#46 12th Street, Corner Gordon Ave New Kalalake</p>
                            <p class="text-sm">afdominicdentalclinic@gmail.com</p>
                            <p class="text-sm">0932 984 9554</p>
                        </div>
                    </div>
                </div>

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
                    <Table shadow>
                        <TableHead>
                            <TableHeadCell>Full Name</TableHeadCell>
                            <TableHeadCell>Patient Address</TableHeadCell>
                            <TableHeadCell>Phone Number</TableHeadCell>
                            <TableHeadCell>Patient Age</TableHeadCell>
                            <TableHeadCell>Action</TableHeadCell>
                        </TableHead>
                        <TableBody tableBodyClass="divide-y">
                            {#each getPaginatedPatients() as patient (patient.id)}
                            <TableBodyRow>
                                <TableBodyCell>{patient.name} {patient.lastName}</TableBodyCell>
                                <TableBodyCell>{patient.address}</TableBodyCell>
                                <TableBodyCell>{patient.phone}</TableBodyCell>
                                <TableBodyCell>
                                    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">{patient.age}</div>
                                </TableBodyCell>
                                <TableBodyCell> 
                                    <button class="view-button">
                                        <EyeOutline class="w-5 h-5 mr-1" />
                                        <span>View</span>
                                    </button>
                                    
                                  
                                </TableBodyCell>
                            </TableBodyRow>
                            {/each}
                        </TableBody>
                    </Table>

                    <div class="pagination">
                        <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>&laquo;</button>
                        {#each Array(totalPages()) as _, i}
                            <button on:click={() => goToPage(i + 1)} class={currentPage === i + 1 ? '' : ''}>{i + 1}</button>
                        {/each}
                        <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages()}>&raquo;</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
