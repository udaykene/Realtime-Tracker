const socket = io();

// Initialize map when DOM is ready
let map;
const marker = {};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    map = L.map('map').setView([0, 0], 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Uday Kene'
    }).addTo(map);

    // Socket connection - log when connected
    socket.on('connect', () => {
        console.log('Connected with socket ID:', socket.id);
    });

    // Receive location from other users (or broadcasted own location)
    socket.on("receive-location", (data) => {
        const { id, latitude, longitude } = data;
        
        // Only update map view for current user's own location
        if (id === socket.id) {
            // This is the current user's location being broadcasted back
            // Update map view to current user's location
            if (map) {
                map.setView([latitude, longitude], 18);
            }
        }
        
        // Update or create marker for this user
        if (marker[id]) {
            marker[id].setLatLng([latitude, longitude]);
        } else {
            // Create marker with different color for current user vs others
            const isCurrentUser = id === socket.id;
            const markerColor = isCurrentUser ? 'blue' : 'red';
            
            marker[id] = L.marker([latitude, longitude], {
                icon: L.icon({
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map)
            .bindPopup(isCurrentUser ? 'Your Location' : `User: ${id.substring(0, 8)}`);
        }
    });

    socket.on("User-disconnected", (id) => {
        if(marker[id]){
            map.removeLayer(marker[id]);
            delete marker[id];
        }
    });

    // Invalidate size to ensure proper rendering
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        console.log("Your location:", { latitude, longitude });

        // Update map view to user's location
        if (map) {
            map.setView([latitude, longitude], 18);
            
            // Create or update marker for current user
            if (marker[socket.id]) {
                marker[socket.id].setLatLng([latitude, longitude]);
            } else {
                // Create blue marker for current user
                marker[socket.id] = L.marker([latitude, longitude], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map)
                .bindPopup('Your Location');
            }
        }

        // Send location to server
        socket.emit("send-location", { latitude, longitude });
    }, (error) => {
        console.log("Geolocation error:", error);
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
} else {
    console.log("Geolocation is not supported by this browser.");
}