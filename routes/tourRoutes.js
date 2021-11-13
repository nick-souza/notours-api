//Module to hanle the Tours resources
const express = require("express");

//Importing the TourController with all the route handler functions:
const tourController = require("./../controllers/tourController");

//---------------------------------------------------------------------------------------------------------------//
//In order to keep everything organized and in separeta files, we need to create different Routers for each resource. Before they were all in the same router, the app router:
// const tourRouter = express.Router();
const router = express.Router();

//Middleware to check for the input id in the URL:
// router.param("id", tourController.checkID);

//---------------------------------------------------------------------------------------------------------------//

//So we can define the routes like this now, since the resource path was already defined in the middleware:
router.route("/").get(tourController.getAllTours).post(tourController.createTour);
router.route("/:id").get(tourController.getTour).patch(tourController.updateTour).delete(tourController.deleteTour);

module.exports = router;
