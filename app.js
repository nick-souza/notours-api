//Requiring express:
const express = require("express");
//Morgan is a library that makes using logger middleware easier:
const morgan = require("morgan");
//Importing the rate-limit package from express:
const rateLimit = require("express-rate-limit");
//Importing helmet to help with setting security in http headers
const helmet = require("helmet");
//Importing packages for data sanitization:
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
//Package to prevent form parameter pollution, like ?sort=price&sort=duration where it should be sort=price,duration
const hpp = require("hpp");
const path = require("path");

//Requiring the AppError Class to handle all the Operational Errors:
const AppError = require("./utils/appError");
//Requiring the ErrorController module:
const globalErrorHandler = require("./controllers/errorController");
//Importing the modules with the routers:
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

//The express is a function that will assign loads of useful methods to our app variable:
const app = express();

//Middleware to serve static files, like the overview.html in the public folder:
app.use(express.static(`${__dirname}/public`));

//Setting the template:
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//---------------------------------------------------------------------------------------------------------------//

//Including the middleware, because express does not automatically include the body data on the request:
//Using the morgan middleware
//The predefined string "dev", give us loads of information, like the type of method request (GET,POST), the path, status code and so on;
app.use(morgan("dev"));

//Middleware to watch and impose a rate limit for requests coming from the same IP, to prevent from attacks:
const limiter = rateLimit({
	//The max number of requests:
	max: 50,
	//The time in milliseconds:
	windowMs: 60 * 60 * 1000,
	//The message the user will receive if he exceeds the limit:
	message: "Too many requests, try again later",
});

//Calling the function in the middleware:
app.use("/api", limiter);

//Middleware to set the security standards for the header using helmet:
app.use(helmet());

//Just a function tha can modify the incoming data. Also limiting the amount of data tha can come in from the req.body:
app.use(express.json({ limit: "10kb" }));

//After reading the data using the middleware above, we can perform data Sanitization, which means cleaning the data from malicious code:
//Against NoSQL Injection:
app.use(mongoSanitize());
//Against XSS:
app.use(xss());

//Middleware to prevent form parameter pollution, like ?sort=price&sort=duration where it should be sort=price,duration:
//We can whitelist some terms, like ?duration=5&duration=9, which should work:
app.use(
	hpp({
		whitelist: ["duration", "ratingsQuantity", "ratingsAverage", "maxGroupSize", "difficulty", "price"],
	})
);

//Creating our own global middleware, when defined at the top, it will execute between all requests:
app.use((req, res, next) => {
	//Creating a new date when the request is made, and converting to ISOString:
	req.requestTime = new Date().toISOString();
	//Always calling the next function:
	next();
});

//---------------------------------------------------------------------------------------------------------------//

//Rendering the templates:
app.get("/", (req, res) => {
	//We only need to put the name of the file since the path is already defined at the top:
	res.status(200).render("base");
});

//Getting the routers from the separate modules:

//Now using middleware to be able to connect these created routers with the main app router:
//Mounting the routers:
app.use("/api/v1/tours", tourRouter);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/reviews", reviewRouter);

//---------------------------------------------------------------------------------------------------------------//

//Adding a middleware to handle in case the user tries to go to a unhandled route. Using .all() to work for all HTTP methods:
app.all("*", (req, res, next) => {
	//All the error can go to the error handler middleware, just have to specify the error object:
	// const error = new Error(`Can't find ${req.originalUrl} in this server.`);
	// error.status = "fail";
	// error.statusCode = 404;

	//Calling the next function passing in any argument, automatically calls the error handler middleware:
	next(new AppError(`Can't find ${req.originalUrl} in this server.`, 404));
});

//Middleware to take care of all the error handling. So every catch block and fail status can come directly here, so theres one unified location to take care of errors:
app.use(globalErrorHandler);

//---------------------------------------------------------------------------------------------------------------//

//Exporting the app so the server.js module can listen and start the server:
module.exports = app;
