import { Router } from "express";
import {
  getUserFavorites,
  checkFavorite,
  addFavorite,
  removeFavorite,
} from "../controllers/favoriteController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getUserFavorites);
router.get("/check/:restaurantId", authenticate, checkFavorite);
router.post("/", authenticate, addFavorite);
router.delete("/:restaurantId", authenticate, removeFavorite);

export default router;
