// Store map reference and libraries globally for dynamic updates
let map3DElement;
let Polygon3DElement;
let polygonCounter = 0; // To track polygons for removal

// This function will run after the loader above has prepared the Google Maps API.
async function init() {
    // Initialize 3D map and starting point
    const { Map3DElement, MapMode } = await google.maps.importLibrary("maps3d");

    map3DElement = new Map3DElement({
        center: { lat: 49.275, lng: -123.104, altitude: 400 },
        range: 1000,
        tilt: 10,
        bounds: { south: 49, west: -124, north: 50, east: -122 },
        mode: MapMode.SATELLITE,
    });

    // Polygon options
    const { Polygon3DElement: Polygon3DClass, AltitudeMode } = await google.maps.importLibrary("maps3d");
    Polygon3DElement = Polygon3DClass; // Store for later use

    const polygonOptions = {
        strokeColor: "#EA433580",
        strokeWidth: 2,
        fillColor: "#0000FF80",
        altitudeMode: "ABSOLUTE",
        extruded: true,
        drawsOccludedSegments: true,
    }

    // Polygon coordinates
    const towerPolygon = new Polygon3DElement(polygonOptions);
    towerPolygon.id = `polygon-${polygonCounter++}`; // Add ID for tracking

    towerPolygon.outerCoordinates = [
        { lat: 49.2751, lng: -123.101, altitude: 300 },
        { lat: 49.2752, lng: -123.101, altitude: 300 },
        { lat: 49.2752, lng: -123.103, altitude: 300 },
        { lat: 49.2751, lng: -123.103, altitude: 300 }
    ];

    // Add the polygon to the map element
    map3DElement.append(towerPolygon);

    // Add the map element to the document's body
    document.body.append(map3DElement);
}

// Function to animate to a new center smoothly
function animateToCenter(lat, lng, altitude = 400, duration = 2000) {
    if (!map3DElement) {
        console.warn('Map not initialized yet');
        return;
    }

    const startCenter = map3DElement.center;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentLat = startCenter.lat + (lat - startCenter.lat) * easeProgress;
        const currentLng = startCenter.lng + (lng - startCenter.lng) * easeProgress;
        const currentAltitude = startCenter.altitude + (altitude - startCenter.altitude) * easeProgress;
        
        map3DElement.center = { 
            lat: currentLat, 
            lng: currentLng, 
            altitude: currentAltitude 
        };
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Function to add a new boundary/polygon dynamically
function addBoundary(coordinates, options = {}) {
    if (!map3DElement || !Polygon3DElement) {
        console.warn('Map or Polygon3DElement not initialized yet');
        return null;
    }

    // Default polygon options
    const defaultOptions = {
        strokeColor: "#EA433580",
        strokeWidth: 2,
        fillColor: "#0000FF80",
        altitudeMode: "ABSOLUTE",
        extruded: true,
        drawsOccludedSegments: true,
    };

    // Merge user options with defaults
    const polygonOptions = { ...defaultOptions, ...options };

    // Create new polygon
    const newPolygon = new Polygon3DElement(polygonOptions);
    newPolygon.id = `polygon-${polygonCounter++}`;
    newPolygon.outerCoordinates = coordinates;

    // Add to map
    map3DElement.append(newPolygon);

    console.log(`Added boundary with ID: ${newPolygon.id}`);
    return newPolygon;
}

// Function to remove a specific boundary
function removeBoundary(polygon) {
    if (polygon && map3DElement.contains(polygon)) {
        map3DElement.removeChild(polygon);
        console.log(`Removed boundary with ID: ${polygon.id}`);
        return true;
    }
    return false;
}

// Function to remove all boundaries
function removeAllBoundaries() {
    if (!map3DElement) return;
    
    const polygons = map3DElement.querySelectorAll('gmp-polygon-3d');
    polygons.forEach(polygon => {
        map3DElement.removeChild(polygon);
    });
    console.log('Removed all boundaries');
}

// Preset boundary creation functions
function addVancouverBuilding() {
    const coordinates = [
        { lat: 49.2851, lng: -123.111, altitude: 200 },
        { lat: 49.2852, lng: -123.111, altitude: 200 },
        { lat: 49.2852, lng: -123.113, altitude: 200 },
        { lat: 49.2851, lng: -123.113, altitude: 200 }
    ];
    
    const options = {
        strokeColor: "#FF000080",
        fillColor: "#FF000040",
        strokeWidth: 3
    };
    
    return addBoundary(coordinates, options);
}
function addCustomCircularArea(centerLat, centerLng, radius = 0.001, altitude = 100) {
    const points = 20; // Number of points to create circle
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const lat = centerLat + radius * Math.cos(angle);
        const lng = centerLng + radius * Math.sin(angle);
        coordinates.push({ lat, lng, altitude });
    }
    
    const options = {
        strokeColor: "#FFFF0080",
        fillColor: "#FFFF0040",
        strokeWidth: 2
    };
    
    return addBoundary(coordinates, options);
}

// Example usage functions
function goToVancouver() {
    animateToCenter(49.2827, -123.1207, 500);
}
// Initialize the map
init();

// Example: Add boundaries dynamically
setTimeout(() => {
    console.log('Adding Vancouver building...');
    addVancouverBuilding();
}, 3000);

// setTimeout(() => {
//     console.log('Adding circular area...');
//     addCustomCircularArea(49.2800, -123.1200, 0.002, 250);
// }, 6000);