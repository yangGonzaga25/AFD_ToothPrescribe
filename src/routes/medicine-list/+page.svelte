<script lang="ts">
  import Sidebar from '../sidenav/+page.svelte';
  import { onMount } from "svelte";
  import { getFirestore, doc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
  import { firebaseConfig } from "$lib/firebaseConfig";
  import { initializeApp, getApps, getApp } from "firebase/app";
  import { MinusOutline, PlusOutline } from 'flowbite-svelte-icons';

  let isCollapsed = false;

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }

  function logout() {
    window.location.href = "/"; // Redirect to main landing page
  }

  type Medicine = {
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

  // Fetch medicines from Firestore
  async function fetchMedicines() {
    const medicinesCollection = collection(firestore, "medicines");
    const medicineSnapshot = await getDocs(medicinesCollection);
    medicines = medicineSnapshot.docs.map(doc => doc.data() as Medicine);
  }

  // On mount, fetch the medicines
  onMount(fetchMedicines);

  function togglePopup() {
    showPopup = !showPopup;
  }

  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files[0]) {
      imageFile = input.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        newMedicine.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
  }

  async function addMedicine() {
    if (newMedicine.name && newMedicine.quantity > 0 && newMedicine.description) {
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          newMedicine.imageUrl = reader.result as string;
          await saveMedicineToFirestore();
        };
      } else {
        await saveMedicineToFirestore();
      }
    }
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
  overflow-y: auto; /* Enable vertical scrolling */
  padding: 1rem;
  margin: 0 auto; 
  max-width: 1200px;
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
    padding: 0.3rem;
    border-radius: 8px;
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
    transform: translateY(-5px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.controls button {
    background-color: #e3e3e3;
    border: none;
    cursor: pointer;
    padding: 8px;
    margin: 0 5px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.controls button:hover {
    background-color: #d0d0d0;
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
</style>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <div class="container">
        <h1 class="text-2xl font-semibold mb-4">Manage Medicines</h1>
        <button class="add-button" on:click={togglePopup}>+Add Medicine</button>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each medicines as medicine, index}
                <div class="bg-white p-4 rounded-lg shadow-md">
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
                        <button
                            class="bg-gray-200 text-gray-700 px-2 py-1 rounded"
                            aria-label="Decrease quantity"
                            on:click={() => updateMedicineQuantity(medicine, false)}
                            disabled={medicine.quantity <= 0}
                        >
                            <MinusOutline class="w-5 h-5" />
                        </button>
                        <span>{medicine.quantity}</span>
                        <button
                            class="bg-gray-200 text-gray-700 px-2 py-1 rounded"
                            aria-label="Increase quantity"
                            on:click={() => updateMedicineQuantity(medicine, true)}
                        >
                            <PlusOutline class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            {/each}
        </div>


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