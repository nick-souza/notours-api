//Requiring express:
const express = require("express");
const fs = require("fs");

//The express is a function that will assign loads of useful methods to our app variable:
const app = express();

//Reading the data files outside the route handler, so it gets executed only once on page load:
//Already converting it to JSON:
const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

//Defining the routes:
//Good practice to specify the version of the api, in case we need to make changes the user can still use the previous version:
app.get("/api/v1/tours", (req, res) => {
	res.status(200).json({
		//Inside the object, also sending the status if its a sucess or fail:
		status: "success",
		//Also including a property of results, with the total number of results generated, and since tours is an array, we can call the length:
		results: tours.length,
		//Sendind the data object and inside the actual data:
		data: {
			//Sending the tours property because it is the name of our endpoint /api/v1/tours:
			tours: tours,
		},
	});
});

//Listening to be able to open the server:
const port = 3000;
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
