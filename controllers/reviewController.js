const Review = require("./../models/reviewModel");
const catchAsync = require("./../utils/catchAsync");

exports.getAllReviews = catchAsync(async (req, res, next) => {
	const reviews = await Review.find();

	res.status(200).json({
		status: "success",
		results: reviews.length,
		data: {
			reviews: reviews,
		},
	});
});

exports.createReview = catchAsync(async (req, res, next) => {
	//So if the tour id was no specified, we should use the one that it is in the URL, since we are now using nested routes. Like /tours/someTourID/reviews:
	if (!req.body.tour) req.body.tour = req.params.tourId;
	//Same for the user, since we get access with the authController.protect:
	if (!req.body.user) req.body.user = req.user.id;

	const newReview = await Review.create(req.body);

	res.status(201).json({
		status: "success",
		data: {
			review: newReview,
		},
	});
});
