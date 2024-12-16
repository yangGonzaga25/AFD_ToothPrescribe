<script lang="ts">
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs } from 'firebase/firestore'; // Firebase Firestore functions
    import { goto } from '$app/navigation'; // To programmatically navigate
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let patients: any[] = [];
    let prescribedPatients: any[] = [];
    let searchTerm = '';  // Holds the search term entered by the user
    let filteredPatients: any[] = [];

    // Fetch all patients from Firestore
    async function fetchPatients() {
        const querySnapshot = await getDocs(collection(db, "patientProfiles"));
        patients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            address: doc.data().address,
            phone: doc.data().phone,
            age: doc.data().age,
            instructions: doc.data().instructions || '',
            medications: doc.data().medications || ''
        }));
        filteredPatients = [...patients];  // Initialize filteredPatients to all patients initially
    }

    // Fetch prescribed patients and map to patient profiles
    async function fetchPrescribedPatients() {
        const prescriptionsSnapshot = await getDocs(collection(db, "prescriptions"));
        const prescriptions = prescriptionsSnapshot.docs.map(doc => ({
            id: doc.id,
            patientId: doc.data().patientId, // Assuming prescriptions reference patient by ID
            instructions: doc.data().instructions || '',
            medications: doc.data().medications || ''
        }));

        // Match prescriptions to patients by ID
        prescribedPatients = prescriptions.map(prescription => {
            const patient = patients.find(p => p.id === prescription.patientId);
            return {
                id: prescription.id,
                name: patient?.name || 'Unknown',
                address: patient?.address || 'Unknown',
                phone: patient?.phone || 'Unknown',
                age: patient?.age || 'Unknown',
                instructions: prescription.instructions,
                medications: prescription.medications
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
        if (id) {
            goto(`/add-prescription1/${id}`);
        }
    }
</script>

<style>
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');
    
    .center-container {
        display: grid;
        place-items: center; /* Center both horizontally and vertically */
        height: 100vh; /* Full viewport height */
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
    
</style>

<div class="center-container">
  <div style="padding: 40px; width: 100%; max-width: 50rem; margin: auto; margin-top: 50px; border-radius: 0.5rem; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background-color: white;">
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
                            <td>{patient.name}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.age}</td>
                            <td><button on:click={() => alert(`View Prescription for ${patient.name}`)}>View Prescription</button></td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>
