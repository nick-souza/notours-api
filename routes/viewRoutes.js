const express = require("express");

const viewController = require("./../controllers/viewController");
const authController = require("./../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//

const router = express.Router();

//---------------------------------------------------------------------------------------------------------------//

//Middleware that will be executed before the routes, to check if the user is logged in or not:
router.use(authController.isLoggedIn);

//Rendering the templates:
router.get("/", viewController.getOverview);

router.get("/tour/:slug", viewController.getTour);

router.get("/login", viewController.getLoginForm);

//---------------------------------------------------------------------------------------------------------------//

module.exports = router;
