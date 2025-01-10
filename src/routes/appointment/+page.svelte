<script lang="ts">
  import { onMount } from 'svelte';
  import { getFirestore, collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';
  import { initializeApp } from 'firebase/app';
  import { firebaseConfig } from '$lib/firebaseConfig';
  import { Card, Tabs, TabItem } from 'flowbite-svelte';
  import Sidebar from '../sidenav/+page.svelte';
  import { AngleLeftOutline, AngleRightOutline } from 'flowbite-svelte-icons';
  import { Modal } from 'flowbite-svelte';
  import { writable } from 'svelte/store';
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  import Swal from 'sweetalert2';


  // Define types
  type Appointment = {
    remarks: any;

    subServices: any;

    cancelReason: any;
    cancellationStatus: any;
    id: string;
    date: string;
    time: string;
    status: string;
    patientId: string;
    service: string;
    
  };

  interface PatientProfile {
  id: string;
  name: string;
  lastName: string;
  age: number;
  // Add any other properties as needed
}
interface Prescription {
    appointmentId: string;
    medicine: string;
    dosage: string;
    instructions: string;
  }
  let prescription: Prescription = {
    appointmentId: '',
    medicine: '',
    dosage: '',
    instructions: ''
  };
// Variables
let totalAppointments = 0;
let pendingAppointments = 0;
let completedAppointments = 0;
let loading = true;
let currentView: 'today' | 'week' | 'month' = 'today';
let currentSection = 0;

let appointments: Appointment[] = [];
let patientProfiles: PatientProfile[] = [];
let pendingAppointmentsList: Appointment[] = [];
let selectedAppointment: Appointment | null = null;
let isModalOpen = false;

let showReasonModal = false; // Controls the visibility of the reason modal
let rejectionReason = ''; // Stores the entered reason
let pendingAppointmentId = ''; // Stores the ID of the appointment to be updated

let dateVisited: string = '';
let prescriber: string = '';
interface Medicine {
    id: string; // or whatever properties are relevant
    name: string;
    stock: number;
    quantity: number;
}
let availableMedicines: Medicine[] = [];
let medication = '';                   
let qtyRefills = '';                     
let instructions = '';                
let selectedMedicine: Medicine | null = null;
let manualMedicines: Medicine[] = [];    

interface PrescriptionMedicine {
    medicine: string; // or whatever type is appropriate
    dosage: string; // or number, depending on your use case
    instructions: string;
}

let prescriptionMedicines: PrescriptionMedicine[] = []; // Update the type of prescriptionMedicines

// Define 'today' as the current date
const today = new Date();

// Reset form fields
dateVisited = today.toISOString().split('T')[0]; 
medication = '';
instructions = '';
qtyRefills = '';
prescriber = '';

// svelte-ignore export_let_unused
export let show = false;
// Fetch appointments and profiles
onMount(async () => {
  try {
    await fetchAppointments();
    await fetchPatientProfiles();
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading = false;
  }
});

// Open the reason modal
const openReasonModal = (appointmentId: string) => {
  showReasonModal = true;
  pendingAppointmentId = appointmentId;
};

// Handle the rejection process with a reason
const confirmRejection = async () => {
  if (!rejectionReason.trim()) {
    // Alert if the reason is empty
    await Swal.fire({
      title: 'Error!',
      text: 'Please provide a reason for rejection.',
      icon: 'error',
    });
    return;
  }

  // Close the modal
  showReasonModal = false;

  // Call the existing updatePendingAppointmentStatus function with the reason
  await updatePendingAppointmentStatus(pendingAppointmentId, 'Decline');
  rejectionReason = ''; // Clear the reason input
};

const fetchAppointments = async () => {
  const appointmentsRef = collection(db, 'appointments');
  const appointmentSnapshot = await getDocs(appointmentsRef);

  appointments = appointmentSnapshot.docs.map(doc => {
    const data = doc.data() as Appointment;
    return {
        id: doc.id,
        date: data.date,
        time: data.time,
        status: data.status,
        patientId: data.patientId,
        service: data.service,
        cancellationStatus: data.cancellationStatus,
        subServices: data.subServices,
        cancelReason: data.cancelReason,
        remarks: data.remarks || '',
    };
  });

  pendingAppointmentsList = appointments.filter(appointment => 
    appointment.status === '' && appointment.cancellationStatus === 'requested'
  );

  const rescheduleRequests = appointments.filter(appointment => 
    appointment.status === 'Reschedule Requested'
  );

  const appointmentRequests = appointments.filter(appointment => !appointment.cancellationStatus);

  totalAppointments = appointments.length;

  pendingAppointments = appointments.filter(app => 
    app.status === 'pending' && !app.cancellationStatus
  ).length;

  completedAppointments = appointments.filter(app => 
    app.status === 'Completed'
  ).length;

  pendingAppointmentsList = [...pendingAppointmentsList, ...appointmentRequests, ...rescheduleRequests];
};

const fetchPatientProfiles = async () => {
  try {
    const profilesRef = collection(db, 'patientProfiles');
    const querySnapshot = await getDocs(profilesRef);
    patientProfiles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        lastName: data.lastName,
        age: data.age
      };
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
  } finally {
    loading = false;
  }
};

