//Class to handle some GET methods for tourController:

class APIFeatures {
	//Passing in the mongoose query and the queryString (req.query) coming from Express:
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString;
	}

	//Method for filtering the results
	filter() {
		/*
			Implementing filtering, using the parameters the user typed in the URL. Example: /api/v1/tours?difficulty=easy the req.query would be { difficulty: "easy" };
			In MongoDB we would usually filter using queries like this:
			const tours = await Tour.find({
				duration: 5,
				difficulty: "easy",
			});

			But we can use mongoose to chain the methods:
			const tour = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy";)
			
			But since we get an object back from the req.query, we can use the first one:
		*/
		//However, we need to exclude some fields from the query, for example the ?page=2 which is only used for the pagination. So we need to create a shallow copy of the req.query object, and remove those if present:

		const queryObj = { ...this.queryString }; //const queryObj = { ...req.query };

		//Array with the query we want to exclude from the filter:
		const excludedFields = ["page", "sort", "limit", "fields"];
		//Now removing these fields from the obj copy, so we can use for the filter:
		excludedFields.forEach((el) => delete queryObj[el]);

		//Now for using operators inside the query, like { duration: { $gt: 5 } }. In the URL we type: ?duration[gte]=5. So we need to convert it to the mongoDB operator by adding the $ sign.
		//First, converting the queryObj to string, then using the replace method:
		let queryStr = JSON.stringify(queryObj);
		//Using regular expression to check if any of these words are in the query, and if they are, using the callback function to replace by adding the $ sign in front of it. And if they are not present, it will just be ignored:
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

		//So the other fields will be ignored for the filtering
		//Also, to be able to chain methods for like, sorting and pagination, we need to first build the query, and only then await it:
		//And we have the parse the string to object again

		// let query = Tour.find(JSON.parse(queryStr));
		//So instead just returning the query to be used outside this class
		this.query = this.query.find(JSON.parse(queryStr));

		//Returning the this (being the entire object) so we can later chain the other methods:
		return this;
	}

	sort() {
		//Implementing sorting. If the user wants to show the lower prices first. And since the query above also returns a query, we can just chain it using the original query object, the one where sort was not excluded:
		if (this.queryString.sort) {
			//So if the sort object is present in the original query obj, use this query instead:

			//In case there is objects with the same property, we can specify additional arguments to which sort them. Example, if there is two tours with the same price, we can sort these two by the rating Average for example.
			//And the way mongoose implements this: .sort("price ratingsAverage").
			//But we cannot have spaces in the URL, so we use commas. ?sort=price,ratingsAverage; So we need to replace the commas with space:
			const sortBy = this.queryString.sort.split(",").join(" ");
			// console.log(sortBy);
			this.query = this.query.sort(sortBy);
		} else {
			//Adding a default, in case the user does not specify any sorting:
			this.query = this.query.sort("-createdAt");
		}

		//Returning the this (being the entire object) so we can later chain the other methods:
		return this;
	}

	limitFields() {
		//Implementing Field Limiting. In the URL it looks like: ?fields=name,duration,difficulty,price; So for mongoose we have to replace the commas with spaces:
		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(",").join(" ");
			this.query = this.query.select(fields);
		} else {
			//Default:
			//Using the minus (-) operator to exclude a field. In this default case, the __v, which is a property that mongoose automatically creates for internal use. But we dont need it, so we just hide it using the minus:
			this.query = this.query.select("-__v");
		}

		return this;
	}

	paginate() {
		//Implementing Pagination and Limit. In the URL it would look like ?page=1&limit=10. With mongoose we use skip().limit(). Where limit is the same in the query string, the amount of results we want, and skip is the amount of results that should be skipped, before querying for the data.
		//So for the query ?page=2&limit=10 meaning that results 1-10 are on page 1, and 11-20 are on page 2. So the formula for the skip is: (page - 1) * limit;

		//Getting the page and the limit values from the query:
		const page = this.queryString.page * 1 || 1; //Multiplying by one to convert to a number, and setting the default for page 1;
		const limit = this.queryString.limit * 1 || 50; //Multiplying by one to convert to a number, and setting the default for 50 at a page;
		//Now using the formula for the pagination:
		const skip = (page - 1) * limit;
		//Building the query:
		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
}

module.exports = APIFeatures;
