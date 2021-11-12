//Everything related to the server will go in this main file, while the rest related to express will go in the app.js module

//Importing the app from the app.js
const app = require("./app");

//Listening to be able to open the server:
const port = 3000;
app.listen(port, () => {
	console.log(`App running on port ${port}`);
});