// Call fetchPatientProfiles when component is created
fetchPatientProfiles();
const updatePendingAppointmentStatus = async (appointmentId: string, newStatus: string) => {
  try {
    // Confirm action with SweetAlert
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to update the status to ${newStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
    });

    if (!result.isConfirmed) {
      return; // Stop if the user cancels
    }

    // Get a reference to the appointment document in Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);

    // Update the status and reason fields in Firestore
    await updateDoc(appointmentRef, {
      status: newStatus,
      cancellationStatus: newStatus === 'Accepted' ? 'approved' : 'decline',
      reason: newStatus === 'Decline' ? rejectionReason : null, // Add the rejection reason
    });

    // Optimistically update the local state
    appointments = appointments.map(appointment =>
      appointment.id === appointmentId
        ? {
            ...appointment,
            status: newStatus,
            cancellationStatus: newStatus === 'Accepted' ? 'approved' : 'decline',
            reason: newStatus === 'Decline' ? rejectionReason : null, // Update local reason
          }
        : appointment
    );

    // Re-fetch the data to ensure the status update is reflected
    await fetchAppointments();

    // Success alert
    await Swal.fire({
      title: 'Success!',
      text: `The status has been updated to ${newStatus}.`,
      icon: 'success',
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);

    // Error alert
    await Swal.fire({
      title: 'Error!',
      text: 'There was an error updating the status. Please try again.',
      icon: 'error',
    });
  }
};



  const filterAppointments = (view: 'today' | 'week' | 'month') => {
  const now = new Date();
  return appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    if (appt.status !== 'Accepted') return false; // Only include accepted appointments
    if (view === 'today') {
      return apptDate.toDateString() === now.toDateString();
    } else if (view === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return apptDate >= startOfWeek && apptDate <= endOfWeek;
    } else if (view === 'month') {
      return apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear();
    }
  });
};
const openModal = (appointmentId: string) => {
  // Find the selected appointment by its ID
  selectedAppointment = appointments.find(appointment => appointment.id === appointmentId) ?? null;

  // Reset form fields
  dateVisited = today.toISOString().split('T')[0]; 
  medication = '';
  instructions = '';
  qtyRefills = '';
  prescriber = '';

  if (selectedAppointment) {
    const patient = patientProfiles.find(profile => profile.id === selectedAppointment?.patientId);
    if (patient) {
      isModalOpen = true;
      console.log('Modal should open:', isModalOpen);
    } else {
      console.error("Patient not found for this appointment.");
    }
  } else {
    console.error("Appointment not found with ID:", appointmentId);
  }
};

// All medicines in the prescription

// Fetch available medicines from the database
const fetchAvailableMedicines = async () => {
  try {
    const db = getFirestore();
    const medicineRef = collection(db, "medicines");
    const querySnapshot = await getDocs(medicineRef);

    // Populate availableMedicines with the correct type
    
    availableMedicines = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Medicine[];

    console.log("Fetched medicines:", availableMedicines);
  } catch (error) {
    if (error instanceof Error) {
        console.error("Error fetching medicines:", error.message);
    } else {
        console.error("Error fetching medicines:", error);
    }
  }
};

// Call the function to fetch available medicines
onMount(async () => {
  await fetchAvailableMedicines();
});

