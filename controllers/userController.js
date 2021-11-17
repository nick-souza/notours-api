const AppError = require("../utils/appError");
//Importing the UserModel, so we can have access to the Model created from the userSchema:
const User = require("./../models/userModel");
//Importing the APIFeatures to be able to use some methods for the getAllUsers:
const APIFeatures = require("./../utils/apiFeatures");
//Importing the function to allows us to remove the try/catch block from the async func.:
const catchAsync = require("./../utils/catchAsync");

//---------------------------------------------------------------------------------------------------------------//

//In order to make a cleaner code, we can remove the try/catch block from the async funcions, put it in another higher order function, and just wrap the async functions with the new one. So there will be no repetetion for the catch block, since it will be handled in just one place:

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
