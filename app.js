//Requiring express:
const express = require("express");
//Morgan is a library that makes using logger middleware easier:
const morgan = require("morgan");

//Requiring the AppError Class to handle all the Operational Errors:
const AppError = require("./utils/appError");
//Requiring the ErrorController module:
const globalErrorHandler = require("./controllers/errorController");

//Importing the modules with the routers:
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

//The express is a function that will assign loads of useful methods to our app variable:
const app = express();

//---------------------------------------------------------------------------------------------------------------//

//Including the middleware, because express does not automatically include the body data on the request:
//Using the morgan middleware
//The predefined string "dev", give us loads of information, like the type of method request (GET,POST), the path, status code and so on;
app.use(morgan("dev"));

//Just a function tha can modify the incoming data:
app.use(express.json());

//Middleware to serve static files, like the overview.html in the public folder:
app.use(express.static(`${__dirname}/public`));

//Creating our own global middleware, when defined at the top, it will execute between all requests:
app.use((req, res, next) => {
	//Creating a new date when the request is made, and converting to ISOString:
	req.requestTime = new Date().toISOString();
	//Always calling the next function:
	next();
});

//---------------------------------------------------------------------------------------------------------------//
//Getting the routers from the separete modules:

//Now using middlewares to be able to connect these created routers with the main app router:
//Mounting the routers:
app.use("/api/v1/tours", tourRouter);

app.use("/api/v1/users", userRouter);

//---------------------------------------------------------------------------------------------------------------//

//Adding a middleware to hanlde in case the user tries to go to a unhandled route. Using .all() to work for all HTTP methods:
app.all("*", (req, res, next) => {
	//All the error can go to the error handler middleware, just have to specify the error object:
	// const error = new Error(`Can't find ${req.originalUrl} in this server.`);
	// error.status = "fail";
	// error.statusCode = 404;

	//Calling the next function passing in any argument, autoamtically calls the error handler middleware:
	next(new AppError(`Can't find ${req.originalUrl} in this server.`, 404));
});

//Middleware to take care of all the error handling. So every catch block and fail status can come directly here, so theres one unified location to take care of errors:
app.use(globalErrorHandler);

//---------------------------------------------------------------------------------------------------------------//

//Exporing the app so the server.js module can listen and start the server:
module.exports = app;
