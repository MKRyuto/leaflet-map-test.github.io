$(document).ready(() => {
    const map = L.map('map').fitWorld();
    const sidebar = document.getElementById('pointDetails');
    const markers = []; // To store the markers
    let activeMarker = null; // To track the active marker
    let userMarker = null; // To track the user marker
    let routingControl = null; // To track the routing control
    let isNavigating = false; // To track navigation state
  
    // Function to initialize the map with user's current location
    function initializeMap() {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const mapContainer = document.getElementById('map');
        mapContainer.style.height = `${windowHeight}px`;
        mapContainer.style.width = `${windowWidth}px`;
      
        map.setView([0, 0], 2); // Set initial view to center of the world
      
        const userIcon = L.divIcon({
          className: 'user-icon',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
      
        map.on('locationfound', (e) => {
          const { lat, lng } = e.latlng;
          if (userMarker) {
            userMarker.setLatLng(e.latlng);
          } else {
            userMarker = L.marker(e.latlng, { icon: userIcon }).addTo(map);
          }
          map.setView(e.latlng, 16); // Zoom in to the user's location
        });
      
        map.on('locationerror', (e) => {
          console.error(e.message);
        });
      
        window.addEventListener('resize', () => {
          const newHeight = window.innerHeight;
          const newWidth = window.innerWidth;
          mapContainer.style.height = `${newHeight}px`;
          mapContainer.style.width = `${newWidth}px`;
          map.invalidateSize(); // Update the map size
        });
      
        map.locate({ setView: true, maxZoom: 16 });
      }
  
    initializeMap();
  
    const locateBtn = document.getElementById('locateBtn');
    locateBtn.addEventListener('click', () => {
      map.locate({ setView: true, maxZoom: 16 });
    });
  
    map.on('click', (e) => {
      const latlng = e.latlng;
      const name = window.prompt('Enter the name:');
      const detail = window.prompt('Enter the detail:');
      if (name && detail) {
        clearSidebar();
        const marker = L.marker(latlng, { name, detail }).addTo(map);
        marker.on('click', () => {
          setActiveMarker(marker);
          updateSidebarWithPoint(marker);
        });
        addOrUpdatePointInSidebar(name, detail, latlng.lat.toFixed(6), latlng.lng.toFixed(6), marker);
        markers.push(marker);
        marker.openPopup();
        if (activeMarker) {
          activeMarker.closePopup();
        }
        activeMarker = marker;
      }
    });
  
    function clearSidebar() {
      sidebar.innerHTML = '';
    }
  
    function addOrUpdatePointInSidebar(name, detail, lat, lng, marker) {
      const pointHTML = `
        <div class="mb-3">
          <h5>${name}</h5>
          <p>${detail}</p>
          <p>Latitude: ${lat}</p>
          <p>Longitude: ${lng}</p>
          <button class="btn btn-danger btn-sm delete-btn" data-marker-id="${marker._leaflet_id}">Delete</button>
          <button class="btn btn-primary btn-sm go-btn" data-lat="${lat}" data-lng="${lng}">Go</button>
        </div>
      `;
      sidebar.innerHTML = pointHTML;
  
      const deleteButton = document.querySelector('.delete-btn');
      deleteButton.addEventListener('click', () => {
        deleteMarker(marker);
      });
  
      const goButton = document.querySelector('.go-btn');
      goButton.addEventListener('click', () => {
        const lat = parseFloat(goButton.dataset.lat);
        const lng = parseFloat(goButton.dataset.lng);
        const destination = L.latLng(lat, lng);
        if (!isNavigating) {
          calculateRouteToDestination(destination);
          goButton.innerText = 'Stop';
          isNavigating = true;
        } else {
          stopNavigation();
          goButton.innerText = 'Go';
          isNavigating = false;
        }
      });
    }
  
    function updateSidebarWithPoint(marker) {
      const name = marker.options.name;
      const detail = marker.options.detail;
      const lat = marker.getLatLng().lat.toFixed(6);
      const lng = marker.getLatLng().lng.toFixed(6);
      addOrUpdatePointInSidebar(name, detail, lat, lng, marker);
    }
  
    function setActiveMarker(marker) {
      markers.forEach((m) => {
        if (m === marker) {
          m.setIcon(activeIcon);
        } else {
          m.setIcon(normalIcon);
        }
      });
    }
  
    function deleteMarker(marker) {
      map.removeLayer(marker);
      const markerIndex = markers.findIndex((m) => m === marker);
      if (markerIndex !== -1) {
        markers.splice(markerIndex, 1);
      }
      clearSidebar();
      activeMarker = null;
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
    }
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  
    const normalIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  
    const activeIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  
    // Function to update the user location in real-time
    function updateUserLocation() {
      map.locate({ setView: false });
    }
  
    // Set an interval to update the user location every 5 seconds
    setInterval(updateUserLocation, 5000);
  
    // Function to calculate and update the route to the destination
    function calculateRouteToDestination(destination) {
      if (userMarker) {
        if (routingControl) {
          map.removeControl(routingControl);
        }
        routingControl = L.Routing.control({
          waypoints: [
            L.latLng(userMarker.getLatLng()),
            destination
          ],
          routeWhileDragging: true,
        }).addTo(map);
      }
    }
  
    function stopNavigation() {
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
    }
  });
  