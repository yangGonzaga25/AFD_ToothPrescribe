<script lang="ts">
    import { onMount } from "svelte";
    import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
    import { firebaseConfig } from "$lib/firebaseConfig";
    import { initializeApp, getApps, getApp } from "firebase/app";
    import { MinusOutline, PlusOutline } from 'flowbite-svelte-icons';

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

    onMount(async () => {
        const medicinesCollection = collection(firestore, "medicines");
        const medicineSnapshot = await getDocs(medicinesCollection);
        medicines = medicineSnapshot.docs.map(doc => doc.data() as Medicine);
    });

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

        medicines = [...medicines, newMedicine];
        newMedicine = { name: "", quantity: 0, description: "", imageUrl: "" };
        imageFile = null;
        togglePopup();
    }

  
</script>


<style>
    .popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
    }

    .popup-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 400px;
    }


    /* Button Styles */
    .add-button {
        background-color: #3b82f6;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        margin-top: 20px;
    }

    .cancel-button {
        background-color: #ef4444;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
    }

    .confirm-button {
        background-color: #10b981;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
    }

    /* Image Preview */
    .image-preview {
        width: 100px;
        height: 100px;
        object-fit: cover;
        margin-top: 10px;
        border-radius: 8px;
        background-color: #f0f0f0;
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

<div class="container">
    <h1 class="text-2xl font-semibold mb-4">Add Medicine</h1>
  
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
            disabled
          >
            <MinusOutline class="w-5 h-5" />
          </button>
          <span>{medicine.quantity}</span>
          <button
            class="bg-gray-200 text-gray-700 px-2 py-1 rounded"
            aria-label="Increase quantity"
            disabled
          >
            <PlusOutline class="w-5 h-5" />
          </button>
          
          </div>
        </div>
      {/each}
    </div>

    <button
      class="add-button"
      on:click={togglePopup}
    >
      Add Medicine
    </button>
  
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
            <button
              class="cancel-button"
              on:click={togglePopup}
            >
              Cancel
            </button>
            <button
              class="confirm-button"
              on:click={addMedicine}
            >
              Add Medicine
            </button>
          </div>
        </div>
      </div>
    {/if}
</div>