const addSelectedMedicine = async () => {
  if (selectedMedicine && qtyRefills) {
    const db = getFirestore();
    const { id, quantity, name } = selectedMedicine;

    const qtyRefillsNumber = Number(qtyRefills); // Convert qtyRefills to a number

    if (quantity >= qtyRefillsNumber) { // Use the converted number for comparison
      try {
        // Check if a prescription already exists for this appointment
        const existingPrescriptionQuery = await getDocs(
          query(
            collection(db, "prescriptions"),
            where("appointmentId", "==", selectedAppointment?.id)
          )
        );

        if (!existingPrescriptionQuery.empty) {
          console.error("A prescription already exists for this appointment.");
          return; // Prevent adding if a prescription already exists
        }

        // Check if the medicine is already in the prescription
        const isMedicineInPrescription = prescriptionMedicines.some(
          (item) => item.medicine === name
        );

        if (isMedicineInPrescription) {
          console.error("This medicine has already been added to the prescription.");
          return; // Prevent adding if the medicine already exists in the prescription
        }

        // Decrease the stock in Firestore
        const updatedQuantity = quantity - qtyRefillsNumber;
        await updateDoc(doc(db, "medicines", id), { quantity: updatedQuantity });

        console.log(`Stock updated: ${name} now has ${updatedQuantity} left.`);

        // Add the medicine to the prescription
        prescriptionMedicines.push({
          medicine: name,
          dosage: qtyRefills,
          instructions,
        });

        // Clear input fields
        selectedMedicine = null;
        qtyRefills = '';
        instructions = '';
      } catch (error) {
        console.error("Error updating medicine stock:", error);
      }
    } else {
      console.error("Insufficient stock for the selected medicine.");
    }
  } else {
    console.error("Please select a medicine and specify the quantity.");
  }
};

const addManualMedicine = () => {
  if (medication && qtyRefills) {
    // Check if the manually entered medicine already exists in the prescription
    const isMedicineInPrescription = prescriptionMedicines.some(
      (item) => item.medicine === medication
    );

    if (isMedicineInPrescription) {
      console.error("This medicine has already been added to the prescription.");
      return; // Prevent adding if the medicine already exists
    }

    // Add manually to the prescription
    prescriptionMedicines.push({
      medicine: medication,
      dosage: qtyRefills,
      instructions,
    });

    console.log("Manually added medicine:", medication);

    // Clear fields
    medication = '';
    qtyRefills = '';
    instructions = '';
  } else {
    console.error("Please enter the medicine name and quantity.");
  }
};

