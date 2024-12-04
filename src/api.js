export async function fetchData() {
    const response = await fetch('/api-integrated_system'); // Proxy handles the forwarding
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  }
  