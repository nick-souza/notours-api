const express = require("express");

const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//

//Now using the merge parameter so the review routes can have access to the /tourID/reviews route we directed from the tourRoutes:
const router = express.Router({ mergeParams: true });

//---------------------------------------------------------------------------------------------------------------//

//All the routes below need to be authenticated to use, so middleware before:
router.use(authController.protect);

router
	.route("/")
	.get(reviewController.getAllReviews)
	.post(authController.restrictTo("user"), reviewController.setTourUserIds, reviewController.createReview);

router
	.route("/:id")
	.get(reviewController.getReview)
	.patch(authController.restrictTo("user", "admin"), reviewController.updateReview)
	.delete(authController.restrictTo("user", "admin"), reviewController.deleteReview);
//---------------------------------------------------------------------------------------------------------------//

module.exports = router;
