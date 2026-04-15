import { Router } from "express";
import {
  getRestaurants,
  getRestaurantById,
  getRestaurantsByOwner,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getRestaurants);
router.get("/mine", authenticate, getRestaurantsByOwner);
router.get("/:id", getRestaurantById);
router.post("/", authenticate, createRestaurant);
router.put("/:id", authenticate, updateRestaurant);
router.delete("/:id", authenticate, deleteRestaurant);

export default router;
