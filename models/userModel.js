const mongoose = require("mongoose");
const slugify = require("slugify");
//Importing the bcryptjs for hashing the pass:
const bcrypt = require("bcryptjs");

//Library that has custom validators:
const validator = require("validator");

//Importing the native node module to encrypt the reset password token, since it can be a bit less secure:
const crypto = require("crypto");

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
	//Property to define roles, like admin or normal user:
	role: {
		type: String,
		//Only allowing certain types of roles:
		enum: ["user", "guide", "lead-guide", "admin"],
		//Setting the default to user, so all created accounts will be just users:
		default: "user",
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
	//Fields to allow the user to receive a token to change the password:
	passwordResetToken: String,
	passwordResetExpires: Date,
	//Property that will be changed when a user deletes the account, so it wont be deleted, it will be set to active: false;
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

//---------------------------------------------------------------------------------------------------------------//

//Query middleware to check for active: false users and do not display them:
//Using regular expression to get all the operations that starts with find, like findAndUpdate and so on:
userSchema.pre(/^find/, function (next) {
	//Since it is a query middleware, the .this points to the query;

	//Using the $ne that is not equal to, like the !
	this.find({ active: { $ne: false } });

	next();
});

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

//Middleware function to run when the user updates the pass, to add the passwordChangedAt property:
userSchema.pre("save", function (next) {
	//So we only want to run this, if the password was changed, but not when it was created:
	if (!this.isModified("password") || this.isNew) return next();

	//If it passes, set a new Date:
	this.passwordChangedAt = Date.now() - 1000;
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

//Another instance method, to create a token for the user reset the password, used by the authController:
userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString("hex");

	//Now setting the field in the user model to be the same as the encrypted token:
	this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

	//Setting the expiration, setting it to be 10 minutes from the creating of the token:
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	//Returning the token to send to the users email:
	return resetToken;
};

//---------------------------------------------------------------------------------------------------------------//

const User = mongoose.model("User", userSchema);

module.exports = User;
