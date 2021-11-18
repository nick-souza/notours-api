const mongoose = require("mongoose");

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

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
