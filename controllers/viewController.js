const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
	//Get the tour data from the collection:
	const tours = await Tour.find();

	//Then render the template

	//We only need to put the name of the file since the path is already defined at the top:
	res.status(200).render("overview", {
		//Passing the variables that will be available in the template:
		title: "All Tours",
		tours: tours,
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({ path: "reviews", fields: "review rating user" });

	//We only need to put the name of the file since the path is already defined at the top:
	res.status(200).render("tour", {
		title: tour.name,
		tour: tour,
	});
});

exports.getLoginForm = (req, res) => {
	res.status(200).render("login", {
		title: "Log in",
	});
};
