const AppError = require("./../utils/appError");

//Class that contains all the handlers for error:

//---------------------------------------------------------------------------------------------------------------//

//Functions to send error messages if in development or production:
const sendErrorDev = (error, res) => {
	res.status(error.statusCode).json({
		status: error.status,
		message: error.message,
		stack: error.stack,
	});
};

const sendErrorProd = (error, res) => {
	//We only want to send this message in case the error is a operational one:
	if (error.isOperational) {
		res.status(error.statusCode).json({
			status: error.status,
			message: error.message,
		});

		//Programming or other unknown error, so we don't leak error details to the client:
	} else {
		//Logging:
		console.error("ERROR", error);

		//Send the message to the user:
		res.status(500).json({
			status: "error",
			message: "Something went very wrong!",
		});
	}
};

//---------------------------------------------------------------------------------------------------------------//

const handleCastErrorDB = (err) => {
	//Creating the message with the properties from the err object:
	const message = `Invalid ${err.path}: ${err.value}`;

	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
	const message = `Duplicate field value: ${err.keyValue.name}. Please use another value.`;

	return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
	//Since we can have multiple fields missing, like price, duration etc. We have to loop over the error object and retrieve each message to create a big string:
	const errors = Object.values(err.errors).map((el) => el.message);
	const message = `Invalid input data. ${errors.join(". ")}`;

	return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid Token. Please log in again", 401);

const handleJWTExpiredError = () => new AppError("Session expired. Please log in again", 401);

//---------------------------------------------------------------------------------------------------------------//

//Middleware to take care of all the error handling. So every catch block and fail status can come directly here, so theres one unified location to take care of errors:
module.exports = (error, req, res, next) => {
	error.statusCode = error.statusCode || 500; //Setting the default, in case none is passed in:
	error.status = error.status || "error";

	//Sending different error messages if the error occurs in development or production, since we have the environment variable NODE_ENV:
	if (process.env.NODE_ENV === "development") {
		sendErrorDev(error, res);
	} else if (process.env.NODE_ENV === "production") {
		//Handling specific errors, like a invalid ID:
		let err = { ...error }; //Creating a copy of the error object, so we dont have to overwrite it;

		//So, if the error is a castError, it will be handle by this function:
		if (error.name === "CastError") err = handleCastErrorDB(err);

		//Handler for the 11000 error, which is duplicate key:
		if (err.code === 11000) err = handleDuplicateFieldsDB(err);

		//Handler for the validationError
		if (error.name === "ValidationError") err = handleValidationErrorDB(err);

		//Handler for invalid token, when trying to access a protected route:
		if (error.name === "JsonWebTokenError") err = handleJWTError();

		//Handler for expired token, when trying to access a protected route:
		if (error.name === "TokenExpiredError") err = handleJWTExpiredError();

		sendErrorProd(err, res);
	}
};
