<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; // Import the Sidebar component
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';  // Import Firebase authentication methods

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);  // Initialize Firestore
    const auth = getAuth(app);  // Initialize Firebase authentication

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
        instructions?: string;
        medications?: string;
    };

    let patients: Patient[] = [];
    let searchTerm = '';
    let isLoading = true;
    let error: string | null = null;
    let addedPatients: Patient[] = [];

    // Fetch patients from Firestore
    async function fetchPatients() {
        try {
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
        } catch (err) {
            error = (err as Error).message;
        } finally {
            isLoading = false;
        }
    }

    // Fetch added prescriptions from Firestore (for persistence across page reloads)
    async function fetchAddedPrescriptions() {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            console.error("No user logged in.");
            return;
        }

        try {
            const querySnapshot = await getDocs(collection(db, "prescriptions"));
            addedPatients = querySnapshot.docs
                .filter(doc => doc.data().userId === userId)
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().patientName,
                    address: doc.data().patientAddress,
                    phone: doc.data().patientPhone,
                    age: doc.data().patientAge,
                    instructions: doc.data().instructions || '',
                    medications: doc.data().medications || ''
                }));
        } catch (err) {
            console.error("Error fetching prescriptions:", err);
        }
    }

    onMount(() => {
        fetchPatients();
        fetchAddedPrescriptions();  // Fetch previously added prescriptions
    });

    // Filter patients based on search term
    function filterPatients() {
        return patients.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone.includes(searchTerm) ||
            patient.age.toString().includes(searchTerm)
        );
    }

    // Add patient to the list of added patients
    function addPatient(patient: Patient) {
        addedPatients = [...addedPatients, patient];
        addPrescription(patient);  // Add prescription when a patient is added
    }

    // Save patient details to Firestore
    async function savePatientDetails(patient: Patient) {
        try {
            const docRef = doc(db, "patientProfiles", patient.id);
            await updateDoc(docRef, {
                instructions: patient.instructions || '',
                medications: patient.medications || ''
            });
            console.log(`Patient ${patient.id} updated successfully.`);
        } catch (err) {
            console.error("Error updating patient details:", err);
        }
    }

    // Delete a patient from Firestore
    async function deletePatient(id: string) {
        try {
            await deleteDoc(doc(db, "patientProfiles", id));
            patients = patients.filter(patient => patient.id !== id);
            console.log(`Patient with ID: ${id} deleted successfully.`);
        } catch (err) {
            console.error("Error deleting patient:", err);
        }
    }

    // Add prescription to Firestore linked to current user
    async function addPrescription(patient: Patient) {
        const userId = auth.currentUser?.uid;  // Get the current user's ID

        if (!userId) {
            console.error("No user logged in.");
            return;
        }

        try {
            const prescriptionRef = doc(db, "prescriptions", patient.id);
            await setDoc(prescriptionRef, {
                patientId: patient.id,
                userId: userId,  // Add the current user's ID to the prescription
                patientName: patient.name,
                patientAddress: patient.address,
                patientPhone: patient.phone,
                patientAge: patient.age,
                instructions: patient.instructions || '',
                medications: patient.medications || '',
                timestamp: new Date()
            });

            console.log(`Prescription for patient ${patient.name} added successfully.`);
        } catch (err) {
            console.error("Error adding prescription:", err);
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
        margin-left: -10rem;
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
</style>

<div class="dashboard">
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

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
                                <button on:click={() => addPatient(patient)}>Add</button>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <div class="content-header">
                <h2>Added Patients</h2>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            
                            <th>Patient Name</th>
                            <th>Patient Address</th>
                            <th>Phone Number</th>
                            <th>Patient Age</th>
                            <th>Instructions</th>
                            <th>Medications</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each addedPatients as patient (patient.id)}
                        <tr>
                          
                            <td>{patient.name}</td>
                            <td>{patient.address}</td>
                            <td>{patient.phone}</td>
                            <td>{patient.age}</td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Add instructions"
                                    bind:value={patient.instructions}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Add medications"
                                    bind:value={patient.medications}
                                />
                            </td>
                            <td>
                                <button on:click={() => savePatientDetails(patient)}>Save</button>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
