import axios from "axios";
import { showAlert } from "./alert";

//Function tha performs the login:
export const login = async (email, password) => {
	//Using the axios library that we imported in the base file:

	try {
		const res = await axios({
			//The method:
			method: "POST",
			//The endpoint:
			url: "http://localhost:3000/api/v1/users/login",
			//The date we are passing along with the body
			data: {
				email: email,
				password: password,
			},
		});

		//Checking to see if the login was successful:
		if (res.data.status === "success") {
			showAlert("success", "Logged in");
			window.setTimeout(() => {
				location.assign("/");
			}, 1500);
		}

		console.log(res);
	} catch (error) {
		showAlert("error", error.response.data.message);
	}
};

//Function tha performs the logout:
export const logout = async () => {
	try {
		//Making the request with axios:
		const res = await axios({
			method: "GET",
			url: "http://localhost:3000/api/v1/users/logout",
		});

		//Reloading the page
		if ((res.data.status = "success")) location.reload(true);
	} catch (error) {
		showAlert("error", "Error logging out");
	}
};
