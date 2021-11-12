//Requiring the file system
const fs = require("fs");

//---------------------------------------------------------------------------------------------------------------//

//Reading the data files outside the route handler, so it gets executed only once on page load:
//Already converting it to JSON:
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

//---------------------------------------------------------------------------------------------------------------//
//Since we want to export all of these functions, we put them in the exports object:

//Separete handler functions to take care of the routes:
exports.getAllTours = (req, res) => {
	res.status(200).json({
		//Inside the object, also sending the status if its a sucess or fail:
		status: "success",
		//Using the middleware to print the time of the request:
		requestedAt: req.requestTime,
		//Also including a property of results, with the total number of results generated, and since tours is an array, we can call the length:
		results: tours.length,
		//Sendind the data object and inside the actual data:
		data: {
			//Sending the tours property because it is the name of our endpoint /api/v1/tours:
			tours: tours,
		},
	});
};

exports.getTour = (req, res) => {
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
};

exports.createTour = (req, res) => {
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
};

exports.updateTour = (req, res) => {
	res.status(200).json({
		status: "success",
		message: "success",
	});
};

exports.deleteTour = (req, res) => {
	res.status(204).json({
		status: "success",
		message: "deleted",
	});
};
