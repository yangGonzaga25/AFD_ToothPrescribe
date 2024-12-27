<script lang="ts">
  import { onMount } from 'svelte';
  import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
  import { initializeApp } from 'firebase/app';
  import { firebaseConfig } from '$lib/firebaseConfig';
  import { Card, Tabs, TabItem } from 'flowbite-svelte';
  import Sidebar from '../sidenav/+page.svelte';
  import { AngleLeftOutline, AngleRightOutline } from 'flowbite-svelte-icons';
 
 
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Define types
  type Appointment = {

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
        cancelReason: data.cancelReason
    };
  });

  pendingAppointmentsList = appointments.filter(appointment => 
    appointment.status === '' && appointment.cancellationStatus === 'requested'
  );
  
  const appointmentRequests = appointments.filter(appointment => !appointment.cancellationStatus);

  totalAppointments = appointments.length;

  pendingAppointments = appointments.filter(app => 
    app.status === 'pending' && !app.cancellationStatus
  ).length;


  completedAppointments = appointments.filter(app => 
    app.status === 'Completed'
  ).length;

  pendingAppointmentsList = [...pendingAppointmentsList, ...appointmentRequests];
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
    // Get a reference to the appointment document in Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);

    // Update the status field in Firestore
    await updateDoc(appointmentRef, {
      status: newStatus,
      cancellationStatus: newStatus === 'Accepted' ? 'approved' : 'declined',
    });

    // Optimistically update the local state to reflect the changes immediately
    appointments = appointments.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: newStatus, cancellationStatus: newStatus === 'Accepted' ? 'approved' : 'declined' }
        : appointment
    );

    // Re-fetch the data to ensure the status update is reflected
    await fetchAppointments();
  } catch (error) {
    console.error('Error updating appointment status:', error);
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

const goToNextSection = () => {
    if (currentSection < 1) {
      currentSection++;
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      currentSection--;
    }
  };
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


    const handleCompletedAppointment = async (appointmentId: string, newStatus: string) => {
  try {
    // Get a reference to the appointment document in Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);

    // Update the status field in Firestore
    await updateDoc(appointmentRef, {
      status: newStatus === 'Completed' ? 'Completed' : 'Missed',
    });

    // Optimistically update the local state to reflect the changes immediately
    appointments = appointments.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: newStatus === 'Completed' ? 'Completed' : 'Missed' }
        : appointment
    );

    // Re-fetch the data to ensure the status update is reflected
    await fetchAppointments();
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
};



    function handleCompleteAppointment(id: string): any {
        throw new Error('Function not implemented.');
    }
</script>



<style>
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.appointment-title {
  font-size: 1rem;
  font-weight: bold;
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

.patient-age-service {
  font-size: 0.75rem;
  color: gray;
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
  min-height: 400px; /* Increased minimum height */
  overflow-y: auto; /* Ensures scrolling if content exceeds container size */
  width: 650px;
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
  border-radius: 5px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
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

</style>

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
      <div class="appointment-header flex justify-between items-center">
        <p class="appointment-title">
          {#if currentSection === 0}
            Pending Appointments
          {:else}
            Pending Cancellation Requests
          {/if}
        </p>
        
        <!-- Right Arrow visible initially (for Pending Appointments) -->
        {#if currentSection === 0}
          <button class="bg-gray-300 p-2 rounded" on:click={goToNextSection}>
            <AngleRightOutline class="h-5 w-5 text-gray-700"/>
          </button>
        {:else}
          <!-- Left Arrow visible after moving to Pending Cancellation Requests -->
          <button class="bg-gray-300 p-2 rounded" on:click={goToPreviousSection}>
            <AngleLeftOutline class="h-5 w-5 text-gray-700"/>
          </button>
        {/if}
      </div>
      {#if currentSection === 0}
      <!-- Pending Appointments Section -->
      <div class="pending-appointments">
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a class="view-all" href="#">View All</a>
    
        {#if pendingAppointmentsList.length > 0}
          {#each pendingAppointmentsList as appointment}
          {#if appointment.status === 'pending'} 
            <div class="appointment-card">
              <div class="patient-info">
                {#each patientProfiles as profile (profile.id)}
                  {#if profile.id === appointment.patientId}
                    <div class="patient-name">
                      <p>{profile.name} {profile.lastName}</p>
                      <p class="patient-age-service">{profile.age} years old</p>
                      <p class="text-sm text-gray-500">{appointment.date}</p>
                    </div>
    
                    <div class="service">
                      <p class="text-sm text-gray-500">Service: {appointment.service}</p>
                    </div>
                  {/if}
                {/each}
              </div>
    
              <div class="appointment-buttons">
                <button class="bg-blue-100 text-blue-500 px-3 py-1 rounded" on:click={() => updatePendingAppointmentStatus(appointment.id, 'Accepted')}>
                  Accept
                </button>
                <button class="bg-red-100 text-red-500 px-3 py-1 rounded" on:click={() => updatePendingAppointmentStatus(appointment.id, 'Declined')}>
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
    {:else}
    
   <!-- Pending Cancellations Section -->
   <div class="pending-cancellations">
    <!-- svelte-ignore a11y_invalid_attribute -->
    <a class="view-all" href="#">View All</a>

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
  </div>
<div class="container">
  <div class="appointments-section">
    <h2>Accepted Appointments</h2>

    <Tabs>
      <TabItem 
        class={currentView === "today" ? "active" : ""} 
        on:click={() => currentView = "today"} 
        title="Today">
      </TabItem>
      <TabItem 
        class={currentView === "week" ? "active" : ""} 
        on:click={() => currentView = "week"} 
        title="This Week">
      </TabItem>
      <TabItem 
        class={currentView === "month" ? "active" : ""} 
        on:click={() => currentView = "month"} 
        title="This Month">
      </TabItem>
    </Tabs>
    

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
          </div>
          <div class="appointment-buttons">
           
            <button class="bg-blue-100" on:click={() => handleCompletedAppointment(appointment.id, 'Completed')}>
              Completed
            </button>
            <button class="bg-red-100" on:click={() => handleCompletedAppointment(appointment.id, 'Missed')}>
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
