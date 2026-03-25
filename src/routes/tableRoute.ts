import { Router } from "express";
import { createTable, joinTable, getTable, closeTable, leaveTable, getTableByCode } from "../controllers/tableController";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createTable);
router.post("/join", authenticate, joinTable);
router.get("/code/:code", authenticate, getTableByCode);
router.get("/:id", authenticate, getTable);
router.patch("/:id/close", authenticate, closeTable);
router.delete("/:id/leave", authenticate, leaveTable);

export default router;
