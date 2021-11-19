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

//NO AUTH -------
//Since we only need the post method for the signup resource, we can just declare as it is:
router.post("/signup", authController.signup);
//Route for the login, again just using post because we need the req.body:
router.post("/login", authController.login);

//Route to redefine the user password:
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
//NO AUTH -------

//So all the routes above require authentication, so we can use middleware to enforce that:
router.use(authController.protect);

//Route to the already logged in user change the password:
router.patch("/updateMyPassword", authController.updatePassword);

//Route to the user get its own information. Using the middleware getMe to put the ID in the params:
router.get("/me", userController.getMe, userController.getUser);

//Route for the authenticated user can update the rest of the information:
router.patch("/updateMe", userController.updateMe);
//Route fot the user delete the account:
router.delete("/deleteMe", userController.deleteMe);

//All the routes below are only for admin, so another middleware to take care of that:
router.use(authController.restrictTo("admin"));

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(userController.getAllUsers);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

//---------------------------------------------------------------------------------------------------------------//

module.exports = router;
