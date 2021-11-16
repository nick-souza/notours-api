//Everything related to the server will go in this main file, while the rest related to express will go in the app.js module

//Requiring the dotenv module to use the env variables in the config.env file
const dotenv = require("dotenv");
//Now specifying the path for the doten config file:
dotenv.config({ path: "./config.env" });

//Importing the app from the app.js
const app = require("./app");

//Requiring the mongoose to connect to the database:
const mongoose = require("mongoose");

//Getting the details from the config.env file, using the process.env variables, using the replace method to automatically input the db password:
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

//Now connection to the mongoDB, using the basic object with default propeties, and since it returns a promise, we can chain it:
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	})
	.then(() => console.log("DB connection true"));

//Listening to be able to open the server:
const port = 3000;
const server = app.listen(port, () => {
	console.log(`App running on port ${port}`);
});

//To catch any unhandled promise rejection in the code, such as a wrong pass for the DB.
process.on("unhandledRejection", (err) => {
	console.log(err.name, err.message);
	console.log("Unhandled Rejection. Shutting down");

	//Exiting the program:
	server.close(() => {
		process.exit(1);
	});
});

//Handling Uncaught Exceptions:
process.on("uncaughtException", (err) => {
	console.log(err.name, err.message);
	console.log("Uncaught Exception. Shutting down");

	//Exiting the program:
	server.close(() => {
		process.exit(1);
	});
});