// Submit prescription
const submitPrescription = async () => {
  try {
    if (selectedAppointment) {
      const db = getFirestore();
      
      // Check if a prescription already exists for this appointment
      const existingPrescriptionQuery = await getDocs(
        query(
          collection(db, "prescriptions"),
          where("appointmentId", "==", selectedAppointment.id)
        )
      );

      if (!existingPrescriptionQuery.empty) {
        await Swal.fire({
          title: 'Duplicate Prescription',
          text: 'A prescription already exists for this appointment.',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        console.error("A prescription already exists for this appointment.");
        return; // Stop execution if a prescription already exists
      }
    
      // Create the new prescription document
      const prescription = {
        appointmentId: selectedAppointment.id,
        medicines: prescriptionMedicines,
        prescriber,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "prescriptions"), prescription);

      console.log("Prescription successfully saved to Firestore.");

      // Clear prescription data
      prescriptionMedicines = [];
      prescriber = '';
      isModalOpen = false;

      
       // Show success alert
       await Swal.fire({
        title: 'Success!',
        text: 'Prescription successfully saved to Firestore.',
        icon: 'success',
      });
    } else {
      await Swal.fire({
        title: 'No Appointment Selected',
        text: 'Please select an appointment to submit a prescription.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      console.error("No selected appointment found.");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error saving prescription to Firestore:", error.message);
      // Show error alert
      await Swal.fire({
        title: 'Error!',
        text: `Error saving prescription: ${error.message}`,
        icon: 'error',
      });
    } else {
      console.error("Error saving prescription to Firestore:", error); // Fallback for unknown error types
      
      // Show fallback error alert
      await Swal.fire({
        title: 'Error!',
        text: 'An unknown error occurred while saving the prescription.',
        icon: 'error',
      });
    }
  }
};


const closeModal = () => {
    isModalOpen = false; // Close the modal
  };
  function goToNextSection() {
  if (currentSection < 2) {
    currentSection += 1;
  }
}

function goToPreviousSection() {
  if (currentSection > 0) {
    currentSection -= 1;
  }
}

  // Sidebar toggle
  let isCollapsed = false;
  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  // Logout
  function logout() {
    window.location.href = '/';
  }


  const updatePendingCancellationRequestStatus = async (id: string, status: string) => {
    try {
      const appointmentRef = doc(db, 'appointments', id);
      await updateDoc(appointmentRef, { cancellationStatus: status });

      appointments = appointments.map(appointment =>
        appointment.id === id
          ? { ...appointment, cancellationStatus: status }
          : appointment
      );

      await fetchAppointments();
    } catch (error) {
      console.error('Error updating cancellation request status:', error);
    }
  };


  export const appointmentStore = writable<Appointment[]>([]);


 export const handleCompletedAppointment = async (appointmentId: string, newStatus: string, remarks: string) => {
  try {
    // Ensure remarks is never undefined, default to an empty string if necessary
    const remarksToSave = remarks || '';

    // Check if the status is 'Completed' and ensure remarks is provided
    if (newStatus === 'Completed' && !remarksToSave.trim()) {
      await Swal.fire({
        title: 'Remarks Required',
        text: 'Please provide remarks to mark the appointment as completed.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      console.error('Remarks are required to mark the appointment as completed.');
      return; // Prevent update if remarks are not provided
    }

      // Confirm the action with SweetAlert
      const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this appointment as ${newStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
    });

    if (!result.isConfirmed) {
      return; // If the user cancels, stop the function here
    }

    // Get a reference to the appointment document in Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);

    // Update the status and remarks field in Firestore
    await updateDoc(appointmentRef, {
      status: newStatus === 'Completed' ? 'Completed' : 'Missed',
      remarks: remarksToSave, // Save the remarks entered by the user
    });

    // Optimistically update the local state
    appointmentStore.update((prevAppointments: Appointment[]) =>
      prevAppointments.map((appointment: Appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus === 'Completed' ? 'Completed' : 'Missed', remarks: remarksToSave }
          : appointment
      )
    );

    // If re-fetching is still needed
    await fetchAppointments();

     // Show success alert
     await Swal.fire({
      title: 'Success!',
      text: `The appointment has been marked as ${newStatus}.`,
      icon: 'success',
    }).then(async (result) => {
    if (result.isConfirmed) {
      // Fetch appointments after the user clicks "OK"
      await fetchAppointments();
    }
  });
  } catch (error) {
    console.error('Error updating appointment status:', error);
     // Show error alert
     await Swal.fire({
      title: 'Error!',
      text: 'There was an error updating the appointment. Please try again.',
      icon: 'error',
    });
  }
};
async function acceptReschedule(appointmentId: string) {
    const result = await Swal.fire({
      title: 'Accept Reschedule?',
      text: 'Are you sure you want to accept this reschedule request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Accept',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      // Update the appointment status
      const appointment = pendingAppointmentsList.find(app => app.id === appointmentId);
      if (appointment) {
        appointment.status = 'Rescheduled';
        await Swal.fire('Accepted!', 'The reschedule request has been accepted.', 'success');
      } else {
        await Swal.fire('Error!', 'Appointment not found.', 'error');
      }
    }
  }

  // Reject reschedule request
  async function rejectReschedule(appointmentId: string) {
    const result = await Swal.fire({
      title: 'Reject Reschedule?',
      text: 'Are you sure you want to reject this reschedule request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      // Update the appointment status
      const appointment = pendingAppointmentsList.find(app => app.id === appointmentId);
      if (appointment) {
        appointment.status = 'Reschedule Rejected';
        await Swal.fire('Rejected!', 'The reschedule request has been rejected.', 'success');
      } else {
        await Swal.fire('Error!', 'Appointment not found.', 'error');
      }
    }
  }


    
</script>

<Sidebar {isCollapsed} {toggleSidebar} {logout} />
<div class="container1">
  {#if loading}
    <p>Loading data...</p>
  {:else}
    <Card class="w-full p-4 shadow-lg">
      <div class="card-content1">
        <div>
          <p class="text-gray-500 text-sm">Total Appointment This Month</p>
          <p class="text-2xl font-bold text-gray-900">{totalAppointments}</p>
        </div>
        <div>
          <p class="text-gray-500 text-sm">Pending Appointment This Month</p>
          <p class="text-2xl font-bold text-gray-900">{pendingAppointments}</p>
        </div>
        <div>
          <p class="text-gray-500 text-sm">Completed Appointment This Month</p>
          <p class="text-2xl font-bold text-gray-900">{completedAppointments}</p>
        </div>
      </div>
    </Card>
    <div class="appointment-container1">
      <div class="appointment-header flex flex-col justify-between items-center">
        <p class="appointment-title">
          {#if currentSection === 0}
            Pending Appointments
          {:else if currentSection === 1}
          Pending Reschedule Requests
          {:else if currentSection === 2}
          Pending Cancellation requests
          {/if}
        </p>
    
        <div class="icon-buttons flex space-x-4 mt-4">
          <!-- Button for Pending Appointments -->
          <button
            class="icon-button"
            on:click={() => (currentSection = 0)}
            aria-label="Pending Appointments"
          >
            <img
              src="./images/pending-appointment.png"
              alt="Pending Appointments"
              class="icon {currentSection === 0 ? 'active' : ''}"
            />
          </button>
    
          <!-- Button for Pending Cancellation Requests -->
          <button
            class="icon-button"
            on:click={() => (currentSection = 1)}
            aria-label="Pending Reschedule Requests"
          >
            <img
              src="./images/pending-reschedule.png"
              alt="Pending Reschedule Requests"
              class="icon {currentSection === 1 ? 'active' : ''}"
            />
          </button>
    
          <!-- Button for Pending Reschedule Requests -->
          <button
            class="icon-button"
            on:click={() => (currentSection = 2)}
            aria-label="Pending Cancellation Requests"
          >
            <img
              src="./images/pending-cancellation.png"
              alt="Pending Cancellation Requests"
              class="icon {currentSection === 2 ? 'active' : ''}"
            />
          </button>
        </div>
      </div>
    
    
      
      {#if currentSection === 0}
      <!-- Pending Appointments Section -->
      <div class="pending-appointments">
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a class="view-all" href="/allstatus">View All</a>
    
        {#if pendingAppointmentsList.length > 0}
          {#each pendingAppointmentsList as appointment}
          {#if appointment.status === 'pending'} 
            <div class="appointment-card">
              <div class="patient-info">
                {#each patientProfiles as profile (profile.id)}
                  {#if profile.id === appointment.patientId}
                  <div class="patient-details">
                    <p class="patient-name">{profile.name} {profile.lastName}</p>
                    <p class="patient-age">{profile.age} years old</p>
                    <p class="appointment-details">{appointment.date} at {appointment.time}</p>
                    <p class="service">
                      Service: {appointment.service}
                    </p>
                    {#if appointment.subServices && appointment.subServices.length > 0}
                      <p class="sub-services">
                        Sub-services: {appointment.subServices.join(', ')}
                      </p>
                    {/if}
                    
                  </div>
                  {/if}
                {/each}
              </div>
    
              <div class="appointment-buttons">
                <button class="bg-blue-100 text-blue-500 px-3 py-1 rounded" on:click={() => updatePendingAppointmentStatus(appointment.id, 'Accepted')}>
                  Accept
                </button>
                <button
            class="bg-red-100 text-red-500 px-3 py-1 rounded"
            on:click={() => openReasonModal(appointment.id)}
          >
            Reject
          </button>
              </div>
            </div>
            {/if}
          {/each}
          
        {:else}
          <p class="text-center text-gray-500">No pending appointment requests available.</p>
        {/if}
      </div>

      {:else if currentSection === 1}
      <!-- Reschedule Requests Section -->
      <div class="reschedule-requests">
        {#if pendingAppointmentsList.filter(a => a.status === 'Reschedule Requested').length > 0}
          {#each pendingAppointmentsList as appointment}
            {#if appointment.status === 'Reschedule Requested'}
              <div class="appointment-card bg-white shadow-md rounded p-4 mb-4">
                <!-- Patient Info -->
                <div class="patient-info">
                  {#each patientProfiles as profile (profile.id)}
                    {#if profile.id === appointment.patientId}
                      <div class="patient-details">
                        <p class="patient-name text-lg font-semibold">
                          {profile.name} {profile.lastName}
                        </p>
                        <p class="patient-age text-gray-600">
                          {profile.age} years old
                        </p>
                        <p class="text-gray-600">
                          Requesting to reschedule
                        </p>
                        <p class="text-sm text-gray-500">
                       Requested Schedule: {appointment.date} at {appointment.time}
                        </p>
                        <p class="service text-sm text-gray-500">
                          Service: {appointment.service}
                        </p>
                        {#if appointment.subServices && appointment.subServices.length > 0}
                          <p class="sub-services text-sm text-gray-500">
                            Sub-services: {appointment.subServices.join(', ')}
                          </p>
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
                <!-- Actions -->
                <div class="appointment-actions flex justify-end space-x-2">
                  <button
                    class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    on:click={() => acceptReschedule(appointment.id)}
                  >
                    Accept
                  </button>
                  <button
                    class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    on:click={() => rejectReschedule(appointment.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            {/if}
          {/each}
       
      
    {:else}
      <p class="text-gray-500 text-center">No reschedule requests available.</p>
    {/if}
  </div>
    {:else}
    
   <!-- Pending Cancellations Section -->
   <div class="pending-cancellations">
    <!-- svelte-ignore a11y_invalid_attribute -->
    <a class="view-all" href="/allstatus">View All</a>


    {#if pendingAppointmentsList.filter(appointment => appointment.cancellationStatus === 'requested').length > 0}
      {#each pendingAppointmentsList as appointment}
        {#if appointment.cancellationStatus === 'requested'} <!-- Display only pending cancellations -->
          <div class="appointment-card">
            <div class="patient-info">
                  {#each patientProfiles as profile (profile.id)}
                    {#if profile.id === appointment.patientId}
                      <div class="patient-details">
                        <p class="patient-name">{profile.name} {profile.lastName}</p>
                        <p class="patient-age">{profile.age} years old</p>
                        <p class="appointment-details">{appointment.date} at {appointment.time}</p>
                        <p class="service">Service: {appointment.service}</p>
                        <p class="sub-service">Sub-services: {appointment.subServices.join(', ')}</p>
                        <p class="cancellation-reason">Cancellation Reason: {appointment.cancelReason}</p>
                      </div>
                    {/if}
                  {/each}
                </div>
        
                <div class="appointment-buttons">
                  <button class="bg-green-100 text-green-500 px-3 py-1 rounded" on:click={() => updatePendingCancellationRequestStatus(appointment.id, 'Approved')}>
                    Approved
                  </button>
                  <button class="bg-red-100 text-red-500 px-3 py-1 rounded" on:click={() => updatePendingCancellationRequestStatus(appointment.id, 'Declined')}>
                    Decline
                  </button>
                </div>
                
              </div>
            {/if}
          {/each}
        {:else}
          <p class="text-center text-gray-500">No pending cancellation requests available.</p>
        {/if}
      </div>
     {/if} 
    </div>
  {/if}

   <!-- Reason Modal -->
{#if showReasonModal}
<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
  <div class="bg-white rounded-lg p-6 w-1/3 shadow-lg">
    <h2 class="text-lg font-semibold mb-4">Reason for Rejection</h2>
    <textarea
      class="w-full border rounded p-2 mb-4"
      rows="4"
      bind:value={rejectionReason}
      placeholder="Enter the reason for rejection..."
    ></textarea>
    <div class="flex justify-end space-x-4">
      <button
        class="bg-gray-200 text-gray-800 px-4 py-2 rounded"
        on:click={() => (showReasonModal = false)}
      >
        Cancel
      </button>
      <button
        class="bg-red-500 text-white px-4 py-2 rounded"
        on:click={confirmRejection}
      >
        Submit
      </button>
    </div>
  </div>
</div>
{/if}

  </div>
  
  <div class="container">
    <div class="appointments-section">
      <h2>Accepted Appointments</h2>
  
      <div class="tabs">
        <button 
          type="button"
          class="tab-item {currentView === 'today' ? 'active' : ''}" 
          on:click={() => currentView = 'today'}>
          Today
        </button>
        <button 
          type="button"
          class="tab-item {currentView === 'week' ? 'active' : ''}" 
          on:click={() => currentView = 'week'}>
          This Week
        </button>
        <button 
          type="button"
          class="tab-item {currentView === 'month' ? 'active' : ''}" 
          on:click={() => currentView = 'month'}>
          This Month
        </button>
      </div>
  
 {#if filterAppointments(currentView).length > 0}
  {#each filterAppointments(currentView) as appointment}
    <div class="appointment-card">
      <div class="appointment-details">
        <p><strong>{appointment.date} at {appointment.time}</strong></p>
        {#each patientProfiles as profile (profile.id)}
          {#if profile.id === appointment.patientId}
            <p>{profile.name} {profile.lastName} ({profile.age} years old)</p>
          {/if}
        {/each}
        <p>Service: {appointment.service}</p>

       <div>
        <label for="remarks-{appointment.id}">Remarks:</label>
        <input
          type="text"
          id="remarks-{appointment.id}"
          bind:value={appointment.remarks}
          placeholder="Enter remarks here"
        />
      </div>
    </div>
     
    <div class="appointment-buttons">
      <button on:click={() => openModal(appointment.id)} class="bg-green-100">
        Add Prescription
      </button>
      <button
        class="bg-blue-100"
        on:click={() => handleCompletedAppointment(appointment.id, 'Completed', appointment.remarks || '')}
      >
        Completed
      </button>
      <button
        class="bg-red-100"
        on:click={() => handleCompletedAppointment(appointment.id, 'Missed', appointment.remarks || '')}
      >
        Missed
      </button>
    </div>
  </div>
{/each}
{:else}
<div class="no-appointments">
  <p>No appointments for the selected period.</p>
</div>
{/if}

    </div>
  </div>
  
 <!-- Modal with Overlay (Appears when isModalOpen is true) -->
 {#if isModalOpen}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal-overlay" on:click={closeModal} role="dialog" aria-labelledby="modal-title" aria-hidden={!isModalOpen}>
   <div class="modal-content" on:click|stopPropagation tabindex="-1">
     <button class="absolute top-2 right-2 text-white text-xl" on:click={closeModal} aria-label="Close Modal"></button>
     <h2 id="modal-title" class="text-lg font-bold mb-4">
       Add Prescription for 
       {selectedAppointment 
         ? (() => {
             const patientProfile = patientProfiles.find(profile => profile.id === selectedAppointment?.patientId);
             return patientProfile ? `${patientProfile.name} ${patientProfile.lastName}` : 'Patient';
           })() 
         : 'Patient'}
     </h2>

     <div class="space-y-8">
      <!-- Left Side (Prescription Form) -->
      <form on:submit|preventDefault={submitPrescription} class="w-full space-y-4">
        <div class="mb-4">
          <label for="dateVisited" class="block text-sm font-medium mb-1">Date Visited</label>
          <input id="dateVisited" type="date" bind:value={dateVisited} required class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500" />
        </div>
    
        <div class="mb-4">
          <label for="availableMedicine" class="block text-sm font-medium mb-1">Available Medicines</label>
          <select id="availableMedicine" bind:value={selectedMedicine} class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500">
            <option value="" disabled>Select a medicine</option>
            {#each availableMedicines as med}
              <option value={med}>
                {med.name} (Stock: {med.quantity})
              </option>
            {/each}
          </select>
        </div>
        <div class="mb-4">
          <label for="manualMedication" class="block text-sm font-medium mb-1">Medication</label>
          <input id="manualMedication" type="text" bind:value={medication} class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500" />
        </div>

        <div class="mb-4">
          <label for="qtyRefills" class="block text-sm font-medium mb-1">Qty/Refills</label>
          <input id="qtyRefills" type="number" bind:value={qtyRefills} class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500" />
        </div>
    
        <div class="mb-4">
          <label for="instructions" class="block text-sm font-medium mb-1">Instructions</label>
          <textarea id="instructions" bind:value={instructions} class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500"></textarea>
        </div>
      </form>
     <div class="mb-4">
          <label for="prescriber" class="block text-sm font-medium mb-1">Prescriber</label>
          <select
            id="prescriber"
            bind:value={prescriber}
            class="border rounded p-2 w-full focus:ring-2 focus:ring-green-500"
          >
            <option value="Alfred Domingo">Alfred Domingo</option>
            <option value="Fernalyn Domingo">Fernalyn Domingo</option>
          </select>
        </div>
      </div>
 
    <!-- Submit Prescription -->
    <div class="flex justify-end mt-6">
      <button
        type="button"
        class="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        on:click={() => {
          // Add both selected and manual medicines before submitting
          addSelectedMedicine();
          addManualMedicine();
    
          // Submit the prescription after adding medicines
          submitPrescription();
        }}
      >
        Submit Prescription
      </button>
    </div>
    
   </div>
  </div>
    
{/if}

<style>
/* Icon Buttons Styling */
.icon-buttons {
  display: flex;
  justify-content: space-around;
  width: 100%;  /* Ensure the icons are evenly spaced */
}

.icon-buttons img.icon {
  width: 40px;  /* Adjust the icon size */
  height: 40px; /* Adjust the icon size */
  cursor: pointer;
  transition: transform 0.3s ease;
}

/* Hover effect for icons */
.icon-buttons img.icon:hover {
  transform: scale(1.1);  /* Slightly enlarge the icon on hover */
}

/* Active icon border styling */
.icon-buttons img.icon.active {
  border: 4px solid #0288d1;  /* Green border for the active icon */
  border-radius: 50%;  /* Make the border circular */
  padding: 2px;  /* Add padding to create space for the border */
}

  /* Position both containers on the right side and adjust width */
  .container1 {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    width: 320px; /* Adjusted width */
    background-color: transparent;
    max-height: 94vh; /* Increased max-height to 90% of the viewport height */
    overflow-y: auto; /* Allows scrolling if the content overflows */
    margin-bottom: 20px; /* Added margin to avoid overlapping with bottom content */
    box-shadow: 0 -4px 0 #0288d1, 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  .card-content1 {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
    margin-right: 0;
    padding: 10px;
  }

  .appointment-container1 {
    background-color: transparent;
    padding: 12px;
    border-radius: 10px;
    box-shadow: 0 -4px 0 #0288d1, 0 2px 4px rgba(0, 0, 0, 0.1);
    max-height: 90vh; /* Increased max-height to 90% of the viewport height */
    overflow-y: auto; /* Ensures the container becomes scrollable if the content overflows */
    margin-bottom: 20px; /* Adds some space between the container and next content */
  }

  .appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

 
/* Appointment Title Styling */
.appointment-title {
  font-size: 15px;
  font-weight: bold;
  text-align: center;  /* Center-align the title */
}

/* Add margin above the icons for spacing */
.icon-buttons {
  margin-top: 16px;  /* Adjust spacing between title and icons */
}

  .view-all {
    font-size: 0.75rem;
    color: #3182ce;
    cursor: pointer;
    text-decoration: underline;
  }

  .appointment-card {
    margin-bottom: 10px;
    padding: 10px;
    font-size: 0.875rem;
    border-radius: 8px;
    background-color: transparent;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
  }

  .patient-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .patient-name {
    font-size: 1rem;
    font-weight: bold;
  }

 

  .service {
    margin-top: 4px;
  }

  .appointment-buttons {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
  }

  .container {
  position: fixed;
  bottom: 20px;
  left: 230px;
  max-height: 90%; /* Adjusted height for better visibility */
  min-height: 600px; /* Increased minimum height */
  overflow-y: scroll; /* Enables vertical scrolling */
  width: 650px;
  box-shadow: 0 -4px 0 #0288d1, 0 2px 4px rgba(0, 0, 0, 0.1);
  
  scrollbar-width: none; /* For Firefox */
}

.container::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Edge */
}


  .appointments-section {
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    
  }

  .appointment-card {
    background-color: #fff;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    min-height: 100px;
    box-shadow: -4px 0 0 #3182ce;
    border: 1px solid rgba(49, 130, 206, 0.5); /* 50% transparent */

  }

  .appointment-details {
    margin-bottom: 10px;
  }

  .appointment-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .appointment-buttons button {
    padding: 8px 16px;
    border-radius: 50px;
    cursor: pointer;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
  }
  /* Style for the active tab */
  .appointments-section .tab-item {
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 50px;
  transition: background-color 0.3s ease;
  display: inline-block; /* Makes it look tab-like */
  text-align: center;
  color: black; /* Default inactive text color */
  margin-bottom: 10px;
}

.appointments-section .tab-item.active {
  background: linear-gradient(90deg, #08B8F3, #005b80); /* Gradient background */
  color: white; /* Active text color */
}

.appointments-section .tab-item:not(.active):hover {
  background-color: #ddd; /* Hover effect for inactive tabs */
}

.view-all {
  color: #3182ce; /* Blue color for the link */
  text-decoration: none; /* Removes the underline */
  font-weight: bold; /* Makes the text bold */
  font-size: 16px; /* Adjusts the font size */
  transition: color 0.3s ease; /* Smooth transition for color on hover */
}

.view-all:hover {
  color: #2563eb; /* Darker blue on hover */
  text-decoration: none; /* Underline on hover */
}


  .bg-blue-100 {
    background-color: #e0f7fa;
    color: #0288d1;
  }

  .bg-red-100 {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .no-appointments {
    text-align: center;
    padding: 15px;
    font-size: 1.2rem;
    color: #555;
    background-color: #f4f4f4;
    border-radius: 8px;
    max-height: 90%;
    min-height: 300px;
    bottom: 20px;
  }

  /* Modal Overlay Styling */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Transparent black background */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* Make sure modal is on top */
  }

  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
    z-index: 10000; /* Ensure the content stays above the overlay */
  }

  /* Prevent modal from closing when clicking inside the modal content */
  .modal-content {
    cursor: default;
  }

  /* Optional: Add a smooth transition effect */
  .modal-overlay {
    transition: visibility 0.3s ease-in-out;
  }

  /* Media Queries for Responsiveness */
  @media (max-width: 1024px) {
    .container1 {
      width: 270px; /* Adjust width for medium-sized screens */
      top: 10px;
      right: 10px;
    }

    .container {
      left: 15px;
      width: 100%;
      min-height: 500px;
    }

    .appointment-buttons {
      flex-direction: column; /* Stack the buttons vertically */
      gap: 10px;
    }
  }

  @media (max-width: 768px) {
    .container1 {
      width: 100%; /* Take full width for small screens */
      top: 10px;
      right: 0;
      bottom: 0;
    }

    .container {
      left: 0;
      width: 100%;
      min-height: 450px;
    }

    .appointment-card {
      padding: 10px;
      font-size: 0.8rem;
    }

    .appointment-buttons button {
      padding: 6px 12px;
      font-size: 0.85rem;
    }
  }

  @media (max-width: 480px) {
    .container1 {
      width: 100%;
      bottom: 0;
      right: 0;
      z-index: 100;
    }

    .container {
      left: 0;
      width: 100%;
      min-height: 400px;
    }

    .appointment-buttons {
      flex-direction: column; /* Stack buttons for smaller screens */
    }

    .appointment-card {
      padding: 8px;
      font-size: 0.75rem;
    }
  }

</style>