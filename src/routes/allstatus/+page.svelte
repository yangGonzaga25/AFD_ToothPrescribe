<script lang="ts">
    import Sidebar from '../sidenav/+page.svelte'; 
    import { onMount } from 'svelte';
    import { firebaseConfig } from "$lib/firebaseConfig"; 
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

    // Initialize Firebase app and Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let isCollapsed = false;
    let searchQuery = '';
    let selectedStatus = 'All';
    let filteredAppointments: Appointment[] = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; 
    }

    interface Appointment {
        appointmentId: string;
        patientData: {
            name: string;
            lastname: string;
            age: number;
        };
        date: string;
        time: string;
        service: string;
        cancellationStatus?: 'pending' | 'Approved' | 'Declined' | 'requested' | null;
        status: "pending" | "Declined" | "Missed" | "confirmed" | "Completed" | "cancelled" | "Accepted" | "cancellationRequested" | "";
        reason?: string; // Add reason field
    }

    let appointments: Appointment[] = [];

    async function fetchPatientsWithAppointments() {
        const appointmentRef = collection(db, "appointments");
        const appointmentSnapshot = await getDocs(query(appointmentRef));

        // Extract unique patient IDs from appointments
        const patientIds = appointmentSnapshot.docs.map(doc => doc.data().patientId);
        const uniquePatientIds = [...new Set(patientIds)];

        // Fetch patient profiles in bulk using `in` query
        const patientRef = collection(db, "patientProfiles");
        const patientBatches = [];
        const batchSize = 10; // Firestore `in` query limit

        for (let i = 0; i < uniquePatientIds.length; i += batchSize) {
            const batch = uniquePatientIds.slice(i, i + batchSize);
            patientBatches.push(query(patientRef, where("id", "in", batch)));
        }

        const patientSnapshots = await Promise.all(patientBatches.map(batch => getDocs(batch)));

        // Map patient data for quick lookup
        const patientsMap = new Map();
        patientSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => patientsMap.set(doc.id, doc.data()));
        });

        // Map appointments with patient data
        appointments = appointmentSnapshot.docs.map(docSnapshot => {
            const appointmentData = docSnapshot.data();
            const patientData = patientsMap.get(appointmentData.patientId) || {};

            return {
                appointmentId: docSnapshot.id,
                ...appointmentData,
                patientData: {
                    name: patientData.name || '',
                    lastname: patientData.lastName || '',
                    age: patientData.age || 0
                },
                date: appointmentData.date || '',
                time: appointmentData.time || '',
                service: appointmentData.service || '',
                status: appointmentData.status || 'pending',
                reason: appointmentData.reason || ''
            };
        });

        filterAppointments();
    }

    function filterAppointments() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        filteredAppointments = appointments
            .filter(app => {
                const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
                const matchesSearch = app.patientData.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesStatus && matchesSearch;
            })
            .slice(startIndex, endIndex);
    }

    function viewDetails(appointmentId: string) {
        console.log('View details for appointment:', appointmentId);
    }

    function editAppointment(appointmentId: string) {
        console.log('Edit appointment:', appointmentId);
    }

    function deleteAppointment(appointmentId: string) {
        console.log('Delete appointment:', appointmentId);
    }
    
    function goToPage(page: number) {
        const totalPages = Math.ceil(appointments.length / itemsPerPage);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        filterAppointments();
    }

    onMount(async () => {
        try {
            currentPage = 1;
            await fetchPatientsWithAppointments();
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });
</script>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />
    <div class="content" style="margin-left: {isCollapsed ? '-1rem' : '-2.4em'};">
        <div class="container">
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center">
                    <img src="/images/logo(landing).png" alt="Sun with dental logo" class="w-24 h-18 mr-4" />
                    <div>
                        <h1 class="font-bold text-lg">AFDomingo</h1>
                        <p class="text-sm">DENTAL CLINIC</p>
                        <p class="text-sm">#46 12th Street, Corner Gordon Ave New Kalalake</p>
                        <p class="text-sm">afdomingodentalclinic@gmail.com</p>
                        <p class="text-sm">0932 984 9554</p>
                    </div>
                </div>
            </div>
           <!-- Back Button -->
           <a href="/appointment" class="back-button flex items-center border p-1 rounded-md text-blue-500 hover:text-blue-700 mb-2 w-1/12">

            <!-- Back Icon (SVG) -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l-7-7 7-7" />
            </svg>
            Back
        </a>

            <!-- Search and Status Filter -->
            <div class="flex justify-between mb-4 search-bar">
                <input 
                    type="text" 
                    placeholder="Search by patient name..." 
                    bind:value={searchQuery} 
                    on:input={filterAppointments}
                    class="search-input p-2 border rounded-md" 
                />

                <select 
                    bind:value={selectedStatus} 
                    on:change={filterAppointments} 
                    class="p-2 border rounded-md"
                >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="Decline">Declined</option>
                    <option value="Completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Missed">Missed</option>
                    <option value="cancellationRequested">Cancellation Requested</option>
                </select>
            </div>

            <!-- Table to display the appointments -->
            <div class="table-content">
                <Table aria-label="Appointments Table">
                    <TableHead>
                        <TableHeadCell>Patient Name</TableHeadCell>
                        <TableHeadCell>Age</TableHeadCell>
                        <TableHeadCell>Service</TableHeadCell>
                        <TableHeadCell>Date</TableHeadCell>
                        <TableHeadCell>Time</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Reason</TableHeadCell>
                    </TableHead>
                    <TableBody>
                        {#each filteredAppointments as { appointmentId, patientData, date, time, service, status, reason } (appointmentId)}
                            <TableBodyRow>
                                <TableBodyCell>{`${patientData.name} ${patientData.lastname}`}</TableBodyCell>
                                <TableBodyCell>{patientData.age}</TableBodyCell>
                                <TableBodyCell>{service}</TableBodyCell>
                                <TableBodyCell>{date}</TableBodyCell>
                                <TableBodyCell>{time}</TableBodyCell>
                                <TableBodyCell>
                                    {#if status === "cancelled"}
                                        <span class="text-red-500">Cancelled</span>
                                    {:else if status === "pending"}
                                        <span class="text-yellow-500">Pending</span>
                                    {:else if status === "Completed"}
                                        <span class="text-green-500">Completed</span>
                                    {:else if status === "Declined"}
                                        <span class="text-gray-500">Declined</span>
                                    {:else}
                                        <span>{status}</span>
                                    {/if}
                                </TableBodyCell>
                                <TableBodyCell>{reason || 'N/A'}</TableBodyCell> <!-- Correctly access reason -->
                            </TableBodyRow>
                        {/each}
                    </TableBody>
                    
                </Table>
            </div>

            <!-- Pagination Section -->
            <div class="pagination">
                <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>&lt;</button>
                <span>Page {currentPage}</span>
                <button on:click={() => goToPage(currentPage + 1)} disabled={filteredAppointments.length < itemsPerPage}>&gt;</button>
            </div>
            
</div>
          
    </div>
</div>


<style>
     <!--
     .edit-container {
        display: flex;
        align-items: center; /* Vertically aligns the icon and text */
        cursor: pointer; /* Makes both icon and text clickable */
    }
   
    .edit-text {
        margin-left: 8px; /* Adds space between the icon and the text */
        font-size: 1rem;  /* Optional: adjusts the font size */
    } -->
      :global(.dashboard) {
            display: flex;
            height: 100vh;
            overflow: hidden;
            font-family: 'Roboto', sans-serif;
        }
    
       :global(.content) {
            flex-grow: 1;
            overflow: auto;
            margin-left: -10rem;
            transition: margin-left 0.3s ease;
            padding: 20px;
           
        }
        /* Header Styling */
        :global(.content-header) {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            font-weight: 600;
        }
    
        /* Table Container */
        :global(.table-container) {
            border-radius: 10px;
            padding: 30px;
            overflow-x: auto;
            width: 100%;
            max-width: 1200px;
            margin: auto;
            height: auto;
        }
    
        /* Search Bar */
        :global(.search-bar) {
            margin-bottom: 30px;
            width: 100%;
        }
    
        :global(.search-input) {
            width: 100%;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ccc;
            font-size: 1rem;
            box-sizing: border-box;
            transition: border-color 0.3s ease;
        }
    
        :global(.search-input:focus) {
            border-color: #08B8F3;
            outline: none;
        }
    
        /* Pagination */
         /* Pagination */
    :global(.pagination) {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }

    :global(.pagination button) {
        padding: 7px 10px;
        margin: 0 5px;
        font-size: 1.1rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #08B8F3;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    :global(.pagination button:disabled) {
        background-color: #d6d6d6;
        cursor: not-allowed;
    }
    
        /* Table Styling */
        :global(table) {
            width: 100%;
            border-collapse: collapse;
        }
    
        :global(th), :global(td) {
            padding: 15px;
            text-align: left;
            font-size: 1rem;
            border-bottom: 1px solid #ddd;
        }
    
        :global(th) {
            background-color: #08B8F3; /* Bright blue for table headers */
            color: white;
            font-weight: bold;
        }
    
        /* Alternate Row Colors */
        :global(tr:nth-child(odd)) {
            background-color: #ffffff;
        }
    
        :global(tr:nth-child(even)) {
            background-color: #f0f8ff; /* Soft blue for alternate rows */
        }
    
        /* Hover Effect on Rows */
        :global(tr:hover) {
            background-color: #f1f1f1;
            cursor: pointer;
        }
    
        /* Container Styling */
        :global(.container) {
            padding: 20px;
            max-width: 100%;
            margin: auto;
            margin-top: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            background-color: #fff;
        }
    
        /* Logo Styling */
        :global(.logo-img) {
            width: 50px;
            height: auto;
            margin-right: 15px;
        }
    
        /* Formal Text Styling */
        :global(.text-sm) {
            font-size: 0.95rem;
            color: #333;
        }
    
        :global(h1, h2) {
            font-size: 1.6rem;
            color: #333;
            margin: 10px 0;
            font-weight: 600;
        }
    
        /* Text Styling for Clinic Info */
        :global(.clinic-info) {
            font-size: 0.95rem;
            color: #666;
        }
    
        :global(.clinic-info p) {
            margin: 5px 0;
        }
    
        /* Footer */
        :global(.footer) {
            margin-top: 50px;
            padding: 10px;
            text-align: center;
            font-size: 0.85rem;
            color: #888;
        }
    
</style>