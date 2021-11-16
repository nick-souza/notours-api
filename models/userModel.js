const mongoose = require("mongoose");
const slugify = require("slugify");

//Library that has custom validators:
const validator = require("validator");

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
	},
	passwordConfirm: {
		type: String,
		required: [true, "Please confirm your email"],
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
