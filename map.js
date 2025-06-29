// Store map reference and libraries globally for dynamic updates
let map3DElement;
let Polygon3DElement;
let polygonCounter = 0; // To track polygons for removal
let Marker3D;
let entries;

let loaded = false;
let currentMarker;
let originalContent;

function aboutClick (){
    console.log("clicking about")
    document.getElementById("container-content").textContent="About me is about me, so what do you want to know about me?";
    clickedAbout = true
}
document.getElementById("properties").addEventListener("click", function(){
    if(clickedAbout){
        if(loaded && entries){
        document.getElementById("container-content").innerHTML="";
        listEntries(entries);
        clickedAbout = false;
        }
    }
})


// This function will run after the loader above has prepared the Google Maps API.
async function init() {
    // Initialize 3D map and starting point
    const { Map3DElement, MapMode, Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");

    Marker3D = Marker3DInteractiveElement;

    map3DElement = new Map3DElement({
        center: { lat: 49.23, lng: -123.104, altitude: 1000 },
        range: 1000,
        tilt: 70,
        bounds: { south: 49, west: -124, north: 50, east: -122 },
        mode: MapMode.HYBRID,
    });

    // Polygon options
    const { Polygon3DElement: Polygon3DClass, AltitudeMode } = await google.maps.importLibrary("maps3d");
    Polygon3DElement = Polygon3DClass; // Store for later use

    // Add the map element to the document's body
    document.body.append(map3DElement);
}

function listEntries(entries){
    // console.log("Creating entries");
    const container = document.getElementById('container-content');
    let prevAddress = "";
    for(let i = 0; i < entries.length; i++){
        if(prevAddress === entries[i].address){
            continue;
        }
        // Create div
        const div = document.createElement('div');
        div.className = 'entry-item';

        // Create img tag
        const img = document.createElement('img');
        img.src = entries[i].img;
        img.style.cssText = `
            width: 90%;
            height: 100px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 10px;
        `;
        
        // Create text element
        const textDiv = document.createElement('h4');
        textDiv.textContent = entries[i].address;

        // Create text element
        const dateDiv = document.createElement('div');
        dateDiv.textContent = "Public comment data: " + entries[i].public_comments_data;

        // Create text element
        const aTag = document.createElement('a');
        aTag.href = entries[i].href;
        aTag.textContent = "Visit page for more detail";
        aTag.target = '_blank';
        
        // Append image and text to div
        div.appendChild(img);
        div.appendChild(textDiv);
        div.appendChild(dateDiv);
        div.appendChild(aTag);
        
        // Add click functionality
        div.onclick = () => {
            if(currentMarker){
                map3DElement.removeChild(currentMarker);
            }
            const middleLat = Number(entries[i].middle_point[0]);
            const middleLng = Number(entries[i].middle_point[1]);
            animateToCenter(entries[i].address, middleLat, middleLng)
        };
        
        // Hover effect
        div.addEventListener('mouseenter', () => {
            div.style.transform = 'scale(1.05)';
        });
        
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'scale(1)';
        });
        // Add div to container
        container.appendChild(div);
        prevAddress = entries[i].address
    }

}
// Function to animate to a new center smoothly
function animateToCenter(addr, lat, lng, altitude = 400, duration = 2000, tilt=1) {
    if (!map3DElement) {
        console.warn('Map not initialized yet');
        return;
    }

    const startCenter = map3DElement.center;
    const startTime = Date.now();

    const newMarker = new Marker3D({
        position: {lat:lat , lng:  lng}, // (Required) Marker must have a lat/lng.
        altitudeMode : "CLAMP_TO_GROUND", // (Optional) Treated as CLAMP_TO_GROUND if omitted.
        extruded : true, // (Optional) Draws line from ground to the bottom of the marker.
        label : addr
    });
    currentMarker = newMarker;
    map3DElement.append(newMarker);
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
            altitude: currentAltitude,
        };
        map3DElement.tilt = tilt;
        map3DElement.range = 100;
        
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

    // console.log(`Added boundary with ID: ${newPolygon.id}`);
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
// Read the json file
async function readJson() {
    try {
        const response = await fetch('./processed_data.json');
        if (!response.ok) {
            throw new Error(`Reading failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error reading JSON:", error);
        return null; 
    }
}

// Create the boundary
function createBoundary(entries){
    if(entries.length === 0){
        console.error("Empty");
    }else{        
        // Loop through all of the entries
        for(let i = 0; i < entries.length; i++){
            const entry = entries[i];
            const oldCoord = entry.points
            const newCoord = [];
            const altitude = 100;
            let strokeColor = "#FF000080";
            let fillColor = "#FF000040";
            if(entry.rezoning){
                strokeColor = "#cc5500";
                fillColor = "#ff8c0080";
            }else if(entry.development){
                strokeColor = "#00bfff";
                fillColor = "#87ceeb80"
            }
            const options = {
                strokeColor: strokeColor,
                fillColor: fillColor,
                strokeWidth: 2
            };
            for(let i = 0; i < oldCoord.length; i++){
                const lngOld = Number(oldCoord[i][0]);
                const latOld = Number(oldCoord[i][1]);
                const lng = lngOld;
                const lat = latOld;
                newCoord.push({lat, lng, altitude})
            }
            addBoundary(newCoord, options);
        }
    }
}

// // Example usage functions
// function goToVancouver() {
//     animateToCenter(49.2827, -123.1207, 500);
// }
// Initialize the map
init().then(async () => {
    entries = await readJson();
    loaded = true;
    listEntries(entries);
    createBoundary(entries);
});


