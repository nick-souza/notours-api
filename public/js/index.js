import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login } from "./login";

//DOM ELEMENTS to get rid of the mapbox error when in a page that does not display the map:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form");

if (mapBox) {
	//Now since we used the data property in the #map div, we can get the information from here:
	const locations = JSON.parse(mapBox.dataset.locations);
	displayMap(locations);
}

if (loginForm) {
	//Selecting the form in the template and listening fot the submit action:
	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const email = document.getElementById("email").value;
		const password = document.getElementById("password").value;

		login(email, password);
	});
}
