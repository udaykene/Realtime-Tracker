const socket = io();

// Initialize map when DOM is ready
let map;
let marker;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    map = L.map('map').setView([0, 0], 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Uday Kene'
    }).addTo(map);


    socket.on("receive-location", (data) => {
        const { id, latitude, longitude } = data;
        map.setView([latitude, longitude],15);
    });

    // Invalidate size to ensure proper rendering
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;

        // Update map view to user's location
        if (map) {
            map.setView([latitude, longitude], 10);
        }

        // Send location to server
        socket.emit("send-location", { latitude, longitude });
    }, (error) => {
        console.log("Geolocation error:", error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
} else {
    console.log("Geolocation is not supported by this browser.");
}