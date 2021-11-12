//Requiring express:
const express = require("express");
const fs = require("fs");

//The express is a function that will assign loads of useful methods to our app variable:
const app = express();
//Including the middleware, because express does not automatically include the body data on the request:
//Just a function tha can modify the incoming data:
app.use(express.json());

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

//Adding a route hanlder to get specific tours by the id. Using the :id to define the variable
app.get("/api/v1/tours/:id", (req, res) => {
	//We can get the id typed using the req.params, which in this case will give us { id: 1 } for example;

	//Creating a variable to convert the params.id to numnber:
	const id = req.params.id * 1;

	//Using the find method to get the correct tour from the array:
	const tour = tours.find((el) => el.id === id);

	//Checking if the id the user input is valid:
	// if (id > tours.length) {
	if (!tour) {
		return res.status(404).json({
			status: "fail",
			message: "Invalid ID",
		});
	}

	res.status(200).json({
		status: "success",
		data: {
			// tour: tours[req.params.id], Would be a simple way of returning the tour
			tour: tour,
		},
	});
});

//Route handler for POST request:
app.post("/api/v1/tours", (req, res) => {
	//Now we need to persist the data thats coming from the request, we are using the file tour5.js as our DB for now, so we have to manually specify the id, whereas in a DB it does automatically:
	//Sp getting the last element's id, and adding 1 to it:
	const newId = tours[tours.length - 1].id + 1;

	//New tour fromthe body
	const newTour = Object.assign({ id: newId }, req.body);
	//Pushing to the tour array:
	tours.push(newTour);

	//Now writing to the file, using the async version to not block the code execution, and upon completion sending back the created object as the response:
	fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
		res.status(201).json({
			status: "success",
			data: {
				tour: newTour,
			},
		});
	});
});

//Route hanlder to PATCH:
app.patch("/api/v1/tours/:id", (req, res) => {
	res.status(200).json({
		status: "success",
		message: "success",
	});
});

//Route hanlder to PATCH:
app.delete("/api/v1/tours/:id", (req, res) => {
	res.status(204).json({
		status: "success",
		message: "deleted",
	});
});

//Listening to be able to open the server:
const port = 3000;
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
