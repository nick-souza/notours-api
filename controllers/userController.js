const AppError = require("../utils/appError");
//Importing the UserModel, so we can have access to the Model created from the userSchema:
const User = require("./../models/userModel");
//Importing the function to allows us to remove the try/catch block from the async func.:
const catchAsync = require("./../utils/catchAsync");
//Importing the handler factory, that contains all the handler functions for all modelController:
const factory = require("./handlerFactory");

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

//METHODS COMING FROM THE HANDLER FACTORY, TO AVOID DUPLICATE CODE:

// Calling the generic getAll function that is defined in the handlerFactory passing in the model:
exports.getAllUsers = factory.getAll(User);

// Calling the generic getOneById function that is defined in the handlerFactory passing in the model:
exports.getUser = factory.getOne(User);

// Calling the generic update function that is defined in the handlerFactory passing in the model:
exports.updateUser = factory.updateOne(User);

// Calling the generic delete function that is defined in the handlerFactory passing in the model:
exports.deleteUser = factory.deleteOne(User);

//Creating an endpoint /me, so the user can have access to his own information. But we need this middleware first, since the id will be coming in from the already logged in user, not in the url:
exports.getMe = (req, res, next) => {
	//So setting the params.id to be the same as the user.id:
	req.params.id = req.user.id;
	next();
};
//---------------------------------------------------------------------------------------------------------------//

//HANDLER FUNCTIONS UNIQUE TO THE USER MODEL:

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
