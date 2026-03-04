import { Router } from "express";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuItemController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

// GET /restaurants/:restaurantId/menu
router.get("/", getMenuItems);
// POST /restaurants/:restaurantId/menu
router.post("/", authenticate, createMenuItem);

export default router;

// Standalone menu-item routes (for update/delete by item id)
export const menuItemRouter = Router();
menuItemRouter.put("/:id", authenticate, updateMenuItem);
menuItemRouter.delete("/:id", authenticate, deleteMenuItem);
