//Importing the TourModel, so we can have access to the Model created from the tourSchema:
const AppError = require("../utils/appError");
const Tour = require("./../models/tourModel");
//Importing the function to allows us to remove the try/catch block from the async func.:
const catchAsync = require("./../utils/catchAsync");
//Importing the handler factory, that contains all the handler functions for all modelController:
const factory = require("./handlerFactory");

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

//METHODS COMING FROM THE HANDLER FACTORY, TO AVOID DUPLICATE CODE:

// Calling the generic getAll function that is defined in the handlerFactory passing in the model:
exports.getAllTours = factory.getAll(Tour);

// Calling the generic getOneById function that is defined in the handlerFactory, passing in the model and the field to populate:
exports.getTour = factory.getOne(Tour, { path: "reviews" });

// Calling the generic create function that is defined in the handlerFactory passing in the model:
exports.createTour = factory.createOne(Tour);

// Calling the generic update function that is defined in the handlerFactory passing in the model:
exports.updateTour = factory.updateOne(Tour);

// Calling the generic delete function that is defined in the handlerFactory passing in the model:
exports.deleteTour = factory.deleteOne(Tour);

//---------------------------------------------------------------------------------------------------------------//

//HANDLER FUNCTIONS UNIQUE TO THE TOURS MODEL:

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
				//To calculate the total number of tours, we just simply add 1 every time a document pass through the pipeline:
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
	const year = req.params.year * 1; //Multiplying by one to convert to a number;

	const plan = await Tour.aggregate([
		{
			//The method unwind deconstructs an array field from each document and then output one document for each element of the array. So we are gonna have a "The Forest Hiker" for each start date:
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

//---------------------------------------------------------------------------------------------------------------//

//Method for the geospatial query:
exports.getToursWithin = catchAsync(async (req, res, next) => {
	//Destructuring to get all the data from the parameters in the URL:
	const { distance, latlng, unit } = req.params;
	//Now splitting the latlng since it comes like -213,324:
	const [lat, lng] = latlng.split(",");

	//Defining the special unit radiance based on the unit, to be used in the query. We divide our radius by the radius of the earth:
	const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1; //Is either miles or kilometers

	//Checking if the coords where specified:
	if (!lat || !lng) {
		return next(new AppError("Please provide latitude and longitude in the format lat,lng", 400));
	}

	//Now the geospatial query. So the first parameter is what we want to query, in this case the startLocation that has the coordinates. Then we specify the value we are searching for, so we use a operator $geoWithin that finds documents that are within a certain geometry. So we need to define the geometry next, which is a circle starting in the latlng defined before, and with a radius of the distance defined before. The centerSphere takes in array of the coords and of the radius:
	const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

	res.status(200).json({
		status: "success",
		results: tours.length,
		data: {
			data: tours,
		},
	});
});

//Function to get the distance between the user and the startLocations:
exports.getDistances = catchAsync(async (req, res, next) => {
	//Destructuring to get all the data from the parameters in the URL:
	const { latlng, unit } = req.params;
	//Now splitting the latlng since it comes like -213,324:
	const [lat, lng] = latlng.split(",");

	//Checking what unit the user is using, to then convert it:
	const multiplier = unit === "mi" ? 0.000621371 : 0.001;

	//Checking if the coords where specified:
	if (!lat || !lng) {
		return next(new AppError("Please provide latitude and longitude in the format lat,lng", 400));
	}

	//Using the aggregation pipeline:
	const distances = await Tour.aggregate([
		{
			//This stage has to always be the first:
			$geoNear: {
				//The variable from the user
				near: {
					type: "Point",
					coordinates: [lng * 1, lat * 1], //Multiplying by one to convert to numbers;
				},
				distanceField: "distance",
				//Since the result is in meters, converting to KM:
				distanceMultiplier: multiplier,
			},
		},
		{
			//Using the project stage to only show certain fields:
			$project: {
				distance: 1,
				name: 1,
			},
		},
	]);

	res.status(200).json({
		status: "success",
		data: {
			data: distances,
		},
	});
});
