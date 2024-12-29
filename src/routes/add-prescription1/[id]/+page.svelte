<script lang="ts">
    import Sidebar from '../../sidenav/+page.svelte'; 
  import { onMount } from 'svelte';
  import { firebaseConfig } from "$lib/firebaseConfig";
  import { initializeApp } from 'firebase/app';
  import { getFirestore, doc, deleteDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
  import { Label, Input, Textarea, Button, Toast } from 'flowbite-svelte';
  import Swal from 'sweetalert2';

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let patientId: string = '';
  let patient: any = {};
  let firstName: string = '';
  let lastName: string = '';
  let address: string = '';
  let age: number = 0;
  let dateVisited: string = '';
  let medication: string = '';
  let instructions: string = '';
  let qtyRefills: string = '';
  let prescriber: string = '';
  let prescriptions: any[] = [];
  let isCollapsed = false;
  let toastMessage: string = '';
  let toastType: 'success' | 'error' | null = null;
  let today: string = new Date().toISOString().split('T')[0];

  let toggleSidebar = () => {
    isCollapsed = !isCollapsed;
  };

  let logout = () => {
    window.location.href = "/";
  };
  function handleQtyRefillsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    // Remove any non-numeric characters
    inputElement.value = inputElement.value.replace(/[^0-9]/g, '');
  }
  async function fetchPatientData() {
    try {
      const patientDocRef = doc(db, "patientProfiles", patientId);
      const patientDoc = await getDoc(patientDocRef);
     
      if (patientDoc.exists()) {
        patient = patientDoc.data();
        firstName = patient.name || '';  // Default to empty if not found
        lastName = patient.lastName || '';
        address = patient.address || '';
        age = patient.age || 0;
      } else {
        console.error("No such patient!");
      }
    } catch (error) {
      console.error('Error fetching patient data: ', error);
    }
  }

  async function fetchPrescriptions() {
  try {
    const prescriptionsRef = collection(db, "prescriptions");
    const prescriptionQuery = await getDocs(prescriptionsRef);
    prescriptions = prescriptionQuery.docs
      .filter(doc => doc.data().patientId === patientId)
      .map(doc => ({ ...doc.data(), id: doc.id })); // Add doc.id as id
  } catch (error) {
    console.error('Error fetching prescriptions: ', error);
  }
}

  // Ensure this function is in the correct place
  function isValidNumber(value: string): boolean {
    const number = parseInt(value, 10);
    return !isNaN(number) && number > 0;
  }

  async function deletePrescription(prescriptionId: string) {
  try {
    // Confirmation dialog before deletion
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const prescriptionRef = doc(db, "prescriptions", prescriptionId);
      await deleteDoc(prescriptionRef);

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Prescription deleted successfully.',
        confirmButtonText: 'Okay'
      });

      fetchPrescriptions(); // Refresh the prescription list after deletion
    }
  } catch (error) {
    console.error('Error deleting prescription: ', error);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error deleting prescription. Please try again.',
      confirmButtonText: 'Okay'
    });
  }
}

  async function submitPrescription() {
    if (!dateVisited || !medication || !instructions || !qtyRefills || !prescriber) {
      Swal.fire({
      icon: 'error',
      title: 'Incomplete Information',
      text: 'Please fill in all fields.',
      confirmButtonText: 'Okay'
    });
      return;
    }

    if (!isValidNumber(qtyRefills)) {
      Swal.fire({
      icon: 'error',
      title: 'Invalid Input',
      text: 'Quantity/Refills must be a valid positive number.',
      confirmButtonText: 'Okay'
    });
      return;
    }

    const date = new Date(dateVisited);
    const dateString = date.toISOString();

    const prescriptionData = {
      patientId: patientId,
      dateVisited: dateString,
      medication: medication,
      instructions: instructions,
      qtyRefills: qtyRefills,
      prescriber: prescriber
    };

    try {
      await setDoc(doc(db, "prescriptions", `${patientId}_${new Date().toISOString()}`), prescriptionData);
      Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Prescription added successfully!',
      confirmButtonText: 'Okay'
    });
      fetchPrescriptions();
    } catch (error) {
      console.error('Error adding prescription: ', error);
      Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error adding prescription. Please try again.',
      confirmButtonText: 'Okay'
    });
    }
  }

  onMount(() => {
    const url = window.location.pathname;
    const pathParts = url.split('/');
    patientId = pathParts[pathParts.length - 1];
    fetchPatientData();
    fetchPrescriptions();
  });
