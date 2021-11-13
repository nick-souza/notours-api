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
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
