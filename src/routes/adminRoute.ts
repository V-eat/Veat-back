import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getAdminOrders,
  getAdminReviews,
  deleteAdminReview,
  getAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  deleteAdminPromotion,
} from "../controllers/adminController";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get("/stats", getAdminStats);

router.get("/users", getAdminUsers);
router.put("/users/:id/role", updateUserRole);

router.get("/restaurants", getAdminRestaurants);
router.patch("/restaurants/:id/approve", approveRestaurant);
router.patch("/restaurants/:id/reject", rejectRestaurant);

router.get("/orders", getAdminOrders);

router.get("/reviews", getAdminReviews);
router.delete("/reviews/:id", deleteAdminReview);

router.get("/promotions", getAdminPromotions);
router.post("/promotions", createAdminPromotion);
router.put("/promotions/:id", updateAdminPromotion);
router.delete("/promotions/:id", deleteAdminPromotion);

export default router;