</script>


<style>
  /* Use :global to ensure these styles are applied to the button component */
:global(button.delete-prescription) {
  background-color: #f44336;
  color: white;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-radius: 0.375rem; /* Rounded corners */
  transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
}

:global(button.delete-prescription):hover {
  background-color: #e53935; /* Darker red on hover */
  transform: translateY(-2px); /* Slight lift effect */
}

:global(button.delete-prescription):active {
  background-color: #d32f2f; /* Even darker red when clicked */
  transform: translateY(0); /* Reset lift effect */
}
/* Use :global to apply the styles to the button component */
:global(button.add-prescription) {
  background-color: #4CAF50; /* Green background */
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 0.375rem; /* Rounded corners */
  transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
}

:global(button.add-prescription):hover {
  background-color: #45a049; /* Darker green on hover */
  transform: translateY(-2px); /* Slight lift effect */
}

:global(button.add-prescription):active {
  background-color: #388e3c; /* Even darker green when clicked */
  transform: translateY(0); /* Reset lift effect */
}

/* For Blue color variant */
:global(button.add-prescription-blue) {
  background-color: #2196F3; /* Blue background */
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 0.375rem; /* Rounded corners */
  transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
}

:global(button.add-prescription-blue):hover {
  background-color: #1976D2; /* Darker blue on hover */
  transform: translateY(-2px); /* Slight lift effect */
}

:global(button.add-prescription-blue):active {
  background-color: #1565C0; /* Even darker blue when clicked */
  transform: translateY(0); /* Reset lift effect */
}

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
      <script lang="ts">
        // Get the current date in the required format (YYYY-MM-DD)
        let today: string = new Date().toISOString().split('T')[0]; 
      </script>
      
      <!-- Date Visited -->
      <div style="margin-bottom: 1rem;">
        <Label for="dateVisited" style="display: block; margin-bottom: 0.5rem;">Date Visited</Label>
        <Input 
          id="dateVisited" 
          type="date" 
          bind:value={dateVisited} 
          required 
          style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"
          max={today} 
        />
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
        <Input 
          id="qtyRefills" 
          type="text" 
          bind:value={qtyRefills} 
          required
          on:input={handleQtyRefillsInput}
          style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"
        />
      </div>

      <!-- Prescriber -->
      <div style="margin-bottom: 1rem;">
        <Label for="prescriber" style="display: block; margin-bottom: 0.5rem;">Prescriber</Label>
        <Input id="prescriber" type="text" bind:value={prescriber} required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 0;"/>
      </div>

      <Button 
      class="add-prescription"
      type="submit"
    >
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
            <th>Action</th>

          </tr>
        </thead>
        <tbody>
          {#each prescriptions as prescription}
            <tr>
              <td>{new Date(prescription.dateVisited).toLocaleDateString()}</td>
              <td>{prescription.medication}</td>
              <td>{prescription.instructions}</td>
              <td>{isNaN(prescription.qtyRefills) || prescription.qtyRefills <= 0 ? '' : prescription.qtyRefills}</td>
              <td>{prescription.prescriber}</td>
              <td>
                <!-- Add a Delete button -->
                <Button 
  class="delete-prescription"
  on:click={() => deletePrescription(prescription.id)}
>
  Delete
</Button>


              </td>
            </tr>
          {/each}
        </tbody>
        
      </table>
    {:else}
      <p>No past prescriptions available.</p>
    {/if}
  </div>
</div>
