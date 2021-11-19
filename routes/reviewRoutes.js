const express = require("express");

const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

//---------------------------------------------------------------------------------------------------------------//

//Now using the merge parameter so the review routes can have access to the /tourID/reviews route we directed from the tourRoutes:
const router = express.Router({ mergeParams: true });

//---------------------------------------------------------------------------------------------------------------//

router
	.route("/")
	.get(reviewController.getAllReviews)
	.post(authController.protect, authController.restrictTo("user"), reviewController.setTourUserIds, reviewController.createReview);

router.route("/:id").get(reviewController.getReview).patch(reviewController.updateReview).delete(reviewController.deleteReview);
//---------------------------------------------------------------------------------------------------------------//

module.exports = router;
