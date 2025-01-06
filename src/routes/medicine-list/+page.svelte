<script lang="ts">
  import Sidebar from '../sidenav/+page.svelte';
  import { onMount } from "svelte";
  import { getFirestore, doc, setDoc, collection, getDocs, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
  import { firebaseConfig } from "$lib/firebaseConfig";
  import { initializeApp, getApps, getApp } from "firebase/app";
  import { MinusOutline, PlusOutline } from 'flowbite-svelte-icons';
  import Swal from "sweetalert2";

  let isCollapsed = false;

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  function logout() {
    window.location.href = "/"; // Redirect to main landing page
  }

  type Medicine = {
    id: string;
    name: string;
    quantity: number;
    description: string;
    imageUrl?: string;
  };

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);

  let medicines: Medicine[] = [];
  let showPopup = false;
  let newMedicine = { name: "", quantity: 0, description: "", imageUrl: "" };
  let imageFile: File | null = null;
  let editPopup = false;
  let medicineToEdit: Medicine | null = null;

  async function fetchMedicines() {
  const medicinesCollection = collection(firestore, "medicines");
  const medicineSnapshot = await getDocs(medicinesCollection);

  medicines = medicineSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,  // Store Firestore document ID as the 'id' property
        name: data.name || "", 
        quantity: data.quantity ?? 0, 
        description: data.description || "", 
        imageUrl: data.imageUrl || "",
      } as Medicine;
    })
    .filter((medicine) => medicine.name && medicine.description); // Filter out invalid medicines
}


  // On mount, fetch the medicines
  onMount(fetchMedicines);

  function togglePopup() {
    showPopup = !showPopup;
  }


  function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      // If editing, update the image for the medicineToEdit
      if (medicineToEdit) {
        medicineToEdit.imageUrl = reader.result as string;
      }

      // If adding, update the image for the newMedicine
      if (newMedicine) {
        newMedicine.imageUrl = reader.result as string;
      }
    };

    reader.readAsDataURL(file);
  }
}



async function addMedicine() {
  if (newMedicine.name && newMedicine.quantity > 0 && newMedicine.description) {
    try {
      // Show loading SweetAlert while processing
      Swal.fire({
        title: "Adding Medicine...",
        text: "Please wait while we save the details.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          newMedicine.imageUrl = reader.result as string;

          // Save to Firestore
          const medicineName = newMedicine.name; // Save the name before resetting
          await saveMedicineToFirestore();

          // Close loading SweetAlert and show success message
          Swal.close();
          showSuccessAlert(medicineName);
        };
      } else {
        // Save to Firestore without image
        const medicineName = newMedicine.name; // Save the name before resetting
        await saveMedicineToFirestore();

        // Close loading SweetAlert and show success message
        Swal.close();
        showSuccessAlert(medicineName);
      }
    } catch (error) {
      console.error("Error adding medicine: ", error);

      // Show error SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add the medicine. Please try again.",
      });
    }
  } else {
    // Show validation error alert
    Swal.fire({
      icon: "warning",
      title: "Invalid Input",
      text: "Please fill in all the required fields and ensure the quantity is greater than zero.",
    });
  }
}

// Function to display success SweetAlert
function showSuccessAlert(medicineName: string) {
  Swal.fire({
    icon: "success",
    title: "Medicine Added",
    text: `${medicineName} has been successfully added to the inventory.`,
  });
}

async function saveMedicineToFirestore() {
  const medicineRef = doc(firestore, "medicines", newMedicine.name);
  await setDoc(medicineRef, newMedicine);

  // Refetch medicines to ensure the list is updated
  await fetchMedicines();
  newMedicine = { name: "", quantity: 0, description: "", imageUrl: "" };
  imageFile = null;
  togglePopup();
}

  async function updateMedicineQuantity(medicine: Medicine, increment: boolean) {
    const medicineRef = doc(firestore, "medicines", medicine.name);
    let updatedQuantity = medicine.quantity;

    if (increment) {
      updatedQuantity++;
    } else {
      if (updatedQuantity > 0) updatedQuantity--;
    }

    try {
      // Update Firestore document with new quantity
      await updateDoc(medicineRef, { quantity: updatedQuantity });

      // Update local state immediately for faster UI feedback
      medicines = medicines.map(m => (m.name === medicine.name ? { ...m, quantity: updatedQuantity } : m));
    } catch (error) {
      console.error("Error updating quantity: ", error);
    }
  }

// Open the edit popup and set the medicine to edit
function openEditPopup(medicine: Medicine) {
  medicineToEdit = { ...medicine }; // Directly clone the medicine object for editing
  editPopup = true;
}

// Close the edit popup
function closeEditPopup() {
  editPopup = false;
  medicineToEdit = null;
}

