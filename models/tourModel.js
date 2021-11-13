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
	//Defining the properties and their types, using native javascript types:
	rating: {
		type: Number,
		default: 4.5,
	},
	price: {
		type: Number,
		required: [true, "A tour must have a price."],
	},
});

//Now that we have the schema, we can create the model out of it, using the name always uppercase, and passing in the schema name:
const Tour = mongoose.model("Tour", tourSchema);

//Now exporting the Tour model
module.exports = Tour;
