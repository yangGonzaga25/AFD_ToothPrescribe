<script lang="ts">
  import Sidebar from '../../sidenav/+page.svelte'; 
  import { onMount } from 'svelte';
  import { firebaseConfig } from "$lib/firebaseConfig"; // Import Firebase config
  import { initializeApp } from 'firebase/app';
  import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'; // Firebase Firestore functions
  import { goto } from '$app/navigation'; // To navigate
  import { Label, Input, Textarea, Button, Toast } from 'flowbite-svelte';

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let patientId: string = ''; 
  let patient: any = {};  // Patient details from Firestore
  let firstName: string = '';  // First name of the patient
  let lastName: string = '';  // Last name of the patient
  let address: string = '';  // Address of the patient
  let age: number = 0; // Assuming age is a number
  let dateVisited: string = '';
  let medication: string = '';
  let instructions: string = '';
  let qtyRefills: string = '';
  let prescriber: string = '';
  let prescriptions: any[] = []; // Array to store fetched prescriptions
  let isCollapsed = false;
  let toastMessage: string = '';
  let toastType: 'success' | 'error' | null = null; // Toast message type

  let toggleSidebar = () => {
      isCollapsed = !isCollapsed;
  }

  let logout = () => {
      window.location.href = "/"; // Redirect to main landing page
  }

  // Fetch the patient data based on patientId from the URL
  async function fetchPatientData() {
    try {
      const patientDocRef = doc(db, "patientProfiles", patientId);
      const patientDoc = await getDoc(patientDocRef);
      if (patientDoc.exists()) {
        patient = patientDoc.data();
        firstName = patient.name || '';  // Default to empty if not found
        lastName = patient.lastName || '';
        address = patient.address || '';
        age = patient.age || 0;  // Default age to 0 if not found
      } else {
        console.error("No such patient!");
      }
    } catch (error) {
      console.error('Error fetching patient data: ', error);
    }
  }

  // Fetch past prescriptions for the patient
  async function fetchPrescriptions() {
    try {
      const prescriptionsRef = collection(db, "prescriptions");
      const prescriptionQuery = await getDocs(prescriptionsRef);
      prescriptions = prescriptionQuery.docs
        .filter(doc => doc.data().patientId === patientId) // Filter prescriptions for the patient
        .map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching prescriptions: ', error);
    }
  }

  // Handle form submission with validation
  async function submitPrescription() {
      if (!dateVisited || !medication || !instructions || !qtyRefills || !prescriber) {
          toastMessage = 'Please fill in all fields.'; // Set error message
          toastType = 'error'; // Set toast type to error
          return;
      }

      const prescriptionData = {
          patientId: patientId,
          dateVisited: dateVisited,
          medication: medication,
          instructions: instructions,
          qtyRefills: qtyRefills,
          prescriber: prescriber
      };

      // Save the prescription to Firestore
      try {
          await setDoc(doc(db, "prescriptions", `${patientId}_${new Date().toISOString()}`), prescriptionData);
          toastMessage = 'Prescription added successfully!'; // Set success message
          toastType = 'success'; // Set toast type to success
          fetchPrescriptions(); // Refresh prescriptions list
      } catch (error) {
          console.error('Error adding prescription: ', error);
          toastMessage = 'Error adding prescription. Please try again.'; // Set error message
          toastType = 'error'; // Set toast type to error
      }
  }

  // Get the 'patientId' from the URL
  onMount(() => {
    const url = window.location.pathname; 
    const pathParts = url.split('/');
    patientId = pathParts[pathParts.length - 1]; // Assuming the last part of the URL is the patient ID
    fetchPatientData();  // Fetch patient data once patientId is available
    fetchPrescriptions();  // Fetch past prescriptions once patient data is loaded
  });
</script>

