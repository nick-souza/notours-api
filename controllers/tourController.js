//Importing the TourModel, so we can have access to the Model created from the tourSchema:
const AppError = require("../utils/appError");
const Tour = require("./../models/tourModel");
//Importing the APIFeatures to be able to use some methods for the getAllTours:
const APIFeatures = require("./../utils/apiFeatures");
//Importing the function to allows us to remove the try/catch block from the async func.:
const catchAsync = require("./../utils/catchAsync");

//---------------------------------------------------------------------------------------------------------------//

//Middleware to create an alias to a common used query string, so the user does not have to type the whole thing. Used by the tourRoutes.js
exports.aliasTopTours = (req, res, next) => {
	//Hard coding the values since this will be just a alias for the common used query:
	req.query.limit = "5";
	req.query.sort = "-ratingsAverage,price";
	req.query.fields = "name,price,ratingsAverage,summary,difficulty";

	next();
};

//---------------------------------------------------------------------------------------------------------------//
//In order to make a cleaner code, we can remove the try/catch block from the async funcions, put it in another higher order function, and just wrap the async functions with the new one. So there will be no repetetion for the catch block, since it will be handled in just one place:

//Separete handler functions to take care of the routes:
exports.getAllTours = catchAsync(async (req, res, next) => {
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

	//OLD TRY AND CATCH BLOCK
	// try {
	// } catch (error) {
	// 	res.status(404).json({
	// 		status: "fail",
	// 		message: error.message,
	// 	});
	// }
});

exports.getTour = catchAsync(async (req, res, next) => {
	//Finding by the ID, form the req.params.id (the variable the user inputs in the URL, like /api/v2/5, the 5 will be the req.params.id)
	const tour = await Tour.findById(req.params.id);

	//If the user inputs a id with the same structure as the tour, but not a valide one, it returns null, not 404:
	if (!tour) {
		//Using next, to jump straight into the middleware error handler:
		return next(new AppError("No tour found with that id", 404));
	}

	res.status(200).json({
		status: "success",
		data: {
			tour: tour,
		},
	});
});

exports.createTour = catchAsync(async (req, res, next) => {
	//To post a new document to the DB, we can use the create methdo directly in the instace of the model, and it returns a promise, so we can await it:
	const newTour = await Tour.create(req.body);

	res.status(201).json({
		status: "success",
		data: {
			tour: newTour,
		},
	});
});

exports.updateTour = catchAsync(async (req, res, next) => {
	//First we have to find the element by the ID, and then update:
	const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
		//The third argument can be the options;
		//Using the new = true, the new updated document is gonna be returned:
		new: true,

		//Option to use the validators specified in the model:
		runValidators: true,
	});

	//If the user inputs a id with the same structure as the tour, but not a valide one, it returns null, not 404:
	if (!tour) {
		//Using next, to jump straight into the middleware error handler:
		return next(new AppError("No tour found with that id", 404));
	}

	res.status(200).json({
		status: "success",
		tour: tour,
	});
});

exports.deleteTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findByIdAndDelete(req.params.id);

	//If the user inputs a id with the same structure as the tour, but not a valide one, it returns null, not 404:
	if (!tour) {
		//Using next, to jump straight into the middleware error handler:
		return next(new AppError("No tour found with that id", 404));
	}

	res.status(204).json({
		status: "success",
		data: null,
	});
});

//Handler function to use aggregation pipeline for mongoDB, used by a route in tourRoutes.js:
exports.getTourStats = catchAsync(async (req, res, next) => {
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
});

//Now a handler function to calculate the busiest month of a year, using aggregation to return how many tours we have for each month, for a specific year:
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
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
});
