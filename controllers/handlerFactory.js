//Module that will handle all the handler function for the model controllers, like the get and delete method. To avoid having duplicate code in all of the controllers:

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
//Importing the APIFeatures to be able to use some methods for the getAllTours:
const APIFeatures = require("./../utils/apiFeatures");

//---------------------------------------------------------------------------------------------------------------//

//In order to make a cleaner code, we can remove the try/catch block from the async functions, put it in another higher order function, and just wrap the async functions with the new one. So there will be no repetition for the catch block, since it will be handled in just one place:

//Passing in the model first because we will be able to use it for any document, Tour, User and so on:
exports.getAll = (Model) =>
	catchAsync(async (req, res, next) => {
		//Checking if in the urls there is a tour id, since we are redirecting from the tour routes. And if there is, only display the reviews for that tour. Used only by the geAllReviews:
		let filter = {};
		if (req.params.tourId) filter = { tour: req.params.tourId };

		//Creating an instance of the class APIFeatures to be able to use its methods. Passing the query and the query string, and then chaining the methods:
		const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

		//And now execute the query:
		const doc = await features.query;

		res.status(200).json({
			status: "success",
			results: doc.length,
			data: {
				data: doc,
			},
		});
	});

//For the getOne function, in the tour model we also need the populate method, to fill up the reviews array:
exports.getOne = (Model, populateOptions) =>
	catchAsync(async (req, res, next) => {
		//So first building the query:
		let query = Model.findById(req.params.id);

		//Then checking if there is a populate parameter
		if (populateOptions) query = query.populate(populateOptions);

		//Then await the query and save it to the document:
		const doc = await query;

		//Finding by the ID, form the req.params.id (the variable the user inputs in the URL, like /api/v2/5, the 5 will be the req.params.id)
		//Using populate virtually populate the reviews array with the actual reviews:
		// const doc = await Model.findById(req.params.id).populate("reviews");

		//If the user inputs a id with the same structure as the document, but not a valid one, it returns null, not 404:
		if (!doc) {
			//Using next, to jump straight into the middleware error handler:
			return next(new AppError("No document found with that id", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				data: doc,
			},
		});
	});

exports.deleteOne = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc) {
			return next(new AppError(`No document found with this ID`, 404));
		}

		res.status(200).json({
			status: "success",
			data: null,
		});
	});

exports.updateOne = (Model) =>
	catchAsync(async (req, res, next) => {
		//First we have to find the element by the ID, and then update:
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			//The third argument can be the options;
			//Using the new = true, the new updated doc is gonna be returned:
			new: true,

			//Option to use the validators specified in the model:
			runValidators: true,
		});

		//If the user inputs a id with the same structure as the doc, but not a valid one, it returns null, not 404:
		if (!doc) {
			//Using next, to jump straight into the middleware error handler:
			return next(new AppError("No document found with that id", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				data: doc,
			},
		});
	});

exports.createOne = (Model) =>
	catchAsync(async (req, res, next) => {
		//To post a new document to the DB, we can use the create method directly in the instance of the model, and it returns a promise, so we can await it:
		const newDoc = await Model.create(req.body);

		res.status(201).json({
			status: "success",
			data: {
				data: newDoc,
			},
		});
	});
