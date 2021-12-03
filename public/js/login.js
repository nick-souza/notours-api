//Function tha performs the login:
const login = async (email, password) => {
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

//Selecting the form in the template and listening fot the submit action:
document.querySelector(".form").addEventListener("submit", (e) => {
	e.preventDefault();

	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;

	login(email, password);
});
