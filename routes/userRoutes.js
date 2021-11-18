//Module to handle the User resources
const express = require("express");

//Importing the userController with all the route handler functions:
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//

//In order to keep everything organized and in separate files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const userRouter = express.Router();
const router = express.Router();

//---------------------------------------------------------------------------------------------------------------//

//Since we only need the post method for the signup resource, we can just declare as it is:
router.post("/signup", authController.signup);
//Route for the login, again just using post because we need the req.body:
router.post("/login", authController.login);

//Route to redefine the user password:
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
//Route to the already logged in user change the password:
router.patch("/updateMyPassword", authController.protect, authController.updatePassword);

//Route for the authenticated user can update the rest of the information:
router.patch("/updateMe", authController.protect, userController.updateMe);
//Route fot the user delete the account:
router.delete("/deleteMe", authController.protect, userController.deleteMe);

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(userController.getAllUsers).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
