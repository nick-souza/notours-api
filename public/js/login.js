import axios from "axios";

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
			alert("Logged in");
			window.setTimeout(() => {
				location.assign("/");
			}, 1500);
		}

		console.log(res);
	} catch (error) {
		alert(error.response.data.message);
	}
};
