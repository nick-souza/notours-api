const express = require("express");

const viewController = require("./../controllers/viewController");

//---------------------------------------------------------------------------------------------------------------//

const router = express.Router();

//---------------------------------------------------------------------------------------------------------------//

//Rendering the templates:

router.get("/", viewController.getOverview);

router.get("/tour/:slug", viewController.getTour);

router.get("/login", viewController.getLoginForm);

//---------------------------------------------------------------------------------------------------------------//

module.exports = router;
