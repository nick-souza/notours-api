//Module that contains everything related to user authentication:

const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

//Importing the library to use the JSON Web Token, JWT, for authentication:
const jwt = require("jsonwebtoken");

//---------------------------------------------------------------------------------------------------------------//

//Function to genegate the Token;
//Passing in the payload (_id), and the secret (stored in the config.env file) and the options object, using a expiration time (Also defined in the config.env)
const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
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

//Function to login:
exports.login = catchAsync(async (req, res, next) => {
	//Using destructuring to get the properies from the body:
	const { email, password } = req.body;

	//Now checking if the user has input the email and pass :
	if (!email || !password) {
		//So if there is no email or pass, we call the next, passing in the error so the middleware will catch it:
		return next(new AppError("Please provide email and password", 400));
	}

	//Now checking if the user exists:
	//We have to use the .select() to slect the pass field that has the select: false in the model, and use the + sign since it is a hidden field:
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

//Middleware function to only allow the user that is logged in, to access the getAllTours route:
exports.protect = catchAsync(async (req, res, next) => {
	//First, getting the token and check if its there:

	//Then, validate the token, using JWT

	next();
});
