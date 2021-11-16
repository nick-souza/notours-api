//Module that contains a global middleware to handle all error. Extending the built in Error class:

class AppError extends Error {
	constructor(message, statusCode) {
		super(message); //Comes from the built in Error class;

		this.statusCode = statusCode;
		//Only options are fail (for 400 http status codes) or error (for 500 codes). So we simply check:
		this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; //Using template literal to convert to string;
		//Property to show if its an operational error (Some error that we can predict):
		this.isOperational = true;

		//To capture the stack trace, that shows us where the error has happened:
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = AppError;
