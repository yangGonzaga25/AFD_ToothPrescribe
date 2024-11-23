<script>
    // @ts-nocheck
    
    import { Modal } from 'flowbite-svelte';
    import { Label, Input } from 'flowbite-svelte';
    
    let showModal = false;
    
    function handleLogin() {
      showModal = true;
    }
    </script>
    
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#094361] to-[#128AC7]">
    
        <!-- Container for the login form -->
        <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <div class="flex items-center mb-4">
                <img src="/images/lock.png" alt="Lock Icon" class="w-12 h-12 mr-4" />
                <h2 class="text-3xl font-semibold text-gray-800">DENTIST LOGIN</h2>
            </div>
           
            <!-- Admin text field -->
            <div class="mb-6">
                <Label for="admin" class="block mb-2">Admin</Label>
                <Input 
                    type="text" 
                    id="admin" 
                    placeholder="Enter admin username" 
                    class="border p-2 w-full" 
                    required 
                />
            </div>
      
            <!-- Email field -->
            <div class="mb-6">
                <Label for="email" class="block mb-2">Email</Label>
                <Input 
                    type="email" 
                    id="email" 
                    placeholder="Enter your email" 
                    class="border p-2 w-full" 
                    required 
                />
            </div>
      
            <!-- Password field -->
            <div class="mb-6">
                <Label for="password" class="block mb-2">Password</Label>
                <Input 
                    type="password" 
                    id="password" 
                    placeholder="Enter your password" 
                    class="border p-2 w-full" 
                    required 
                />
            </div>
    
            <!-- Remember me checkbox -->
            <div class="mb-6 flex items-center">
                <input 
                    type="checkbox" 
                    id="remember" 
                    class="mr-2"
                />
                <label for="remember" class="text-gray-600">Remember me</label>
            </div>
      
            <!-- Login button -->
            <div class="mb-6">
                <button 
                    type="submit" 
                    class="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    on:click={handleLogin}
                >
                    Login
                </button>
            </div>
      
        </div>
    </div>
      
    <!-- Modal for success/error -->
    <Modal visible={showModal} on:close={() => showModal = false}>
        <p>Your login was successful!</p>
        <button 
            on:click={() => showModal = false} 
            class="bg-blue-500 text-white p-2 rounded"
        >
            Close
        </button>
    </Modal>
    