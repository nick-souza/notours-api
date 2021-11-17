//In order to make a cleaner code, we can remove the try/catch block from the async functions, put it in another higher order function, and just wrap the async functions with the new one. So there will be no repetition for the catch block, since it will be handled in just one place:

//So the fn function being whatever we are calling, like the getAllTours, getTour, and so on:
module.exports = catchAsync = (fn) => {
	return (req, res, next) => {
		//So it takes a function as a argument, and then we just called it here, chaining the .catch() method, since any errors will cause the promise to be rejected:
		fn(req, res, next).catch((error) => next(error));
		//And the next with any argument will automatically call the middleware error handler;
	};
};
