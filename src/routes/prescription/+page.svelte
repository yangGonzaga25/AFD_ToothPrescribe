<script lang="ts">
    import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte'; 
    import Sidebar from '../sidenav/+page.svelte'; 
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; 
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs } from 'firebase/firestore'; 
    import { goto } from '$app/navigation'; 
    import { EyeOutline } from 'flowbite-svelte-icons'; 

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let isCollapsed = false;
    let patients: any[] = [];
    let prescribedPatients: any[] = [];
    let searchTerm = '';  
    let filteredPatients: any[] = [];
    
    let showModal = false; 
    let currentPatient: any = {}; 

    let sortColumn = '';
    let sortDirection = 'asc'; 

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; 
    }
    
    function sortPatients(column: string) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        filteredPatients.sort((a, b) => {
            if (a[column] < b[column]) return sortDirection === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    function filterPatients() {
    if (searchTerm.trim() === '') {
        filteredPatients = [...patients];
    } else {
        filteredPatients = patients.filter(patient =>
            Object.values(patient).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchTerm.toLowerCase());
                }
                if (typeof value === 'number') {
                    return value.toString().includes(searchTerm);
                }
                return false;
            })
        );
    }
}

function filterAndSortPatients() {
    // Step 1: Filter patients based on the search term
    if (searchTerm.trim() === '') {
        filteredPatients = [...patients];
    } else {
        filteredPatients = patients.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Step 2: Sort the filtered patients alphabetically
    filteredPatients.sort((a, b) => {
        if (a.name < b.name) return sortDirection === 'asc' ? -1 : 1;
        if (a.name > b.name) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

async function fetchPatients() {
        try {
            const querySnapshot = await getDocs(collection(db, "patientProfiles"));
            patients = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                lastName: doc.data().lastName,
                address: doc.data().address,
                phone: doc.data().phone,
                age: doc.data().age
            }));
            filteredPatients = [...patients];
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    }

    

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

        // Map prescriptions to patients and group prescriptions by patient
        prescribedPatients = patients.map(patient => {
            const patientPrescriptions = prescriptions.filter(prescription => prescription.patientId === patient.id);
            return {
                id: patient.id,
                fullName: `${patient.name} ${patient.lastName}`,  // Concatenating first and last name
                address: patient.address,
                phone: patient.phone,
                age: patient.age,
                prescriptions: patientPrescriptions
            };
        });
    }



    onMount(async () => {
    await fetchPatients();
    await fetchPrescribedPatients();
    filterAndSortPatients(); // Initialize with default settings
});


    // Add new prescription function
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



    // Open the modal to view prescriptions of the selected patient
    function openPrescriptionModal(patient: any) {
        currentPatient = prescribedPatients.find(p => p.id === patient.id) || {};
        showModal = true;
    }

    // Close the modal
    function closeModal() {
        showModal = false;
        currentPatient = {};
    }
</script>


<style>
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');
    :global(.dashboard) {
        display: flex;
        height: 100vh;
        overflow: hidden;
        font-family: 'Roboto', sans-serif;
    }


    /* Header Styling */
    :global(.content-header) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        font-weight: 600;
    }

    /* Table Container */
    :global(.table-container) {
        border-radius: 10px;
        padding: 30px;
        overflow-x: auto;
        width: 100%;
        max-width: 1200px;
        margin: auto;
        height: auto;
    }

    /* Search Bar */
    :global(.search-bar) {
        margin-bottom: 30px;
        width: 100%;
    }

    :global(.search-input) {
        width: 100%;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #ccc;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.3s ease;
    }

    :global(.search-input:focus) {
        border-color: #08B8F3;
        outline: none;
    }

    /* Pagination */
    :global(.pagination) {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }

    :global(.pagination button) {
        padding: 10px 16px;
        margin: 0 5px;
        font-size: 1.1rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #08B8F3;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

   

    :global(.pagination button:disabled) {
        background-color: #d6d6d6;
        cursor: not-allowed;
    }

    /* Table Styling */
    :global(table) {
        width: 100%;
        border-collapse: collapse;
    }

    :global(th), :global(td) {
        padding: 15px;
        text-align: left;
        font-size: 1rem;
        border-bottom: 1px solid #ddd;
    }

    :global(th) {
        background-color: #08B8F3; /* Bright blue for table headers */
        color: white;
        font-weight: bold;
    }

    /* Alternate Row Colors */
    :global(tr:nth-child(odd)) {
        background-color: #ffffff;
    }

    :global(tr:nth-child(even)) {
        background-color: #f0f8ff; /* Soft blue for alternate rows */
    }

    /* Hover Effect on Rows */
    :global(tr:hover) {
        background-color: #f1f1f1;
        cursor: pointer;
    }

    /* Container Styling */
    :global(.container) {
        padding: 20px;
        max-width: 100%;
        margin: auto;
        margin-top: 40px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        background-color: #fff;
    }

    /* Logo Styling */
    :global(.logo-img) {
        width: 50px;
        height: auto;
        margin-right: 15px;
    }

    /* Formal Text Styling */
    :global(.text-sm) {
        font-size: 0.95rem;
        color: #333;
    }

    :global(h1, h2) {
        font-size: 1.6rem;
        color: #333;
        margin: 10px 0;
        font-weight: 600;
    }

    /* Text Styling for Clinic Info */
    :global(.clinic-info) {
        font-size: 0.95rem;
        color: #666;
    }

    :global(.clinic-info p) {
        margin: 5px 0;
    }

    /* Footer */
    :global(.footer) {
        margin-top: 50px;
        padding: 10px;
        text-align: center;
        font-size: 0.85rem;
        color: #888;
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
    
  


.search-and-sort-container {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 1200px;
    margin: auto;
}

.search-input {
    flex: 1;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
}

.search-input:focus {
    border-color: #08B8F3;
    outline: none;
}

.sort-dropdown {
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    background-color: #fff;
    color: #333;
    transition: border-color 0.3s ease;
}

.sort-dropdown:focus {
    border-color: #08B8F3;
    outline: none;
}

    
</style>
<div class="dashboard">
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <div class="content" style="margin-left: {isCollapsed ? '-1rem' : '-2.4em'};">

  
        <div class="container">
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
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
        <div class="search-and-sort-container">
            <input
                type="text"
                placeholder="Search patients..."
                bind:value={searchTerm}
                on:input={filterAndSortPatients}
                class="search-input"
            />
            <select bind:value={sortDirection} on:change={filterAndSortPatients} class="sort-dropdown">
                <option value="asc">Sort by Name: A–Z</option>
                <option value="desc">Sort by Name: Z–A</option>
            </select>
        </div>
        
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th on:click={() => sortPatients('name')}>Name</th>
                        <th on:click={() => sortPatients('age')}>Age</th>
                        <th on:click={() => sortPatients('address')}>Address</th>
                        <th on:click={() => sortPatients('phone')}>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredPatients as patient}
                        <tr>
                            <td>{patient.name}</td>
                            <td>{patient.age}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>
                                <button on:click={() => openPrescriptionModal(patient)}>
                                    View Prescriptions
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        
    </div>
</div>
        <!-- Modal Content -->
        {#if showModal}
            <div class="modal fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
                <div class="modal-content bg-white p-6 rounded-lg shadow-lg w-3/4 md:w-1/2">
                    <h3 class="text-xl font-semibold mb-4">Prescription Details</h3>
                    <p><strong>Patient Name:</strong> {currentPatient.fullName}</p>
                    <p><strong>Address:</strong> {currentPatient.address}</p>
                    <p><strong>Phone:</strong> {currentPatient.phone}</p>
                    <p><strong>Age:</strong> {currentPatient.age}</p>
        
                    <!-- Display all prescriptions in a table -->
                    <Table shadow style="width: 100%; height: auto;">
                        <TableHead style="background-color: #08B8F3; color: white;">
                            <TableHeadCell class="border border-gray-300">Instructions</TableHeadCell>
                            <TableHeadCell class="border border-gray-300">Medications</TableHeadCell>
                            <TableHeadCell class="border border-gray-300">Date Visited</TableHeadCell>
                            <TableHeadCell class="border border-gray-300">Prescriber</TableHeadCell>
                            <TableHeadCell class="border border-gray-300">Qty Refills</TableHeadCell>
                        </TableHead>
                        <TableBody tableBodyClass="divide-y">
                            {#each currentPatient.prescriptions as prescription}
                                <TableBodyRow class="table-body-row">
                                    <TableBodyCell class="text-center">{prescription.instructions}</TableBodyCell>
                                    <TableBodyCell class="text-center">{prescription.medications}</TableBodyCell>
                                    <TableBodyCell class="text-center">{prescription.dateVisited}</TableBodyCell>
                                    <TableBodyCell class="text-center">{prescription.prescriber}</TableBodyCell>
                                    <TableBodyCell class="text-center">{prescription.qtyRefills}</TableBodyCell>
                                </TableBodyRow>
                            {/each}
                        </TableBody>
                    </Table>
        
                    <!-- Add New Prescription Button -->
                    <button
                        on:click={() => goto(`/add-prescription1/${currentPatient.id}`)}
                        class="bg-green-500 text-white py-2 px-4 rounded mt-4 hover:bg-green-600"
                    >
                        Add New Prescription
                    </button>
        
                    <!-- Close Button -->
                    <button 
                        on:click={closeModal} 
                        class="bg-red-500 text-white py-2 px-4 rounded mt-4 hover:bg-red-600"
                    >
                        Close
                    </button>
                </div>
            </div>
            
        {/if}
    </div>