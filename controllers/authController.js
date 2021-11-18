//Module that contains everything related to user authentication:

const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
//Importing the email module:
const sendEmail = require("./../utils/email");

//Importing the native node module to encrypt the reset password token, since it can be a bit less secure:
const crypto = require("crypto");
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

//Function to log the user in, after some operation, like changing the password:
const createAndSendToken = (user, statusCode, res) => {
	//Calling the token creating passing in the id from the created user:
	const token = signToken(user._id);

	//Options object for the cookie:
	const cookieOptions = {
		//Setting the expiration time, similar to the JWT expiration time:
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		//Option to only send over secure https:
		// secure: true,
		//Option so the cookie cannot be modified by the browser, only read and sent:
		httpOnly: true,
	};

	//Only using the secure option when in production:
	if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

	//Sending the token as a cookie, so the use can stay logged in:
	res.cookie("jwt", token, cookieOptions);

	//Not sending the pass back when the user is created:
	user.password = undefined;

	res.status(statusCode).json({
		status: "success",
		//Passing in the created token
		token,
		data: {
			user: user,
		},
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

	//Calling the function to create the token and log the user in:
	createAndSendToken(newUser, 201, res);
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
	//Calling the function to create the token and log the user in:
	createAndSendToken(user, 200, res);
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

//---------------------------------------------------------------------------------------------------------------//

//Middleware to the user receives a link to reset the password
exports.forgotPassword = catchAsync(async (req, res, next) => {
	//First, get the user based on the posted email:
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(new AppError("There is no user with that email address", 404));
	}

	//Generate the random reset token. Storing the generated token (by createPasswordResetToken in the model) in a variable:
	const resetToken = user.createPasswordResetToken();

	//Deactivating validators to just require the users email:
	await user.save({ validateBeforeSave: false });

	//Then send it to the user's email:
	//Creating the URL:
	const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

	//Message for the email
	const message = `Forgot password? Submit a PATCH request with a new password and passwordConfirm to: ${resetURL}. \nIf you didn't, ignore this email. `;

	try {
		await sendEmail({
			email: req.body.email,
			subject: "Your password reset token (valid for 10 mi)",
			message: message,
		});

		res.status(200).json({
			status: "success",
			message: "Token sent to email",
		});
	} catch (error) {
		//In case of any errors, just remove those properties:
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new AppError("There was an error sending email, try again later", 500));
	}
});

//---------------------------------------------------------------------------------------------------------------//

exports.resetPassword = catchAsync(async (req, res, next) => {
	//First, get the user based on the token
	const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

	//Finding the user, and checking if the has not expired, using mongoDb operands gt (greater than):
	const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

	//If the token has not expired and there us a user, set the new password
	if (!user) {
		return next(new AppError("Token is invalid or has expired", 400));
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	//Update changedPasswordAt property for the user
	//Log the user in , send JWT

	//If all information checks out, create a new token with the id:
	//Calling the function to create the token and log the user in:
	createAndSendToken(user, 200, res);
});

//---------------------------------------------------------------------------------------------------------------//

//In case the logged user wants to change the pass, without having to go to forgot password:
exports.updatePassword = catchAsync(async (req, res, next) => {
	//First we need to get the user from the collection:
	const user = await User.findById(req.user.id).select("+password");

	//Then check if the POSTed current pass is correct:

	if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
		return next(new AppError("Your current password is incorrect", 401));
	}

	//Then update the pass:
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	//Finally log the user in, send JWT
	//Calling the function to create the token and log the user in:
	createAndSendToken(user, 200, res);
});
