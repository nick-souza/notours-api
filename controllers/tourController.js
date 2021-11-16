//Importing the TourModel, so we can have access to the Model created from the tourSchema:
const Tour = require("./../models/tourModel");
//Importing the APIFeatures to be able to use some methods for the getAllTours:
const APIFeatures = require("./../utils/apiFeatures");

//---------------------------------------------------------------------------------------------------------------//

//Reading the data files outside the route handler, so it gets executed only once on page load:
//Already converting it to JSON:
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));
//Since we now can connect with the DB, we dont need these files anymore;

//Middleware to create an alias to a common used query string, so the user does not have to type the whole thing. Used by the tourRoutes.js
exports.aliasTopTours = (req, res, next) => {
	//Hard coding the values since this will be just a alias for the common used query:
	req.query.limit = "5";
	req.query.sort = "-ratingsAverage,price";
	req.query.fields = "name,price,ratingsAverage,summary,difficulty";

	next();
};

//---------------------------------------------------------------------------------------------------------------//

//Separete handler functions to take care of the routes:
exports.getAllTours = async (req, res) => {
	try {
		//Creating an instance of the class APIFeatures to be able to use its methods. Passing the query and the query string, and then chaining the methods:
		const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();

		//And now execute the query:
		const tours = await features.query;

		res.status(200).json({
			//Inside the object, also sending the status if its a sucess or fail:
			status: "success",
			//Also including a property of results, with the total number of results generated, and since the find method returns an array, we can call the length:
			results: tours.length,
			//Sendind the data object and inside the actual data:
			data: {
				//Sending the tours property because it is the name of our endpoint /api/v1/tours:
				tours: tours,
			},
		});
	} catch (error) {
		res.status(404).json({
			status: "fail",
			message: error.message,
		});
	}
};

exports.getTour = async (req, res) => {
	try {
		//Finding by the ID, form the req.params.id (the variable the user inputs in the URL, like /api/v2/5, the 5 will be the req.params.id)
		const tour = await Tour.findById(req.params.id);

		res.status(200).json({
			status: "success",
			data: {
				tour: tour,
			},
		});
	} catch (error) {
		res.status(404).json({
			status: "fail",
			message: error,
		});
	}
};

exports.createTour = async (req, res) => {
	try {
		//To post a new document to the DB, we can use the create methdo directly in the instace of the model, and it returns a promise, so we can await it:
		const newTour = await Tour.create(req.body);

		res.status(201).json({
			status: "success",
			data: {
				tour: newTour,
			},
		});
	} catch (error) {
		//To handle errors, since the promise newTour will be rejected, we can just send the response back with the error:
		res.status(400).json({
			status: "fail",
			message: error.message,
		});
	}
};

exports.updateTour = async (req, res) => {
	try {
		//First we have to find the element by the ID, and then update:
		const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
			//The third argument can be the options;
			//Using the new = true, the new updated document is gonna be returned:
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			status: "success",
			tour: tour,
		});
	} catch (error) {
		res.status(400).json({
			status: "fail",
			message: error.message,
		});
	}
};

exports.deleteTour = async (req, res) => {
	try {
		await Tour.findByIdAndDelete(req.params.id);

		res.status(204).json({
			status: "success",
			data: null,
		});
	} catch (error) {
		res.status(404).json({
			status: "fail",
			message: error.message,
		});
	}
};
