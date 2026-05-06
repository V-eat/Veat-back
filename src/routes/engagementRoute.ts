import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getDynamicPromotions,
  getLoyaltySummary,
  getRecommendations,
  validatePromotionCode,
  validateLoyaltyUsage,
} from "../controllers/engagementController";

const router = Router();

router.get("/loyalty", authenticate, getLoyaltySummary);
router.get("/recommendations", authenticate, getRecommendations);
router.get("/promotions", authenticate, getDynamicPromotions);
router.post("/promotions/validate", authenticate, validatePromotionCode);
router.post("/loyalty/validate", authenticate, validateLoyaltyUsage);

export default router;