async function saveEditedMedicine() {
  if (!medicineToEdit) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No medicine selected for editing.",
    });
    return;
  }

  if (!medicineToEdit.name || !medicineToEdit.description || medicineToEdit.quantity === undefined) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Input",
      text: "Please fill in all required fields.",
    });
    return;
  }

  try {
    // Show loading SweetAlert while processing
    Swal.fire({
      title: "Saving Changes...",
      text: "Please wait while we update the medicine details.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const medicineRef = doc(firestore, "medicines", medicineToEdit?.id); // Use optional chaining on id

    // Check if the document exists before attempting to update it
    const docSnapshot = await getDoc(medicineRef);
    if (!docSnapshot.exists()) {
      Swal.close(); // Close the loading SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `The medicine record for ${medicineToEdit?.name || "this medicine"} does not exist.`,
      });
      return;
    }

    // Proceed with updating the Firestore document
    await updateDoc(medicineRef, {
      name: medicineToEdit?.name,
      quantity: medicineToEdit?.quantity,
      description: medicineToEdit?.description,
      imageUrl: medicineToEdit?.imageUrl || "",
    });

    // Update the local state immediately
    medicines = medicines.map(m =>
      m.id === medicineToEdit?.id ? { ...m, ...medicineToEdit } : m
    );

    // Close the loading SweetAlert and show success message
    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Medicine Updated",
      text: `${medicineToEdit.name} has been successfully updated.`,
    });

    // Close the edit popup
    closeEditPopup();
  } catch (error) {
    console.error("Error saving edited medicine:", error);

    // Close the loading SweetAlert and show error message
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to save changes. Please try again.",
    });
  }
}


