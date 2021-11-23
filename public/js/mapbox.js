//Js module that will be integrated into the html file, that handles the map for the client side:

//Now since we used the data property in the #map div, we can get the information from here:
const locations = JSON.parse(document.getElementById("map").dataset.locations);
console.log(locations[0].coordinates);
console.log(locations[0].coordinates[1]);
console.log(locations[0].coordinates[0]);

// From the MapBox Website:

mapboxgl.accessToken = "pk.eyJ1IjoibnNkczI2IiwiYSI6ImNrd2M0ZXN1a2F6NDkzMXMxOW15aXoxN2EifQ.xUrKRw3vNAChy4rlLfv3gw";

var map = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/mapbox/streets-v11",
	scrollZoom: false,
	//Where the map will start when the page is loaded:
	// center: [locations[0].coordinates[0], locations[0].coordinates[1]],
	//Zoom level:
	// zoom: 9,
});

//Bounds Variable to display the right portion of the map:
const bounds = new mapboxgl.LngLatBounds();

//Looping over the locations array to add a marker on the map:
locations.forEach((loc) => {
	//Adding the marker since we already have the css configurations for it:
	const el = document.createElement("div");
	//The name in the styles.css is also marker:
	el.className = "marker";

	new mapboxgl.Marker({
		//The element just created:
		element: el,
		//It will be the bottom of the marker that will be placed exactly in the coords:
		anchor: "bottom",
	})
		.setLngLat(loc.coordinates)
		.addTo(map);

	//Adding the popup
	new mapboxgl.Popup({
		offset: 40,
	})
		.setLngLat(loc.coordinates)
		.setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`)
		.addTo(map);

	bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
	padding: {
		top: 200,
		bottom: 150,
		left: 100,
		right: 100,
	},
});
