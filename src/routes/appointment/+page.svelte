<script lang="ts">
  import { onMount } from 'svelte';
  import { getFirestore,  onSnapshot, collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';
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

  // Dental Assessment Form State
  let isDentalFormOpen = false;
  let isMobile = false;
  
  // Form data for dental assessment
  let dentalFormData = {
    childName: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phone: '',
    dentalNeeds: {
      cleaning: false,
      exam: false,
      fluorideTreatment: false,
      sealantAdministration: false,
      noProblemsNoted: false
    },
    treatmentRequired: {
      restoration: false,
      pulpTherapy: false,
      extraction: false,
      other: false,
      otherDetails: ''
    },
  missingTooth: 0,
  decayedTooth: 0,
  filledTooth: 0,
  
  };

  interface Treatment {
    id: string;
    toothNumber: number;
    date: Date;
    month: string;
    day: string;
    condition: string;
    treatment: string;
    dentist: string;
    status: string;
    notes: string;
    reason: string;
  }
  let serviceType = "Medical";
  let selectedTooth = 22; // Default selected tooth
  let treatments: Treatment[] = [];
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const toothNames = {
    11: "Maxillary Right Central Incisor",
    12: "Maxillary Right Lateral Incisor",
    13: "Maxillary Right Canine",
    14: "Maxillary Right First Premolar",
    15: "Maxillary Right Second Premolar",
    16: "Maxillary Right First Molar",
    17: "Maxillary Right Second Molar",
    18: "Maxillary Right Third Molar",
    21: "Maxillary Left Central Incisor",
    22: "Maxillary Left Lateral Incisor",
    23: "Maxillary Left Canine",
    24: "Maxillary Left First Premolar",
    25: "Maxillary Left Second Premolar",
    26: "Maxillary Left First Molar",
    27: "Maxillary Left Second Molar",
    28: "Maxillary Left Third Molar",
    31: "Mandibular Left Central Incisor",
    32: "Mandibular Left Lateral Incisor",
    33: "Mandibular Left Canine",
    34: "Mandibular Left First Premolar",
    35: "Mandibular Left Second Premolar",
    36: "Mandibular Left First Molar",
    37: "Mandibular Left Second Molar",
    38: "Mandibular Left Third Molar",
    41: "Mandibular Right Central Incisor",
    42: "Mandibular Right Lateral Incisor",
    43: "Mandibular Right Canine",
    44: "Mandibular Right First Premolar",
    45: "Mandibular Right Second Premolar",
    46: "Mandibular Right First Molar",
    47: "Mandibular Right Second Molar",
    48: "Mandibular Right Third Molar"
  };
  
  function selectTooth(toothNumber: number) {
  selectedTooth = toothNumber;
  treatments = [
    {
      id: "1",
      toothNumber: selectedTooth,
      date: new Date(2023, 2, 3),
      month: "MEI",
      day: "03",
      condition: "Caries",
      treatment: "Tooth filling",
      dentist: "Drg Soap Mactavish",
      status: "done",
      notes: "Advanced Decay",
      reason: ""
    },
    {
      id: "2",
      toothNumber: selectedTooth,
      date: new Date(2023, 3, 12),
      month: "APR",
      day: "12",
      condition: "Caries",
      treatment: "Tooth filling",
      dentist: "Drg Soap Mactavish",
      status: "pending",
      notes: "Decay in pulp",
      reason: "Not enough time"
    }
  ];
}

  // Function to toggle dental assessment modal/drawer
  function toggleDentalForm() {
    isDentalFormOpen = !isDentalFormOpen;
  }
  
  // Function to close dental assessment modal/drawer
  function closeDentalForm() {
    isDentalFormOpen = false;
  }
  
  // Function to handle dental form submission
  async function handleDentalFormSubmit() {
  console.log('Dental form submitted:', dentalFormData);
  
  // Update the appointment's assessment status
  if (selectedAppointment) {
    const appointmentIndex = appointments.findIndex(app => app.id === selectedAppointment!.id);
    if (appointmentIndex !== -1) {
      appointments[appointmentIndex].assessmentSubmitted = true; // Mark as assessed
      appointments[appointmentIndex].assessmentData = dentalFormData; // Store the submitted assessment data

      // Update Firestore with the assessment data
      const appointmentRef = doc(db, 'appointments', selectedAppointment.id);
      await updateDoc(appointmentRef, {
        assessmentSubmitted: true,
        assessmentData: dentalFormData,
      });
    }
  }

  closeDentalForm();
  // Here you would typically send the data to your backend
  Swal.fire({
    title: 'Success!',
    text: 'Dental assessment form submitted successfully',
    icon: 'success',
  });
}

  const morningSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
];
const afternoonSlots = [
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

let availableSlots = [...morningSlots, ...afternoonSlots];
 // Array to store available time slots
let date: string = ''; // Date selected by the user
let time: string = ''; // Time selected by the user
let newTime: string = ''; // New time slot for the appointment
let appointmentId: string = ''; // Appointment ID if modifying an existing one
let appointmentService: string = '';
let subServices: string = '';
let remarks: string = '';
let cancelReason: string = '';
let cancellationStatus: string = 'Pending'; // Default cancellation status
let showModal: boolean = false; // Control to show/hide the modal

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
    assessmentSubmitted?: boolean; 
    assessmentData?: any;
    [key: string]: any;
  };

  interface PatientProfile {
  id: string;
  name: string;
  lastName: string;
  age: number;
  gender?: string;  // Make gender optional or required depending on your use case
  address?: string;  // Optional address field
  phone?: string;  // Optional phone field
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

let showReasonModal = false; 
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
let prescriptionAdded = false;

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

onMount(() => {
  // Async logic
  (async () => {
    try {
      await fetchAppointments();
      await fetchPatientProfiles();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading = false;
    }
  })();

  // Synchronous logic and cleanup
  const checkMobile = () => {
    isMobile = window.innerWidth < 768;
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);

  return () => {
    window.removeEventListener('resize', checkMobile);
  };
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
        assessmentSubmitted: data.assessmentSubmitted || false, // Fetch assessment status
        assessmentData: data.assessmentData || {}, // Fetch assessment data
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
        age: data.age,
        gender: data.gender,  // Ensure the gender is fetched
        address: data.address,  // Ensure the address is fetched
        phone: data.phone  // Ensure the phone number is fetched
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
      cancellationStatus: newStatus === 'Accepted' ? '' : 'decline', // Make empty when Accepted
      reason: newStatus === 'Decline' ? rejectionReason : null, // Add the rejection reason
    });

    // Optimistically update the local state
    appointments = appointments.map(appointment =>
      appointment.id === appointmentId
        ? {
            ...appointment,
            status: newStatus,
            cancellationStatus: newStatus === 'Accepted' ? '' : 'decline', // Make empty when Accepted
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

onMount(() => { 
  currentView = 'today';
});

const filterAppointments = (view: 'today' | 'week' | 'month') => {
  const now = new Date();
  return appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    // Include accepted, rescheduled, or completed appointments
    if (!['Accepted', 'Rescheduled', 'Completed','Scheduled'].includes(appt.status)) return false;

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

// Open dental assessment form
const openDentalAssessment = (appointmentId: string) => {
  // Find the selected appointment by its ID
  selectedAppointment = appointments.find(appointment => appointment.id === appointmentId) ?? null;

  if (selectedAppointment) {
    const patient = patientProfiles.find(profile => profile.id === selectedAppointment?.patientId);
    if (patient) {
      // Pre-fill the dental form with patient data
      dentalFormData.childName = `${patient.name} ${patient.lastName}`;
      dentalFormData.gender = patient.gender || '';  // Ensure gender is filled
      dentalFormData.address = patient.address || '';  // Ensure address is filled
      dentalFormData.phone = patient.phone || '';  // Ensure phone number is filled

      // Open the dental assessment form
      isDentalFormOpen = true;
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

    if (quantity >= qtyRefillsNumber) { // Ensure sufficient stock
      try {
        // Decrease the stock in Firestore first
        const updatedQuantity = quantity - qtyRefillsNumber;
        await updateDoc(doc(db, "medicines", id), { quantity: updatedQuantity });

        console.log(`Stock updated: ${name} now has ${updatedQuantity} left.`);

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
          // Show a Swal alert and stop if a prescription already exists
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

        console.log("Prescription successfully Added!");

        // Mark prescription as added
        prescriptionAdded = true; // Disable the button

        // Clear prescription data
        prescriptionMedicines = [];
        prescriber = '';
        isModalOpen = false;

        // Show success alert
        await Swal.fire({
          title: 'Success!',
          text: 'Prescription successfully Added!',
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
        console.error("Error saving prescription to Firestore:", error);
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
 
  // Sidebar toggle
  let isCollapsed = false;
  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  // Logout
  function logout() {
    window.location.href = '/';
  }


  const updateCancellationStatus = async (id: string, status: string, appointments: any[], fetchAppointments: Function) => {
  try {
    const appointmentRef = doc(db, 'appointments', id);
    await updateDoc(appointmentRef, { cancellationStatus: status });

    // Update local appointments list
    appointments = appointments.map(appointment =>
      appointment.id === id
        ? { ...appointment, cancellationStatus: status }
        : appointment
    );

    // Refresh appointments list
    await fetchAppointments();
    Swal.fire('Success', `Appointment status updated to "${status}"`, 'success');
  } catch (error) {
    console.error('Error updating cancellation request status:', error);
    Swal.fire('Error', 'Failed to update the status. Please try again.', 'error');
  }
};
const confirmStatusChange = async (id: string, status: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this appointment as "${status}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: status === 'Approved' ? '#28a745' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, proceed!',
    });

    if (result.isConfirmed) {
      updateCancellationStatus(id, status, appointments, fetchAppointments);
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

    // Get the current timestamp for the appointment completion time
    const completionTime = newStatus === 'Completed' ? new Date().toISOString() : null;

    // Update the status, remarks, and completion time field in Firestore
    await updateDoc(appointmentRef, {
      status: newStatus === 'Completed' ? 'Completed' : 'Missed',
      remarks: remarksToSave, // Save the remarks entered by the user
      completionTime: completionTime, // Save the timestamp for completed appointments
    });

    // Optimistically update the local state
    appointmentStore.update((prevAppointments: Appointment[]) =>
      prevAppointments.map((appointment: Appointment) =>
        appointment.id === appointmentId
          ? { 
              ...appointment, 
              status: newStatus === 'Completed' ? 'Completed' : 'Missed', 
              remarks: remarksToSave,
              completionTime: completionTime, // Update the local completion time
            }
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
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    const appointment = pendingAppointmentsList.find(app => app.id === appointmentId);

    if (!appointment) {
      await Swal.fire('Error!', 'Appointment not found.', 'error');
      return;
    }

    if (!appointment.date || !appointment.time) {
      console.error("Invalid appointment data:", appointment);
      await Swal.fire('Error!', 'Invalid appointment data. Please try again.', 'error');
      return;
    }

    try {
      const appointmentsRef = collection(db, "appointments");
      const conflictQuery = query(
        appointmentsRef,
        where("date", "==", appointment.date),
        where("time", "==", appointment.time),
        where("status", "in", ["Accepted", "Pending", "accepted", "pending"])
      );
      const conflictSnapshot = await getDocs(conflictQuery);

      if (!conflictSnapshot.empty) {
        await Swal.fire(
          'Conflict Detected!',
          'Another appointment already exists in the requested time slot. Cannot accept this reschedule.',
          'error'
        );
        return;
      }

      // Update appointment status
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { status: 'Rescheduled' });

      // Remove the accepted appointment from the local list
      pendingAppointmentsList = pendingAppointmentsList.filter(app => app.id !== appointmentId);

      // Notify success
      await Swal.fire('Accepted!', 'The reschedule request has been accepted.', 'success');
    } catch (error) {
      console.error("Error handling reschedule:", error);
      await Swal.fire('Error!', 'An unexpected error occurred.', 'error');
    }
  }
}

async function rejectReschedule(appointmentId: string, previousDate: string | undefined, previousTime: string | undefined) {
  // Validate required parameters
  if (!previousDate || !previousTime) {
    console.error("Error: Missing required parameters - previousDate or previousTime is undefined.");
    await Swal.fire('Error!', 'Invalid appointment data. Please try again.', 'error');
    return;
  }

  const result = await Swal.fire({
    title: 'Reject Reschedule?',
    text: 'Are you sure you want to reject this reschedule request?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Reject',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      // Check for conflicts in the previous date and time
      const appointmentsRef = collection(db, "appointments");
      const conflictQuery = query(
        appointmentsRef,
        where("date", "==", previousDate),
        where("time", "==", previousTime),
        where("status", "in", ["Accepted", "Pending", "accepted", "pending"]) // Check both "pending" and "accepted"
      );
      const conflictSnapshot = await getDocs(conflictQuery);

      const appointmentRef = doc(db, "appointments", appointmentId);
      if (!conflictSnapshot.empty) {
        // Conflict exists, update status to 'Rejected'
        await updateDoc(appointmentRef, { status: 'Rejected' });

        // Use onSnapshot to listen for real-time updates
        const appointmentsQuery = query(collection(db, "appointments"));
        onSnapshot(appointmentsQuery, (snapshot) => {
          const updatedAppointments: Appointment[] = [];
          snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as Appointment;
            updatedAppointments.push(data);
          });
          // Update local state with real-time data
          pendingAppointmentsList = updatedAppointments;
        });

        await Swal.fire(
          'Rejected!',
          'The reschedule request has been rejected as the original time slot is no longer available.',
          'info'
        );
        return;
      }

      // No conflict, proceed to update the status to 'Accepted'
      await updateDoc(appointmentRef, { status: 'Accepted' });

      // Use onSnapshot to listen for real-time updates
      const appointmentsQuery = query(collection(db, "appointments"));
      onSnapshot(appointmentsQuery, (snapshot) => {
        const updatedAppointments: Appointment[] = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Appointment;
          updatedAppointments.push(data);
        });
        // Update local state with real-time data
        pendingAppointmentsList = updatedAppointments;
      });

      await Swal.fire(
        'Rejected and Reverted!',
        'The reschedule request has been rejected, and the appointment has been reverted to Accepted.',
        'success'
      );
    } catch (error) {
      console.error("Error checking for conflicts or updating status: ", error);
      await Swal.fire('Error!', 'An unexpected error occurred. Please try again later.', 'error');
    }
  }
}

// Function to load available time slots for the selected date
async function loadAvailableSlots() {
  const selectedDate = date; // Get the date value from the form
  
  // Ensure selectedDate is valid
  if (!selectedDate) {
    console.error("Selected date is invalid.");
    return;
  }

  // Query the database to check which slots are already booked for the selected date
  const q = query(
    collection(db, "appointments"),
    where("date", "==", selectedDate),
    where("cancellationStatus", "==", "") // Ensure it excludes cancelled appointments
  );

  const querySnapshot = await getDocs(q);
  const bookedSlots = querySnapshot.docs.map((doc) => doc.data().time);

  // Filter out the booked slots from the available slots
  availableSlots = [...morningSlots, ...afternoonSlots].filter(
    (slot) => !bookedSlots.includes(slot)
  );
}

// Function to show the appointment modal (to view and modify details)
function showAppointmentModal(appointment: Appointment) {
  appointmentId = appointment.id;
  appointmentService = appointment.service;
  date = appointment.date;
  time = appointment.time;
  remarks = appointment.remarks;
  subServices = appointment.subServices;
  cancelReason = appointment.cancelReason;
  cancellationStatus = appointment.cancellationStatus;
  showModal = true;

  // Ensure that patientId is assigned correctly
  selectedAppointment = appointment; // Ensure this is set correctly

  // Load available slots when the modal is shown
  loadAvailableSlots();
}

// Function to close the modal and reset the form values
function hideAppointmentModal() {
  showModal = false;
  // Reset form values to clear the modal
  appointmentId = '';
  appointmentService = '';
  date = '';
  time = '';
  remarks = '';
  subServices = '';
  cancelReason = '';
  cancellationStatus = '';
  availableSlots = []; // Clear available slots when hiding the modal
}

// Function to handle adding a new appointment (without updating the patient profile)
async function addNewAppointment() {
  // Ensure that the required fields are valid before proceeding
  if (!newTime || !date || !appointmentService) {
    Swal.fire({
      icon: "warning",
      title: "Missing Required Information",
      text: "Please ensure that all required fields are filled out (Date, Time, Service).",
    });
    return; // Exit if any required field is missing
  }

  // Check if the time slot is already booked before saving
  const q = query(
    collection(db, "appointments"),
    where("date", "==", date),
    where("time", "==", newTime),
    where("cancellationStatus", "==", "")
  );

  const querySnapshot = await getDocs(q);
  const existingAppointment = querySnapshot.docs.find(
    (doc) => doc.data().status === "Accepted" || doc.data().status === "Pending"
  );

  if (existingAppointment) {
    Swal.fire({
      icon: "info",
      title: "Time Slot Unavailable",
      text: "This time slot is already booked or pending. Please choose a different time.",
    });
    return; // Exit if the slot is already booked
  }

  // Ensure the patient profile exists (via user-side function or check)
  const patientId = selectedAppointment?.patientId;

  if (!patientId) {
    Swal.fire({
      icon: "error",
      title: "Patient Not Selected",
      text: "Please select a patient before scheduling the appointment.",
    });
    return; // Exit if no patient profile is found
  }

  // Check if the patient profile exists in the list (if applicable)
  const patientProfile = patientProfiles.find(profile => profile.id === patientId);

  if (!patientProfile) {
    Swal.fire({
      icon: "error",
      title: "Profile Not Found",
      text: "The patient profile doesn't exist. Please ensure the patient has a profile before proceeding.",
    });
    return; // Exit if no patient profile is found
  }

  // If available, save the new appointment to the database
  const newAppointment: Appointment = {
    id: appointmentId || '', // Fallback to an empty string if not set
    service: appointmentService || '', // Fallback to empty string if not set
    date: date || '', // Fallback to empty string if not set
    time: newTime || '', // Fallback to empty string if not set
    remarks: remarks || '', // Fallback to empty string if not set
    subServices: subServices || '', // Fallback to empty string if not set
    cancelReason: cancelReason || '', // Fallback to empty string if not set
    cancellationStatus: cancellationStatus || 'Pending', // Default to 'Pending'
    status: 'Scheduled', // Default status for new appointments
    patientId: patientId, // Ensure patientId is included
  };

  // Log and save the new appointment
  console.log("Adding appointment:", newAppointment);

  try {
    await addDoc(collection(db, "appointments"), newAppointment);

    // Now that the new follow-up appointment has been added,
    // Update the status of the selected appointment to "Completed: Need Follow-up"
    if (selectedAppointment) {
      const updatedAppointment = {
        ...selectedAppointment,
        status: "Completed: Need Follow-up", // Update status here
      };

      // Ensure selectedAppointment is not null before updating
      if (selectedAppointment?.id) {
        await updateDoc(doc(db, "appointments", selectedAppointment.id), {
          status: updatedAppointment.status,
        });
      }
    }

    Swal.fire({
      icon: "success",
      title: "Appointment Added",
      text: "Your appointment has been successfully scheduled and the previous appointment status updated.",
    });

    hideAppointmentModal(); // Close the modal after adding the appointment
  } catch (error) {
    console.error("Error adding appointment:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "There was an issue adding the appointment. Please try again.",
    });
  }
}

// Function to validate the form data before adding an appointment
function validateAppointmentData() {
  if (!appointmentService || !newTime || !date) {
    Swal.fire({
      icon: "warning",
      title: "Missing Required Fields",
      text: "Please fill in all required fields (Date, Time, Service).",
    });
    return false;
  }
  return true;
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
      <a class="view-all" href="/allstatus">View All</a>
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
                <div class="appointment-buttons">
                  <button
                    class="bg-green-100 text-green-500 px-3 py-1 rounded hover:bg-green-600"
                    on:click={() => acceptReschedule(appointment.id)}
                  >
                    Accept
                  </button>
                  <button
                  class="bg-red-100 text-red-500 px-3 py-1 rounded hover:bg-red-600"
                  on:click={() => rejectReschedule(appointment.id, appointment.date, appointment.time)}
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
                  <button
                    class="bg-green-100 text-green-500 px-3 py-1 rounded"
                    on:click={() => confirmStatusChange(appointment.id, 'Approved')}
                  >
                    Approved
                  </button>
                  <button
                    class="bg-red-100 text-red-500 px-3 py-1 rounded"
                    on:click={() => confirmStatusChange(appointment.id, 'Declined')}
                  >
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
    <div class="container">
      <div class="appointments-section">
        <h2>Accepted Appointments</h2>
    
        <!-- Tabs for Filtering -->
        <div class="tabs">
          <button
            type="button"
            class="tab-item {currentView === 'today' ? 'active' : ''}"
            on:click={() => currentView = 'today'}
          >
            Today
          </button>
          <button
            type="button"
            class="tab-item {currentView === 'week' ? 'active' : ''}"
            on:click={() => currentView = 'week'}
          >
            This Week
          </button>
          <button
            type="button"
            class="tab-item {currentView === 'month' ? 'active' : ''}"
            on:click={() => currentView = 'month'}
          >
            This Month
          </button>
        </div>
    
        <!-- Display Appointments if any -->
        {#if filterAppointments(currentView).length > 0}
        {#each filterAppointments(currentView) as appointment}
        <article class="appointment-card1">
          <section class="appointment-details">
            <!-- Patient Info Section -->
            <p class="appointment-patient">
              {#each patientProfiles as profile (profile.id)}
                {#if profile.id === appointment.patientId}
                  <strong>{profile.name} {profile.lastName}</strong> ({profile.age} years old)
                {/if}
              {/each}
            </p>
    
                <!-- Date & Time Section -->
                <div style="margin-bottom: 10px;">
                  <p style="margin: 5px 0 0; font-size: 0.95em; color: #555;">
                    <strong>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    <span> | {appointment.time}</span>
                  </p>
                </div>
    
                <!-- Service Information -->
                <p class="appointment-service">Service: {appointment.service}</p>
                {#if appointment.subServices && appointment.subServices.length > 0}
                  <p class="appointment-service">Sub-services: {appointment.subServices.join(', ')}</p>
                {/if}
    
                <!-- Remarks Input -->
                <div class="remarks-container">
                  <label for="remarks-{appointment.id}" class="remarks-label">Remarks:</label>
                  <input
                    type="text"
                    id="remarks-{appointment.id}"
                    class="remarks-input"
                    bind:value={appointment.remarks}
                    placeholder="Enter remarks here"
                    aria-label="Enter remarks for {appointment.date} at {appointment.time}"
                  />
                </div>
              </section>
            </article>
    
            <!-- Action Buttons (Add Prescription, Completed, Missed) -->
            <div class="appointment-buttons">
              {#if appointment.status === 'Completed'}
                <!-- Ipakita lang ang button na "Add Appointment" kung 'Completed' ang status -->
                <div class="add-appointment-button">
                  <button class="bg-green-500 text-white px-4 py-2 rounded" on:click={() => showAppointmentModal(appointment)}>
                    Add Appointment
                  </button>
                </div>
              {:else}
                <!-- Show these buttons if the status is not 'Completed' -->
                <button
                  on:click={() => openModal(appointment.id)}
                  class="bg-green-100 text-green-500 px-3 py-1 rounded"
                  disabled={prescriptionAdded}
                >
                  Add Prescription
                </button>
                <button
  class={`px-3 py-1 rounded ${appointment.assessmentSubmitted ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-500'}`}
  on:click={() => {
    if (appointment.assessmentSubmitted) {
      // Show the submitted assessment data
      Swal.fire({
        title: 'Submitted Assessment',
        html: `
          <strong>Patient's Name:</strong> ${appointment.assessmentData.childName}<br>
          <strong>Gender:</strong> ${appointment.assessmentData.gender}<br>
          <strong>Address:</strong> ${appointment.assessmentData.address}<br>
          <strong>Phone:</strong> ${appointment.assessmentData.phone}<br>
          <strong>Dental Needs:</strong> ${Object.entries(appointment.assessmentData.dentalNeeds).filter(([key, value]) => value).map(([key]) => key).join(', ')}<br>
          <strong>Treatment Required:</strong> ${Object.entries(appointment.assessmentData.treatmentRequired).filter(([key, value]) => value).map(([key]) => key).join(', ')}<br>
          <strong>Missing Teeth:</strong> ${appointment.assessmentData.missingTooth}<br>
          <strong>Decayed Teeth:</strong> ${appointment.assessmentData.decayedTooth}<br>
          <strong>Filled Teeth:</strong> ${appointment.assessmentData.filledTooth}<br>
        `,
        icon: 'info',
      });
    } else {
      openDentalAssessment(appointment.id);
    }
  }}
>
  {#if appointment.assessmentSubmitted}
    Assessed
  {:else}
    Assessment
  {/if}
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
              {/if}
            </div>
            
    
          {/each}
        {:else}
          <div class="no-appointments">
            <p>No appointments for the selected period.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
  <!-- Modal -->
 
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  {#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay-new-appointment" on:click={hideAppointmentModal}>
    <div class="modal-content-new-appointment" on:click|stopPropagation>
      <h3>
        Add Follow-up Appointment for 
        {selectedAppointment 
          ? (() => {
              const patientProfile = patientProfiles.find(profile => profile.id === selectedAppointment?.patientId);
              return patientProfile ? `${patientProfile.name} ${patientProfile.lastName}` : 'Patient';
            })() 
          : 'Patient'}
      </h3>

      <!-- Modal form or other content here -->
   
     
  
      <form on:submit|preventDefault={addNewAppointment}>
        <label for="date">Date:</label>
        <input 
          type="date" 
          id="date" 
          name="date" 
          bind:value={date} 
          required 
          on:change={loadAvailableSlots} 
          min={new Date().toISOString().split('T')[0]}
        />
     
      
        
        <label for="newTime">Select a new time:</label>
        <select id="newTime" bind:value={newTime} required>
          <option value="" disabled selected>Select a time</option>
          {#each availableSlots as slot}
            <option value={slot}>{slot}</option>
          {/each}
        </select>
        
  
        <label for="service">Service:</label>
        <input 
          type="text" 
          id="service" 
          name="service" 
          bind:value={appointmentService} 
          required 
        />
  
        <label for="subServices">Sub-services:</label>
        <input 
          type="text" 
          id="subServices" 
          name="subServices" 
          bind:value={subServices} 
          placeholder="Enter sub-services here"
        />
  
        <label for="remarks">Remarks:</label>
        <input 
          type="text" 
          id="remarks" 
          name="remarks" 
          bind:value={remarks} 
          placeholder="Enter remarks here"
        />
        
        
        <button type="submit" class="submit-btn">Add Appointment</button>
        <button type="button" class="cancel-btn" on:click={hideAppointmentModal}>Cancel</button>
      </form>
    </div>
  </div>
  {/if}
  
  
<!-- Modal with Overlay (Appears when isModalOpen is true) -->
{#if isModalOpen}
  <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" role="dialog" aria-labelledby="modal-title" aria-hidden={!isModalOpen}>
    <div class="modal-content bg-white p-6 rounded shadow-lg relative w-full max-w-md" tabindex="-1">
      
      <!-- Close Button -->
      <button 
        class="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
        on:click={closeModal}
        aria-label="Close Modal"
      >
        &times;
      </button>

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
            addSelectedMedicine();
            addManualMedicine();
            submitPrescription();
          }}
        >
          Submit Prescription
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Dental Assessment Modal/Drawer -->
{#if isDentalFormOpen}
  {#if !isMobile}
    <!-- Modal for desktop -->
    <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    aria-label="Close dental form"
    on:click={closeDentalForm}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeDentalForm()}
  >
        <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>DENTAL ASSESSMENT FORM</h2>
          <button class="close-btn" on:click={closeDentalForm}>&times;</button>
        </div>
        <div class="modal-body">
          <form on:submit|preventDefault={handleDentalFormSubmit}>
            <div class="form-grid">
              <!-- Row 1 -->
              <div class="form-group">
                <label for="childName">Patient's Name:</label>
                <input type="text" id="childName" bind:value={dentalFormData.childName} />
              </div>
              
              <div class="form-group">
                <label for="gender">Gender:</label>
                <select id="gender" bind:value={dentalFormData.gender}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Row 2 -->
              <div class="form-group address">
                <label for="address">Address:</label>
                <input type="text" id="address" bind:value={dentalFormData.address} />
              </div>
              <div class="form-group">
                <label for="phone">Phone:</label>
                <input type="tel" id="phone" bind:value={dentalFormData.phone} />
              </div>
              
              <!-- Row 3 -->
              <div class="form-group dental-needs">
                <label>Dental Needs:</label>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input type="checkbox" id="cleaning" bind:checked={dentalFormData.dentalNeeds.cleaning} />
                    <label for="cleaning">Cleaning</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="exam" bind:checked={dentalFormData.dentalNeeds.exam} />
                    <label for="exam">Exam</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="fluoride" bind:checked={dentalFormData.dentalNeeds.fluorideTreatment} />
                    <label for="fluoride">Fluoride Treatment Received</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="sealant" bind:checked={dentalFormData.dentalNeeds.sealantAdministration} />
                    <label for="sealant">Sealant Administration</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="noProblems" bind:checked={dentalFormData.dentalNeeds.noProblemsNoted} />
                    <label for="noProblems">No Problems Noted</label>
                  </div>
                </div>
              </div>
              
              <div class="form-group treatment-required">
                <label>Treatment Required:</label>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input type="checkbox" id="restoration" bind:checked={dentalFormData.treatmentRequired.restoration} />
                    <label for="restoration">Restoration</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="pulpTherapy" bind:checked={dentalFormData.treatmentRequired.pulpTherapy} />
                    <label for="pulpTherapy">Pulp Therapy</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="extraction" bind:checked={dentalFormData.treatmentRequired.extraction} />
                    <label for="extraction">Extraction</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="other" bind:checked={dentalFormData.treatmentRequired.other} />
                    <label for="other">Other</label>
                    <input 
                      type="text" 
                      id="otherDetails" 
                      bind:value={dentalFormData.treatmentRequired.otherDetails} 
                      class="other-input" 
                      disabled={!dentalFormData.treatmentRequired.other}
                    />
                  </div>
                </div>
              </div>
              
              <!-- Row 4 -->
              <!-- Oral conditions prior to today's visit -->
<div class="form-group oral-conditions full-width">
  <label>Oral conditions prior to today's visit: (Please indicate number of each condition)</label>
  <div class="legend">
    <label for="missingTooth">Missing Tooth: </label>
    <input type="number" id="missingTooth" bind:value={dentalFormData.missingTooth} min="0" />
    <label></label>
  </div>
  <div class="legend">
    <label for="decayedTooth">Decayed Tooth: </label>
    <input type="number" id="decayedTooth" bind:value={dentalFormData.decayedTooth} min="0" />
    <label></label>
  </div>
  <div class="legend">
    <label for="filledTooth">Filled Tooth: </label>
    <input type="number" id="filledTooth" bind:value={dentalFormData.filledTooth} min="0" />
    <label></label>
  </div>
</div>
<div class="max-w-6xl mx-auto p-4 bg-white">
  <!-- Service Type Selection -->
  
  <!-- Main Content -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg">
    <!-- Odontogram -->
    <div class="p-6 border-r border-gray-200">
      <h2 class="text-lg font-medium text-gray-700 mb-6">Odontogram</h2>
      <div class="relative">
        <!-- Upper teeth -->
        <div class="flex justify-center mb-4">
          <div class="grid grid-cols-8 gap-1 w-full">
            {#each upperTeeth as tooth}
              <div class="flex flex-col items-center">
                <div class="text-xs text-gray-500 mb-1">{tooth}</div>
                <div
                  class="w-10 h-12 border border-gray-300 rounded-t-full cursor-pointer hover:border-blue-500 transition-colors
                    {selectedTooth === tooth ? 'ring-2 ring-blue-500' : ''}"
                  on:click={() => selectTooth(tooth)}
                  on:keydown={(event) => event.key === 'Enter' || event.key === ' ' ? selectTooth(tooth) : null}
                  tabindex="0"
                  role="button"
                  aria-label={`Select tooth ${tooth}`}
                ></div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-300 my-4"></div>

        <!-- Lower teeth -->
        <div class="flex justify-center">
    <div class="grid grid-cols-8 gap-1 w-full">
      {#each lowerTeeth as tooth}
        <div class="flex flex-col items-center">
          <button
            class="w-10 h-12 border border-gray-300 rounded-t-full cursor-pointer hover:border-blue-500 transition-colors
              {selectedTooth === tooth ? 'ring-2 ring-blue-500' : ''}"
            on:click={() => selectTooth(tooth)}
            aria-pressed={selectedTooth === tooth ? 'true' : 'false'}
            aria-label={`Select tooth ${tooth}`}
          ></button>
          <div class="text-xs text-gray-500 mt-1">{tooth}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
</div>
    </div>
  </div>


            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Submit</button>
              <button type="button" class="btn btn-secondary" on:click={closeDentalForm}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {:else}
    <!-- Drawer for mobile -->
    <div class="drawer-overlay">
      <div class="drawer">
        <div class="drawer-header">
          <h2>DENTAL ASSESSMENT FORM</h2>
          <button class="close-btn" on:click={closeDentalForm}>&times;</button>
        </div>
        <div class="drawer-body">
          <form on:submit|preventDefault={handleDentalFormSubmit}>
            <div class="form-stack">
              <!-- Child's Name -->
              <div class="form-group">
                <label for="mobileChildName">Patient's Name:</label>
                <input type="text" id="mobileChildName" bind:value={dentalFormData.childName} />
              </div>
              
              <!-- Gender -->
              <div class="form-group">
                <label for="mobileGender">Gender:</label>
                <select id="mobileGender" bind:value={dentalFormData.gender}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Address -->
              <div class="form-group">
                <label for="mobileAddress">Address:</label>
                <input type="text" id="mobileAddress" bind:value={dentalFormData.address} />
              </div>
              
              <!-- Phone -->
              <div class="form-group">
                <label for="mobilePhone">Phone:</label>
                <input type="tel" id="mobilePhone" bind:value={dentalFormData.phone} />
              </div>
              
              <!-- Dental Needs -->
              <div class="form-group">
                <label>Dental Needs:</label>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileCleaning" bind:checked={dentalFormData.dentalNeeds.cleaning} />
                    <label for="mobileCleaning">Cleaning</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileExam" bind:checked={dentalFormData.dentalNeeds.exam} />
                    <label for="mobileExam">Exam</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileFluoride" bind:checked={dentalFormData.dentalNeeds.fluorideTreatment} />
                    <label for="mobileFluoride">Fluoride Treatment Received</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileSealant" bind:checked={dentalFormData.dentalNeeds.sealantAdministration} />
                    <label for="mobileSealant">Sealant Administration</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileNoProblems" bind:checked={dentalFormData.dentalNeeds.noProblemsNoted} />
                    <label for="mobileNoProblems">No Problems Noted</label>
                  </div>
                </div>
              </div>
              
              <!-- Treatment Required -->
              <div class="form-group">
                <label>Treatment Required:</label>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileRestoration" bind:checked={dentalFormData.treatmentRequired.restoration} />
                    <label for="mobileRestoration">Restoration</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobilePulpTherapy" bind:checked={dentalFormData.treatmentRequired.pulpTherapy} />
                    <label for="mobilePulpTherapy">Pulp Therapy</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileExtraction" bind:checked={dentalFormData.treatmentRequired.extraction} />
                    <label for="mobileExtraction">Extraction</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="mobileOther" bind:checked={dentalFormData.treatmentRequired.other} />
                    <label for="mobileOther">Other</label>
                    <input 
                      type="text" 
                      id="mobileOtherDetails" 
                      bind:value={dentalFormData.treatmentRequired.otherDetails} 
                      class="other-input" 
                      disabled={!dentalFormData.treatmentRequired.other}
                    />
                  </div>
                </div>
              </div>
              
              <!-- Oral Conditions -->
              <!-- Oral conditions prior to today's visit -->
<div class="form-group">
  <label>Oral conditions prior to today's visit:</label>
  <div class="legend">
    <label for="mobileMissingTooth">Missing Tooth: </label>
    <input type="number" id="mobileMissingTooth" bind:value={dentalFormData.missingTooth} min="0" />
    <label></label>
  </div>
  <div class="legend">
    <label for="mobileDecayedTooth">Decayed Tooth: </label>
    <input type="number" id="mobileDecayedTooth" bind:value={dentalFormData.decayedTooth} min="0" />
    <label></label>
  </div>
  <div class="legend">
    <label for="mobileFilledTooth">Filled Tooth: </label>
    <input type="number" id="mobileFilledTooth" bind:value={dentalFormData.filledTooth} min="0" />
    <label></label>
  </div>
</div>
<div class="max-w-6xl mx-auto p-4 bg-white">
  <!-- Service Type Selection -->
  
  <!-- Main Content -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-lg">
    <!-- Odontogram -->
    <div class="p-6 border-r border-gray-200">
      <h2 class="text-lg font-medium text-gray-700 mb-6">Odontogram</h2>
      <div class="relative">
        <!-- Upper teeth -->
        <div class="flex justify-center mb-4">
          <div class="grid grid-cols-8 gap-1 w-full">
            {#each upperTeeth as tooth}
              <div class="flex flex-col items-center">
                <div class="text-xs text-gray-500 mb-1">{tooth}</div>
                <div
                  class="w-10 h-12 border border-gray-300 rounded-t-full cursor-pointer hover:border-blue-500 transition-colors
                    {selectedTooth === tooth ? 'ring-2 ring-blue-500' : ''}"
                  on:click={() => selectTooth(tooth)}
                  on:keydown={(event) => event.key === 'Enter' || event.key === ' ' ? selectTooth(tooth) : null}
                  tabindex="0"
                  role="button"
                  aria-label={`Select tooth ${tooth}`}
                ></div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-300 my-4"></div>

        <!-- Lower teeth -->
        <div class="flex justify-center">
    <div class="grid grid-cols-8 gap-1 w-full">
      {#each lowerTeeth as tooth}
        <div class="flex flex-col items-center">
          <button
            class="w-10 h-12 border border-gray-300 rounded-t-full cursor-pointer hover:border-blue-500 transition-colors
              {selectedTooth === tooth ? 'ring-2 ring-blue-500' : ''}"
            on:click={() => selectTooth(tooth)}
            aria-pressed={selectedTooth === tooth ? 'true' : 'false'}
            aria-label={`Select tooth ${tooth}`}
          ></button>
          <div class="text-xs text-gray-500 mt-1">{tooth}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
</div>
    </div>
  </div>


            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Submit</button>
              <button type="button" class="btn btn-secondary" on:click={closeDentalForm}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}
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
  margin-bottom: 12px; /* Slightly increased spacing for better separation */
  padding: 12px 16px; /* Increased padding for more balanced layout */
  font-size: 0.9rem;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(49, 130, 206, 0.5); /* Consistent border */
  min-height: 100px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.appointment-card:hover {
  transform: translateY(-2px); /* Subtle hover effect */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.patient-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.patient-name {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
}

.service {
  margin-top: 6px;
  color: #555;
  font-size: 0.875rem;
}

.appointment-buttons {
  display: flex;
  gap: 12px; /* Increased gap for better separation */
  justify-content: flex-end;
  margin-top: 10px;
}

.appointment-buttons button {
  padding: 8px 16px;
  border-radius: 50px;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.appointment-buttons button:hover {
  background-color: #3182ce;
  color: #fff;
}

.container {
  position: fixed;
  top: 0;
  left: 230px;
  height: 700px;
  width: 57%;
  overflow-y: scroll;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1), 0 2px 4px #0288d1;
  scrollbar-width: thin; /* Visible but minimal scrollbar for Firefox */
  scrollbar-color: #aaa #f9fafb;
}

.container::-webkit-scrollbar {
  width: 8px;
}

.container::-webkit-scrollbar-thumb {
  background-color: #aaa; /* Custom thumb color */
  border-radius: 4px;
}

.container::-webkit-scrollbar-track {
  background-color: #f9fafb;
}

.appointments-section {
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .container {
    left: 0;
    width: 100%;
    height: auto;
    top: 0;
    padding: 10px;
  }

  .appointment-card {
    padding: 10px;
  }

  .appointment-buttons button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

  .appointment-buttons button {
    padding: 8px 16px;
    border-radius: 50px;
    cursor: pointer;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 10px;
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
  .appointment-card1 {
  border: 1px solid #b0bec5; 
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 0; /* Tanggalin ang margin sa ibaba */
  background-color: #ffffff;
}

.appointment-details {
  display: flex;
  flex-direction: column;
  gap: 0; /* Tanggalin ang gap sa pagitan ng mga elements */
}

.appointment-patient {
  font-size: 1.1em;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 0; /* Tanggalin ang margin sa ibaba */
}

.appointment-service {
  font-size: 1em;
  color: #34495e;
  margin-bottom: 0; /* Tanggalin ang margin sa ibaba */
}

.remarks-container {
  display: flex;
  flex-direction: column;
  gap: 0; /* Tanggalin ang gap sa pagitan ng remarks at input */
}

.remarks-input {
  padding: 8px; /* I-adjust ang padding kung kinakailangan */
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  font-size: 1em;
  width: 100%;
  background-color: #f8f9fa;
  margin-bottom: 0; /* Tanggalin ang margin sa ibaba */
}

.appointment-buttons {
  display: flex;
  gap: 5px; /* Konting gap para hindi magdikit ang buttons */
  margin-top: 10px; /* Magdagdag ng kaunting space sa ibabaw ng buttons */
}

/* Modal Overlay - Semi-transparent background */
/* Modal Overlay for New Appointment */
.modal-overlay-new-appointment  {
  position: fixed; /* Makes it overlay on the entire screen */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Ensure modal is on top */
  overflow: hidden; /* Prevents any scrolling */
  pointer-events: auto; /* Prevent interaction with background */
}

/* Modal Content Box for New Appointment */
.modal-content-new-appointment {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
  position: relative; /* Prevents affecting other elements */
}

/* Modal Header */
.modal-content-new-appointment h3 {
  font-size: 24px;
  color: #333;
  
  margin-bottom: 10px;
  text-align: center;
}

/* Modal Description */

/* Form Labels */
.modal-content-new-appointment label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #444;
  margin-bottom: 6px;
}

/* Form Inputs */
.modal-content-new-appointment input {
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}

/* Button Styling */
.submit-btn,
.cancel-btn {
  padding: 10px 15px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 48%;
  margin-top: 10px;
}

/* Submit Button (Green) */
.submit-btn {
  background-color: #4caf50;
  color: #fff;
}

/* Cancel Button (Red) */
.cancel-btn {
  background-color: #f44336;
  color: #fff;
}

/* Button Hover Effects */
.submit-btn:hover {
  background-color: #45a049;
}

.cancel-btn:hover {
  background-color: #e53935;
}

/* Fade-in Animation */
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* Dental Assessment Form Styles */
.modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f8f8;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
}

/* Drawer styles for mobile */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 100%;
  background-color: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f8f8;
  position: sticky;
  top: 0;
  z-index: 10;
}

.drawer-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.drawer-body {
  padding: 20px;
}

/* Form styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.address {
  grid-column: span 2;
}

.dental-needs, .treatment-required {
  grid-column: span 1;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  font-weight: 500;
  color: #333;
}

input, select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #08B8F3;
  box-shadow: 0 0 0 2px rgba(8, 184, 243, 0.2);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item label {
  font-weight: normal;
}

.other-input {
  flex: 1;
  margin-left: 5px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn:active {
  transform: translate;
}
</style>