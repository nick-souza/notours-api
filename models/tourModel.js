const mongoose = require("mongoose");

//Creating the schema for the tours, using the moongose.Schema constructor passing in an object in the parameter:
//Defining the de fields and doing some validation;
const tourSchema = new mongoose.Schema({
	//Defining the schema type options for the name field:
	name: {
		type: String,
		//In the required field, we can just pass the boolean, or pass an array with the boolean and the error message in case it requirements are not met:
		required: [true, "A tour must have a name."],
		unique: true,
	},
	duration: {
		type: Number,
		required: [true, "A tour must have a duration"],
	},
	maxGroupSize: {
		type: Number,
		required: [true, "A tour must have a group size"],
	},
	difficulty: {
		type: String,
		required: [true, "A tour must have a dificulty"],
	},
	//Defining the properties and their types, using native javascript types:
	ratingsAverage: {
		type: Number,
		default: 4.5,
	},
	ratingsQuantity: {
		type: Number,
		defualt: 0,
	},
	price: {
		type: Number,
		required: [true, "A tour must have a price."],
	},
	priceDiscount: Number,
	summary: {
		type: String,
		//Using trim to remove the whitespaces
		trim: true,
		required: [true, "A tour must have a description"],
	},
	description: {
		type: String,
		trim: true,
	},
	imageCover: {
		type: String,
		required: [true, "A tour must have a cover image"],
	},
	//The tipy is an array of strings, containing the url for the images:
	images: [String],
	createdAt: {
		type: Date,
		//Using the date.now to get a timestamp of when the tour is created:
		default: Date.now(),
		//Using the select property to automatically hide this property, so the user would not have access to it. Useful for sensitive data:
		select: false,
	},
	//Array containing all the possible start dates for a tour:
	startDates: [Date],
});

//Now that we have the schema, we can create the model out of it, using the name always uppercase, and passing in the schema name:
const Tour = mongoose.model("Tour", tourSchema);

//Now exporting the Tour model
module.exports = Tour;
