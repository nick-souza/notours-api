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

//Handler function to use aggregation pipeline for mongoDB, used by a route in tourRoutes.js:
exports.getTourStats = async (req, res) => {
	try {
		//This method from mongoose, takes in an array of stages as argument, that will process documents. Each stage transforms the documents as they pass through the pipeline.

		const stats = await Tour.aggregate([
			{
				//Preliminary stage, that filters out the documents with a ratingsAverage below 4.5:
				$match: { ratingsAverage: { $gte: 4.5 } },
			},
			{
				//Stage to group the results coming from the $match stage:
				$group: {
					//Setting the property _id to null, because here we want the results all in one group, so we can calculate the avg:
					// _id: null,
					//Now grouping by the difficulty level:
					_id: "$difficulty",
					//To calculate the total number of ratings:
					numRatings: { $sum: "$ratingsQuantity" },
					//To calculate the total number of tours, we just simply add 1 every time a document pass trhough the pipeline:
					numTours: { $sum: 1 },
					//Created property avgRating, using the mongodb operator $avg to get the average from the fields ratingsAverage:
					avgRating: { $avg: "$ratingsAverage" },
					avgPrice: { $avg: "$price" },
					minPrice: { $min: "$price" },
					maxPrice: { $max: "$price" },
				},
			},
			{
				//Stage to sort the results coming from the $group stage. So we need to use the names defined in the previous stage
				//Sorting by the average Price, using 1 for ascending:
				$sort: { avgPrice: 1 },
			},
		]);

		//Now sending the response after passing all the documents through the pipeline:
		res.status(200).json({
			status: "success",
			data: {
				stats,
			},
		});
	} catch (error) {
		res.status(404).json({
			status: "fail",
			message: error.message,
		});
	}
};

//Now a handler function to calculate the busiest month of a year, using aggregation to return how many tours we have for each month, for a specific year:
exports.getMonthlyPlan = async (req, res) => {
	try {
		const year = req.params.year * 1; //Multipying by one to convert to a number;

		const plan = await Tour.aggregate([
			{
				//The methdod unwind deconstructs an array field from each document and then output one document for each element of the array. So we are gonna have a "The Forest Hiker" for each start date:
				$unwind: "$startDates",
			},
			{
				//Selecting the documents that have starting dates equal to the specified year:
				$match: {
					startDates: {
						//We want it to be greater or equal then 01-01-YEAR
						$gte: new Date(`${year}-01-01`),
						//We want it to be less or equal then 31-12-YEAR
						$lte: new Date(`${year}-12-31`),
					},
				},
			},
			{
				//Grouping by the month:
				$group: {
					_id: { $month: "$startDates" }, //Using the $month operator, that returns the month of a date in number: JAN = 1
					//Counting the number of tours:
					numToursStarts: { $sum: 1 },
					//Getting the name of each tour, in an array:
					tours: { $push: "$name" },
				},
			},
			{
				//Adding a field with the same value of the _id field, so we can later hide the _id:
				$addFields: { month: "$_id" },
			},
			{
				//Using Project to hide the fields, using 0 to hide and 1 to show:
				$project: {
					_id: 0,
				},
			},
			{
				$sort: { numToursStarts: 1 },
				//Sorting by the month:
				// $sort: { month: 1 },
			},
		]);

		res.status(200).json({
			status: "success",
			data: {
				plan,
			},
		});
	} catch (error) {
		res.status(404).json({
			status: "fail",
			message: error.message,
		});
	}
};
