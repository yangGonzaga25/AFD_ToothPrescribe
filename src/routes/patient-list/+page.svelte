<script>
    import Sidebar from '../sidenav/+page.svelte'; // Import the Sidebar component

    let isCollapsed = false;

    function toggleSidebar() {
        isCollapsed = !isCollapsed;
    }

    function logout() {
        window.location.href = "/"; // Redirect to main landing page
    }

    // Example data for patients
    let patients = [
        { id: 1, name: 'Juan Dela Cruz', address: 'L24 B9 Sta Rita, O.C.', phone: '09123456789', age: 18 },
        { id: 2, name: 'Trisha Delos Santos', address: '27 Johnson St. E.B.B, O.C.', phone: '09876543210', age: 27 },
        { id: 3, name: 'Christian Gonzaga', address: '14 St. Canda O.C.', phone: '09246801234', age: 54 },
        { id: 4, name: 'Enrique Velasquez', address: '46 St. Salcedo Vill., O.C.', phone: '09369123456', age: 20 },
        { id: 5, name: 'Gabriella Fernandez', address: '8 Murphy St. PAG-ASA, O.C.', phone: '09211234567', age: 33 }
    ];
    
    let searchTerm = '';

    function filterPatients() {
        return patients.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.phone.includes(searchTerm) ||
            patient.age.toString().includes(searchTerm)
        );
    }

    /**
   * @param {number} id
   */
    function viewPatient(id) {
        console.log(`Viewing patient with ID: ${id}`);
        // Redirect to patient details or handle view logic here
    }
</script>

<style>
    body, html {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        height: 100%;
    }

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
    margin-left: -10rem; /* Move to the left */
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

    .view-btn {
        padding: 8px 12px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .view-btn:hover {
        background-color: #218838;
    }

    .pagination {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }

    .pagination button {
        margin: 0 5px;
        padding: 5px 10px;
        border: 1px solid #ddd;
        background-color: white;
        cursor: pointer;
    }

    .pagination button:hover {
        background-color: #f4f4f4;
    }
</style>

<div class="dashboard">
    <!-- Sidebar -->
    <Sidebar {isCollapsed} {toggleSidebar} {logout} />

    <!-- Main Content -->
    <!-- Apply dynamic margin-left with inline style -->
    <div class="content" style="margin-left: {isCollapsed ? '-1rem' : '-2.4em'};">
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
                            <button class="view-btn" on:click={() => viewPatient(patient.id)}>View</button>
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
            <div class="pagination">
                <button disabled>&laquo;</button>
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button>&raquo;</button>
            </div>
        </div>
    </div>
</div>

