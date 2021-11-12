//Module to hanle the User resources
const express = require("express");

//Importing the userController with all the route handler functions:
const userController = require("./../controllers/userController");

//---------------------------------------------------------------------------------------------------------------//

/* OLD CODE
//Defining the routes:

//Good practice to specify the version of the api, in case we need to make changes the user can still use the previous version:
//Also good practice to separete the route and the handler functions, so we only pass the function name here:

app.get("/api/v1/tours", getAllTours);
app.get("/api/v1/tours/:id", getTour);
app.post("/api/v1/tours", createTour);
app.patch("/api/v1/tours/:id", updateTour);
app.delete("/api/v1/tours/:id", deleteTour);

//With express there is a way to chain these routes, so we only have to write the route path once:
app.route("/api/v1/tours").get(getAllTours).post(createTour);
app.route("/api/v1/tours/:id").get(getTour).patch(updateTour).delete(deleteTour);

//Routes for the user:
app.route("/api/v1/users").get(getAllUsers).post(createUser);
app.route("/api/v1/users/:id").get(getUser).patch(updateUser).delete(deleteUser);
*/

//In order to keep everything organized and in separeta files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const userRouter = express.Router();
const router = express.Router();

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(userController.getAllUsers).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
