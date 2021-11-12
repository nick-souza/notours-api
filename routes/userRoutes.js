//Module to hanle the User resources
const express = require("express");

//Importing the userController with all the route handler functions:
const userController = require("./../controllers/userController");

//---------------------------------------------------------------------------------------------------------------//
//In order to keep everything organized and in separeta files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const userRouter = express.Router();
const router = express.Router();

//---------------------------------------------------------------------------------------------------------------//

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(userController.getAllUsers).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
