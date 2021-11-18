const mongoose = require("mongoose");
const slugify = require("slugify");

//---------------------------------------------------------------------------------------------------------------//

//Creating the schema for the tours, using the mongoose.Schema constructor passing in an object in the parameter:
//Defining the de fields and doing some validation;
const tourSchema = new mongoose.Schema(
	{
		//Defining the schema type options for the name field:
		name: {
			type: String,
			//In the required field, we can just pass the boolean, or pass an array with the boolean and the error message in case it requirements are not met:
			unique: true,
			//Validation Fields:
			required: [true, "A tour must have a name."],
			maxlength: [40, "A tour name must have less or equal than 40 characters."],
			minlength: [10, "A tour name must have more or equal than 10 characters."],
			//Using the library to check if the name is all letters:
			// validate: [validator.isAlpha, "A tour name must contain letters only"],
		},
		//Property that will be filled after inserting a document, and then the mongoose middleware will be called:
		slug: String,
		duration: {
			type: Number,
			required: [true, "A tour must have a duration"],
		},
		maxGroupSize: {
			type: Number,
			required: [true, "A tour must have a group size"],
		},
		difficulty: {
			type: String,
			//Validators:
			required: [true, "A tour must have a difficulty"],
			//Since we only want three possibilities for the difficulty, we can use Enums:
			enum: {
				values: ["easy", "medium", "difficult"],
				message: "Difficulty is either: easy, medium, or difficult.",
			},
		},
		//Defining the properties and their types, using native javascript types:
		ratingsAverage: {
			type: Number,
			default: 4.5,
			//Validators:
			min: [1, "Rating must be above 1.0"],
			max: [5, "Rating must be below 5.0"],
		},
		ratingsQuantity: {
			type: Number,
			default: 0,
		},
		price: {
			type: Number,
			required: [true, "A tour must have a price"],
		},
		priceDiscount: {
			type: Number,
			//Adding custom validators:
			validate: {
				validator: function (value) {
					//Callback function to check if the discount is less the the actual price. So returning true or false;
					//However, this function will not work when updating a document;
					return value < this.price;
				},
				message: "Discount price ({VALUE}) should be less than the regular price.",
			},
		},
		summary: {
			type: String,
			//Using trim to remove the whitespace
			trim: true,
			required: [true, "A tour must have a description"],
		},
		description: {
			type: String,
			trim: true,
		},
		imageCover: {
			type: String,
			required: [true, "A tour must have a cover image"],
		},
		//The type is an array of strings, containing the url for the images:
		images: [String],
		createdAt: {
			type: Date,
			//Using the date.now to get a timestamp of when the tour is created:
			default: Date.now(),
			//Using the select property to automatically hide this property, so the user would not have access to it. Useful for sensitive data:
			select: false,
		},
		//Property to define private tours, using the mongoose middleware at the time of querying:
		secretTour: {
			type: Boolean,
			default: false,
		},
		//Array containing all the possible start dates for a tour:
		startDates: [Date],

		//Now we start to add the locations, using geospatial data, using GeoJSON:
		startLocation: {
			//This is not the schema options like the fields before, it is indeed a embedded object, so each field will get its schema option:
			type: {
				type: String,
				default: "Point",
				//It can only be "Point", so using enum once again:
				enum: ["Point"],
			},
			coordinates: [Number],
			address: String,
			description: String,
		},
		//Embedding documents needs to go inside an array, and then with the object inside it:
		locations: [
			{
				type: {
					type: String,
					default: "Point",
					//It can only be "Point", so using enum once again:
					enum: ["Point"],
				},
				coordinates: [Number],
				address: String,
				description: String,
				//The day of the tour:
				day: Number,
			},
		],
		//Using child referencing to keep the ids of the user guides in the document tours:
		guides: [
			{
				//So the type expected is to be a mongo ID:
				type: mongoose.Schema.ObjectId,
				//Now establishing the reference to the User document:
				ref: "User",
			},
		],
	},
	{
		//Passing another object as the object Options, so we can display the virtual property

		//So every time the data is output as JSON/OBJECT, we want virtuals to be a part of it:
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

//---------------------------------------------------------------------------------------------------------------//

//Adding virtual properties, from mongoose. Just fields we can add to our model but it will not be persistent in our schema, so it wont be saved in the DB. Good for fields there are derived from one another, like converting from KM to MILES, where we dont need to save both if we can easily convert them:

//Now using virtual properties to calculate the duration in weeks, since we have the duration in days.
//Inside the getter we have to use a normal function, because arrow functions do not receive a this keyword:
tourSchema.virtual("durationWeeks").get(function () {
	return this.duration / 7;
});

//Virtually populating reviews. Since we only have child reference in the reviews, where the review model saves the tour id and the tour does not have access, we can use virtual populate to only get that information upon querying:
tourSchema.virtual("reviews", {
	//The first option is the name of the model we want to reference:
	ref: "Review",
	//Also specify the name of the field in the other model (review model in this case) where the reference to the current model is stored. So in the review.model the tour property holds the id for a certain tour:
	foreignField: "tour",
	//And the name for current model where the id is stored:
	localField: "_id",
});

//---------------------------------------------------------------------------------------------------------------//

//Defining a mongoose Document Middleware, to be activated between the save command is issued and the actual document saved:
//So using the pre method will activate the function before the described event happens. Only after th .save() and .create() in this case:
tourSchema.pre("save", function (next) {
	//In a save middleware, the .this keyword points to the currently processed documents, thus called Document Middleware;
	//So before inserting the document to the DB, we can do operations with the data. In this case, create a slug for each:
	this.slug = slugify(this.name, { lower: true });

	//Calling the next middleware in the stack, just like express:
	next();
});

//Defining a mongoose Query Middleware that runs every time a query is executed. A Query Middleware:
// tourSchema.pre("find", function (next) {
//Using regular expression to get all the method that starts with find, like findOne, findOneAndDelete and so on:
tourSchema.pre(/^find/, function (next) {
	//So the .this will point to the query;

	//Only displaying the tours that have the property secretTour set to "not equal to" true:
	this.find({ secretTour: { $ne: true } });

	next();
});

//Defining a middleware using the .populate() so the child reference to the user ID that it is in the Tour.guides, can pull up the user information to display, as if it was embedded, but the full information will only show in the query, it wont be in the DB:
tourSchema.pre(/^find/, function (next) {
	//And since the query middleware .this always points to the query, we can just do the .populate to the .this:
	this.populate({
		//So which field to populate:
		path: "guides",
		//Using - to not show certain property:
		select: "-__v -passwordChangedAt",
	});

	next();
});

//Defining a mongoose Aggregation Middleware. Using our private tour, it is still being use to calculate the stats for the tourController.getMonthlyPlan, so we can use a middleware to exclude the documents with the property  secretTour;
tourSchema.pre("aggregate", function (next) {
	//So the .this will point to the aggregation object; So we can add another stage in the this.pipeline, which is the property that contains all the stages. Using the unshift to add at the beginning of the aggregation array:
	this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

	next();
});

//---------------------------------------------------------------------------------------------------------------//

//Now that we have the schema, we can create the model out of it, using the name always uppercase, and passing in the schema name:
const Tour = mongoose.model("Tour", tourSchema);

//Now exporting the Tour model
module.exports = Tour;
