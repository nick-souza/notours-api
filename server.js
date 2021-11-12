//Everything related to the server will go in this main file, while the rest related to express will go in the app.js module

//Importing the app from the app.js
const app = require("./app");
//Requiring the dotenv module to use the env variables in the config.env file
const dotenv = require("dotenv");
//Requiring the mongoose to connect to the database:
const mongoose = require("mongoose");

//Now specifying the path for the doten config file:
dotenv.config({ path: "./config.env" });

//Getting the details from the config.env file, using the process.env variables, using the replace method to automatically input the db password:
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

//Now connection to he mongoDB, using the basic object with default propeties, and since it returns a promise, we can chain it:
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	})
	.then(() => console.log("DB connection true"));

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

//Creating a new document in the mongoDB, using the Tour model created before:
const testTour = new Tour({
	name: "The forest hiker",
	rating: 4.7,
	price: 496,
});

//So this testTour variable is a instace of the Tour model, and it has some methods we can use to interact with the database:
// testTour
// 	.save()
// 	.then((doc) => {
// 		console.log(doc);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

//Listening to be able to open the server:
const port = 3000;
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
