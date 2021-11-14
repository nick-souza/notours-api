const dotenv = require("dotenv");
const fs = require("fs");
const mongoose = require("mongoose");
const Tour = require("./../../models/tourModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	})
	.then(() => console.log("DB connection true"));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8"));

const importData = async () => {
	try {
		await Tour.create(tours);
		console.log("Data OK");
	} catch (error) {
		console.log(error);
	}
};

const deleteData = async () => {
	try {
		await Tour.deleteMany();
	} catch (error) {
		console.log(error);
	}
};

// deleteData();
importData();
