const AppError = require("../utils/appError");
//Importing the UserModel, so we can have access to the Model created from the userSchema:
const User = require("./../models/userModel");
//Importing the APIFeatures to be able to use some methods for the getAllUsers:
const APIFeatures = require("./../utils/apiFeatures");
//Importing the function to allows us to remove the try/catch block from the async func.:
const catchAsync = require("./../utils/catchAsync");

//---------------------------------------------------------------------------------------------------------------//

//Function that will filter the req.body object for the updateMe, so the user cannot update properties such as the role:
//It takes in the object (the req.body) and a undefined number of properties:
const filterObj = (obj, ...allowedFields) => {
	//New obj that will hold only the allowed fields:
	const newObj = {};

	//Looping over the object, and checking for the allowed fields:
	Object.keys(obj).forEach((element) => {
		if (allowedFields.includes(element)) newObj[element] = obj[element];
	});

	return newObj;
};

//---------------------------------------------------------------------------------------------------------------//

//In order to make a cleaner code, we can remove the try/catch block from the async functions, put it in another higher order function, and just wrap the async functions with the new one. So there will be no repetition for the catch block, since it will be handled in just one place:

//Since we want to export all of these functions, we put them in the exports object:
exports.getAllUsers = catchAsync(async (req, res, next) => {
	const users = await User.find();

	res.status(200).json({
		status: "success",
		results: users.length,
		data: {
			users: users,
		},
	});
});

exports.createUser = (req, res) => {
	res.status(500).json({
		status: "error",
		message: "Route not defined",
	});
};

exports.getUser = (req, res) => {
	res.status(500).json({
		status: "error",
		message: "Route not defined",
	});
};

exports.updateUser = (req, res) => {
	res.status(500).json({
		status: "error",
		message: "Route not defined",
	});
};

exports.deleteUser = (req, res) => {
	res.status(500).json({
		status: "error",
		message: "Route not defined",
	});
};

//---------------------------------------------------------------------------------------------------------------//

//Function that updated the current authenticated user:
exports.updateMe = catchAsync(async (req, res, next) => {
	//Since there is another route for the user to update the pass, throw an error if he tries to do it here:
	if (req.body.password || req.body.passwordConfirm) {
		return next(new AppError("This route is not for password updates", 400));
	}

	//Updating the other properties:

	//Function to filter the properties the user wants to update. In this case, we cannot just use req.body because the user might try to update the role for example;
	const filteredBody = filterObj(req.body, "name", "email");

	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

	res.status(200).json({
		status: "success",
		data: {
			user: updatedUser,
		},
	});
});

//Function that will delete the user, in this case, it will only set the property of active: false:
exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });

	res.status(204).json({
		status: "success",
		data: null,
	});
});
