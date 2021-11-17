//Module that contains everything related to user authentication:

const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

//Importing the library to use the JSON Web Token, JWT, for authentication:
const jwt = require("jsonwebtoken");
//Importing the native node module that can promisify functions:
const { promisify } = require("util");

//---------------------------------------------------------------------------------------------------------------//

//Function to generate the Token;
//Passing in the payload (_id), and the secret (stored in the config.env file) and the options object, using a expiration time (Also defined in the config.env)
const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

//---------------------------------------------------------------------------------------------------------------//

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		role: req.body.role,
	});

	//Calling the token creating passing in the id from the created user:
	const token = signToken(newUser._id);

	res.status(201).json({
		status: "success",
		//Passing in the created token
		token,
		data: {
			user: newUser,
		},
	});
});

//---------------------------------------------------------------------------------------------------------------//

//Function to login:
exports.login = catchAsync(async (req, res, next) => {
	//Using destructuring to get the properties from the body:
	const { email, password } = req.body;

	//Now checking if the user has input the email and pass :
	if (!email || !password) {
		//So if there is no email or pass, we call the next, passing in the error so the middleware will catch it:
		return next(new AppError("Please provide email and password", 400));
	}

	//Now checking if the user exists:
	//We have to use the .select() to select the pass field that has the select: false in the model, and use the + sign since it is a hidden field:
	const user = await User.findOne({ email: email }).select("+password");

	//Now, we need to compare the pass the user input to login, with the pass that is encrypted in our DB. Using a function created in the userModel.js. And since that function is a instance method, it is available in the new user we defined above, so we can just directly call it:

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError("Incorrect email or password", 401));
	}

	//If all information checks out, create a new token with the id:
	const token = signToken(user._id);

	res.status(200).json({
		status: "success",
		token,
	});
});

//---------------------------------------------------------------------------------------------------------------//

//Middleware function to only allow the user that is logged in, to access the getAllTours route:
exports.protect = catchAsync(async (req, res, next) => {
	//First, getting the token and check if its there. Getting from the req.headers, always using the format: Authorization - Bearer "and the token":

	let token; //Creating the variable out here, since the if block is blocked scope:

	if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
		//Then splitting the header string by the space character, and only getting the second part of the string:
		token = req.headers.authorization.split(" ")[1];
	}

	//Returning an error if in the header there is no token:
	if (!token) {
		return next(new AppError("You are not logged in. Please log in to get access", 401));
	}

	//Then, validate the token, using JWT. In the .verify() we pass in the token, and also the secret, that is in the config.env, and it also requires a callback function, that will run when the verification if completed. But, we can use the promisify from native node, to make this function return a promise:
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	//If authentication successful, check if the user trying to access the route still exists. Using the payload from the token that is in the decoded variable, since we are using the id as the payload:
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(new AppError("This user no longer exists", 401));
	}

	//Check if user changed pass after the token was issued. Using the instate method declared in the userModel, passing in the property of the decoded object created by the jwt.verify, that contains the JWTTimestamp:
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		//So the code will enter the if block if the changedPasswordAfter returns true, meaning the user has changed pass:
		return next(new AppError("User recently changed password. Please log in again", 401));
	}

	//Only if after all the steps are ok, then call the next function, granting access to the protected route:
	req.user = currentUser;
	next();
});

//---------------------------------------------------------------------------------------------------------------//

//Middleware for authorization, to restrict some routes only to admin users, like deleting tours:
//However, since we cant pass arguments to middleware functions, we need to create a wrapper function, and then return the middleware inside it:
exports.restrictTo = (...roles) => {
	//Receiving an arbitrary number of roles, and storing it in an array:

	//Immediately returning the middleware function:
	return (req, res, next) => {
		//Now checking to see if the role of the user trying to access the route, is in the roles array that was specified when the function was called. Example: ["admin", "lead-guide"];
		//And since this middleware will always run after the .protect(), we have access to the req.user:
		if (!roles.includes(req.user.role)) {
			return next(new AppError("You do not have permission to perform this action", 403));
			//With the http code of 403 which is forbidden;
		}

		//So if the user is one of them:
		next();
	};
};
