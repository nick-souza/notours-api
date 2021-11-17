//Module to hanle the User resources
const express = require("express");

//Importing the userController with all the route handler functions:
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//

//In order to keep everything organized and in separeta files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const userRouter = express.Router();
const router = express.Router();

//---------------------------------------------------------------------------------------------------------------//

//Since we only need the post method for the signup resource, we can just declare as it is:
router.post("/signup", authController.signup);
//Route for the login, again just using post because we need the req.body:
router.post("/login", authController.login);

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(userController.getAllUsers).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