// Delete a medicine
async function deleteMedicine(medicine: Medicine) {
  if (!medicine.id) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to delete the medicine. No ID was found.",
    });
    return;
  }

  try {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to delete the medicine: ${medicine.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return; // If the user cancels, stop the deletion process
    }

    // Use the document ID (`medicine.id`) for deletion
    const medicineRef = doc(firestore, "medicines", medicine.id);
    await deleteDoc(medicineRef);

    // Update the local state to remove the deleted medicine
    medicines = medicines.filter((m) => m.id !== medicine.id);

    // Show success alert
    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: `${medicine.name} has been deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting medicine: ", error);

    // Show error alert
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to delete the medicine. Please try again.",
    });
  }
}


</script>


<style>
 

      .dashboard {
        display: flex;
        height: 100vh;
        overflow: hidden;
        font-family: 'Nunito', sans-serif;
        color: #333;

    }
    .container {
  flex-grow: 1; /* Make this container take the remaining space */
  overflow-y: scroll; /* Enable vertical scrolling */
  padding: 1rem;
  margin: 0 auto; 
  max-width: 1200px;
  scrollbar-width: none; /* For Firefox */
}

.container::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Edge */
}


.popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.popup-content {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

    /* Button Styles */
    .add-button {
    background-color: #4a90e2;
    color: #fff;
    border: none;
    padding: 10px;
    border-radius: 50px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 20px;
    transition: background-color 0.3s ease;
    display: block;

}

.add-button:hover {
    background-color: #357ABD;
}
.grid {
    margin-top: 20px;
    display: grid;
    gap: 20px;
}
.bg-white {
    border: 1px solid #e0e0e0;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bg-white:hover {
    
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.controls button {
  
    border: none;
    cursor: pointer;
    padding: 8px;
    margin: 0 5px;
    
    
}



span {
    font-size: 1.1rem;
    font-weight: 500;
}

label {
    font-weight: bold;
    font-size: 1rem;
    margin-bottom: 5px;
}

input,
textarea {
    background-color: #f9f9fc;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    font-size: 1rem;
    width: 100%;
}

input:focus,
textarea:focus {
    border-color: #4a90e2;
    outline: none;
    box-shadow: 0 0 4px rgba(74, 144, 226, 0.4);
}

.cancel-button {
    background-color: #f44336;
    color: #fff;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.cancel-button:hover {
    background-color: #c23628;
}

.confirm-button {
    background-color: #4caf50;
    color: #fff;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.confirm-button:hover {
    background-color: #3e8e41;
}

.image-preview {
    margin-top: 10px;
    max-height: 150px;
    max-width: 100%;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #ddd;
}
    /* Responsive adjustments */
    .container {
    padding: 1rem;
    margin: 0 auto;  /* Center the container */
    max-width: 1200px; /* You can adjust this max-width value as per your design */
}
   
    /* Media Queries */
    @media (min-width: 640px) {
        .container {
            padding: 2rem; /* More padding for larger screens */
        }
    }

    @media (min-width: 768px) {
     
    }

    @media (min-width: 1024px) {
        .popup-content {
            width: 600px; /* Wider popup on larger screens */
        }
    }
    .edit-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  width: 800px;
  max-width: 90%;
  z-index: 1050; /* Ensures it appears above other content */
}

.edit-popup-content {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.landscape-layout {
  align-items: flex-start;
}

.edit-popup .form-left {
  flex: 2;
}

.edit-popup .form-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.edit-popup .image-preview {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-top: 10px;
}

.edit-popup .cancel-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-popup .cancel-button:hover {
  background-color: #c23628;
}

.edit-popup .confirm-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.edit-popup .confirm-button:hover {
  background-color: #388e3c;
}
.medicine-card {
  box-shadow: -4px 0 0 #3182ce; /* Left-side solid shadow */
  transition: box-shadow 0.3s ease, transform 0.3s ease; /* Smooth transition for both shadow and scaling */
  border: 1px solid rgba(49, 130, 206, 0.5); /* 50% transparent */

}

.medicine-card:hover {
  box-shadow: -4px 0 0 #3182ce; 
}



</style>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <div class="container">
        <h1 class="text-2xl font-semibold mb-4">Manage Medicines</h1>
        <button class="add-button" on:click={togglePopup}>+Add Medicine</button>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each medicines as medicine, index}
                <div class="medicine-card bg-white p-4 rounded-lg shadow-md">
                    <div class="w-full h-40 bg-gray-200 mb-4">
                        {#if medicine.imageUrl}
                            <img src={medicine.imageUrl} alt={medicine.name} class="w-full h-full object-cover rounded" />
                        {:else}
                            <!-- Placeholder if no image -->
                        {/if}
                    </div>
                    <h2 class="text-lg font-semibold">{medicine.name}</h2>
                    <p class="text-gray-600 mb-4">{medicine.description}</p>
                    <div class="controls">
                        <span>Quantity:{medicine.quantity}</span>
                        <button class="edit-button" on:click={() => openEditPopup(medicine)}>
                          <i class="fas fa-edit" style="color: blue;"></i> Edit
                      </button>
                      <button class="delete-button" on:click={() => deleteMedicine(medicine)}>
                          <i class="fas fa-trash" style="color: red;"></i> Delete
                      </button>
                      
                      
                    </div>
                </div>
            {/each}
        </div>

        {#if editPopup && medicineToEdit}
        <div class="edit-popup">
          <div class="edit-popup-content landscape-layout">
            <div class="form-left">
              <h2 class="text-xl font-semibold mb-4">Edit Medicine</h2>
      
              <label for="edit-name" class="block text-gray-700 mb-2">Medicine Name</label>
              <input
                id="edit-name"
                type="text"
                bind:value={medicineToEdit.name}
                class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                required
              />
      
              <label for="edit-quantity" class="block text-gray-700 mb-2">Quantity</label>
              <input
                id="edit-quantity"
                type="number"
                bind:value={medicineToEdit.quantity}
                class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                required
              />
      
              <label for="edit-description" class="block text-gray-700 mb-2">Description</label>
              <textarea
                id="edit-description"
                bind:value={medicineToEdit.description}
                class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                rows="4"
                required
              ></textarea>
      
              <div class="flex justify-between">
                <button class="cancel-button" on:click={closeEditPopup}>Cancel</button>
                <button class="confirm-button" on:click={saveEditedMedicine} disabled={!medicineToEdit}>
                  Save Changes
                </button>
              </div>
            </div>
      
            <div class="form-right">
              <label for="edit-image" class="block text-gray-700 mt-10">Upload Image</label>
              <input
                id="edit-image"
                type="file"
                accept="image/*"
                on:change={handleImageUpload}
                class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
              />
              {#if medicineToEdit.imageUrl}
                <img src={medicineToEdit.imageUrl} alt="Preview" class="image-preview" />
              {/if}
            </div>
          </div>
        </div>
      {/if}
      

      

        {#if showPopup}
            <div class="popup">
                <div class="popup-content">
                    <h2 class="text-xl font-semibold mb-4">Add New Medicine</h2>
                    <label for="name" class="block text-gray-700 mb-2">Medicine Name</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={newMedicine.name}
                        class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                    />
                    <label for="quantity" class="block text-gray-700 mb-2">Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        bind:value={newMedicine.quantity}
                        class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                    />
                    <label for="description" class="block text-gray-700 mb-2">Description</label>
                    <textarea
                        id="description"
                        bind:value={newMedicine.description}
                        class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                        rows="4"
                    ></textarea>
                    <label for="image" class="block text-gray-700 mb-2">Upload Image</label>
                    <input
                        id="image"
                        type="file"
                        accept="image/*"
                        on:change={handleImageUpload}
                        class="border border-gray-300 rounded px-3 py-2 mb-4 w-full"
                    />
                    {#if newMedicine.imageUrl}
                        <img src={newMedicine.imageUrl} alt="Preview of {newMedicine.name}" class="image-preview" />
                    {/if}
                    <div class="flex justify-between">
                        <button class="cancel-button" on:click={togglePopup}>Cancel</button>
                        <button class="confirm-button" on:click={addMedicine}>Add Medicine</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>