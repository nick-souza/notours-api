//Requiring the file system
const fs = require("fs");
//Importing the TourModel, so we can have access to the Model created from the tourSchema:
const Tour = require("./../models/tourModel");

//---------------------------------------------------------------------------------------------------------------//

//Reading the data files outside the route handler, so it gets executed only once on page load:
//Already converting it to JSON:
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));
//Since we now can connect with the DB, we dont need these files anymore;

//---------------------------------------------------------------------------------------------------------------//

//Separete handler functions to take care of the routes:
exports.getAllTours = async (req, res) => {
	try {
		/*
			Implementing filtering, using the parameters the user typed in the URL. Example: /api/v1/tours?difficulty=easy the req.query would be { difficulty: "easy" };
			In MongoDB we would usually filter using queries like this:
			const tours = await Tour.find({
				duration: 5,
				difficulty: "easy",
			});

			But we can use mongoose to chain the methods:
			const tour = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy";)
			
			But since we get an object back from the req.query, we can use the first one:
		*/
		//However, we need to exclude some fields from the query, for example the ?page=2 which is only used for the pagination. So we need to create a shallow copy of the req.query object, and remove those if present:
		const queryObj = { ...req.query };

		//Array with the query we want to exclude from the filter:
		const excludedFields = ["page", "sort", "limit", "fields"];
		//Now removing these fields from the obj copy, so we can use for the filter:
		excludedFields.forEach((el) => delete queryObj[el]);

		//So the other fields will be ignored for the filtering
		//Also, to be able to chain methods for like, sorting and pagination, we need to first build the query, and only then await it:
		const query = Tour.find(queryObj);

		//And now execute the query:
		const tour = await query;

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
			message: "error",
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
