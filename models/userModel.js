const mongoose = require("mongoose");
const slugify = require("slugify");
//Importing the bcryptjs for hashing the pass:
const bcrypt = require("bcryptjs");

//Library that has custom validators:
const validator = require("validator");

//---------------------------------------------------------------------------------------------------------------//

//Schema for the users:
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please tell us your name"],
	},
	email: {
		type: String,
		required: [true, "Please provide your email"],
		unique: true,
		//Transform the input email to lowercase:
		lowercase: true,
		//Validator to check if its a valid email format:
		validate: [validator.isEmail, "Please provide a valid email"],
	},
	photo: {
		type: String,
	},
	password: {
		type: String,
		required: [true, "Please provide a password"],
		minlength: 8,
		//Using select, so we don't display the password when sending back the user object upon signup:
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, "Please confirm your password"],
		//Function to validate:
		validate: {
			//Only works on .CREATE() .SAVE(), so for update users we are gonna have to use the .save(), not .finOneAndUpdate();
			validator: function (el) {
				//Return either true or false if the passwords match:
				return el === this.password;
			},
			message: "Passwords are not the same",
		},
	},
	//TimeStamp to keep track if the user change the password:
	passwordChangedAt: Date,
});

//---------------------------------------------------------------------------------------------------------------//

//Middleware to handle password encryption, and it returns a promise, so the callback is a async:
userSchema.pre("save", async function (next) {
	//So we only want to encrypt the pass, if the pass was actually changed. In case the user updates like the name, this should not run:
	if (!this.isModified("password")) return next(); //We can use the mongoose method .isModified(), passing in the field;

	//Now encrypting using hash, with the bcryptjs library;
	//So we are setting the password to be the encrypted one, using the bcrypt.hash(), passing in the password to be encrypted and the salt length to generate or salt to use:
	this.password = await bcrypt.hash(this.password, 10);

	//Now we need to delete the old password, that is still stored in the passwordConfirm field:
	this.passwordConfirm = undefined;

	next();
});

//---------------------------------------------------------------------------------------------------------------//

//Function to check if the pass the user input in the login page, matches with the encrypted pass we have in the DB. Used by authController.js:
//An instance method. Is a method that will be available on all documents for this collection:
userSchema.methods.correctPassword = async function (candidatePass, userPass) {
	//Where the candidatePass is the not hashed pass, and the userPass is the hashed pass in our DB;

	//So using the bcrypt.compare method to compare both, returning true or false:
	return await bcrypt.compare(candidatePass, userPass);
};

//Another instance method, to check if the user that is trying to access a protected route, has changed the password after the token was issued:
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
	//The .this keyword in an instance method always points to the current document:

	//Checking if this field exists, meaning that the user changed the pass before:
	if (this.passwordChangedAt) {
		//Converting the passwordChangedAt from date to milliseconds
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

		//It will return true, which means that the user changed:
		return JWTTimestamp < changedTimestamp;
	}

	//By default, assuming the user has not changed the password:
	return false;
};

//---------------------------------------------------------------------------------------------------------------//

const User = mongoose.model("User", userSchema);

module.exports = User;
