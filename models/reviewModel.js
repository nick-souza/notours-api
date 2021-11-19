const mongoose = require("mongoose");
//Importing the tour model to calculate the avg rating statistics:
const Tour = require("./tourModel");

//---------------------------------------------------------------------------------------------------------------//

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, "Review cannot be empty"],
		},
		rating: {
			type: Number,
			required: [true, "A reviews must have a rating"],
			min: [1, "Rating must be above 1.0"],
			max: [5, "Rating must be below 5.0"],
		},
		createdAt: {
			type: Date,
			default: Date.now(),
		},
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: "Tour",
			required: [true, "Review must belong to a tour"],
		},

		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Review must have a author"],
		},
	},
	{
		//Passing another object as the object Options, so we can display the virtual property

		//So every time the data is output as JSON/OBJECT, we want virtuals to be a part of it:
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

//---------------------------------------------------------------------------------------------------------------//

//Creating indexes so the user can only write one review about a tour, passing in a object of options, setting it to unique:
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//---------------------------------------------------------------------------------------------------------------//

//Middleware to populate the Tour and User field in the Review query:
reviewSchema.pre(/^find/, function (next) {
	//Populating the tour and the user:

	// this.populate({
	// 	path: "tour",
	// 	select: "name",
	// }).populate({
	// 	path: "user",
	// 	select: "name photo",
	// });

	//Just populating the user, since the review will be available in the tour itself:
	this.populate({
		path: "user",
		select: "name photo",
	});

	next();
});

//---------------------------------------------------------------------------------------------------------------//

//Function responsible for calculating the ratingsAverage and quantity whenever a reviews is posted about a tour.
//Using Static method:
reviewSchema.statics.calcAverageRatings = async function (tourId) {
	//It takes in the ID of the tour

	//Using aggregation pipeline to make the calculation, since the .this points to the current Model:
	const stats = await this.aggregate([
		{
			//Fist select all the reviews that belong to the tour ID that was passed in:
			$match: { tour: tourId },
		},
		{
			//Calculating the statistics:
			$group: {
				//Grouping by the tour
				_id: "$tour",
				//Creating the number of reviews just by adding 1 to each tour:
				nRating: { $sum: 1 },
				//Now calculating the actual average:
				avgRating: { $avg: "$rating" },
			},
		},
	]);

	//Now we need to persist these statistics to the actual tour

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			//Since the stats is an array, we get the values from there:s
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating,
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			//Since the stats is an array, we get the values from there:s
			ratingsQuantity: 0,
			ratingsAverage: 0,
		});
	}
};

//Calling that function with a middleware that will run each time a reviews is created:
reviewSchema.post("save", function () {
	//.this points to the current review:

	//And since that function is static, we can just call from the model directly. But since the Review has not yet been created, we have to use the .constructor:
	this.constructor.calcAverageRatings(this.tour);
});

//Middleware to apply the calc function when updating or deleting a review also:
reviewSchema.pre(/^findOneAnd/, async function (next) {
	this.rev = await this.findOne();

	next();
});

reviewSchema.post(/^findOneAnd/, async function () {
	await this.rev.constructor.calcAverageRatings(this.rev.tour);
});

//---------------------------------------------------------------------------------------------------------------//

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
