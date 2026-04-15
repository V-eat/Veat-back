import { Router } from "express";
import {
  getUserOrders,
  getRestaurantOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getUserOrders);
router.get("/restaurant/:restaurantId", authenticate, getRestaurantOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/", authenticate, createOrder);
router.patch("/:id/status", authenticate, updateOrderStatus);
router.patch("/:id/cancel", authenticate, cancelOrder);

export default router;