<style>
  .dashboard {
      display: flex;
      height: 100vh;
      overflow: hidden;
  }

  .content-container {
      padding: 40px;
      width: 100%;
      max-width: 50rem;
      margin: auto;
      margin-top: 50px;
      border-radius: 0.5rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      background-color: white;
      overflow-y: auto; /* Enable scrolling */
      max-height: calc(100vh - 80px); /* Ensure it doesn't overflow the viewport */
  }

  /* Hide scrollbar for Chrome, Safari, and Opera */
  .content-container::-webkit-scrollbar {
      display: none;
  }

  /* Hide scrollbar for IE, Edge, and Firefox */
  .content-container {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
  }

  table {
    width: 100%;
    margin-top: 2rem;
    border-collapse: collapse;
  }

  table, th, td {
    border: 1px solid #ddd;
  }

  th, td {
    padding: 12px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }
</style>

<div class="dashboard">
  <Sidebar {isCollapsed} {toggleSidebar} {logout} />

  <!-- Content container with scrollable area -->
  <div class="content-container">
    <!-- Clinic Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="display: flex; align-items: center;">
        <img 
          src="/images/logo(landing).png" 
          alt="Sun with dental logo" 
          class="w-24 h-18 mr-4">
        <div>
          <h1 style="font-weight: bold; font-size: 1.25rem;">AF DOMINIC</h1>
          <p style="font-size: 0.875rem;">DENTAL CLINIC</p>
          <p style="font-size: 0.875rem;">#46 12th Street, Corner Gordon Ave New Kalalake</p>
          <p style="font-size: 0.875rem;">afdominicdentalclinic@gmail.com</p>
          <p style="font-size: 0.875rem;">0932 984 9554</p>
        </div>
      </div>
    </div>

    <!-- Form for Prescription -->
    <h2 style="font-size: 2rem; font-weight: Ariel; margin-bottom: 1.5rem;">Add Prescription for {patient.name} {lastName}</h2>

    <div style="margin-bottom: 1.5rem;">
      <p><strong>Address:</strong> {address}</p>
      <p><strong>Age:</strong> {age} years old</p>
    </div>

    <form style="display: flex; flex-direction: column;" on:submit|preventDefault={submitPrescription}>
      <!-- Date Visited -->
      <div style="margin-bottom: 1rem;">
        <Label for="dateVisited" style="display: block; margin-bottom: 0.5rem;">Date Visited</Label>
        <Input id="dateVisited" type="date" bind:value={dateVisited} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <!-- Medication -->
      <div style="margin-bottom: 1rem;">
        <Label for="medication" style="display: block; margin-bottom: 0.5rem;">Medication</Label>
        <Input id="medication" type="text" bind:value={medication} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <!-- Instructions -->
      <div style="margin-bottom: 1rem;">
        <Label for="instructions" style="display: block; margin-bottom: 0.5rem;">Instructions</Label>
        <Textarea id="instructions" placeholder="Enter medication instructions" bind:value={instructions} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <!-- Qty/Refills -->
      <div style="margin-bottom: 1rem;">
        <Label for="qtyRefills" style="display: block; margin-bottom: 0.5rem;">Qty/Refills</Label>
        <Input id="qtyRefills" type="text" bind:value={qtyRefills} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <!-- Prescriber -->
      <div style="margin-bottom: 1rem;">
        <Label for="prescriber" style="display: block; margin-bottom: 0.5rem;">Prescriber</Label>
        <Input id="prescriber" type="text" bind:value={prescriber} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <Button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; font-size: 16px; border-radius: 0;">
        Add Prescription
      </Button>
    </form>

    <!-- Past Prescriptions Table -->
    <h2 style="font-size: 1.5rem; font-weight: bold; margin-top: 2rem;">Past Prescriptions</h2>
    {#if prescriptions.length > 0}
      <table>
        <thead>
          <tr>
            <th>Date Visited</th>
            <th>Medication</th>
            <th>Instructions</th>
            <th>Qty/Refills</th>
            <th>Prescriber</th>
          </tr>
        </thead>
        <tbody>
          {#each prescriptions as prescription}
            <tr>
              <td>{prescription.dateVisited}</td>
              <td>{prescription.medication}</td>
              <td>{prescription.instructions}</td>
              <td>{prescription.qtyRefills}</td>
              <td>{prescription.prescriber}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No past prescriptions available.</p>
    {/if}
  </div>
</div>
