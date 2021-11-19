const Review = require("./../models/reviewModel");
//Importing the handler factory, that contains all the handler functions for all modelController:
const factory = require("./handlerFactory");

//---------------------------------------------------------------------------------------------------------------//

//METHODS COMING FROM THE HANDLER FACTORY, TO AVOID DUPLICATE CODE:

exports.getAllReviews = factory.getAll(Review);

// Calling the generic create function that is defined in the handlerFactory passing in the model:
exports.createReview = factory.createOne(Review);

// Calling the generic delete function that is defined in the handlerFactory passing in the model:
exports.deleteReview = factory.deleteOne(Review);

// Calling the generic update function that is defined in the handlerFactory passing in the model:
exports.updateReview = factory.updateOne(Review);

//Middleware function that will run before creating a tour, so we can check if the touID was specified or not:
exports.setTourUserIds = (req, res, next) => {
	//So if the tour id was no specified, we should use the one that it is in the URL, since we are now using nested routes. Like /tours/someTourID/reviews:
	if (!req.body.tour) req.body.tour = req.params.tourId;
	//Same for the user, since we get access with the authController.protect:
	if (!req.body.user) req.body.user = req.user.id;

	next();
};

// Calling the generic getOneById function that is defined in the handlerFactory passing in the model:
exports.getReview = factory.getOne(Review);

//---------------------------------------------------------------------------------------------------------------//
