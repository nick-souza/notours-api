//Module to handle the Tours resources
const express = require("express");

//Importing the TourController with all the route handler functions:
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//
//In order to keep everything organized and in separate files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const tourRouter = express.Router();
const router = express.Router();

//Middleware to check for the input id in the URL:
// router.param("id", tourController.checkID);

//---------------------------------------------------------------------------------------------------------------//

//Adding a route to facilitate for the most used query strings, like an alias, so the user does not have to type the whole query:
//We can achieve that using middleware, aliasTopTours:
router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);

//Route to use the Aggregation Pipeline method created in the tourController:
router.route("/tour-stats").get(tourController.getTourStats);

//Using the url operator to get the specific year
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

//So we can define the routes like this now, since the resource path was already defined in the middleware in app.js:
//Using the authController.protect middleware, to only allow signed in users to get the tours:
router.route("/").get(authController.protect, tourController.getAllTours).post(tourController.createTour);
router.route("/:id").get(tourController.getTour).patch(tourController.updateTour).delete(tourController.deleteTour);

module.exports = router;
