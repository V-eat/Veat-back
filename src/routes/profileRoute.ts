import { Router } from "express";
import { getMyProfile, updateMyProfile, getMyRole } from "../controllers/profileController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getMyProfile);
router.put("/", authenticate, updateMyProfile);
router.get("/role", authenticate, getMyRole);

export default router;
