import { Router } from "express";
import {
  getRestaurantReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { authenticate } from "../middleware/auth.middleware";

// Nested under /restaurants/:restaurantId/reviews
export const restaurantReviewRouter = Router({ mergeParams: true });
restaurantReviewRouter.get("/", getRestaurantReviews);
restaurantReviewRouter.post("/", authenticate, createReview);

// Standalone /reviews/:id
const router = Router();
router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

export default router;
